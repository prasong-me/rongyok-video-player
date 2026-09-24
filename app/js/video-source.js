const VideoSource = {
  async resolve(video) {
    if (!video) throw new Error('Missing video');
    if (video.url) return this.normalize(video.url, video.type, video);
    if (!video.path) throw new Error('Missing video path');
    const result = await Proxy.getVideoSources(video.path);
    if (!result.success || !result.links.length) throw new Error('ไม่พบลิงก์วิดีโอ');
    const link = result.links.find(x => x.type === 'mp4' && x.hasToken) ||
                 result.links.find(x => x.type === 'mp4') ||
                 result.links[0];
    return this.normalize(link.url, link.type, { ...video, expiresAt: link.expiresAt });
  },
  normalize(url, type, meta = {}) {
    const clean = String(url || '').trim();
    const detected = type || (/\.m3u8(?:$|[?#])/i.test(clean) ? 'hls' : 'mp4');
    return {
      url: clean,
      type: detected,
      episode: meta.episode ?? null,
      expiresAt: meta.expiresAt ?? null,
      headers: meta.headers || null
    };
  }
};
window.VideoSource = VideoSource;
