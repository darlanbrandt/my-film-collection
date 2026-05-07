import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

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

const STORAGE_KEY = "mfc_v1_films";
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || null
const PROXY = "https://tmdb-proxy.darlanbrandt.workers.dev";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w1280";

async function tmdbFetch(path, params = {}) {
  const qs = new URLSearchParams({ path, ...params }).toString();
  const res = await fetch(`${PROXY}?${qs}`);
  if (!res.ok) throw new Error(`Proxy error ${res.status}`);
  return res.json();
}

async function searchFilms(query, year, director, setStatus) {
  setStatus("Searching TMDB...");
  try {
    const fullQuery = [query, director].filter(Boolean).join(" ");
    const params = { query: fullQuery, include_adult: "false", page: "1" };
    if (year) params.year = year;
    const d = await tmdbFetch("/search/movie", params);
    setStatus("");
    if (d.results?.length) {
      return d.results.slice(0, 5).map(r => ({
        tmdb_id: r.id,
        title: r.title,
        original_title: r.original_title,
        year: r.release_date?.slice(0, 4) || "?",
        overview: r.overview,
        poster_path: r.poster_path || null
      }));
    }
    return [];
  } catch (e) {
    setStatus("");
    throw e;
  }
}

async function getDetails(candidate, directorHint) {
  const [detail, credits] = await Promise.all([
    tmdbFetch(`/movie/${candidate.tmdb_id}`),
    tmdbFetch(`/movie/${candidate.tmdb_id}/credits`)
  ]);
  const director = credits.crew?.find(p => p.job === "Director")?.name || directorHint || "";
  const actors = credits.cast?.slice(0, 5).map(a => a.name).join(", ") || "";
  const genre = detail.genres?.map(g => g.name).join(", ") || "";
  const country = detail.production_countries?.[0]?.name || "";
  const poster = detail.poster_path ? `${TMDB_IMG}${detail.poster_path}` : (candidate.poster_path ? `${TMDB_IMG}${candidate.poster_path}` : "");
  const backdrop = detail.backdrop_path ? `${TMDB_BACKDROP}${detail.backdrop_path}` : "";
  const plot = detail.overview || candidate.overview || "";
  const title = detail.title || candidate.title;
  const year = detail.release_date?.slice(0, 4) || candidate.year || "";
  const runtime = detail.runtime ? `${detail.runtime} min` : "";

  let awards = 0;
  let imdbRating = "";
  try {
    const imdbId = detail.imdb_id || "";
    const query = imdbId
      ? `${PROXY}/omdb?imdbId=${imdbId}`
      : `${PROXY}/omdb?title=${encodeURIComponent(title)}&year=${year}`;
    const omdbRes = await fetch(query);
    const omdb = await omdbRes.json();
    if (omdb.Awards) {
      const match = omdb.Awards.match(/Won (\d+) Oscar/i);
      if (match) awards = parseInt(match[1]);
    }
    if (omdb.imdbRating && omdb.imdbRating !== "N/A") imdbRating = omdb.imdbRating;
  } catch {}

  return { title, year, genre, director: directorHint || director, country, actors, awards: String(awards), imdbRating, poster, backdrop, plot, runtime };
}

function useStorage() {
  const [films, setFilms] = useState([]);
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r) setFilms(JSON.parse(r.value));
      } catch {}
    })();
  }, []);
  const save = async (arr) => {
    setFilms(arr);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(arr)); } catch {}
  };
  return [films, save];
}

const inp = { background:"#12122a", border:"1px solid #2a2a4a", borderRadius:6, color:"#fff", padding:"8px 10px", fontSize:13, boxSizing:"border-box" };

function FilmDetailModal({ film, onClose, onRemove, onToggleRewatch, isUnlocked }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.95)", zIndex:9999, overflowY:"auto" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth:860, margin:"0 auto", paddingBottom:"3rem" }}>

        {/* Backdrop */}
        <div style={{ position:"relative", height:320, background:"#12122a", overflow:"hidden" }}>
          {film.backdrop
            ? <img src={film.backdrop} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.6 }} />
            : film.poster
              ? <img src={film.poster} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", filter:"blur(18px) brightness(0.4)", transform:"scale(1.1)" }} />
              : null
          }
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.95) 100%)" }} />
          <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"rgba(0,0,0,0.6)", border:"1px solid #444", borderRadius:"50%", width:36, height:36, color:"#fff", fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1 }}>×</button>
        </div>

        {/* Content */}
        <div style={{ padding:"0 1.5rem", marginTop:-80, position:"relative" }}>
          <div style={{ display:"flex", gap:20, alignItems:"flex-end", marginBottom:"1.5rem" }}>
            {film.poster && (
              <img src={film.poster} alt={film.title} style={{ width:120, borderRadius:10, boxShadow:"0 8px 32px rgba(0,0,0,0.6)", flexShrink:0 }} />
            )}
            <div style={{ flex:1, paddingBottom:4 }}>
              <div style={{ fontSize:24, fontWeight:600, color:"#fff", lineHeight:1.2, marginBottom:6 }}>{film.title}</div>
              <div style={{ fontSize:13, color:"#8888aa", marginBottom:8 }}>
                {film.year}{film.runtime ? ` · ${film.runtime}` : ""}{film.country ? ` · ${film.country}` : ""}
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                {film.genre?.split(",").map(g => (
                  <span key={g} style={{ fontSize:11, background:"#1a1a3a", color:"#a388ee", borderRadius:6, padding:"3px 10px", border:"1px solid #2a2a5a" }}>{g.trim()}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Ratings row */}
          <div style={{ display:"flex", gap:16, marginBottom:"1.5rem", flexWrap:"wrap" }}>
            {film.imdbRating && (
              <div style={{ background:"#1a1a2e", borderRadius:8, padding:"10px 16px", border:"1px solid #2a2a4a", textAlign:"center" }}>
                <div style={{ fontSize:11, color:"#8888aa", marginBottom:2 }}>IMDb</div>
                <div style={{ fontSize:18, fontWeight:600, color:"#f5c518" }}>⭐ {film.imdbRating}</div>
              </div>
            )}
            {film.awards > 0 && (
              <div style={{ background:"#1a1a2e", borderRadius:8, padding:"10px 16px", border:"1px solid #2a2a4a", textAlign:"center" }}>
                <div style={{ fontSize:11, color:"#8888aa", marginBottom:2 }}>Oscars</div>
                <div style={{ fontSize:18, fontWeight:600, color:"#f5c518" }}>★ {film.awards}</div>
              </div>
            )}
            {film.rewatched && (
              <div style={{ background:"#1a3a2a", borderRadius:8, padding:"10px 16px", border:"1px solid #1a4a2a", textAlign:"center" }}>
                <div style={{ fontSize:11, color:"#4ade80", marginBottom:2 }}>Status</div>
                <div style={{ fontSize:14, fontWeight:600, color:"#4ade80" }}>↩ Rewatched</div>
              </div>
            )}
          </div>

          {/* Plot */}
          {film.plot && (
            <div style={{ marginBottom:"1.5rem" }}>
              <div style={{ fontSize:12, color:"#8888aa", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Plot</div>
              <div style={{ fontSize:14, color:"#ccc", lineHeight:1.7 }}>{film.plot}</div>
            </div>
          )}

          {/* Director & Cast */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:"1.5rem" }}>
            {film.director && (
              <div>
                <div style={{ fontSize:12, color:"#8888aa", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Director</div>
                <div style={{ fontSize:14, color:"#fff" }}>{film.director}</div>
              </div>
            )}
            {film.actors && (
              <div>
                <div style={{ fontSize:12, color:"#8888aa", textTransform:"uppercase", letterSpacing:1, marginBottom:6 }}>Cast</div>
                <div style={{ fontSize:13, color:"#ccc", lineHeight:1.6 }}>{film.actors.split(",").map(a => a.trim()).join(" · ")}</div>
              </div>
            )}
          </div>

          {/* Actions */}
          {isUnlocked && (
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <button onClick={() => onToggleRewatch(film.id)} style={{ fontSize:13, color:"#4ade80", background:"none", border:"1px solid #1a3a2a", borderRadius:8, padding:"8px 16px", cursor:"pointer" }}>
                {film.rewatched ? "↩ Rewatched ✓" : "Mark as rewatched"}
              </button>
              <button onClick={() => { onRemove(film.id); onClose(); }} style={{ fontSize:13, color:"#ff6b6b", background:"none", border:"1px solid #3a2a2a", borderRadius:8, padding:"8px 16px", cursor:"pointer" }}>
                Remove from collection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordModal({ onSuccess, onClose }) {
  const [value, setValue] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    if (value === APP_PASSWORD) { onSuccess(); onClose(); }
    else { setErr("Wrong password. Try again."); setValue(""); }
  };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 }}>
      <div style={{ background:"#0f0f1e", border:"1px solid #2a2a4a", borderRadius:14, padding:"1.5rem", width:"min(360px, 94vw)", color:"#fff" }}>
        <div style={{ fontSize:17, fontWeight:500, marginBottom:"0.5rem" }}>Enter password</div>
        <div style={{ fontSize:12, color:"#8888aa", marginBottom:"1rem" }}>This action is restricted to the collection owner.</div>
        <input
          type="password"
          value={value}
          onChange={e => { setValue(e.target.value); setErr(""); }}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Password"
          autoFocus
          style={{ width:"100%", boxSizing:"border-box", background:"#12122a", border:"1px solid #2a2a4a", borderRadius:6, color:"#fff", padding:"9px 12px", fontSize:13, marginBottom:8 }}
        />
        {err && <div style={{ fontSize:12, color:"#ff8888", marginBottom:8 }}>{err}</div>}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ flex:1, background:"none", border:"1px solid #2a2a4a", borderRadius:6, color:"#aaa", padding:"9px", cursor:"pointer", fontSize:13 }}>Cancel</button>
          <button onClick={submit} style={{ flex:2, background:"#7F77DD", color:"#fff", border:"none", borderRadius:8, padding:"9px", fontWeight:500, cursor:"pointer", fontSize:13 }}>Unlock</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={{ background:"#1a1a2e", borderRadius:10, padding:"14px 18px", flex:1, minWidth:130, border:"1px solid #2a2a4a" }}>
      <div style={{ fontSize:11, color:"#8888aa", marginBottom:4, textTransform:"uppercase", letterSpacing:1 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:500, color:"#fff" }}>{value || "-"}</div>
    </div>
  );
}

function FilmCard({ film, onSelect }) {
  return (
    <div onClick={() => onSelect(film)} style={{ cursor:"pointer", borderRadius:10, overflow:"hidden", border:"1px solid #2a2a4a", background:"#1a1a2e", display:"flex", flexDirection:"column", transition:"transform 0.15s, border-color 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.borderColor="#7F77DD"; }}
      onMouseLeave={e => { e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.borderColor="#2a2a4a"; }}
    >
      <div style={{ height:210, background:"#12122a", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
        {film.poster && film.poster !== "N/A"
          ? <img src={film.poster} alt={film.title} style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e => e.target.style.display="none"} />
          : <span style={{ fontSize:36, opacity:.4 }}>🎬</span>}
        {film.rewatched && (
          <div style={{ position:"absolute", top:8, right:8, background:"#1a3a2a", color:"#4ade80", fontSize:10, borderRadius:6, padding:"2px 7px" }}>↩ Rewatched</div>
        )}
      </div>
      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ fontWeight:500, fontSize:13, color:"#fff", lineHeight:1.3, marginBottom:3 }}>{film.title}</div>
        <div style={{ fontSize:11, color:"#8888aa" }}>{film.year} · {film.genre?.split(",")[0]}</div>
        {film.imdbRating && <div style={{ fontSize:11, color:"#f5c518", marginTop:2 }}>⭐ {film.imdbRating}/10</div>}
        {film.awards > 0 && <div style={{ marginTop:6, fontSize:10, background:"#3a2a00", color:"#f5c518", borderRadius:6, display:"inline-block", padding:"2px 8px" }}>★ {film.awards} Oscar{film.awards > 1 ? "s" : ""}</div>}
      </div>
    </div>
  );
}

function AddModal({ onClose, onAdd }) {
  const [query, setQuery] = useState("");
  const [yearQuery, setYearQuery] = useState("");
  const [directorQuery, setDirectorQuery] = useState("");
  const [step, setStep] = useState("search");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState({ title:"", year:"", genre:"", director:"", country:"", actors:"", awards:"", imdbRating:"", poster:"", backdrop:"", plot:"", runtime:"" });
  const [err, setErr] = useState("");

  const doSearch = async () => {
    const q = query.trim().slice(0, 100);
    const y = yearQuery.trim().slice(0, 4).replace(/\D/g, "");
    const d = directorQuery.trim().slice(0, 100);
    if (!q) return;
    setLoading(true); setErr("");
    try {
      const results = await searchFilms(q, y, d, setStatus);
      if (!results.length) {
        setErr("No results found. Try different search terms or fill in manually.");
        setForm(f => ({ ...f, title: query, year: yearQuery, director: directorQuery }));
        setStep("edit");
      } else {
        setCandidates(results);
        setStep("confirm");
      }
    } catch (e) {
      setErr(`Search error: ${e.message}`);
    }
    setStatus(""); setLoading(false);
  };

  const selectCandidate = async (c) => {
    setLoading(true); setErr(""); setStatus("Fetching details...");
    try {
      const f = await getDetails(c, directorQuery.trim());
      setForm(f);
      setStep("edit");
    } catch (e) {
      setErr(`Could not load details: ${e.message}`);
      setForm(f => ({ ...f, title: c.title, year: c.year, director: directorQuery.trim(), poster: c.poster_path ? `${TMDB_IMG}${c.poster_path}` : "" }));
      setStep("edit");
    }
    setStatus(""); setLoading(false);
  };

  const handleAdd = () => {
    if (!form.title.trim()) { setErr("Title is required."); return; }
    if (!form.year.trim() || isNaN(parseInt(form.year))) { setErr("A valid year is required."); return; }
    onAdd({ ...form, id: Date.now(), awards: Number(form.awards) || 0, rewatched: false });
    onClose();
  };

  const Field = ({ label, k, type="text" }) => (
    <div>
      <label style={{ fontSize:11, color:"#8888aa", display:"block", marginBottom:3 }}>{label}</label>
      <input type={type} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={{ width:"100%", ...inp }} />
    </div>
  );

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999 }}>
      <div style={{ background:"#0f0f1e", border:"1px solid #2a2a4a", borderRadius:14, padding:"1.5rem", width:"min(560px, 94vw)", maxHeight:"90vh", overflowY:"auto", color:"#fff" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.25rem" }}>
          <div style={{ fontSize:17, fontWeight:500 }}>
            {step==="search" && "Add a film"}
            {step==="confirm" && "Select the correct film"}
            {step==="edit" && "Review details"}
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", fontSize:22, color:"#888" }}>×</button>
        </div>

        {step==="search" && (
          <>
            <div style={{ fontSize:12, color:"#8888aa", marginBottom:"0.75rem", lineHeight:1.6 }}>
              Add a year or director to narrow results — especially useful for recent or ambiguous titles.
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:8 }}>
              <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && doSearch()} placeholder="Film title..." style={{ flex:3, ...inp }} />
              <input value={yearQuery} onChange={e => setYearQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && doSearch()} placeholder="Year" style={{ flex:1, ...inp }} />
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <input value={directorQuery} onChange={e => setDirectorQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && doSearch()} placeholder="Director (optional)" style={{ flex:1, ...inp }} />
              <button onClick={doSearch} disabled={loading} style={{ whiteSpace:"nowrap", background:"#7F77DD", color:"#fff", border:"none", borderRadius:6, padding:"9px 16px", fontWeight:500, cursor:"pointer", fontSize:13, opacity:loading?0.7:1 }}>
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
            {status && <div style={{ fontSize:12, color:"#a388ee", marginTop:8 }}>{status}</div>}
            {err && <div style={{ fontSize:12, color:"#ff8888", marginTop:8 }}>{err}</div>}
          </>
        )}

        {step==="confirm" && (
          <>
            <div style={{ fontSize:12, color:"#8888aa", marginBottom:"1rem" }}>Select the correct film below.</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:"1rem" }}>
              {candidates.map((c, i) => (
                <button key={i} onClick={() => !loading && selectCandidate(c)} style={{ background:"#1a1a2e", border:"1px solid #2a2a4a", borderRadius:8, padding:"10px 12px", cursor:"pointer", textAlign:"left", color:"#fff", opacity:loading?0.5:1, display:"flex", gap:12, alignItems:"center" }}>
                  {c.poster_path
                    ? <img src={`https://image.tmdb.org/t/p/w92${c.poster_path}`} alt="" style={{ width:40, height:60, objectFit:"cover", borderRadius:4, flexShrink:0 }} onError={e => e.target.style.display="none"} />
                    : <div style={{ width:40, height:60, background:"#12122a", borderRadius:4, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🎬</div>
                  }
                  <div>
                    <div style={{ fontWeight:500, fontSize:14 }}>{c.title} <span style={{ color:"#8888aa", fontWeight:400 }}>({c.year})</span></div>
                    {c.original_title && c.original_title !== c.title && <div style={{ fontSize:11, color:"#666", marginTop:1 }}>{c.original_title}</div>}
                    {c.overview && <div style={{ fontSize:11, color:"#8888aa", marginTop:4, lineHeight:1.4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{c.overview}</div>}
                  </div>
                </button>
              ))}
            </div>
            {status && <div style={{ fontSize:12, color:"#a388ee", marginBottom:8, textAlign:"center" }}>{status}</div>}
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={() => { setStep("search"); setCandidates([]); }} style={{ flex:1, background:"none", border:"1px solid #2a2a4a", borderRadius:6, color:"#aaa", padding:"9px", cursor:"pointer", fontSize:13 }}>Back</button>
              <button onClick={() => { setForm(f => ({ ...f, title:query, year:yearQuery, director:directorQuery })); setStep("edit"); }} style={{ flex:1, background:"none", border:"1px solid #2a2a4a", borderRadius:6, color:"#aaa", padding:"9px", cursor:"pointer", fontSize:13 }}>Fill manually</button>
            </div>
          </>
        )}

        {step==="edit" && (
          <>
            <div style={{ fontSize:12, color:"#8888aa", marginBottom:"0.75rem", lineHeight:1.5 }}>
              Review all fields before saving. Oscar count and IMDb rating are fetched automatically.
            </div>
            {err && <div style={{ fontSize:12, color:"#ff8888", marginBottom:8 }}>{err}</div>}
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {form.poster ? (
                <div style={{ textAlign:"center" }}>
                  <img src={form.poster} alt="poster" style={{ height:170, borderRadius:8, objectFit:"cover" }} onError={e => e.target.style.display="none"} />
                </div>
              ) : (
                <div style={{ textAlign:"center", padding:"1rem", color:"#666", fontSize:12, border:"1px dashed #2a2a4a", borderRadius:8 }}>No poster found — paste a URL below</div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <Field label="Title" k="title" />
                <Field label="Year" k="year" />
                <Field label="Genre" k="genre" />
                <Field label="Director" k="director" />
                <Field label="Country" k="country" />
                <Field label="Oscars won" k="awards" type="number" />
              </div>
              <Field label="Main cast (comma-separated)" k="actors" />
              <Field label="Poster URL" k="poster" />
              <div>
                <label style={{ fontSize:11, color:"#8888aa", display:"block", marginBottom:3 }}>Plot</label>
                <textarea value={form.plot} onChange={e => setForm(f => ({ ...f, plot: e.target.value }))} rows={3} style={{ width:"100%", ...inp, resize:"vertical" }} />
              </div>
              {form.imdbRating && (
                <div style={{ fontSize:12, color:"#8888aa" }}>IMDb rating: <span style={{ color:"#f5c518" }}>⭐ {form.imdbRating}/10</span></div>
              )}
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={() => setStep("confirm")} style={{ flex:1, background:"none", border:"1px solid #2a2a4a", borderRadius:6, color:"#aaa", padding:"10px", cursor:"pointer", fontSize:13 }}>Back</button>
                <button onClick={handleAdd} style={{ flex:2, background:"#7F77DD", color:"#fff", border:"none", borderRadius:8, padding:"10px", fontWeight:500, cursor:"pointer", fontSize:14 }}>Add to collection</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function decadeOf(year) {
  const y = parseInt(year);
  if (isNaN(y)) return "Unknown";
  return `${Math.floor(y / 10) * 10}s`;
}

function AppInner() {
  const [films, saveFilms] = useStorage();
  const [tab, setTab] = useState("stats");
  const [showAdd, setShowAdd] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(!APP_PASSWORD);
  const [search, setSearch] = useState("");
  const [filterGenre, setFilterGenre] = useState("All");
  const [filterDecade, setFilterDecade] = useState("All");
  const [filterDirector, setFilterDirector] = useState("All");
  const [filterCountry, setFilterCountry] = useState("All");
  const [sortBy, setSortBy] = useState("dateAdded");
  const [selectedFilm, setSelectedFilm] = useState(null);

  const addFilm = film => saveFilms([...films, film]);
  const removeFilm = id => saveFilms(films.filter(f => f.id !== id));
  const toggleRewatch = id => saveFilms(films.map(f => f.id === id ? { ...f, rewatched: !f.rewatched } : f));

  const handleAddClick = () => {
    if (isUnlocked) setShowAdd(true);
    else setShowPassword(true);
  };

  const allGenres = ["All", ...new Set(films.flatMap(f => f.genre?.split(",").map(g=>g.trim()).filter(Boolean)))].sort();
  const allDecades = ["All", ...new Set(films.map(f=>decadeOf(f.year)).filter(d=>d!=="Unknown"))].sort();
  const allDirectors = ["All", ...new Set(films.map(f=>f.director).filter(Boolean))].sort();
  const allCountries = ["All", ...new Set(films.map(f=>f.country).filter(Boolean))].sort();

  const filteredFilms = films.filter(f => {
    const q = search.toLowerCase();
    return (!q || [f.title,f.director,f.actors,f.country,f.genre].some(v=>v?.toLowerCase().includes(q)))
      && (filterGenre==="All" || f.genre?.toLowerCase().includes(filterGenre.toLowerCase()))
      && (filterDecade==="All" || decadeOf(f.year)===filterDecade)
      && (filterDirector==="All" || f.director===filterDirector)
      && (filterCountry==="All" || f.country===filterCountry);
  }).sort((a, b) => {
    if (sortBy==="title") return a.title.localeCompare(b.title);
    if (sortBy==="year") return parseInt(b.year) - parseInt(a.year);
    if (sortBy==="imdbRating") return parseFloat(b.imdbRating||0) - parseFloat(a.imdbRating||0);
    if (sortBy==="awards") return (Number(b.awards)||0) - (Number(a.awards)||0);
    return b.id - a.id;
  });

  const tally = arr => arr.reduce((m,k)=>{ m[k]=(m[k]||0)+1; return m; },{});
  const toChart = obj => Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,films])=>({name,films}));

  const byDecade = toChart(tally(films.map(f=>decadeOf(f.year)).filter(d=>d!=="Unknown"))).sort((a,b)=>a.name.localeCompare(b.name));
  const byGenre = toChart(tally(films.flatMap(f=>f.genre?.split(",").map(g=>g.trim()).filter(Boolean)||[])));
  const byDirector = toChart(tally(films.map(f=>f.director).filter(Boolean)));
  const byCountry = toChart(tally(films.map(f=>f.country).filter(Boolean)));

  const topGenre = byGenre[0]?.name || "-";
  const topDirector = byDirector[0]?.name || "-";
  const topDecade = [...byDecade].sort((a,b)=>b.films-a.films)[0]?.name || "-";
  const totalOscars = films.reduce((s,f)=>s+(Number(f.awards)||0),0);
  const ratedFilms = films.filter(f => f.imdbRating);
  const avgRating = ratedFilms.length
    ? (ratedFilms.reduce((s,f) => s + parseFloat(f.imdbRating), 0) / ratedFilms.length).toFixed(1)
    : "-";
  const topForeignCountry = (() => {
    const counts = {};
    films.forEach(f => {
      if (f.country && f.country !== "United States" && f.country !== "USA") {
        counts[f.country] = (counts[f.country]||0)+1;
      }
    });
    return Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0] || "-";
  })();

  const sel = { background:"#12122a", border:"1px solid #2a2a4a", borderRadius:6, color:"#fff", padding:"8px 10px", fontSize:13 };
  const tabBtn = t => ({ padding:"8px 20px", border:"none", borderRadius:8, cursor:"pointer", fontWeight:500, fontSize:13, background:tab===t?"#7F77DD":"#1a1a2e", color:tab===t?"#fff":"#8888aa" });

  const ChartBlock = ({ title, data, color }) => (
    <div style={{ background:"#1a1a2e", borderRadius:10, border:"1px solid #2a2a4a", padding:"1rem 1.25rem", marginBottom:"1rem" }}>
      <div style={{ fontSize:14, fontWeight:500, marginBottom:"0.75rem", color:"#fff" }}>{title}</div>
      {data.length===0
        ? <div style={{ fontSize:13, color:"#666", padding:"1rem 0" }}>No data yet</div>
        : <ResponsiveContainer width="100%" height={Math.max(180, data.length*38)}>
            <BarChart data={data} layout="vertical" margin={{ left:10, right:30, top:0, bottom:0 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize:11, fill:"#666" }} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize:11, fill:"#aaa" }} />
              <Tooltip formatter={v=>[v,"Films"]} contentStyle={{ background:"#0f0f1e", border:"1px solid #2a2a4a", borderRadius:8, fontSize:12, color:"#fff" }} />
              <Bar dataKey="films" fill={color} radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
      }
    </div>
  );

  return (
    <div style={{ fontFamily:"var(--font-sans)", padding:"1.5rem", maxWidth:900, margin:"0 auto", background:"#0a0a18", minHeight:"100vh", borderRadius:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem", flexWrap:"wrap", gap:12 }}>
        <div>
          <div style={{ fontSize:22, fontWeight:500, color:"#fff" }}>My Film Collection</div>
          <div style={{ fontSize:13, color:"#8888aa" }}>{films.length} film{films.length!==1?"s":""} watched</div>
        </div>
        <button onClick={handleAddClick} style={{ background:"#7F77DD", color:"#fff", border:"none", borderRadius:8, padding:"10px 20px", fontWeight:500, cursor:"pointer", fontSize:14 }}>
          {isUnlocked ? "+ Add film" : "🔒 Add film"}
        </button>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:"1.5rem" }}>
        <button style={tabBtn("stats")} onClick={()=>setTab("stats")}>Stats</button>
        <button style={tabBtn("collection")} onClick={()=>setTab("collection")}>Collection</button>
      </div>

      {tab==="stats" && (
        <>
          <div style={{ display:"flex", gap:12, marginBottom:"1.5rem", flexWrap:"wrap" }}>
            <StatCard label="Total films" value={films.length} />
            <StatCard label="Total Oscars" value={totalOscars} />
            <StatCard label="Avg IMDb rating" value={avgRating === "NaN" ? "-" : avgRating} />
            <StatCard label="Top genre" value={topGenre} />
            <StatCard label="Top director" value={topDirector} />
            <StatCard label="Fav decade" value={topDecade} />
            <StatCard label="Top foreign country" value={topForeignCountry} />
          </div>
          <ChartBlock title="Films by decade" data={byDecade} color="#7F77DD" />
          <ChartBlock title="Films by genre" data={byGenre} color="#1D9E75" />
          <ChartBlock title="Films by director" data={byDirector} color="#378ADD" />
          <ChartBlock title="Films by country" data={byCountry} color="#D85A30" />
        </>
      )}

      {tab==="collection" && (
        <>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:"0.75rem" }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search films, directors, actors..." style={{ flex:"1 1 200px", minWidth:180, ...sel }} />
            <select value={filterGenre} onChange={e=>setFilterGenre(e.target.value)} style={{ flex:"1 1 120px", ...sel }}>{allGenres.map(g=><option key={g}>{g}</option>)}</select>
            <select value={filterDecade} onChange={e=>setFilterDecade(e.target.value)} style={{ flex:"1 1 100px", ...sel }}>{allDecades.map(d=><option key={d}>{d}</option>)}</select>
            <select value={filterDirector} onChange={e=>setFilterDirector(e.target.value)} style={{ flex:"1 1 140px", ...sel }}>{allDirectors.map(d=><option key={d}>{d}</option>)}</select>
            <select value={filterCountry} onChange={e=>setFilterCountry(e.target.value)} style={{ flex:"1 1 120px", ...sel }}>{allCountries.map(c=><option key={c}>{c}</option>)}</select>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:"1rem" }}>
            <span style={{ fontSize:12, color:"#8888aa" }}>Sort by:</span>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{ ...sel }}>
              <option value="dateAdded">Date added</option>
              <option value="title">Title</option>
              <option value="year">Year</option>
              <option value="imdbRating">IMDb rating</option>
              <option value="awards">Oscar wins</option>
            </select>
          </div>
          {filteredFilms.length===0
            ? <div style={{ textAlign:"center", padding:"3rem", color:"#666", fontSize:14 }}>{films.length===0?"No films yet. Add your first one!":"No films match your filters."}</div>
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:12 }}>
                {filteredFilms.map(f=><FilmCard key={f.id} film={f} onSelect={setSelectedFilm} />)}
              </div>
          }
        </>
      )}

      {selectedFilm && (
        <FilmDetailModal
          film={selectedFilm}
          onClose={() => setSelectedFilm(null)}
          onRemove={removeFilm}
          onToggleRewatch={id => { toggleRewatch(id); setSelectedFilm(f => ({ ...f, rewatched: !f.rewatched })); }}
          isUnlocked={isUnlocked}
        />
      )}
      {showPassword && <PasswordModal onSuccess={() => { setIsUnlocked(true); setShowAdd(true); }} onClose={() => setShowPassword(false)} />}
      {showAdd && <AddModal onClose={()=>setShowAdd(false)} onAdd={addFilm} />}
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><AppInner /></ErrorBoundary>;
}