const App = {
  videoList: [], player: null, episodeManager: null, currentTab: 'home', currentVideo: null, busy: false,

  async init() {
    console.log('[App] Rongyok Player v6');
    this.player = new RongyokPlayer({ autoNext: true });
    this.episodeManager = new EpisodeManager();
    this._setupEventListeners();
    await this.loadList();
  },

  _setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      this.currentTab = btn.dataset.tab;
      document.getElementById(this.currentTab + '-tab').classList.add('active');
      if (this.currentTab === 'history') this.renderHistory();
      if (this.currentTab === 'bookmarks') this.renderBookmarks();
    }));
    document.getElementById('search-input').addEventListener('input', e => this.filterVideos(e.target.value));
    document.getElementById('refresh-btn').addEventListener('click', () => this.loadList());
    document.getElementById('open-source-btn').addEventListener('click', () => this.playSourceUrl());
    document.getElementById('source-url').addEventListener('keydown', e => {
      if (e.key === 'Enter') this.playSourceUrl();
    });
    document.getElementById('clear-history-btn').addEventListener('click', () => {
      if (confirm('ลบประวัติการดูทั้งหมด?')) { Storage.clearHistory(); this.renderHistory(); }
    });
    document.getElementById('clear-bookmarks-btn').addEventListener('click', () => {
      if (confirm('ลบรายการบันทึกทั้งหมด?')) { Storage.clearBookmarks(); this.renderBookmarks(); }
    });
  },

  async playSourceUrl() {
    const input = document.getElementById('source-url');
    const raw = input.value.trim();
    if (!raw) { input.focus(); return; }

    let url;
    try { url = new URL(raw); } catch { alert('ลิงก์ไม่ถูกต้อง'); return; }
    if (url.hostname !== 'rongyok.com' && !url.hostname.endsWith('.rongyok.com')) {
      alert('รองรับเฉพาะลิงก์จาก rongyok.com');
      return;
    }

    const video = {
      id: url.pathname,
      title: 'Rongyok — ' + (url.pathname.split('/').filter(Boolean).pop() || 'ตอนที่เลือก'),
      path: url.pathname
    };
    await this.playVideo(video);
  },

  async loadList() {
    const el=document.getElementById('video-list');
    el.innerHTML='<div class="loading">กำลังโหลดรายการ...</div>';
    try {
      this.videoList=await Proxy.getHomeList();
      this.episodeManager.setItems(this.videoList);
      this.renderVideos(this.videoList);
      if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
    } catch(e) {
      console.error(e);
      el.innerHTML='<div class="loading">ไม่สามารถโหลดรายการได้</div>';
    }
  },

  filterVideos(q) {
    const query=q.trim().toLowerCase();
    this.renderVideos(this.videoList.filter(v => (v.title||'').toLowerCase().includes(query)));
  },

  renderVideos(videos) {
    const el=document.getElementById('video-list'); el.innerHTML='';
    if (!videos.length) { el.innerHTML='<div class="empty-state">ไม่พบรายการวิดีโอ</div>'; return; }
    videos.forEach(v=>el.appendChild(this._createCard(v)));
  },

  _createCard(v) {
    const card=document.createElement('article'); card.className='video-card';
    const thumb=document.createElement('div'); thumb.className='video-card-thumb'; thumb.textContent='▶';
    const content=document.createElement('div'); content.className='video-card-content';
    const title=document.createElement('div'); title.className='video-card-title'; title.textContent=v.title||'ไม่มีชื่อ';
    const meta=document.createElement('div'); meta.className='video-card-meta';
    const p=Storage.getProgress(v.id);
    if (p && !p.completed && p.duration) meta.textContent='กำลังดู ' + Math.min(100,Math.round(p.time/p.duration*100)) + '%';
    else if (p?.completed) meta.textContent='ดูจบแล้ว';
    else meta.textContent='พร้อมเล่น';
    const actions=document.createElement('div'); actions.className='video-card-actions';
    const play=document.createElement('button'); play.className='action-btn'; play.type='button'; play.textContent='▶ เล่น';
    play.onclick=e=>{e.stopPropagation();this.playVideo(v);};
    const mark=document.createElement('button'); mark.className='action-btn';
    const bookmarked=Storage.isBookmarked(v.id); mark.textContent=bookmarked?'★ บันทึก':'☆ บันทึก';
    if(bookmarked)mark.classList.add('bookmarked');
    mark.onclick=e=>{e.stopPropagation();this.toggleBookmark(v,mark);};
    actions.append(play,mark); content.append(title,meta,actions); card.append(thumb,content);
    card.onclick=()=>this.playVideo(v);
    return card;
  },

  renderHistory() {
    const el=document.getElementById('history-list'), list=Storage.getHistory(); el.innerHTML='';
    if(!list.length){el.innerHTML='<div class="empty-state">ยังไม่มีประวัติการดู</div>';return;}
    list.forEach(v=>el.appendChild(this._createCard(v)));
  },

  renderBookmarks() {
    const el=document.getElementById('bookmarks-list'), list=Storage.getBookmarks(); el.innerHTML='';
    if(!list.length){el.innerHTML='<div class="empty-state">ยังไม่มีรายการบันทึก</div>';return;}
    list.forEach(v=>el.appendChild(this._createCard(v)));
  },

  async playVideo(video) {
    if(this.busy)return;
    this.busy=true; this.currentVideo=video;
    const listEl=document.getElementById('video-list');
    const old=listEl.innerHTML;
    listEl.innerHTML='<div class="loading">กำลังเตรียมวิดีโอ...</div>';
    try {
      const source=await VideoSource.resolve(video);
      Storage.addHistory(video);
      await this.player.loadVideoFullscreen(source.url, video.id, video.title, source.type);
      if(this.player.video) {
        this.player.video.addEventListener('ended',()=>this._handleEnded(video),{once:true});
      }
    } catch(e) {
      console.error('[App] Source error',e);
      listEl.innerHTML=old;
      alert(e.message || 'ไม่พบลิงก์วิดีโอ');
    } finally { this.busy=false; }
  },

  async _handleEnded(video) {
    const next=this.episodeManager.next(video.id);
    if(!next)return;
    try {
      const source=await VideoSource.resolve(next);
      Storage.addHistory(next);
      await this.player.loadVideoFullscreen(source.url,next.id,next.title,source.type);
      if(this.player.video) {
        this.player.video.addEventListener('ended',()=>this._handleEnded(next),{once:true});
      }
    } catch(e) { console.error('[AutoNext] failed',e); }
  },

  toggleBookmark(v,btn) {
    if(Storage.isBookmarked(v.id)){
      Storage.removeBookmark(v.id); btn.classList.remove('bookmarked'); btn.textContent='☆ บันทึก';
    } else {
      Storage.addBookmark(v); btn.classList.add('bookmarked'); btn.textContent='★ บันทึก';
    }
  }
};
window.addEventListener('load',()=>App.init());
window.App=App;
