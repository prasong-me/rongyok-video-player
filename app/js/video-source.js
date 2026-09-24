const VideoSource = {
  async resolve(video) {
    if (!video) throw new Error('Missing video');

    if (video.url) {
      return this.normalize(video.url, video.type, video);
    }

    if (!video.seriesId || !video.episode) {
      throw new Error('กรุณาเลือกตอนก่อนเล่น');
    }

    const result = await RongyokSource.getVideoSources(video);
    if (!result.success || !result.links.length) {
      throw new Error('ไม่พบแหล่งวิดีโอจาก RongYok ตอนนี้');
    }

    const source = result.links[0];
    return this.normalize(source.url, source.type, {
      ...video,
      expiresAt: source.expiresAt,
      headers: source.headers
    });
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