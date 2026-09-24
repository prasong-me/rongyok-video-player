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
    this.endedHandler = null;
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
    container.style.cssText = 'position:fixed;inset:0;background:#000;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;';
    const header = document.createElement('div');
    header.style.cssText = 'position:absolute;inset:0 0 auto;padding:14px 16px;background:linear-gradient(#000d,transparent);z-index:2;display:flex;justify-content:space-between;align-items:center;color:#fff;font:600 16px -apple-system,BlinkMacSystemFont,sans-serif;';
    const title = document.createElement('div');
    title.textContent = this.videoTitle;
    title.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:75%;';
    const controls = document.createElement('div');
    controls.style.cssText = 'display:flex;gap:8px;';
    const fs = this._button('⛶', () => this._enterFullscreen(container));
    const close = this._button('✕', () => this._closePlayer());
    controls.append(fs, close); header.append(title, controls); container.appendChild(header);

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width:100%;max-width:1400px;display:flex;align-items:center;justify-content:center;';
    const video = document.createElement('video');
    video.id = 'rongyok-fullscreen-video';
    video.controls = true; video.preload = 'metadata'; video.playsInline = true;
    video.setAttribute('playsinline',''); video.setAttribute('webkit-playsinline',''); video.setAttribute('x5-playsinline','');
    video.style.cssText = 'width:100%;max-height:100vh;background:#000;display:block;';
    if (this.videoType === 'hls' && !video.canPlayType('application/vnd.apple.mpegurl')) {
      const source = document.createElement('source');
      source.src = url; source.type = 'application/x-mpegURL'; video.appendChild(source);
    } else {
      video.src = url;
    }
    wrapper.appendChild(video); container.appendChild(wrapper);

    const info = document.createElement('div');
    info.style.cssText = 'position:absolute;bottom:0;left:0;right:0;padding:14px;color:#aaa;text-align:center;font:12px monospace;pointer-events:none;background:linear-gradient(transparent,#000d);';
    container.appendChild(info);
    document.body.appendChild(container);
    this.container = container; this.video = video;

    video.addEventListener('loadedmetadata', () => this._restoreProgress(), { once:true });
    video.addEventListener('pause', () => this._saveProgress(false));
    video.addEventListener('ended', () => this._saveProgress(true));
    this.timeTimer = setInterval(() => {
      info.textContent = this._format(video.currentTime) + ' / ' + this._format(video.duration);
    }, 500);
    this.saveTimer = setInterval(() => this._saveProgress(false), 5000);
  }

  _button(text, fn) {
    const b=document.createElement('button'); b.type='button'; b.textContent=text;
    b.style.cssText='width:44px;height:44px;border:0;border-radius:6px;background:#ffffff33;color:#fff;font-size:18px;cursor:pointer;';
    b.addEventListener('click', e => { e.preventDefault(); fn(); }); return b;
  }

  _restoreProgress() {
    const saved = Storage.getProgress(this.videoId);
    if (saved && !saved.completed && saved.time > 10 && saved.time < this.video.duration - 5) {
      try { this.video.currentTime = saved.time; } catch {}
    }
  }
  _saveProgress(completed) {
    if (this.video) Storage.saveProgress(this.videoId, this.video.currentTime, this.video.duration, completed);
  }
  _format(s) {
    if (!Number.isFinite(s)) return '00:00';
    const h=Math.floor(s/3600), m=Math.floor(s%3600/60), sec=Math.floor(s%60);
    return (h ? String(h).padStart(2,'0')+':' : '') + String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');
  }
  _enterFullscreen(container) {
    const v=this.video;
    if (v && typeof v.webkitEnterFullscreen === 'function') { try { v.webkitEnterFullscreen(); return; } catch {} }
    if (container.requestFullscreen) container.requestFullscreen().catch(()=>{});
    else if (container.webkitRequestFullscreen) container.webkitRequestFullscreen();
  }
  _exitFullscreen() {
    try {
      if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
    } catch {}
  }
  _closePlayer() {
    this._saveProgress(false);
    this._destroyCurrent();
  }
  _destroyCurrent() {
    if (this.saveTimer) { clearInterval(this.saveTimer); this.saveTimer=null; }
    if (this.timeTimer) { clearInterval(this.timeTimer); this.timeTimer=null; }
    this._exitFullscreen();
    if (this.video) { try { this.video.pause(); this.video.removeAttribute('src'); this.video.load(); } catch {} }
    if (this.container?.parentNode) this.container.remove();
    this.video=null; this.container=null;
  }
}
window.RongyokPlayer = RongyokPlayer;
