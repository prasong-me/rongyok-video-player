const App={
  videoList:[],catalog:null,player:null,episodeManager:null,currentTab:"home",currentVideo:null,currentSeries:null,busy:false,

  async init(){
    console.log("[App] RongYok UI rebuild");
    this.player=new RongyokPlayer({autoNext:true});
    this.episodeManager=new EpisodeManager();
    this._setupEventListeners();
    await this.loadCatalog();
  },

  _setupEventListeners(){
    document.querySelectorAll(".nav-tab").forEach(btn=>btn.addEventListener("click",()=>{
      document.querySelectorAll(".nav-tab").forEach(b=>b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c=>c.classList.remove("active"));
      btn.classList.add("active");
      this.currentTab=btn.dataset.tab;
      document.getElementById(this.currentTab+"-tab")?.classList.add("active");
      if(this.currentTab==="history")this.renderHistory();
      if(this.currentTab==="bookmarks")this.renderBookmarks();
    }));
    document.getElementById("search-input")?.addEventListener("input",e=>this.filterVideos(e.target.value));
    document.getElementById("refresh-btn")?.addEventListener("click",()=>this.loadCatalog());
    document.getElementById("clear-history-btn")?.addEventListener("click",()=>{
      if(confirm("ลบประวัติการดูทั้งหมด?")){Storage.clearHistory();this.renderHistory();}
    });
    document.getElementById("clear-bookmarks-btn")?.addEventListener("click",()=>{
      if(confirm("ลบรายการบันทึกทั้งหมด?")){Storage.clearBookmarks();this.renderBookmarks();}
    });
    document.getElementById("episode-close-btn")?.addEventListener("click",()=>this.closeEpisodePicker());
    document.getElementById("episode-backdrop")?.addEventListener("click",e=>{
      if(e.target.id==="episode-backdrop")this.closeEpisodePicker();
    });
  },

  async loadCatalog(){
    ["new","recommended","popular","dub","sub","all"].forEach(id=>{
      const el=document.getElementById(id+"-list");
      if(el)el.innerHTML='<div class="loading">กำลังโหลด...</div>';
    });
    try{
      this.catalog=await RongyokSource.getCatalog();
      this.videoList=this.catalog.all||[];
      this.renderCatalog();
      if("serviceWorker" in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
    }catch(error){
      console.error("[App] Catalog error",error);
      const all=document.getElementById("all-list");
      if(all)all.innerHTML='<div class="loading">ไม่สามารถโหลดรายการ RongYok ได้</div>';
    }
  },

  renderCatalog(){
    ["recommended","popular","new","dub","sub","all"].forEach(id=>{
      this.renderVideos(this.catalog?.[id]||[],document.getElementById(id+"-list"));
    });
  },

  filterVideos(query){
    const q=query.trim().toLowerCase();
    const result=this.videoList.filter(v=>(v.title||"").toLowerCase().includes(q));
    document.querySelectorAll(".catalog-section").forEach(s=>s.style.display=q?"none":"");
    const all=document.getElementById("all-list");
    const allSection=all?.closest(".catalog-section");
    if(allSection)allSection.style.display="";
    this.renderVideos(result,all);
  },

  renderVideos(videos,element){
    if(!element)return;
    element.innerHTML="";
    if(!videos.length){element.innerHTML='<div class="empty-state">ไม่พบรายการ</div>';return;}
    videos.forEach(video=>element.appendChild(this._createCard(video)));
  },

  _createCard(video){
    const card=document.createElement("article");
    card.className="video-card";
    const thumb=document.createElement("div");
    thumb.className="video-card-thumb";
    if(video.image){
      const img=document.createElement("img");
      img.src=video.image;img.alt=video.title||"";img.loading="lazy";img.referrerPolicy="no-referrer";
      thumb.appendChild(img);
    }
    const content=document.createElement("div");content.className="video-card-content";
    const title=document.createElement("div");title.className="video-card-title";title.textContent=video.title||"ไม่มีชื่อ";
    const meta=document.createElement("div");meta.className="video-card-meta";
    const progress=Storage.getProgress(video.id);
    meta.textContent=progress&&!progress.completed&&progress.duration?"กำลังดู "+Math.min(100,Math.round(progress.time/progress.duration*100))+"%":progress?.completed?"ดูจบแล้ว":"เลือกตอนเพื่อเล่น";
    const actions=document.createElement("div");actions.className="video-card-actions";
    const play=document.createElement("button");play.className="action-btn";play.textContent="▶ เลือกตอน";
    play.onclick=e=>{e.stopPropagation();this.openSeries(video)};
    const mark=document.createElement("button");mark.className="action-btn";const bookmarked=Storage.isBookmarked(video.id);
    mark.textContent=bookmarked?"★ บันทึก":"☆ บันทึก";if(bookmarked)mark.classList.add("bookmarked");
    mark.onclick=e=>{e.stopPropagation();this.toggleBookmark(video,mark)};
    actions.append(play,mark);content.append(title,meta,actions);card.append(thumb,content);card.onclick=()=>this.openSeries(video);
    return card;
  },

  async openSeries(video){
    if(this.busy)return;
    this.busy=true;this.currentSeries=video;
    const titleEl=document.getElementById("episode-title"),grid=document.getElementById("episode-list"),backdrop=document.getElementById("episode-backdrop");
    if(!backdrop||!grid||!titleEl){this.busy=false;return}
    backdrop.classList.add("active");titleEl.textContent=video.title||"เลือกตอน";grid.innerHTML='<div class="loading">กำลังอ่านจำนวนตอน...</div>';
    try{
      const info=await RongyokSource.getSeriesInfo(video.seriesUrl||video.path);
      this.currentSeries={...video,...info};titleEl.textContent=info.title||video.title||"เลือกตอน";
      if(!info.totalEpisodes)throw new Error("ไม่พบจำนวนตอนของเรื่องนี้");
      const items=Array.from({length:info.totalEpisodes},(_,i)=>({id:"series:"+info.seriesId+":ep:"+(i+1),seriesId:info.seriesId,episode:i+1,title:info.title+" — ตอนที่ "+(i+1),image:info.image||video.image,seriesUrl:info.seriesUrl}));
      this.episodeManager.setItems(items);grid.innerHTML="";
      items.forEach(item=>{
        const button=document.createElement("button");button.type="button";button.className="episode-btn";button.textContent="ตอน "+item.episode;
        const progress=Storage.getProgress(item.id);
        if(progress?.completed)button.classList.add("completed");else if(progress?.time>0&&progress?.duration)button.classList.add("in-progress");
        button.addEventListener("click",()=>{this.closeEpisodePicker();this.playEpisode(item)});
        grid.appendChild(button);
      });
    }catch(error){
      console.error("[App] Series info error",error);
      grid.innerHTML='<div class="empty-state">'+(error.message||"ไม่สามารถโหลดรายการตอนได้")+"</div>";
    }finally{this.busy=false}
  },

  closeEpisodePicker(){document.getElementById("episode-backdrop")?.classList.remove("active")},

  async playEpisode(video){
    if(this.busy)return;
    this.busy=true;this.currentVideo=video;
    try{
      const source=await VideoSource.resolve(video);
      Storage.addHistory(video);
      await this.player.loadVideoFullscreen(source.url,video.id,video.title,source.type);
      if(this.player.video)this.player.video.addEventListener("ended",()=>this._handleEnded(video),{once:true});
    }catch(error){
      console.error("[App] Source error",error);
      alert(error.message||"ไม่พบลิงก์วิดีโอ");
    }finally{this.busy=false}
  },

  async _handleEnded(video){
    const next=this.episodeManager.next(video.id);
    if(!next)return;
    try{
      const source=await VideoSource.resolve(next);
      Storage.addHistory(next);
      await this.player.loadVideoFullscreen(source.url,next.id,next.title,source.type);
      if(this.player.video)this.player.video.addEventListener("ended",()=>this._handleEnded(next),{once:true});
    }catch(error){
      console.error("[AutoNext] failed",error);
      alert("ไม่สามารถโหลดตอนถัดไปได้");
    }
  },

  renderHistory(){this.renderVideos(Storage.getHistory(),document.getElementById("history-list"))},
  renderBookmarks(){this.renderVideos(Storage.getBookmarks(),document.getElementById("bookmarks-list"))},

  toggleBookmark(video,button){
    if(Storage.isBookmarked(video.id)){Storage.removeBookmark(video.id);button.classList.remove("bookmarked");button.textContent="☆ บันทึก"}
    else{Storage.addBookmark(video);button.classList.add("bookmarked");button.textContent="★ บันทึก"}
  }
};
window.addEventListener("load",()=>App.init());
window.App=App;