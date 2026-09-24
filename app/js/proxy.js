const RongyokSource = {
  PROXIES:['https://corsproxy.io/?url=','https://api.allorigins.win/raw?url='],
  BASE_URL:'https://rongyok.com', TIMEOUT:12000, MAX_RESULTS:100,
  async fetchHtml(url){
    for(const proxy of this.PROXIES){
      try{
        const c=new AbortController(), t=setTimeout(()=>c.abort(),this.TIMEOUT);
        const r=await fetch(proxy+encodeURIComponent(url),{signal:c.signal}); clearTimeout(t);
        if(r.ok)return await r.text();
      }catch(e){console.error('[RongyokSource] fetchHtml:',e)}
    }
    throw new Error('ไม่สามารถดึงข้อมูลจาก RongYok ได้');
  },
  absoluteUrl(v){try{return new URL(v,this.BASE_URL).href}catch{return ''}},
  parseCatalogLinks(html){
    const d=new DOMParser().parseFromString(html,'text/html'), seen=new Set(), out=[];
    for(const a of [...d.querySelectorAll('a[href*="/series/"]')]){
      const href=this.absoluteUrl(a.getAttribute('href')); if(!href||seen.has(href))continue; seen.add(href);
      const box=a.closest('article,li,.card,.item,.series-card,.movie-card,div')||a;
      const img=box.querySelector?.('img'), title=(a.textContent||'').replace(/\s+/g,' ').trim();
      if(!title)continue;
      out.push({id:href,title,path:new URL(href).pathname+new URL(href).search,seriesUrl:href,
        image:this.absoluteUrl(img?.getAttribute('src')||img?.getAttribute('data-src')||''),
        type:/ซับไทย/i.test(title)?'sub':/พากย์ไทย/i.test(title)?'dub':'other'});
    }
    return out.slice(0,this.MAX_RESULTS);
  },
  async getCatalog(){
    const html=await this.fetchHtml(this.BASE_URL+'/'), d=new DOMParser().parseFromString(html,'text/html');
    const all=this.parseCatalogLinks(html), s={recommended:[],popular:[],new:[],dub:[],sub:[],all};
    const classify=h=>{const t=(h.textContent||'').replace(/\s+/g,' ').trim();
      if(/มาใหม่/i.test(t))return'new'; if(/ยอดนิยม/i.test(t))return'popular'; if(/แนะนำ/i.test(t))return'recommended';
      if(/พากย์ไทย/i.test(t))return'dub'; if(/ซับไทย/i.test(t))return'sub'; return null};
    for(const h of [...d.querySelectorAll('h1,h2,h3,h4')]){
      const key=classify(h); if(!key)continue; let n=h.nextElementSibling, local=[], guard=0;
      while(n&&guard++<12){
        for(const a of [...(n.querySelectorAll?.('a[href*="/series/"]')||[])]){
          const x=all.find(v=>v.seriesUrl===this.absoluteUrl(a.getAttribute('href')));
          if(x&&!local.some(v=>v.id===x.id))local.push(x);
        }
        if(/^h[1-4]$/i.test(n.tagName))break; n=n.nextElementSibling;
      }
      if(local.length)s[key]=local;
    }
    if(!s.new.length)s.new=all.slice(0,24);
    if(!s.recommended.length)s.recommended=all.slice(0,12);
    if(!s.popular.length)s.popular=all.slice(0,18);
    if(!s.dub.length)s.dub=all.filter(x=>x.type==='dub').slice(0,18);
    if(!s.sub.length)s.sub=all.filter(x=>x.type==='sub').slice(0,18);
    return s;
  },
  async getHomeList(){return (await this.getCatalog()).all},
  async getVideoSources(path){
    const html=await this.fetchHtml(this.BASE_URL+path), d=new DOMParser().parseFromString(html,'text/html'), links=new Set();
    d.querySelectorAll('video source,video[src],source[src]').forEach(e=>{const s=e.getAttribute('src');if(s)links.add(this.absoluteUrl(s))});
    for(const m of html.matchAll(/https?:\/\/[^"'\s<>]+\.(?:m3u8|mp4)(?:\?[^"'\s<>]*)?/gi))links.add(m[0]);
    return {success:links.size>0,links:[...links].map(url=>({url,type:/\.m3u8(?:$|[?#])/i.test(url)?'hls':'mp4',hasToken:/(?:token|expires|auth|signature|sig|key)=/i.test(url)}))};
  }
};
window.RongyokSource=RongyokSource;