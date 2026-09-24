class RongyokPlayer {
  constructor(options = {}) {
    this.options = options;
    this.videoId = null;
    this.videoTitle = '';
    this.videoType = 'mp4';
    this.video = null;
    this.container = null;
    this.saveTimer = null;
    this.timeTimer = null;
  }

  async loadVideoFullscreen(source, videoId, videoTitle, videoType = 'mp4') {
    this._destroyCurrent();
    this.videoId = videoId;
    this.videoTitle = videoTitle || '';
    this.videoType = videoType || 'mp4';
    this._build(source);
  }

  _build(url) {
    const container = document.createElement('div');
    container.id = 'rongyok-fullscreen-player';
    container.style.cssText =
      'position:fixed;inset:0;width:100vw;height:100dvh;min-height:100%;' +
      'background:#000;z-index:99999;overflow:hidden;display:flex;' +
      'align-items:center;justify-content:center;';

    const header = document.createElement('div');
    header.style.cssText =
      'position:absolute;top:0;left:0;right:0;padding:calc(10px + env(safe-area-inset-top)) ' +
      'calc(12px + env(safe-area-inset-right)) 12px calc(12px + env(safe-area-inset-left));' +
      'background:linear-gradient(#000e,transparent);z-index:2;display:flex;' +
      'justify-content:space-between;align-items:center;color:#fff;' +
      'font:600 15px -apple-system,BlinkMacSystemFont,sans-serif;';

    const title = document.createElement('div');
    title.textContent = this.videoTitle;
    title.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:75%;';

    const controls = document.createElement('div');
    controls.style.cssText = 'display:flex;gap:8px;';
    const fs = this._button('⛶', () => this._enterFullscreen(container));
    const close = this._button('✕', () => this._closePlayer());
    controls.append(fs, close);
    header.append(title, controls);
    container.appendChild(header);

    const video = document.createElement('video');
    video.id = 'rongyok-fullscreen-video';
    video.controls = true;
    video.preload = 'metadata';
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('x5-playsinline', '');
    video.style.cssText =
      'width:100vw;height:100dvh;max-width:none;max-height:none;' +
      'display:block;background:#000;object-fit:contain;';

    if (this.videoType === 'hls' && !video.canPlayType('application/vnd.apple.mpegurl')) {
      const source = document.createElement('source');
      source.src = url;
      source.type = 'application/x-mpegURL';
      video.appendChild(source);
    } else {
      video.src = url;
    }

    container.appendChild(video);

    const info = document.createElement('div');
    info.style.cssText =
      'position:absolute;bottom:0;left:0;right:0;padding:12px ' +
      'calc(12px + env(safe-area-inset-right)) calc(12px + env(safe-area-inset-bottom)) ' +
      'calc(12px + env(safe-area-inset-left));color:#aaa;text-align:center;' +
      'font:12px monospace;pointer-events:none;background:linear-gradient(transparent,#000d);';
    container.appendChild(info);

    document.body.appendChild(container);
    this.container = container;
    this.video = video;

    video.addEventListener('loadedmetadata', () => this._restoreProgress(), { once: true });
    video.addEventListener('pause', () => this._saveProgress(false));
    video.addEventListener('ended', () => this._saveProgress(true));

    this.timeTimer = setInterval(() => {
      info.textContent = this._format(video.currentTime) + ' / ' + this._format(video.duration);
    }, 500);
    this.saveTimer = setInterval(() => this._saveProgress(false), 5000);
  }

  _button(text, fn) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.style.cssText =
      'width:44px;height:44px;border:0;border-radius:6px;background:#ffffff33;' +
      'color:#fff;font-size:18px;cursor:pointer;';
    button.addEventListener('click', event => {
      event.preventDefault();
      fn();
    });
    return button;
  }

  _restoreProgress() {
    const saved = Storage.getProgress(this.videoId);
    if (saved && !saved.completed && saved.time > 10 && saved.time < this.video.duration - 5) {
      try { this.video.currentTime = saved.time; } catch {}
    }
  }

  _saveProgress(completed) {
    if (this.video) {
      Storage.saveProgress(this.videoId, this.video.currentTime, this.video.duration, completed);
    }
  }

  _format(seconds) {
    if (!Number.isFinite(seconds)) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secondsPart = Math.floor(seconds % 60);
    return (hours ? String(hours).padStart(2, '0') + ':' : '') +
      String(minutes).padStart(2, '0') + ':' + String(secondsPart).padStart(2, '0');
  }

  _enterFullscreen(container) {
    const video = this.video;
    if (video && typeof video.webkitEnterFullscreen === 'function') {
      try { video.webkitEnterFullscreen(); return; } catch {}
    }
    if (container.requestFullscreen) container.requestFullscreen().catch(() => {});
    else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
  }

  _exitFullscreen() {
    try {
      if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
    } catch {}
  }

  _closePlayer() {
    this._saveProgress(false);
    this._destroyCurrent();
  }

  _destroyCurrent() {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
    if (this.timeTimer) {
      clearInterval(this.timeTimer);
      this.timeTimer = null;
    }

    this._exitFullscreen();

    if (this.video) {
      try {
        this.video.pause();
        this.video.removeAttribute('src');
        this.video.load();
      } catch {}
    }

    if (this.container?.parentNode) this.container.remove();
    this.video = null;
    this.container = null;
  }
}

window.RongyokPlayer = RongyokPlayer;