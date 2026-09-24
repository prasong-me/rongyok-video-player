const App={
  videoList:[],catalog:null,player:null,episodeManager:null,currentTab:'home',currentVideo:null,busy:false,
  async init(){console.log('[App] Rongyok Player v7');this.player=new RongyokPlayer({autoNext:true});this.episodeManager=new EpisodeManager();this._setupEventListeners();await this.loadCatalog();},
  _setupEventListeners(){
    document.querySelectorAll('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));btn.classList.add('active');this.currentTab=btn.dataset.tab;document.getElementById(this.currentTab+'-tab').classList.add('active');if(this.currentTab==='history')this.renderHistory();if(this.currentTab==='bookmarks')this.renderBookmarks();}));
    document.getElementById('search-input').addEventListener('input',e=>this.filterVideos(e.target.value));
    document.getElementById('refresh-btn').addEventListener('click',()=>this.loadCatalog());
    document.getElementById('open-source-btn').addEventListener('click',()=>this.playSourceUrl());
    document.getElementById('source-url').addEventListener('keydown',e=>{if(e.key==='Enter')this.playSourceUrl()});
    document.getElementById('clear-history-btn').addEventListener('click',()=>{if(confirm('ลบประวัติการดูทั้งหมด?')){Storage.clearHistory();this.renderHistory()}});
    document.getElementById('clear-bookmarks-btn').addEventListener('click',()=>{if(confirm('ลบรายการบันทึกทั้งหมด?')){Storage.clearBookmarks();this.renderBookmarks()}});
  },
  async playSourceUrl(){
    const input=document.getElementById('source-url'),raw=input.value.trim();if(!raw){input.focus();return}
    let url;try{url=new URL(raw)}catch{alert('ลิงก์ไม่ถูกต้อง');return}
    if(url.hostname!=='rongyok.com'&&!url.hostname.endsWith('.rongyok.com')){alert('รองรับเฉพาะลิงก์จาก rongyok.com');return}
    await this.playVideo({id:url.href,title:'RongYok — '+(url.pathname.split('/').filter(Boolean).pop()||'ตอนที่เลือก'),path:url.pathname+url.search});
  },
  async loadCatalog(){
    ['new','recommended','popular','dub','sub','all'].forEach(id=>{const e=document.getElementById(id+'-list');if(e)e.innerHTML='<div class="loading">กำลังโหลด...</div>'});
    try{this.catalog=await RongyokSource.getCatalog();this.videoList=this.catalog.all;this.episodeManager.setItems(this.videoList);this.renderCatalog();if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{})}
    catch(e){console.error('[App] Catalog error',e);document.getElementById('all-list').innerHTML='<div class="loading">ไม่สามารถโหลดรายการ RongYok ได้</div>'}
  },
  renderCatalog(){for(const id of ['new','recommended','popular','dub','sub','all'])this.renderVideos(this.catalog?.[id]||[],document.getElementById(id+'-list'))},
  filterVideos(q){const query=q.trim().toLowerCase();this.renderVideos(this.videoList.filter(v=>(v.title||'').toLowerCase().includes(query)),document.getElementById('all-list'))},
  renderVideos(videos,el){if(!el)return;el.innerHTML='';if(!videos.length){el.innerHTML='<div class="empty-state">ไม่พบรายการ</div>';return}videos.forEach(v=>el.appendChild(this._createCard(v)))},
  _createCard(v){
    const card=document.createElement('article');card.className='video-card';const thumb=document.createElement('div');thumb.className='video-card-thumb';
    if(v.image){const img=document.createElement('img');img.src=v.image;img.alt=v.title||'';img.loading='lazy';img.referrerPolicy='no-referrer';thumb.appendChild(img)}else thumb.textContent='▶';
    const content=document.createElement('div');content.className='video-card-content';const title=document.createElement('div');title.className='video-card-title';title.textContent=v.title||'ไม่มีชื่อ';
    const meta=document.createElement('div');meta.className='video-card-meta';const p=Storage.getProgress(v.id);meta.textContent=p&&!p.completed&&p.duration?'กำลังดู '+Math.min(100,Math.round(p.time/p.duration*100))+'%':p?.completed?'ดูจบแล้ว':'พร้อมเล่น';
    const actions=document.createElement('div');actions.className='video-card-actions';const play=document.createElement('button');play.className='action-btn';play.textContent='▶ เปิดเรื่อง';play.onclick=e=>{e.stopPropagation();this.playVideo(v)};
    const mark=document.createElement('button');mark.className='action-btn';const b=Storage.isBookmarked(v.id);mark.textContent=b?'★ บันทึก':'☆ บันทึก';if(b)mark.classList.add('bookmarked');mark.onclick=e=>{e.stopPropagation();this.toggleBookmark(v,mark)};
    actions.append(play,mark);content.append(title,meta,actions);card.append(thumb,content);card.onclick=()=>this.playVideo(v);return card;
  },
  renderHistory(){const e=document.getElementById('history-list'),l=Storage.getHistory();this.renderVideos(l,e)},
  renderBookmarks(){const e=document.getElementById('bookmarks-list'),l=Storage.getBookmarks();this.renderVideos(l,e)},
  async playVideo(video){
    if(this.busy)return;this.busy=true;this.currentVideo=video;const e=document.getElementById('all-list'),old=e.innerHTML;e.innerHTML='<div class="loading">กำลังเตรียมวิดีโอ...</div>';
    try{const source=await VideoSource.resolve(video);Storage.addHistory(video);await this.player.loadVideoFullscreen(source.url,video.id,video.title,source.type);if(this.player.video)this.player.video.addEventListener('ended',()=>this._handleEnded(video),{once:true})}
    catch(err){console.error('[App] Source error',err);e.innerHTML=old;alert(err.message||'ไม่พบลิงก์วิดีโอ')}finally{this.busy=false}
  },
  async _handleEnded(video){const next=this.episodeManager.next(video.id);if(!next)return;try{const source=await VideoSource.resolve(next);Storage.addHistory(next);await this.player.loadVideoFullscreen(source.url,next.id,next.title,source.type);if(this.player.video)this.player.video.addEventListener('ended',()=>this._handleEnded(next),{once:true})}catch(e){console.error('[AutoNext] failed',e)}},
  toggleBookmark(v,btn){if(Storage.isBookmarked(v.id)){Storage.removeBookmark(v.id);btn.classList.remove('bookmarked');btn.textContent='☆ บันทึก'}else{Storage.addBookmark(v);btn.classList.add('bookmarked');btn.textContent='★ บันทึก'}}
};window.addEventListener('load',()=>App.init());window.App=App;