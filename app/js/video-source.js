const VideoSource={
  async resolve(video){
    if(!video)throw new Error('Missing video');
    if(video.url)return this.normalize(video.url,video.type,video);
    if(!video.path)throw new Error('Missing video path');
    const r=await RongyokSource.getVideoSources(video.path);
    if(!r.success||!r.links.length)throw new Error('ไม่พบแหล่งวิดีโอจากหน้านี้');
    const x=r.links.find(v=>v.hasToken)||r.links.find(v=>v.type==='mp4')||r.links[0];
    return this.normalize(x.url,x.type,{...video,expiresAt:x.expiresAt});
  },
  normalize(url,type,meta={}){
    const clean=String(url||'').trim(), detected=type||(/\.m3u8(?:$|[?#])/i.test(clean)?'hls':'mp4');
    return {url:clean,type:detected,episode:meta.episode??null,expiresAt:meta.expiresAt??null,headers:meta.headers||null};
  }
};
window.VideoSource=VideoSource;