import React, { useState, useEffect, useRef, useContext, createContext } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { createClient } from "@supabase/supabase-js";

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding:"2rem", textAlign:"center", color:"#ff8888", fontFamily:"sans-serif" }}>
        <div style={{ fontSize:32, marginBottom:8 }}>😵</div>
        <div style={{ fontSize:16, marginBottom:4 }}>Something went wrong.</div>
        <button onClick={() => this.setState({ hasError: false })} style={{ marginTop:12, padding:"8px 16px", background:"#7F77DD", color:"#fff", border:"none", borderRadius:8, cursor:"pointer" }}>Try again</button>
      </div>
    );
    return this.props.children;
  }
}

// ─── Theme System ─────────────────────────────────────────────────────────────
const THEMES = {
  "dark-violet": {
    id:"dark-violet", mode:"dark", hue:"violet", label:"Dark Violet",
    bgPrimary:"#0a0a18", bgSecondary:"#1a1a2e", bgTertiary:"#12122a",
    bgHover:"#1e1e38", bgModal:"#0f0f1e", border:"#2a2a4a", borderStrong:"#3a3a5a",
    accent:"#7F77DD", accentText:"#ffffff",
    textPrimary:"#ffffff", textSecondary:"#8888aa", textMuted:"#555566",
    gold:"#f5c518", goldBg:"#3a2a00", goldText:"#f5c518",
    green:"#4ade80", greenBg:"#1a3a2a", greenBorder:"#1a4a2a",
    red:"#ff6b6b", redBg:"#1a0a0a", redBorder:"#3a2a2a", redButton:"#cc3333",
    purple:"#a388ee", purpleBg:"#1a1a4a", purpleBorder:"#2a2a5a",
    tagBg:"#1a1a3a", tagBorder:"#2a2a5a",
    chartText:"#aaaacc", chartGrid:"#555566",
    overlayBg:"rgba(0,0,0,0.88)", overlayBgDark:"rgba(0,0,0,0.95)", overlayBgDeep:"rgba(0,0,0,0.92)",
  },
  "dark-blue": {
    id:"dark-blue", mode:"dark", hue:"blue", label:"Dark Blue",
    bgPrimary:"#080f18", bgSecondary:"#0f1e30", bgTertiary:"#0a1420",
    bgHover:"#142030", bgModal:"#0a1220", border:"#1a2e44", borderStrong:"#2a3e54",
    accent:"#3b82f6", accentText:"#ffffff",
    textPrimary:"#ffffff", textSecondary:"#7799bb", textMuted:"#446677",
    gold:"#f5c518", goldBg:"#3a2a00", goldText:"#f5c518",
    green:"#4ade80", greenBg:"#0a2a1a", greenBorder:"#0a3a1a",
    red:"#ff6b6b", redBg:"#1a0a0a", redBorder:"#3a1a1a", redButton:"#cc3333",
    purple:"#93c5fd", purpleBg:"#0a1a3a", purpleBorder:"#1a2a4a",
    tagBg:"#0a1a3a", tagBorder:"#1a2e4a",
    chartText:"#7799bb", chartGrid:"#446677",
    overlayBg:"rgba(0,0,0,0.88)", overlayBgDark:"rgba(0,0,0,0.95)", overlayBgDeep:"rgba(0,0,0,0.92)",
  },
  "light-violet": {
    id:"light-violet", mode:"light", hue:"violet", label:"Light Violet",
    bgPrimary:"#f4f3fc", bgSecondary:"#eae8f8", bgTertiary:"#dddaf2",
    bgHover:"#e4e2f5", bgModal:"#ffffff", border:"#cac7e8", borderStrong:"#b0abdc",
    accent:"#6655cc", accentText:"#ffffff",
    textPrimary:"#111128", textSecondary:"#555577", textMuted:"#9999aa",
    gold:"#92400e", goldBg:"#fef3c7", goldText:"#92400e",
    green:"#16a34a", greenBg:"#dcfce7", greenBorder:"#86efac",
    red:"#dc2626", redBg:"#fef2f2", redBorder:"#fca5a5", redButton:"#dc2626",
    purple:"#6655cc", purpleBg:"#ede9fe", purpleBorder:"#c4b5fd",
    tagBg:"#ede9fe", tagBorder:"#c4b5fd",
    chartText:"#555577", chartGrid:"#9999aa",
    overlayBg:"rgba(0,0,0,0.5)", overlayBgDark:"rgba(0,0,0,0.75)", overlayBgDeep:"rgba(0,0,0,0.6)",
  },
  "light-blue": {
    id:"light-blue", mode:"light", hue:"blue", label:"Light Blue",
    bgPrimary:"#f0f6fc", bgSecondary:"#e0ecf8", bgTertiary:"#cce0f4",
    bgHover:"#d8eaf8", bgModal:"#ffffff", border:"#b0cce4", borderStrong:"#90b8d8",
    accent:"#2563eb", accentText:"#ffffff",
    textPrimary:"#0a1628", textSecondary:"#446688", textMuted:"#7799aa",
    gold:"#92400e", goldBg:"#fef3c7", goldText:"#92400e",
    green:"#16a34a", greenBg:"#dcfce7", greenBorder:"#86efac",
    red:"#dc2626", redBg:"#fef2f2", redBorder:"#fca5a5", redButton:"#dc2626",
    purple:"#2563eb", purpleBg:"#dbeafe", purpleBorder:"#93c5fd",
    tagBg:"#dbeafe", tagBorder:"#93c5fd",
    chartText:"#446688", chartGrid:"#7799aa",
    overlayBg:"rgba(0,0,0,0.5)", overlayBgDark:"rgba(0,0,0,0.75)", overlayBgDeep:"rgba(0,0,0,0.6)",
  },
};

const ThemeContext = createContext(THEMES["dark-violet"]);
const useT = () => useContext(ThemeContext);

// ─── Constants ────────────────────────────────────────────────────────────────
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || null;
const PROXY = "https://tmdb-proxy.darlanbrandt.workers.dev";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w1280";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const PAGE_SIZE = 20;
const PAGE_SIZE_LIST = 40;

// ─── Mappers ──────────────────────────────────────────────────────────────────
function rowToFilm(row) {
  return {
    id:row.id, title:row.title, year:row.year, genre:row.genre, director:row.director,
    country:row.country, actors:row.actors, awards:row.awards??0, imdbRating:row.imdb_rating,
    imdbId:row.imdb_id, poster:row.poster, backdrop:row.backdrop, plot:row.plot,
    runtime:row.runtime, rewatched:row.rewatched??false, list:row.list||"watched", created_at:row.created_at
  };
}
function filmToRow(film) {
  return {
    title:film.title, year:film.year, genre:film.genre, director:film.director,
    country:film.country, actors:film.actors, awards:Number(film.awards)||0,
    imdb_rating:film.imdbRating, imdb_id:film.imdbId, poster:film.poster,
    backdrop:film.backdrop, plot:film.plot, runtime:film.runtime,
    rewatched:film.rewatched??false, list:film.list||"watched"
  };
}

// ─── TMDB / OMDB ──────────────────────────────────────────────────────────────
async function tmdbFetch(path, params={}) {
  const qs = new URLSearchParams({path,...params}).toString();
  const res = await fetch(`${PROXY}?${qs}`);
  if (!res.ok) throw new Error(`Proxy error ${res.status}`);
  return res.json();
}

async function searchFilms(query, year, director, setStatus) {
  setStatus("Searching TMDB...");
  try {
    const fullQuery = [query,director].filter(Boolean).join(" ");
    const params = {query:fullQuery,include_adult:"false",page:"1"};
    if (year) params.year = year;
    const d = await tmdbFetch("/search/movie", params);
    setStatus("");
    if (d.results?.length) return d.results.slice(0,5).map(r=>({
      tmdb_id:r.id, title:r.title, original_title:r.original_title,
      year:r.release_date?.slice(0,4)||"?", overview:r.overview, poster_path:r.poster_path||null
    }));
    return [];
  } catch(e) { setStatus(""); throw e; }
}

async function getDetails(candidate, directorHint) {
  const [detail,credits] = await Promise.all([
    tmdbFetch(`/movie/${candidate.tmdb_id}`),
    tmdbFetch(`/movie/${candidate.tmdb_id}/credits`)
  ]);
  const director = credits.crew?.find(p=>p.job==="Director")?.name||directorHint||"";
  const actors = credits.cast?.slice(0,5).map(a=>a.name).join(", ")||"";
  const genre = detail.genres?.map(g=>g.name).join(", ")||"";
  const country = detail.production_countries?.[0]?.name||"";
  const poster = detail.poster_path?`${TMDB_IMG}${detail.poster_path}`:(candidate.poster_path?`${TMDB_IMG}${candidate.poster_path}`:"");
  const backdrop = detail.backdrop_path?`${TMDB_BACKDROP}${detail.backdrop_path}`:"";
  const plot = detail.overview||candidate.overview||"";
  const title = detail.title||candidate.title;
  const year = detail.release_date?.slice(0,4)||candidate.year||"";
  const runtime = detail.runtime?`${detail.runtime} min`:"";
  let awards=0, imdbRating="", imdbId="";
  try {
    const tmdbImdbId = detail.imdb_id||"";
    const q = tmdbImdbId?`${PROXY}/omdb?imdbId=${tmdbImdbId}`:`${PROXY}/omdb?title=${encodeURIComponent(title)}&year=${year}`;
    const omdb = await(await fetch(q)).json();
    if (omdb.Awards){const m=omdb.Awards.match(/Won (\d+) Oscar/i);if(m)awards=parseInt(m[1]);}
    if (omdb.imdbRating&&omdb.imdbRating!=="N/A") imdbRating=omdb.imdbRating;
    if (omdb.imdbID) imdbId=omdb.imdbID;
  } catch {}
  return {title,year,genre,director:directorHint||director,country,actors,awards:String(awards),imdbRating,imdbId,poster,backdrop,plot,runtime};
}

// ─── Storage Hook ─────────────────────────────────────────────────────────────
function useFilms() {
  const [films,setFilms] = useState([]);
  const [loading,setLoading] = useState(true);
  useEffect(()=>{
    (async()=>{
      if(supabase){
        const{data,error}=await supabase.from("films").select("*").order("created_at",{ascending:false});
        if(!error&&data) setFilms(data.map(rowToFilm));
      }
      setLoading(false);
    })();
  },[]);
  const addFilm = async(film)=>{
    if(supabase){
      const{data,error}=await supabase.from("films").insert(filmToRow(film)).select().single();
      if(!error&&data) setFilms(prev=>[rowToFilm(data),...prev]);
    } else setFilms(prev=>[{...film,id:Date.now()},...prev]);
  };
  const updateFilm = async(id,updates)=>{
    const row={};
    const map={title:"title",year:"year",genre:"genre",director:"director",country:"country",actors:"actors",poster:"poster",plot:"plot",list:"list",rewatched:"rewatched"};
    Object.entries(map).forEach(([k,v])=>{if(updates[k]!==undefined)row[v]=updates[k];});
    if(updates.awards!==undefined) row.awards=Number(updates.awards)||0;
    if(supabase) await supabase.from("films").update(row).eq("id",id);
    setFilms(prev=>prev.map(f=>f.id===id?{...f,...updates}:f));
  };
  const removeFilm = async(id)=>{
    if(supabase) await supabase.from("films").delete().eq("id",id);
    setFilms(prev=>prev.filter(f=>f.id!==id));
  };
  const toggleRewatch = async(id)=>{
    const film=films.find(f=>f.id===id);
    if(!film) return;
    await updateFilm(id,{rewatched:!film.rewatched});
  };
  return{films,loading,addFilm,updateFilm,removeFilm,toggleRewatch};
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function decadeOf(year){const y=parseInt(year);return isNaN(y)?"Unknown":`${Math.floor(y/10)*10}s`;}
function parseRuntime(r){if(!r)return 0;const m=String(r).match(/(\d+)/);return m?parseInt(m[1]):0;}

// ─── Fade ─────────────────────────────────────────────────────────────────────
function Fade({children}){
  const[vis,setVis]=useState(false);
  useEffect(()=>{requestAnimationFrame(()=>setVis(true));},[]);
  return<div style={{opacity:vis?1:0,transition:"opacity 0.2s ease"}}>{children}</div>;
}

// ─── Theme Toggle ─────────────────────────────────────────────────────────────
function ThemeToggle({themeId,onChange}){
  const t = useT();
  const[open,setOpen]=useState(false);
  const ref=useRef(null);
  useEffect(()=>{
    const h=(e)=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);};
    document.addEventListener("mousedown",h);
    return()=>document.removeEventListener("mousedown",h);
  },[]);
  const cur=THEMES[themeId];
  return(
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{background:t.bgSecondary,border:`1px solid ${t.border}`,borderRadius:8,padding:"8px 12px",cursor:"pointer",color:t.textSecondary,fontSize:13,display:"flex",alignItems:"center",gap:6}}>
        <span>{cur.mode==="dark"?"🌙":"☀️"}</span>
        <span style={{width:10,height:10,borderRadius:"50%",background:t.accent,display:"inline-block",flexShrink:0}}/>
        <span style={{fontSize:10}}>▾</span>
      </button>
      {open&&(
        <Fade>
          <div style={{position:"absolute",right:0,top:"calc(100% + 8px)",background:t.bgModal,border:`1px solid ${t.border}`,borderRadius:12,padding:"1rem",zIndex:10001,boxShadow:"0 8px 32px rgba(0,0,0,0.3)",minWidth:220}}>
            <div style={{fontSize:11,color:t.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Appearance</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {Object.values(THEMES).map(th=>(
                <button key={th.id} onClick={()=>{onChange(th.id);setOpen(false);}} style={{background:th.id===themeId?t.accent:t.bgSecondary,border:`1px solid ${th.id===themeId?t.accent:t.border}`,borderRadius:8,padding:"10px 8px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:5,color:th.id===themeId?"#fff":t.textSecondary,fontSize:12,transition:"all 0.15s"}}>
                  <div style={{display:"flex",alignItems:"center",gap:5}}>
                    <span>{th.mode==="dark"?"🌙":"☀️"}</span>
                    <span style={{width:10,height:10,borderRadius:"50%",background:th.accent,display:"inline-block",border:"1px solid rgba(255,255,255,0.3)"}}/>
                  </div>
                  <span style={{fontSize:11}}>{th.label}</span>
                </button>
              ))}
            </div>
            <div style={{marginTop:10,fontSize:11,color:t.textMuted,textAlign:"center"}}>More themes coming in v2.0</div>
          </div>
        </Fade>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({isWatchlist,onAdd,isUnlocked}){
  const t=useT();
  return(
    <div style={{textAlign:"center",padding:"3rem 1rem"}}>
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{marginBottom:16,opacity:0.5}}>
        <rect x="8" y="16" width="64" height="48" rx="4" stroke={t.accent} strokeWidth="2.5" fill="none"/>
        <circle cx="28" cy="40" r="10" stroke={t.accent} strokeWidth="2.5" fill="none"/>
        <path d="M24 40l3 3 5-6" stroke={t.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M44 32h16M44 40h12M44 48h8" stroke={t.accent} strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      </svg>
      <div style={{fontSize:16,fontWeight:500,color:t.textPrimary,marginBottom:8}}>
        {isWatchlist?"Your watchlist is empty":"No films in your collection yet"}
      </div>
      <div style={{fontSize:13,color:t.textSecondary,marginBottom:20}}>
        {isWatchlist?"Add films you want to watch and they'll appear here.":"Start building your personal film archive."}
      </div>
      {isUnlocked&&(
        <button onClick={onAdd} style={{background:t.accent,color:t.accentText,border:"none",borderRadius:8,padding:"10px 24px",fontWeight:500,cursor:"pointer",fontSize:14}}>
          + Add your first film
        </button>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({label,value,sub}){
  const t=useT();
  return(
    <div style={{background:t.bgSecondary,borderRadius:10,padding:"14px 18px",flex:1,minWidth:130,border:`1px solid ${t.border}`}}>
      <div style={{fontSize:11,color:t.textSecondary,marginBottom:4,textTransform:"uppercase",letterSpacing:1}}>{label}</div>
      <div style={{fontSize:20,fontWeight:500,color:t.textPrimary}}>{value||"-"}</div>
      {sub&&<div style={{fontSize:11,color:t.textSecondary,marginTop:2}}>{sub}</div>}
    </div>
  );
}

// ─── Film Card ────────────────────────────────────────────────────────────────
function FilmCard({film,onSelect}){
  const t=useT();
  return(
    <div onClick={()=>onSelect(film)} style={{cursor:"pointer",borderRadius:10,overflow:"hidden",border:`1px solid ${t.border}`,background:t.bgSecondary,display:"flex",flexDirection:"column",transition:"transform 0.15s, border-color 0.15s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.borderColor=t.accent;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.borderColor=t.border;}}
    >
      <div style={{height:210,background:t.bgTertiary,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        {film.poster&&film.poster!=="N/A"
          ?<img src={film.poster} alt={film.title} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
          :<span style={{fontSize:36,opacity:.4}}>🎬</span>}
        {film.rewatched&&<div style={{position:"absolute",top:8,right:8,background:t.greenBg,color:t.green,fontSize:10,borderRadius:6,padding:"2px 7px"}}>↩ Rewatched</div>}
        {film.list==="watchlist"&&<div style={{position:"absolute",top:8,left:8,background:t.purpleBg,color:t.purple,fontSize:10,borderRadius:6,padding:"2px 7px"}}>🔖 Watchlist</div>}
      </div>
      <div style={{padding:"10px 12px 12px"}}>
        <div style={{fontWeight:500,fontSize:13,color:t.textPrimary,lineHeight:1.3,marginBottom:3}}>{film.title}</div>
        <div style={{fontSize:11,color:t.textSecondary}}>{film.year} · {film.genre?.split(",")[0]}</div>
        {film.imdbRating&&<div style={{fontSize:11,color:t.goldText,marginTop:2}}>⭐ {film.imdbRating}/10</div>}
        {film.awards>0&&<div style={{marginTop:6,fontSize:10,background:t.goldBg,color:t.goldText,borderRadius:6,display:"inline-block",padding:"2px 8px"}}>★ {film.awards} Oscar{film.awards>1?"s":""}</div>}
      </div>
    </div>
  );
}

// ─── Film List Row ────────────────────────────────────────────────────────────
function FilmListRow({film,onSelect}){
  const t=useT();
  return(
    <div onClick={()=>onSelect(film)} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:12,padding:"8px 10px",borderRadius:8,border:`1px solid ${t.border}`,background:t.bgSecondary,transition:"border-color 0.15s, background 0.15s"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=t.accent;e.currentTarget.style.background=t.bgHover;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=t.border;e.currentTarget.style.background=t.bgSecondary;}}
    >
      <div style={{width:40,height:60,borderRadius:5,overflow:"hidden",flexShrink:0,background:t.bgTertiary,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {film.poster&&film.poster!=="N/A"
          ?<img src={film.poster} alt={film.title} style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>e.target.style.display="none"}/>
          :<span style={{fontSize:16,opacity:.4}}>🎬</span>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:500,fontSize:14,color:t.textPrimary,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{film.title}</div>
        <div style={{fontSize:12,color:t.textSecondary,marginTop:2}}>
          {film.year}{film.director?` · ${film.director}`:""}{film.genre?` · ${film.genre.split(",")[0]}`:""}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
        {film.imdbRating&&<div style={{fontSize:12,color:t.goldText}}>⭐ {film.imdbRating}</div>}
        {film.awards>0&&<div style={{fontSize:11,background:t.goldBg,color:t.goldText,borderRadius:6,padding:"1px 7px"}}>★ {film.awards}</div>}
        {film.rewatched&&<div style={{fontSize:10,background:t.greenBg,color:t.green,borderRadius:6,padding:"1px 7px"}}>↩</div>}
        {film.list==="watchlist"&&<div style={{fontSize:10,background:t.purpleBg,color:t.purple,borderRadius:6,padding:"1px 7px"}}>🔖</div>}
      </div>
    </div>
  );
}

// ─── Share Card ───────────────────────────────────────────────────────────────
function ShareCard({film,onClose}){
  const t=useT();
  const canvasRef=useRef(null);
  const[generating,setGenerating]=useState(true);
  const[ready,setReady]=useState(false);
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent);

  const loadImage=(src)=>new Promise((res,rej)=>{
    const img=new Image();img.crossOrigin="anonymous";
    img.onload=()=>res(img);img.onerror=rej;img.src=src;
  });
  const proxyUrl=(url)=>url?`${PROXY}/image?url=${encodeURIComponent(url)}`:null;

  useEffect(()=>{
    (async()=>{
      const canvas=canvasRef.current;
      const ctx=canvas.getContext("2d");
      const W=1080,H=1920;
      canvas.width=W;canvas.height=H;
      const bg=ctx.createLinearGradient(0,0,0,H);
      bg.addColorStop(0,"#0a0a18");bg.addColorStop(1,"#12122a");
      ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
      if(film.poster){
        try{
          const bgImg=await loadImage(proxyUrl(film.poster));
          if(!isIOS){ctx.save();ctx.filter="blur(40px) brightness(0.25)";ctx.drawImage(bgImg,-60,-60,W+120,H+120);ctx.restore();}
          else{ctx.save();ctx.globalAlpha=0.15;ctx.drawImage(bgImg,0,0,W,H);ctx.restore();}
        }catch{}
      }
      const ov=ctx.createLinearGradient(0,0,0,H);
      ov.addColorStop(0,"rgba(0,0,0,0.5)");ov.addColorStop(0.5,"rgba(0,0,0,0.3)");ov.addColorStop(1,"rgba(0,0,0,0.8)");
      ctx.fillStyle=ov;ctx.fillRect(0,0,W,H);
      const PW=640,PH=960,PX=(W-640)/2,PY=(H-960)/2-120;
      if(film.poster){
        try{
          const pi=await loadImage(proxyUrl(film.poster));
          const r=24;ctx.save();ctx.beginPath();
          ctx.moveTo(PX+r,PY);ctx.lineTo(PX+PW-r,PY);ctx.quadraticCurveTo(PX+PW,PY,PX+PW,PY+r);
          ctx.lineTo(PX+PW,PY+PH-r);ctx.quadraticCurveTo(PX+PW,PY+PH,PX+PW-r,PY+PH);
          ctx.lineTo(PX+r,PY+PH);ctx.quadraticCurveTo(PX,PY+PH,PX,PY+PH-r);
          ctx.lineTo(PX,PY+r);ctx.quadraticCurveTo(PX,PY,PX+r,PY);ctx.closePath();
          ctx.clip();ctx.drawImage(pi,PX,PY,PW,PH);ctx.restore();
          ctx.save();ctx.strokeStyle="rgba(255,255,255,0.08)";ctx.lineWidth=2;ctx.beginPath();
          ctx.moveTo(PX+r,PY);ctx.lineTo(PX+PW-r,PY);ctx.quadraticCurveTo(PX+PW,PY,PX+PW,PY+r);
          ctx.lineTo(PX+PW,PY+PH-r);ctx.quadraticCurveTo(PX+PW,PY+PH,PX+PW-r,PY+PH);
          ctx.lineTo(PX+r,PY+PH);ctx.quadraticCurveTo(PX,PY+PH,PX,PY+PH-r);
          ctx.lineTo(PX,PY+r);ctx.quadraticCurveTo(PX,PY,PX+r,PY);ctx.closePath();ctx.stroke();ctx.restore();
        }catch{}
      }
      const tY=PY+PH+70;ctx.textAlign="center";
      ctx.font="bold 64px sans-serif";ctx.fillStyle="#ffffff";
      let title=film.title;
      const maxW=W-120;
      while(ctx.measureText(title+"…").width>maxW&&title.length>0)title=title.slice(0,-1);
      if(title!==film.title)title+="…";
      ctx.fillText(title,W/2,tY);
      const meta=[film.year,film.genre?.split(",")[0]].filter(Boolean).join(" · ");
      ctx.font="36px sans-serif";ctx.fillStyle="rgba(255,255,255,0.55)";ctx.fillText(meta,W/2,tY+72);
      let eY=0;
      if(film.imdbRating){
        ctx.font="bold 42px sans-serif";ctx.fillStyle="#f5c518";
        ctx.fillText(`⭐ ${film.imdbRating} / 10  IMDb`,W/2,tY+152);eY=60;
      }
      if(film.awards>0){ctx.font="36px sans-serif";ctx.fillStyle="#f5c518";ctx.fillText(`★ ${film.awards} Oscar${film.awards>1?"s":""}`,W/2,tY+152+eY);}
      ctx.strokeStyle="rgba(255,255,255,0.15)";ctx.lineWidth=1;ctx.beginPath();
      ctx.moveTo(W/2-120,H-160);ctx.lineTo(W/2+120,H-160);ctx.stroke();
      ctx.font="32px sans-serif";ctx.fillStyle="rgba(255,255,255,0.35)";ctx.fillText("My Film Collection",W/2,H-110);
      setGenerating(false);setReady(true);
    })();
  },[]);

  const download=()=>{
    const dataUrl=canvasRef.current.toDataURL("image/png");
    if(isIOS){const w=window.open();w.document.write(`<img src="${dataUrl}" style="max-width:100%"/>`);w.document.title=film.title;}
    else{const l=document.createElement("a");l.download=`${film.title.replace(/[^a-z0-9]/gi,"_")}_share.png`;l.href=dataUrl;l.click();}
  };

  return(
    <Fade>
      <div style={{position:"fixed",inset:0,background:t.overlayBgDeep,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:10000,padding:"1rem"}} onClick={onClose}>
        <div onClick={e=>e.stopPropagation()} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,maxWidth:320,width:"100%"}}>
          {generating&&<div style={{color:t.textSecondary,fontSize:14,padding:"2rem"}}>Generating share card...</div>}
          <canvas ref={canvasRef} style={{width:"100%",borderRadius:12,boxShadow:"0 8px 40px rgba(0,0,0,0.8)",display:ready?"block":"none"}}/>
          <div style={{display:"flex",gap:8,width:"100%"}}>
            <button onClick={onClose} style={{flex:1,background:"none",border:`1px solid ${t.border}`,borderRadius:8,color:t.textSecondary,padding:"10px",cursor:"pointer",fontSize:13}}>Close</button>
            {ready&&<button onClick={download} style={{flex:2,background:t.accent,color:t.accentText,border:"none",borderRadius:8,padding:"10px",fontWeight:500,cursor:"pointer",fontSize:14}}>{isIOS?"🖼 Open image":"⬇ Download for Stories"}</button>}
          </div>
          {ready&&<div style={{fontSize:11,color:t.textMuted,textAlign:"center"}}>{isIOS?"Long-press the image to save it, then share to Stories":"Save and share it to your Instagram Story"}</div>}
        </div>
      </div>
    </Fade>
  );
}

// ─── Film Detail Modal ────────────────────────────────────────────────────────
function FilmDetailModal({film,onClose,onRemove,onToggleRewatch,onMoveToWatched,onEdit,onShare,isUnlocked}){
  const t=useT();
  const[confirmRemove,setConfirmRemove]=useState(false);
  return(
    <Fade>
      <div style={{position:"fixed",inset:0,background:t.overlayBgDark,zIndex:9999,overflowY:"auto"}} onClick={onClose}>
        <div onClick={e=>e.stopPropagation()} style={{maxWidth:860,margin:"0 auto",paddingBottom:"3rem"}}>
          <div style={{position:"relative",height:320,background:t.bgTertiary,overflow:"hidden"}}>
            {film.backdrop?<img src={film.backdrop} alt="" style={{width:"100%",height:"100%",objectFit:"cover",opacity:0.6}}/>
              :film.poster?<img src={film.poster} alt="" style={{width:"100%",height:"100%",objectFit:"cover",filter:"blur(18px) brightness(0.4)",transform:"scale(1.1)"}}/>:null}
            <div style={{position:"absolute",inset:0,background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.95) 100%)"}}/>
            <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"rgba(0,0,0,0.6)",border:"1px solid #444",borderRadius:"50%",width:36,height:36,color:"#fff",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
          <div style={{padding:"0 1.5rem",marginTop:-80,position:"relative"}}>
            <div style={{display:"flex",gap:20,alignItems:"flex-end",marginBottom:"1.5rem"}}>
              {film.poster&&<img src={film.poster} alt={film.title} style={{width:120,borderRadius:10,boxShadow:"0 8px 32px rgba(0,0,0,0.6)",flexShrink:0}}/>}
              <div style={{flex:1,paddingBottom:4}}>
                <div style={{fontSize:24,fontWeight:600,color:"#fff",lineHeight:1.2,marginBottom:6}}>{film.title}</div>
                <div style={{fontSize:13,color:"rgba(255,255,255,0.55)",marginBottom:8}}>{film.year}{film.runtime?` · ${film.runtime}`:""}{film.country?` · ${film.country}`:""}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                  {film.genre?.split(",").map(g=><span key={g} style={{fontSize:11,background:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.8)",borderRadius:6,padding:"3px 10px",border:"1px solid rgba(255,255,255,0.2)"}}>{g.trim()}</span>)}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:16,marginBottom:"1.5rem",flexWrap:"wrap"}}>
              {film.imdbRating&&<div style={{background:"rgba(0,0,0,0.4)",borderRadius:8,padding:"10px 16px",border:"1px solid rgba(255,255,255,0.1)",textAlign:"center"}}><div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginBottom:2}}>IMDb</div><div style={{fontSize:18,fontWeight:600,color:"#f5c518"}}>⭐ {film.imdbRating}</div></div>}
              {film.awards>0&&<div style={{background:"rgba(0,0,0,0.4)",borderRadius:8,padding:"10px 16px",border:"1px solid rgba(255,255,255,0.1)",textAlign:"center"}}><div style={{fontSize:11,color:"rgba(255,255,255,0.5)",marginBottom:2}}>Oscars</div><div style={{fontSize:18,fontWeight:600,color:"#f5c518"}}>★ {film.awards}</div></div>}
              {film.rewatched&&<div style={{background:"rgba(0,100,50,0.3)",borderRadius:8,padding:"10px 16px",border:"1px solid rgba(74,222,128,0.3)",textAlign:"center"}}><div style={{fontSize:11,color:"rgba(74,222,128,0.7)",marginBottom:2}}>Status</div><div style={{fontSize:14,fontWeight:600,color:"#4ade80"}}>↩ Rewatched</div></div>}
            </div>
            {film.plot&&<div style={{marginBottom:"1.5rem"}}><div style={{fontSize:12,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Plot</div><div style={{fontSize:14,color:"rgba(255,255,255,0.8)",lineHeight:1.7}}>{film.plot}</div></div>}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:"1.5rem"}}>
              {film.director&&<div><div style={{fontSize:12,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Director</div><div style={{fontSize:14,color:"#fff"}}>{film.director}</div></div>}
              {film.actors&&<div><div style={{fontSize:12,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Cast</div><div style={{fontSize:13,color:"rgba(255,255,255,0.7)",lineHeight:1.6}}>{film.actors.split(",").map(a=>a.trim()).join(" · ")}</div></div>}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {isUnlocked&&(
                <>
                  <button onClick={()=>{onShare(film);onClose();}} style={{fontSize:13,color:"#fff",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:8,padding:"8px 16px",cursor:"pointer"}}>📤 Share</button>
                  {film.list==="watchlist"
                    ?<button onClick={()=>{onMoveToWatched(film.id);onClose();}} style={{fontSize:13,color:"#a388ee",background:"none",border:"1px solid rgba(163,136,238,0.3)",borderRadius:8,padding:"8px 16px",cursor:"pointer"}}>✓ Move to watched</button>
                    :<button onClick={()=>onToggleRewatch(film.id)} style={{fontSize:13,color:"#4ade80",background:"none",border:"1px solid rgba(74,222,128,0.3)",borderRadius:8,padding:"8px 16px",cursor:"pointer"}}>{film.rewatched?"↩ Rewatched ✓":"Mark as rewatched"}</button>
                  }
                  <button onClick={()=>{onEdit(film);onClose();}} style={{fontSize:13,color:"#a388ee",background:"none",border:"1px solid rgba(163,136,238,0.3)",borderRadius:8,padding:"8px 16px",cursor:"pointer"}}>✏️ Edit</button>
                  {!confirmRemove
                    ?<button onClick={()=>setConfirmRemove(true)} style={{fontSize:13,color:"#ff6b6b",background:"none",border:"1px solid rgba(255,107,107,0.3)",borderRadius:8,padding:"8px 16px",cursor:"pointer"}}>Remove</button>
                    :<div style={{display:"flex",alignItems:"center",gap:8,background:"rgba(100,0,0,0.4)",border:"1px solid rgba(255,107,107,0.3)",borderRadius:8,padding:"8px 12px"}}>
                      <span style={{fontSize:13,color:"#ff8888"}}>Remove "{film.title}"?</span>
                      <button onClick={()=>{onRemove(film.id);onClose();}} style={{fontSize:12,color:"#fff",background:"#cc3333",border:"none",borderRadius:6,padding:"5px 12px",cursor:"pointer",fontWeight:500}}>Yes</button>
                      <button onClick={()=>setConfirmRemove(false)} style={{fontSize:12,color:"#aaa",background:"none",border:"1px solid #444",borderRadius:6,padding:"5px 12px",cursor:"pointer"}}>Cancel</button>
                    </div>
                  }
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Fade>
  );
}

// ─── Password Modal ───────────────────────────────────────────────────────────
function PasswordModal({onSuccess,onClose}){
  const t=useT();
  const[value,setValue]=useState("");
  const[err,setErr]=useState("");
  const submit=()=>{
    if(value===APP_PASSWORD){onSuccess();onClose();}
    else{setErr("Wrong password. Try again.");setValue("");}
  };
  return(
    <Fade>
      <div style={{position:"fixed",inset:0,background:t.overlayBg,display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
        <div style={{background:t.bgModal,border:`1px solid ${t.border}`,borderRadius:14,padding:"1.5rem",width:"min(360px, 94vw)",color:t.textPrimary}}>
          <div style={{fontSize:17,fontWeight:500,marginBottom:"0.5rem"}}>Enter password</div>
          <div style={{fontSize:12,color:t.textSecondary,marginBottom:"1rem"}}>This action is restricted to the collection owner.</div>
          <input type="password" value={value} onChange={e=>{setValue(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Password" autoFocus style={{width:"100%",boxSizing:"border-box",background:t.bgTertiary,border:`1px solid ${t.border}`,borderRadius:6,color:t.textPrimary,padding:"9px 12px",fontSize:13,marginBottom:8}}/>
          {err&&<div style={{fontSize:12,color:t.red,marginBottom:8}}>{err}</div>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={onClose} style={{flex:1,background:"none",border:`1px solid ${t.border}`,borderRadius:6,color:t.textSecondary,padding:"9px",cursor:"pointer",fontSize:13}}>Cancel</button>
            <button onClick={submit} style={{flex:2,background:t.accent,color:t.accentText,border:"none",borderRadius:8,padding:"9px",fontWeight:500,cursor:"pointer",fontSize:13}}>Unlock</button>
          </div>
        </div>
      </div>
    </Fade>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function AddModal({onClose,onAdd,onUpdate,existingFilms,editFilm}){
  const t=useT();
  const isEdit=!!editFilm;
  const[query,setQuery]=useState("");
  const[yearQuery,setYearQuery]=useState("");
  const[directorQuery,setDirectorQuery]=useState("");
  const[step,setStep]=useState(isEdit?"edit":"search");
  const[loading,setLoading]=useState(false);
  const[status,setStatus]=useState("");
  const[candidates,setCandidates]=useState([]);
  const[addToWatchlist,setAddToWatchlist]=useState(false);
  const[form,setForm]=useState(isEdit?{
    title:editFilm.title||"",year:editFilm.year||"",genre:editFilm.genre||"",
    director:editFilm.director||"",country:editFilm.country||"",actors:editFilm.actors||"",
    awards:String(editFilm.awards??""),imdbRating:editFilm.imdbRating||"",imdbId:editFilm.imdbId||"",
    poster:editFilm.poster||"",backdrop:editFilm.backdrop||"",plot:editFilm.plot||"",runtime:editFilm.runtime||""
  }:{title:"",year:"",genre:"",director:"",country:"",actors:"",awards:"",imdbRating:"",imdbId:"",poster:"",backdrop:"",plot:"",runtime:""});
  const[err,setErr]=useState("");

  const inp={background:t.bgTertiary,border:`1px solid ${t.border}`,borderRadius:6,color:t.textPrimary,padding:"8px 10px",fontSize:13,boxSizing:"border-box"};

  const doSearch=async()=>{
    const q=query.trim().slice(0,100);const y=yearQuery.trim().slice(0,4).replace(/\D/g,"");const d=directorQuery.trim().slice(0,100);
    if(!q)return;setLoading(true);setErr("");
    try{
      const results=await searchFilms(q,y,d,setStatus);
      if(!results.length){setErr("No results found. Try different terms or fill in manually.");setForm(f=>({...f,title:query,year:yearQuery,director:directorQuery}));setStep("edit");}
      else{setCandidates(results);setStep("confirm");}
    }catch(e){setErr(`Search error: ${e.message}`);}
    setStatus("");setLoading(false);
  };

  const selectCandidate=async(c)=>{
    setLoading(true);setErr("");setStatus("Fetching details...");
    try{const f=await getDetails(c,directorQuery.trim());setForm(f);setStep("edit");}
    catch(e){setErr(`Could not load details: ${e.message}`);setForm(f=>({...f,title:c.title,year:c.year,director:directorQuery.trim(),poster:c.poster_path?`${TMDB_IMG}${c.poster_path}`:""}));setStep("edit");}
    setStatus("");setLoading(false);
  };

  const handleSave=()=>{
    if(!form.title.trim()){setErr("Title is required.");return;}
    if(!form.year.trim()||isNaN(parseInt(form.year))){setErr("A valid year is required.");return;}
    if(!isEdit){
      const dup=existingFilms.find(f=>(form.imdbId&&f.imdbId&&form.imdbId===f.imdbId)||(f.title.trim().toLowerCase()===form.title.trim().toLowerCase()&&f.year===form.year.trim()));
      if(dup){setErr(`"${dup.title}" (${dup.year}) is already in your collection.`);return;}
      onAdd({...form,awards:Number(form.awards)||0,rewatched:false,list:addToWatchlist?"watchlist":"watched"});
    }else{onUpdate(editFilm.id,{...form,awards:Number(form.awards)||0});}
    onClose();
  };

  const Field=({label,k,type="text"})=>(
    <div>
      <label style={{fontSize:11,color:t.textSecondary,display:"block",marginBottom:3}}>{label}</label>
      <input type={type} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{width:"100%",...inp}}/>
    </div>
  );

  return(
    <Fade>
      <div style={{position:"fixed",inset:0,background:t.overlayBg,display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999}}>
        <div style={{background:t.bgModal,border:`1px solid ${t.border}`,borderRadius:14,padding:"1.5rem",width:"min(560px, 94vw)",maxHeight:"90vh",overflowY:"auto",color:t.textPrimary}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem"}}>
            <div style={{fontSize:17,fontWeight:500}}>{isEdit?`Edit — ${editFilm.title}`:step==="search"?"Add a film":step==="confirm"?"Select the correct film":"Review details"}</div>
            <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:22,color:t.textMuted}}>×</button>
          </div>

          {step==="search"&&(
            <>
              <div style={{fontSize:12,color:t.textSecondary,marginBottom:"0.75rem",lineHeight:1.6}}>Add a year or director to narrow results.</div>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()} placeholder="Film title..." style={{flex:3,...inp}}/>
                <input value={yearQuery} onChange={e=>setYearQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()} placeholder="Year" style={{flex:1,...inp}}/>
              </div>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                <input value={directorQuery} onChange={e=>setDirectorQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doSearch()} placeholder="Director (optional)" style={{flex:1,...inp}}/>
                <button onClick={doSearch} disabled={loading} style={{whiteSpace:"nowrap",background:t.accent,color:t.accentText,border:"none",borderRadius:6,padding:"9px 16px",fontWeight:500,cursor:"pointer",fontSize:13,opacity:loading?0.7:1}}>{loading?"Searching...":"Search"}</button>
              </div>
              <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:t.textSecondary,cursor:"pointer"}}>
                <input type="checkbox" checked={addToWatchlist} onChange={e=>setAddToWatchlist(e.target.checked)}/>
                Add to watchlist instead of watched
              </label>
              {status&&<div style={{fontSize:12,color:t.accent,marginTop:8}}>{status}</div>}
              {err&&<div style={{fontSize:12,color:t.red,marginTop:8}}>{err}</div>}
            </>
          )}

          {step==="confirm"&&(
            <>
              <div style={{fontSize:12,color:t.textSecondary,marginBottom:"1rem"}}>Select the correct film below.</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:"1rem"}}>
                {candidates.map((c,i)=>(
                  <button key={i} onClick={()=>!loading&&selectCandidate(c)} style={{background:t.bgSecondary,border:`1px solid ${t.border}`,borderRadius:8,padding:"10px 12px",cursor:"pointer",textAlign:"left",color:t.textPrimary,opacity:loading?0.5:1,display:"flex",gap:12,alignItems:"center"}}>
                    {c.poster_path?<img src={`https://image.tmdb.org/t/p/w92${c.poster_path}`} alt="" style={{width:40,height:60,objectFit:"cover",borderRadius:4,flexShrink:0}} onError={e=>e.target.style.display="none"}/>:<div style={{width:40,height:60,background:t.bgTertiary,borderRadius:4,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🎬</div>}
                    <div>
                      <div style={{fontWeight:500,fontSize:14}}>{c.title} <span style={{color:t.textSecondary,fontWeight:400}}>({c.year})</span></div>
                      {c.original_title&&c.original_title!==c.title&&<div style={{fontSize:11,color:t.textMuted,marginTop:1}}>{c.original_title}</div>}
                      {c.overview&&<div style={{fontSize:11,color:t.textSecondary,marginTop:4,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{c.overview}</div>}
                    </div>
                  </button>
                ))}
              </div>
              {status&&<div style={{fontSize:12,color:t.accent,marginBottom:8,textAlign:"center"}}>{status}</div>}
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>{setStep("search");setCandidates([]);}} style={{flex:1,background:"none",border:`1px solid ${t.border}`,borderRadius:6,color:t.textSecondary,padding:"9px",cursor:"pointer",fontSize:13}}>Back</button>
                <button onClick={()=>{setForm(f=>({...f,title:query,year:yearQuery,director:directorQuery}));setStep("edit");}} style={{flex:1,background:"none",border:`1px solid ${t.border}`,borderRadius:6,color:t.textSecondary,padding:"9px",cursor:"pointer",fontSize:13}}>Fill manually</button>
              </div>
            </>
          )}

          {step==="edit"&&(
            <>
              <div style={{fontSize:12,color:t.textSecondary,marginBottom:"0.75rem",lineHeight:1.5}}>{isEdit?"Update any field and save.":"Review all fields before saving."}</div>
              {err&&<div style={{fontSize:12,color:t.red,marginBottom:8}}>{err}</div>}
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {form.poster
                  ?<div style={{textAlign:"center"}}><img src={form.poster} alt="poster" style={{height:170,borderRadius:8,objectFit:"cover"}} onError={e=>e.target.style.display="none"}/></div>
                  :<div style={{textAlign:"center",padding:"1rem",color:t.textMuted,fontSize:12,border:`1px dashed ${t.border}`,borderRadius:8}}>No poster found — paste a URL below</div>
                }
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <Field label="Title" k="title"/><Field label="Year" k="year"/>
                  <Field label="Genre" k="genre"/><Field label="Director" k="director"/>
                  <Field label="Country" k="country"/><Field label="Oscars won" k="awards" type="number"/>
                </div>
                <Field label="Main cast (comma-separated)" k="actors"/>
                <Field label="Poster URL" k="poster"/>
                <div>
                  <label style={{fontSize:11,color:t.textSecondary,display:"block",marginBottom:3}}>Plot</label>
                  <textarea value={form.plot} onChange={e=>setForm(f=>({...f,plot:e.target.value}))} rows={3} style={{width:"100%",...inp,resize:"vertical"}}/>
                </div>
                {form.imdbRating&&<div style={{fontSize:12,color:t.textSecondary}}>IMDb rating: <span style={{color:t.goldText}}>⭐ {form.imdbRating}/10</span></div>}
                <div style={{display:"flex",gap:8}}>
                  {!isEdit&&<button onClick={()=>setStep("confirm")} style={{flex:1,background:"none",border:`1px solid ${t.border}`,borderRadius:6,color:t.textSecondary,padding:"10px",cursor:"pointer",fontSize:13}}>Back</button>}
                  <button onClick={handleSave} style={{flex:2,background:t.accent,color:t.accentText,border:"none",borderRadius:8,padding:"10px",fontWeight:500,cursor:"pointer",fontSize:14}}>{isEdit?"Save changes":"Add to collection"}</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Fade>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function AppInner(){
  const[themeId,setThemeId]=useState(()=>{try{return localStorage.getItem("mfc_theme")||"dark-violet";}catch{return"dark-violet";}});
  useEffect(()=>{try{localStorage.setItem("mfc_theme",themeId);}catch{}},[themeId]);
  const theme=THEMES[themeId]||THEMES["dark-violet"];

  const{films,loading,addFilm,updateFilm,removeFilm,toggleRewatch}=useFilms();
  const[tab,setTab]=useState("watched");
  const[showAdd,setShowAdd]=useState(false);
  const[showPassword,setShowPassword]=useState(false);
  const[pendingAction,setPendingAction]=useState(null);
  const[isUnlocked,setIsUnlocked]=useState(!APP_PASSWORD);
  const[search,setSearch]=useState("");
  const[filterGenre,setFilterGenre]=useState("All");
  const[filterDecade,setFilterDecade]=useState("All");
  const[filterDirector,setFilterDirector]=useState("All");
  const[filterCountry,setFilterCountry]=useState("All");
  const[sortBy,setSortBy]=useState("dateAdded");
  const[sortDir,setSortDir]=useState("desc");
  const[viewMode,setViewMode]=useState("grid");
  const[page,setPage]=useState(1);
  const[selectedFilm,setSelectedFilm]=useState(null);
  const[editFilm,setEditFilm]=useState(null);
  const[shareFilm,setShareFilm]=useState(null);

  useEffect(()=>{setPage(1);},[tab,search,filterGenre,filterDecade,filterDirector,filterCountry,sortBy,sortDir]);

  const t=theme;
  const sel={background:t.bgTertiary,border:`1px solid ${t.border}`,borderRadius:6,color:t.textPrimary,padding:"8px 10px",fontSize:13};

  const requireUnlock=(action)=>{if(isUnlocked)action();else{setPendingAction(()=>action);setShowPassword(true);}};
  const handleAddClick=()=>requireUnlock(()=>setShowAdd(true));
  const handleEdit=(film)=>requireUnlock(()=>setEditFilm(film));

  const watchedFilms=films.filter(f=>f.list!=="watchlist");
  const watchlistFilms=films.filter(f=>f.list==="watchlist");
  const activeFilms=tab==="watchlist"?watchlistFilms:watchedFilms;

  const sortAlpha=(a,b)=>a==="All"?-1:b==="All"?1:a.localeCompare(b);
  const allGenres=["All",...new Set(activeFilms.flatMap(f=>f.genre?.split(",").map(g=>g.trim()).filter(Boolean)))].sort(sortAlpha);
  const allDecades=["All",...new Set(activeFilms.map(f=>decadeOf(f.year)).filter(d=>d!=="Unknown"))].sort(sortAlpha);
  const allDirectors=["All",...new Set(activeFilms.map(f=>f.director).filter(Boolean))].sort(sortAlpha);
  const allCountries=["All",...new Set(activeFilms.map(f=>f.country).filter(Boolean))].sort(sortAlpha);

  const genreCounts=activeFilms.reduce((m,f)=>{f.genre?.split(",").forEach(g=>{const k=g.trim();if(k)m[k]=(m[k]||0)+1;});return m;},{});
  const decadeCounts=activeFilms.reduce((m,f)=>{const d=decadeOf(f.year);if(d!=="Unknown")m[d]=(m[d]||0)+1;return m;},{});

  const filtered=activeFilms.filter(f=>{
    const q=search.toLowerCase();
    return(!q||[f.title,f.director,f.actors,f.country,f.genre].some(v=>v?.toLowerCase().includes(q)))
      &&(filterGenre==="All"||f.genre?.toLowerCase().includes(filterGenre.toLowerCase()))
      &&(filterDecade==="All"||decadeOf(f.year)===filterDecade)
      &&(filterDirector==="All"||f.director===filterDirector)
      &&(filterCountry==="All"||f.country===filterCountry);
  }).sort((a,b)=>{
    const dir=sortDir==="asc"?1:-1;
    if(sortBy==="title")return dir*a.title.localeCompare(b.title);
    if(sortBy==="year")return dir*(parseInt(a.year)-parseInt(b.year));
    if(sortBy==="imdbRating")return dir*(parseFloat(a.imdbRating||0)-parseFloat(b.imdbRating||0));
    if(sortBy==="awards")return dir*((Number(a.awards)||0)-(Number(b.awards)||0));
    return dir*(a.id-b.id);
  });

  const pageSize=viewMode==="list"?PAGE_SIZE_LIST:PAGE_SIZE;
  const paginated=filtered.slice(0,page*pageSize);
  const hasMore=paginated.length<filtered.length;

  const tally=arr=>arr.reduce((m,k)=>{m[k]=(m[k]||0)+1;return m;},{});
  const toChart=obj=>Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,films])=>({name,films}));

  const byDecade=toChart(tally(watchedFilms.map(f=>decadeOf(f.year)).filter(d=>d!=="Unknown"))).sort((a,b)=>a.name.localeCompare(b.name));
  const byGenre=toChart(tally(watchedFilms.flatMap(f=>f.genre?.split(",").map(g=>g.trim()).filter(Boolean)||[])));
  const byDirector=toChart(tally(watchedFilms.map(f=>f.director).filter(Boolean)));
  const byCountry=toChart(tally(watchedFilms.map(f=>f.country).filter(Boolean)));

  const totalOscars=watchedFilms.reduce((s,f)=>s+(Number(f.awards)||0),0);
  const ratedFilms=watchedFilms.filter(f=>f.imdbRating);
  const avgRating=ratedFilms.length?(ratedFilms.reduce((s,f)=>s+parseFloat(f.imdbRating),0)/ratedFilms.length).toFixed(1):"-";
  const topGenre=byGenre[0]?.name||"-";
  const topDirector=byDirector[0]?.name||"-";
  const topDecade=[...byDecade].sort((a,b)=>b.films-a.films)[0]?.name||"-";
  const topForeignCountry=(()=>{const c={};watchedFilms.forEach(f=>{if(f.country&&f.country!=="United States"&&f.country!=="USA")c[f.country]=(c[f.country]||0)+1;});return Object.entries(c).sort((a,b)=>b[1]-a[1])[0]?.[0]||"-";})();
  const withRuntime=watchedFilms.filter(f=>parseRuntime(f.runtime)>0);
  const longestFilm=withRuntime.length?withRuntime.reduce((a,b)=>parseRuntime(a.runtime)>parseRuntime(b.runtime)?a:b):null;
  const shortestFilm=withRuntime.length?withRuntime.reduce((a,b)=>parseRuntime(a.runtime)<parseRuntime(b.runtime)?a:b):null;
  const mostAwardedDirector=(()=>{const c={};watchedFilms.forEach(f=>{if(f.director&&f.awards>0)c[f.director]=(c[f.director]||0)+Number(f.awards);});return Object.entries(c).sort((a,b)=>b[1]-a[1])[0]||null;})();

  const tabBtn=(tId,label,count)=>(
    <button onClick={()=>setTab(tId)} style={{padding:"8px 20px",border:"none",borderRadius:8,cursor:"pointer",fontWeight:500,fontSize:13,background:tab===tId?t.accent:t.bgSecondary,color:tab===tId?t.accentText:t.textSecondary,display:"flex",alignItems:"center",gap:6,transition:"all 0.15s"}}>
      {label}
      {count>0&&<span style={{fontSize:10,background:tab===tId?"rgba(255,255,255,0.2)":t.bgTertiary,borderRadius:10,padding:"1px 7px",color:tab===tId?"#fff":t.textSecondary}}>{count}</span>}
    </button>
  );

  const ChartBlock=({title,data,color})=>(
    <div style={{background:t.bgSecondary,borderRadius:10,border:`1px solid ${t.border}`,padding:"1rem 1.25rem",marginBottom:"1rem"}}>
      <div style={{fontSize:14,fontWeight:500,marginBottom:"0.75rem",color:t.textPrimary}}>{title}</div>
      {data.length===0
        ?<div style={{fontSize:13,color:t.textMuted,padding:"1rem 0"}}>No data yet</div>
        :<ResponsiveContainer width="100%" height={Math.max(180,data.length*38)}>
          <BarChart data={data} layout="vertical" margin={{left:10,right:30,top:0,bottom:0}}>
            <XAxis type="number" allowDecimals={false} tick={{fontSize:11,fill:t.chartGrid}}/>
            <YAxis type="category" dataKey="name" width={140} tick={{fontSize:11,fill:t.chartText}}/>
            <Tooltip formatter={v=>[v,"Films"]} contentStyle={{background:t.bgModal,border:`1px solid ${t.border}`,borderRadius:8,fontSize:12,color:t.textPrimary}}/>
            <Bar dataKey="films" fill={color} radius={[0,4,4,0]}/>
          </BarChart>
        </ResponsiveContainer>
      }
    </div>
  );

  if(loading) return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:t.bgPrimary,color:t.textSecondary,fontSize:14}}>
      Loading your collection...
    </div>
  );

  return(
    <ThemeContext.Provider value={theme}>
      <div style={{fontFamily:"'Syne', sans-serif",padding:"1rem",maxWidth:900,margin:"0 auto",background:t.bgPrimary,minHeight:"100vh",scrollbarGutter:"stable"}}>

        {/* ── Header ── */}
        <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem",gap:12,padding:"0.5rem 0",borderBottom:`1px solid ${t.border}`,paddingBottom:"1rem"}}>
          {/* Left — unlock */}
          <div style={{flex:1,display:"flex",justifyContent:"flex-start"}}>
            {!isUnlocked
              ?<button onClick={()=>setShowPassword(true)} style={{background:t.bgSecondary,color:t.textSecondary,border:`1px solid ${t.border}`,borderRadius:8,padding:"8px 14px",fontWeight:500,cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",gap:6}}>
                🔒 <span>Unlock</span>
              </button>
              :<div style={{fontSize:12,color:t.green,display:"flex",alignItems:"center",gap:4}}>
                <span>✓</span><span>Unlocked</span>
              </div>
            }
          </div>
          {/* Center — title */}
          <div style={{flex:2,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:600,color:t.textPrimary,letterSpacing:"-0.3px"}}>My Film Collection</div>
            <div style={{fontSize:12,color:t.textSecondary,marginTop:2}}>{watchedFilms.length} watched · {watchlistFilms.length} on watchlist</div>
          </div>
          {/* Right — theme toggle */}
          <div style={{flex:1,display:"flex",justifyContent:"flex-end"}}>
            <ThemeToggle themeId={themeId} onChange={setThemeId}/>
          </div>
        </header>

        {/* ── Tabs + Add button ── */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem",flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {tabBtn("stats","Stats",0)}
            {tabBtn("watched","Watched",watchedFilms.length)}
            {tabBtn("watchlist","Watchlist",watchlistFilms.length)}
          </div>
          <button onClick={handleAddClick} style={{background:t.accent,color:t.accentText,border:"none",borderRadius:8,padding:"9px 18px",fontWeight:500,cursor:"pointer",fontSize:14}}>
            + Add film
          </button>
        </div>

        {/* ── Stats tab ── */}
        {tab==="stats"&&(
          <>
            <div style={{display:"flex",gap:10,marginBottom:"1.5rem",flexWrap:"wrap"}}>
              <StatCard label="Total watched" value={watchedFilms.length}/>
              <StatCard label="Total Oscars" value={totalOscars}/>
              <StatCard label="Avg IMDb" value={avgRating==="NaN"?"-":avgRating}/>
              <StatCard label="Top genre" value={topGenre}/>
              <StatCard label="Top director" value={topDirector}/>
              <StatCard label="Fav decade" value={topDecade}/>
              <StatCard label="Top foreign" value={topForeignCountry}/>
              <StatCard label="Longest film" value={longestFilm?.title||"-"} sub={longestFilm?.runtime}/>
              <StatCard label="Shortest film" value={shortestFilm?.title||"-"} sub={shortestFilm?.runtime}/>
              <StatCard label="Most awarded director" value={mostAwardedDirector?.[0]||"-"} sub={mostAwardedDirector?`${mostAwardedDirector[1]} Oscars`:""}/>
            </div>
            <ChartBlock title="Films by decade" data={byDecade} color={t.accent}/>
            <ChartBlock title="Films by genre" data={byGenre} color={t.green}/>
            <ChartBlock title="Films by director" data={byDirector} color={t.purple}/>
            <ChartBlock title="Films by country" data={byCountry} color={t.red}/>
          </>
        )}

        {/* ── Watched / Watchlist tabs ── */}
        {(tab==="watched"||tab==="watchlist")&&(
          <>
            <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:"0.75rem"}}>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search films, directors, actors..." style={{flex:"1 1 200px",minWidth:0,...sel}}/>
              <select value={filterGenre} onChange={e=>setFilterGenre(e.target.value)} style={{flex:"1 1 120px",...sel}}>
                {allGenres.map(g=><option key={g} value={g}>{g}{g!=="All"&&genreCounts[g]?` (${genreCounts[g]})`:""}</option>)}
              </select>
              <select value={filterDecade} onChange={e=>setFilterDecade(e.target.value)} style={{flex:"1 1 100px",...sel}}>
                {allDecades.map(d=><option key={d} value={d}>{d}{d!=="All"&&decadeCounts[d]?` (${decadeCounts[d]})`:""}</option>)}
              </select>
              <select value={filterDirector} onChange={e=>setFilterDirector(e.target.value)} style={{flex:"1 1 140px",...sel}}>{allDirectors.map(d=><option key={d}>{d}</option>)}</select>
              <select value={filterCountry} onChange={e=>setFilterCountry(e.target.value)} style={{flex:"1 1 120px",...sel}}>{allCountries.map(c=><option key={c}>{c}</option>)}</select>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"1rem",flexWrap:"wrap"}}>
              <span style={{fontSize:12,color:t.textSecondary}}>Sort by:</span>
              <select value={sortBy} onChange={e=>{setSortBy(e.target.value);setSortDir("desc");}} style={{...sel}}>
                <option value="dateAdded">Date added</option>
                <option value="title">Title</option>
                <option value="year">Year</option>
                <option value="imdbRating">IMDb rating</option>
                <option value="awards">Oscar wins</option>
              </select>
              <button onClick={()=>setSortDir(d=>d==="asc"?"desc":"asc")} style={{background:t.bgSecondary,border:`1px solid ${t.border}`,borderRadius:6,padding:"5px 10px",cursor:"pointer",color:t.textSecondary,fontSize:12,whiteSpace:"nowrap"}}>
                {sortBy==="title"?(sortDir==="desc"?"Z → A":"A → Z"):sortBy==="year"?(sortDir==="desc"?"Newer first":"Older first"):(sortDir==="desc"?"Highest first":"Lowest first")}
              </button>
              <span style={{fontSize:12,color:t.textSecondary,marginLeft:"auto"}}>{filtered.length} film{filtered.length!==1?"s":""}</span>
              <div style={{display:"flex",gap:4}}>
                <button onClick={()=>setViewMode("grid")} title="Grid view" style={{background:viewMode==="grid"?t.accent:t.bgSecondary,border:`1px solid ${t.border}`,borderRadius:6,padding:"5px 9px",cursor:"pointer",color:viewMode==="grid"?t.accentText:t.textSecondary,fontSize:14,lineHeight:1}}>⊞</button>
                <button onClick={()=>setViewMode("list")} title="List view" style={{background:viewMode==="list"?t.accent:t.bgSecondary,border:`1px solid ${t.border}`,borderRadius:6,padding:"5px 9px",cursor:"pointer",color:viewMode==="list"?t.accentText:t.textSecondary,fontSize:14,lineHeight:1}}>☰</button>
              </div>
            </div>

            {filtered.length===0
              ?<EmptyState isWatchlist={tab==="watchlist"} onAdd={handleAddClick} isUnlocked={isUnlocked}/>
              :<div style={{scrollbarGutter:"stable"}}>
                {viewMode==="grid"
                  ?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(150px, 1fr))",gap:12}}>
                    {paginated.map(f=><FilmCard key={f.id} film={f} onSelect={setSelectedFilm}/>)}
                  </div>
                  :<div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {paginated.map(f=><FilmListRow key={f.id} film={f} onSelect={setSelectedFilm}/>)}
                  </div>
                }
                {hasMore&&(
                  <div style={{textAlign:"center",marginTop:"1.5rem"}}>
                    <button onClick={()=>setPage(p=>p+1)} style={{background:t.bgSecondary,color:t.textSecondary,border:`1px solid ${t.border}`,borderRadius:8,padding:"10px 28px",cursor:"pointer",fontSize:13}}>
                      Load more ({filtered.length-paginated.length} remaining)
                    </button>
                  </div>
                )}
              </div>
            }
          </>
        )}

        {/* ── Modals ── */}
        {selectedFilm&&(
          <FilmDetailModal
            film={selectedFilm} onClose={()=>setSelectedFilm(null)}
            onRemove={removeFilm}
            onToggleRewatch={id=>{toggleRewatch(id);setSelectedFilm(f=>({...f,rewatched:!f.rewatched}));}}
            onMoveToWatched={id=>updateFilm(id,{list:"watched"})}
            onEdit={handleEdit} onShare={setShareFilm} isUnlocked={isUnlocked}
          />
        )}
        {shareFilm&&<ShareCard film={shareFilm} onClose={()=>setShareFilm(null)}/>}
        {showPassword&&(
          <PasswordModal
            onSuccess={()=>{setIsUnlocked(true);if(pendingAction){pendingAction();setPendingAction(null);}}}
            onClose={()=>{setShowPassword(false);setPendingAction(null);}}
          />
        )}
        {(showAdd||editFilm)&&(
          <AddModal
            onClose={()=>{setShowAdd(false);setEditFilm(null);}}
            onAdd={addFilm} onUpdate={updateFilm} existingFilms={films} editFilm={editFilm}
          />
        )}
      </div>
    </ThemeContext.Provider>
  );
}

export default function App(){
  return<ErrorBoundary><AppInner/></ErrorBoundary>;
}