const RongyokSource = {
  /**
   * Single source of truth:
   * RongYok's public HTML is parsed first. UI never depends on RongYok CSS/classes.
   * Normalized shape:
   * { id, seriesId, title, image, seriesUrl, episodes:[{episode,url,href,title}] }
   */
  PROXIES: ['https://corsproxy.io/?url=', 'https://api.allorigins.win/raw?url='],
  BASE_URL: 'https://rongyok.com',
  API_PATH: '/watch/playseries.php',
  TIMEOUT: 12000,
  MAX_RESULTS: 100,

  async fetchText(url) {
    const targets = [url, ...this.PROXIES.map(p => p + encodeURIComponent(url))];
    for (const target of targets) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.TIMEOUT);
        const response = await fetch(target, { signal: controller.signal });
        clearTimeout(timer);
        if (response.ok) return await response.text();
      } catch (error) {
        console.warn('[RongyokSource] fetchText failed:', target, error);
      }
    }
    throw new Error('ไม่สามารถเชื่อมต่อ RongYok ได้');
  },

  async fetchJson(url) {
    const targets = [url, ...this.PROXIES.map(p => p + encodeURIComponent(url))];
    let lastError = null;
    for (const target of targets) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.TIMEOUT);
        const response = await fetch(target, {
          signal: controller.signal,
          headers: { Accept: 'application/json,text/plain,*/*' }
        });
        clearTimeout(timer);
        if (!response.ok) {
          lastError = new Error('HTTP ' + response.status);
          continue;
        }
        const text = await response.text();
        try {
          return JSON.parse(text);
        } catch {
          lastError = new Error('RongYok API ไม่ได้ตอบกลับเป็น JSON');
        }
      } catch (error) {
        lastError = error;
        console.warn('[RongyokSource] fetchJson failed:', target, error);
      }
    }
    throw lastError || new Error('ไม่สามารถเรียก RongYok API ได้');
  },

  absoluteUrl(value) {
    try { return new URL(value, this.BASE_URL).href; } catch { return ''; }
  },

  extractSeriesId(value) {
    try {
      const url = new URL(value, this.BASE_URL);
      const fromQuery = url.searchParams.get('series_id');
      if (fromQuery && /^\d+$/.test(fromQuery)) return fromQuery;
      const match = url.pathname.match(/\/series\/(\d+)/i);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  },

  cleanVideoUrl(value) {
    return String(value || '')
      .replace(/\\\//g, '/')
      .replace(/\\u0026/g, '&')
      .replace(/&amp;/g, '&')
      .trim();
  },

  async getSeriesInfo(seriesUrl) {
    const seriesId = this.extractSeriesId(seriesUrl);
    if (!seriesId) throw new Error('ไม่พบ series_id ของเรื่องนี้');

    const html = await this.fetchText(this.absoluteUrl(seriesUrl));
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const title =
      doc.querySelector('meta[property="og:title"]')?.content ||
      doc.querySelector('h1')?.textContent?.trim() ||
      doc.title ||
      'RongYok';

    const poster =
      doc.querySelector('meta[property="og:image"]')?.content ||
      doc.querySelector('meta[name="twitter:image"]')?.content ||
      '';

    const text = doc.body?.textContent?.replace(/\s+/g, ' ') || '';
    const counts = [...text.matchAll(/(?:จำนวนตอน|ทั้งหมด|ตอน)\s*[:：]?\s*(\d+)\s*ตอน/gi)]
      .map(m => Number(m[1]))
      .filter(Number.isFinite);

    const buttons = [...doc.querySelectorAll('button,a,[data-episode],.episode,.ep')];
    const episodeNumbers = buttons
      .map(el => {
        const m = (el.textContent || '').match(/(?:EP\.?\s*)?(\d{1,4})/i);
        return m ? Number(m[1]) : null;
      })
      .filter(n => Number.isFinite(n) && n > 0);

    const totalEpisodes = Math.max(
      counts.length ? Math.max(...counts) : 0,
      episodeNumbers.length ? Math.max(...episodeNumbers) : 0
    );

    return {
      seriesId,
      title: String(title).replace(/\s+/g, ' ').trim(),
      image: this.absoluteUrl(poster),
      totalEpisodes: totalEpisodes || null,
      seriesUrl: this.absoluteUrl(seriesUrl)
    };
  },

  async getVideoSources(video) {
    const seriesId = typeof video === 'object' ? video.seriesId : this.extractSeriesId(video);
    const episode = typeof video === 'object' ? video.episode : null;
    if (!seriesId || !episode) throw new Error('ต้องระบุ series_id และตอนก่อนเล่น');

    const apiUrl = new URL(this.API_PATH, this.BASE_URL);
    apiUrl.searchParams.set('series_id', seriesId);
    apiUrl.searchParams.set('ep', String(episode));

    const data = await this.fetchJson(apiUrl.href);
    const raw = data?.video_url || data?.url || data?.videoUrl;
    const videoUrl = this.cleanVideoUrl(raw);
    if (!videoUrl) {
      throw new Error(data?.message || data?.error || 'RongYok API ไม่พบลิงก์วิดีโอของตอนนี้');
    }

    const type = /\.m3u8(?:$|[?#])/i.test(videoUrl) ? 'hls' : 'mp4';
    return {
      success: true,
      links: [{
        url: videoUrl,
        type,
        episode: Number(episode),
        expiresAt: null,
        headers: null
      }],
      raw: data
    };
  },

  parseCatalogLinks(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const seen = new Set();
    const output = [];

    for (const a of [...doc.querySelectorAll('a[href*="/series/"]')]) {
      const href = this.absoluteUrl(a.getAttribute('href'));
      if (!href || seen.has(href)) continue;
      seen.add(href);

      const box = a.closest('article,li,.card,.item,.series-card,.movie-card,div') || a;
      const img = box.querySelector?.('img');
      const title = (a.textContent || '').replace(/\s+/g, ' ').trim();
      if (!title) continue;

      const seriesId = this.extractSeriesId(href);
      output.push({
        id: seriesId ? 'series:' + seriesId : href,
        seriesId,
        title,
        path: new URL(href).pathname + new URL(href).search,
        seriesUrl: href,
        image: this.absoluteUrl(img?.getAttribute('src') || img?.getAttribute('data-src') || ''),
        type: /ซับไทย/i.test(title) ? 'sub' : /พากย์ไทย/i.test(title) ? 'dub' : 'other'
      });
    }

    return output.slice(0, this.MAX_RESULTS);
  },

  async getCatalog() {
    const html = await this.fetchText(this.BASE_URL + '/');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const all = this.parseCatalogLinks(html);
    const sections = { recommended: [], popular: [], new: [], dub: [], sub: [], all };

    const classify = node => {
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (/มาใหม่/i.test(text)) return 'new';
      if (/ยอดนิยม/i.test(text)) return 'popular';
      if (/แนะนำ/i.test(text)) return 'recommended';
      if (/พากย์ไทย/i.test(text)) return 'dub';
      if (/ซับไทย/i.test(text)) return 'sub';
      return null;
    };

    for (const heading of [...doc.querySelectorAll('h1,h2,h3,h4')]) {
      const key = classify(heading);
      if (!key) continue;
      let node = heading.nextElementSibling;
      const local = [];
      let guard = 0;

      while (node && guard++ < 15) {
        for (const a of [...(node.querySelectorAll?.('a[href*="/series/"]') || [])]) {
          const href = this.absoluteUrl(a.getAttribute('href'));
          const found = all.find(v => v.seriesUrl === href);
          if (found && !local.some(v => v.id === found.id)) local.push(found);
        }
        if (/^h[1-4]$/i.test(node.tagName)) break;
        node = node.nextElementSibling;
      }
      if (local.length) sections[key] = local;
    }

    if (!sections.new.length) sections.new = all.slice(0, 24);
    if (!sections.recommended.length) sections.recommended = all.slice(0, 12);
    if (!sections.popular.length) sections.popular = all.slice(0, 18);
    if (!sections.dub.length) sections.dub = all.filter(v => v.type === 'dub').slice(0, 18);
    if (!sections.sub.length) sections.sub = all.filter(v => v.type === 'sub').slice(0, 18);

    return sections;
  },

  async getHomeList() {
    return (await this.getCatalog()).all;
  }
};

window.RongyokSource = RongyokSource;