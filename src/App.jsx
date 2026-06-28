/**
 * My Film Collection — Cinéma
 * Root component — imports all modules, holds app state.
 *
 * index.html fonts (add to <head>):
 * <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&family=Geist:wght@300..700&family=Geist+Mono:wght@300..700&display=swap" rel="stylesheet" />
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

// Styles
import "./styles/cinema.css";

// Lib
import { APP_PASSWORD, PAGE_SIZE, TMDB_IMG } from "./lib/constants.js";
import { decadeOf }                           from "./lib/adapters.js";
import { tmdbFetch, fetchTmdbId }             from "./lib/tmdb.js";

// Hooks
import { useFilms } from "./hooks/useFilms.js";

// Components
import { SettingsPopover }    from "./components/SettingsPopover.jsx";
import { ToastHost }          from "./components/ToastHost.jsx";
import { FilmCard,
         RecentlyAdded,
         EmptyState }         from "./components/FilmCard.jsx";
import { CinemaModal }        from "./components/CinemaModal.jsx";
import { AddModal }           from "./components/AddModal.jsx";
import { PasswordModal }      from "./components/PasswordModal.jsx";
import { SuggestionsSheet }   from "./components/SuggestionsSheet.jsx";
import { ShareCardModal }     from "./components/ShareCardModal.jsx";
import { ImportExportModal }  from "./components/ImportExportModal.jsx";
import { RandomPicker }       from "./components/RandomPicker.jsx";
import { CinemaStats }        from "./components/CinemaStats.jsx";
import { Ico }                from "./components/icons.jsx";

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding:"2rem", textAlign:"center", color:"#e05a5a",
        fontFamily:"'Geist Mono',monospace", letterSpacing:"0.1em" }}>
        <div style={{ fontSize:32, marginBottom:8 }}>😵</div>
        <div style={{ fontSize:13, marginBottom:4, textTransform:"uppercase" }}>Something went wrong.</div>
        <button onClick={() => this.setState({ hasError: false })}
          style={{ marginTop:12, padding:"10px 22px", background:"#d4a04a", color:"#1a1208",
            border:"none", borderRadius:8, cursor:"pointer", fontFamily:"'Geist Mono',monospace",
            fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase" }}>
          Try again
        </button>
      </div>
    );
    return this.props.children;
  }
}

// ─── AppInner ─────────────────────────────────────────────────────────────────
function AppInner() {
  // Theme
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('mfc_cinema_theme') || 'light'; } catch { return 'light'; }
  });
  useEffect(() => {
    try { localStorage.setItem('mfc_cinema_theme', theme); } catch {}
    document.body.classList.add('cine-host');
    if (theme === 'dark') { document.body.classList.add('dark');  document.body.classList.remove('light'); }
    else                  { document.body.classList.add('light'); document.body.classList.remove('dark');  }
  }, [theme]);

  // Surface (design language): 'neumorphic' | 'glass' | 'liquid' | 'neon' | 'clay'
  const [surface, setSurface] = useState(() => {
    try { return localStorage.getItem('mfc_cinema_surface') || 'neumorphic'; } catch { return 'neumorphic'; }
  });
  useEffect(() => {
    try { localStorage.setItem('mfc_cinema_surface', surface); } catch {}
  }, [surface]);

  // Settings popover
  const [showSettings, setShowSettings] = useState(false);
  const settingsBtnRef = useRef(null);

  // Default accent per design language.
  //   neumorphic + liquid → gold
  //   glass               → blue
  //   neon                → hot pink (Miami-vice magenta)
  //   clay                → coral (warm + friendly, fits the puffy aesthetic)
  const accentDefault =
    surface === 'glass' ? '#3a7aaa' :
    surface === 'neon'  ? '#ff2bd6' :
    surface === 'clay'  ? '#ff7e5e' :
                          '#d4a04a';

  // Data
  const { films, loading, addFilm, updateFilm, removeFilm, toggleRewatch } = useFilms();

  // UI state
  const [tab,             setTab]             = useState('watched');
  const [showAdd,         setShowAdd]         = useState(false);
  const [showPassword,    setShowPassword]    = useState(false);
  const [showImportExport,setShowImportExport]= useState(false);
  const [pendingAction,   setPendingAction]   = useState(null);
  const [selectedFilm,    setSelectedFilm]    = useState(null);
  const [editFilm,        setEditFilm]        = useState(null);
  const [shareFilm,       setShareFilm]       = useState(null);
  const [suggestions,     setSuggestions]     = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  // Auth
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (!APP_PASSWORD) return true;
    try { return sessionStorage.getItem('mfc_unlocked') === '1'; } catch { return false; }
  });
  const unlock = () => {
    setIsUnlocked(true);
    try { sessionStorage.setItem('mfc_unlocked', '1'); } catch {}
  };

  // Filters / sort
  const [search,       setSearch]       = useState('');
  const [filterDecade, setFilterDecade] = useState('all');
  const [filterGenre,  setFilterGenre]  = useState('all');
  const [sortBy,       setSortBy]       = useState('added');
  const [sortDir,      setSortDir]      = useState('desc');
  const [viewMode,     setViewMode]     = useState('grid');
  const [gridDensity,  setGridDensity]  = useState('compact');

  // Pagination
  const [watchedPage, setWatchedPage] = useState(1);
  const [wlPage,      setWlPage]      = useState(1);

  // Scroll position memory
  const scrollRef = useRef(0);
  const openFilm  = (film) => { scrollRef.current = window.scrollY; setSelectedFilm(film); };
  const closeFilm = ()     => setSelectedFilm(null);
  useEffect(() => {
    if (!selectedFilm) window.scrollTo({ top: scrollRef.current, behavior: 'instant' });
  }, [selectedFilm]);

  // Infinite scroll — callback refs fire on every mount/unmount
  const watchedObsRef = useRef(null);
  const wlObsRef      = useRef(null);
  const watchedSentinel = useCallback((node) => {
    if (watchedObsRef.current) { watchedObsRef.current.disconnect(); watchedObsRef.current = null; }
    if (!node) return;
    watchedObsRef.current = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setWatchedPage(p => p + 1); },
      { rootMargin: '200px' }
    );
    watchedObsRef.current.observe(node);
  }, []);
  const wlSentinel = useCallback((node) => {
    if (wlObsRef.current) { wlObsRef.current.disconnect(); wlObsRef.current = null; }
    if (!node) return;
    wlObsRef.current = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setWlPage(p => p + 1); },
      { rootMargin: '200px' }
    );
    wlObsRef.current.observe(node);
  }, []);

  // Reset pages when filters/tab change
  useEffect(() => { setWatchedPage(1); }, [tab, search, filterDecade, filterGenre, sortBy, sortDir]);
  useEffect(() => { setWlPage(1); },      [tab]);

  // Auth helpers
  const requireUnlock  = (action) => { if (isUnlocked) action(); else { setPendingAction(() => action); setShowPassword(true); } };
  const handleAddClick = ()       => requireUnlock(() => setShowAdd(true));
  const handleEdit     = (film)   => requireUnlock(() => setEditFilm(film));

  // Suggestions
  const fetchSuggestions = async (tmdbId, basedOn) => {
    setSuggestionsLoading(true);
    try {
      const d     = await tmdbFetch(`/movie/${tmdbId}/recommendations`);
      const picks = (d.results || []).slice(0, 6).map(r => ({
        tmdbId: String(r.id), title: r.title,
        year:   r.release_date?.slice(0, 4) || '?',
        poster: r.poster_path ? `${TMDB_IMG}${r.poster_path}` : null,
      }));
      if (picks.length) setSuggestions({ basedOn, picks });
    } catch {}
    setSuggestionsLoading(false);
  };
  const handleAdd = async (film) => {
    await addFilm(film);
    if (film.tmdbId) fetchSuggestions(film.tmdbId, film.title);
  };
  const handleFindSimilar = async (film) => {
    const tmdbId = await fetchTmdbId(film);
    if (tmdbId) fetchSuggestions(tmdbId, film.title);
  };

  // Derived film lists — memoized so a new array isn't allocated on every
  // render (which would otherwise invalidate all the useMemo() filters below).
  const watchedFilms   = useMemo(() => films.filter(f => f.list !== 'watchlist'), [films]);
  const watchlistFilms = useMemo(() => films.filter(f => f.list === 'watchlist'), [films]);

  const recentlyAdded = useMemo(() => [...watchedFilms]
    .filter(f => !String(f.id).startsWith('temp_'))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 4), [watchedFilms]);

  const allDecades = useMemo(() => {
    const ds = new Set(watchedFilms.map(f => decadeOf(f.year)).filter(d => d !== 'Unknown'));
    return [...ds].sort((a, b) => b - a);
  }, [watchedFilms]);

  const allGenres = useMemo(() => {
    const gs = new Set(watchedFilms.flatMap(f =>
      (typeof f.genre === 'string' ? f.genre.split(',').map(g => g.trim()) : f.genre || []).filter(Boolean)
    ));
    return [...gs].sort((a, b) => a.localeCompare(b));
  }, [watchedFilms]);

  const sortFilms = (arr, by) => {
    const a = [...arr];
    const d = sortDir === 'asc' ? 1 : -1;
    if (by === 'added')  return a.sort((x, y) => d * (new Date(x.created_at) - new Date(y.created_at)));
    if (by === 'title')  return a.sort((x, y) => d * x.title.localeCompare(y.title));
    if (by === 'year')   return a.sort((x, y) => d * (parseInt(x.year) - parseInt(y.year)));
    if (by === 'rating') return a.sort((x, y) => d * (parseFloat(x.imdbRating || 0) - parseFloat(y.imdbRating || 0)));
    if (by === 'oscars') return a.sort((x, y) => d * (Number(x.awards) - Number(y.awards)));
    return a;
  };

  const filteredWatched = useMemo(() => {
    let list = watchedFilms;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f => [f.title, f.director, f.actors, f.country, f.genre].some(v => v?.toLowerCase().includes(q)));
    }
    if (filterDecade !== 'all') list = list.filter(f => decadeOf(f.year) === filterDecade);
    if (filterGenre  !== 'all') list = list.filter(f =>
      (typeof f.genre === 'string' ? f.genre.split(',').map(g => g.trim()) : f.genre || []).includes(filterGenre)
    );
    return sortFilms(list, sortBy);
  }, [watchedFilms, search, filterDecade, filterGenre, sortBy, sortDir]);

  const paginated   = filteredWatched.slice(0, watchedPage * PAGE_SIZE);
  const hasMore     = paginated.length < filteredWatched.length;
  const paginatedWl = watchlistFilms.slice(0, wlPage * PAGE_SIZE);
  const wlHasMore   = paginatedWl.length < watchlistFilms.length;

  const activeList  = tab === 'watchlist' ? watchlistFilms : filteredWatched;
  const selectedIdx = selectedFilm ? activeList.findIndex(f => f.id === selectedFilm.id) : -1;

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh',
      background: theme === 'dark' ? '#14141a' : '#ece4d2',
      fontFamily:"'Geist Mono',monospace", fontSize:10,
      color:'#5a5448', letterSpacing:'0.3em', textTransform:'uppercase' }}>
      Loading collection…
    </div>
  );

  return (
    <div className={`cine-root page ${theme === 'light' ? 'light' : ''} ${surface === 'glass' ? 'glass' : ''} ${surface === 'liquid' ? 'liquid' : ''} ${surface === 'neon' ? 'neon' : ''} ${surface === 'clay' ? 'clay' : ''}`}
      style={{ '--cine-accent': accentDefault }}>

      {/* ── Header ── */}
      <div className="ch">
        <div className="ch-count">{watchedFilms.length}</div>
        <div className="ch-mid">
          <h1>My Film Collection</h1>
          <div className="sub">{watchedFilms.length} watched · {watchlistFilms.length} on watchlist</div>
        </div>
        <div className="ch-tools">
          {!isUnlocked
            ? <button className="ch-btn" onClick={() => setShowPassword(true)} title="Unlock">{Ico.lock}</button>
            : <div className="ch-pad"><div className="dot"/><span>Unlocked</span></div>
          }
          <button className="ch-btn" onClick={() => setShowImportExport(true)} title="Import / Export">{Ico.updown}</button>
          <div style={{ position:'relative' }}>
            <button
              ref={settingsBtnRef}
              className={`ch-btn ${showSettings ? 'on' : ''}`}
              onClick={() => setShowSettings(s => !s)}
              aria-expanded={showSettings}
              title="Settings">
              {Ico.gear}
            </button>
            <SettingsPopover
              open={showSettings}
              onClose={() => setShowSettings(false)}
              theme={theme}
              onThemeChange={setTheme}
              surface={surface}
              onSurfaceChange={setSurface}
              anchorRef={settingsBtnRef}
            />
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="ct">
        {[['watched','Watched',watchedFilms.length],['watchlist','Watchlist',watchlistFilms.length],['stats','Stats',0]].map(([id, label, count]) => (
          <button key={id} className={`ct-tab ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
            {label}
            {count > 0 && <span className="num">{count}</span>}
          </button>
        ))}
        {isUnlocked && (
          <button className="cm-btn" style={{ marginLeft:'auto', color:'var(--accent)' }} onClick={handleAddClick}>
            + Add film
          </button>
        )}
      </div>

      {/* ── Watched tab ── */}
      {tab === 'watched' && (
        <>
          <RecentlyAdded films={recentlyAdded} onSelect={openFilm}/>

      {/* ── Filter bar ── */}
      <div className="cf">
        <div className="cf-row1">
          <div className="cf-search">
            {Ico.search}
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search films, directors, actors…"/>
            {search && (
              <button onClick={() => setSearch('')}
                style={{ background:'none', border:0, cursor:'pointer', color:'var(--ink-soft)',
                  fontSize:16, lineHeight:1, padding:'0 2px', flexShrink:0 }}>×</button>
            )}
          </div>
        </div>
        <div className="cf-row2">
          <div className="cf-sort">
            <span>Decade</span>
            <select value={filterDecade} onChange={e => setFilterDecade(e.target.value)}>
              <option value="all">All</option>
              {allDecades.map(d => <option key={d} value={d}>{d}s</option>)}
            </select>
          </div>
          <div className="cf-sort">
            <span>Genre</span>
            <select value={filterGenre} onChange={e => setFilterGenre(e.target.value)}>
              <option value="all">All</option>
              {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="cf-sort">
            <span>Sort by</span>
            <select value={sortBy} onChange={e => { setSortBy(e.target.value); setSortDir('desc'); setWatchedPage(1); }}>
              <option value="added">Added</option>
              <option value="title">Title</option>
              <option value="year">Year</option>
              <option value="rating">Rating</option>
              <option value="oscars">Oscars</option>
            </select>
          </div>
          <button className="cf-chip" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            title="Toggle sort direction" style={{ fontSize:14, padding:'6px 10px' }}>
            {sortDir === 'desc' ? '↓' : '↑'}
          </button>
          <span className="cf-count">{filteredWatched.length} film{filteredWatched.length !== 1 ? 's' : ''}</span>
          <div className="cf-view" style={{ marginLeft:'auto' }}>
            <button className={viewMode === 'grid' ? 'on' : ''} onClick={() => setViewMode('grid')}>{Ico.grid}</button>
            <button className={viewMode === 'list' ? 'on' : ''} onClick={() => setViewMode('list')}>{Ico.list}</button>
            {viewMode === 'grid' && (
              <button
                className={gridDensity === 'comfy' ? 'on' : ''}
                onClick={() => setGridDensity(d => d === 'compact' ? 'comfy' : 'compact')}
                title={gridDensity === 'compact' ? 'Switch to 4 columns' : 'Switch to 6 columns'}
                style={{ minWidth:28 }}>
                {gridDensity === 'compact' ? '4' : '6'}
              </button>
            )}
          </div>
        </div>
      </div>

          {filteredWatched.length === 0
            ? <EmptyState isWatchlist={false} onAdd={handleAddClick} isUnlocked={isUnlocked}/>
            : (
              <div className="cg-wrap">
                <div className={viewMode === 'list' ? 'cg d-list' : `cg d-${gridDensity}`}>
                  {paginated.map(f => (
                    <FilmCard key={f.id} film={f} onSelect={openFilm} layout={viewMode === 'list' ? 'list' : 'classic'}/>
                  ))}
                </div>
                {hasMore && <div ref={watchedSentinel} style={{ height:1 }}/>}
              </div>
            )
          }
        </>
      )}

      {/* ── Watchlist tab ── */}
      {tab === 'watchlist' && (
        watchlistFilms.length === 0
          ? <EmptyState isWatchlist={true} onAdd={handleAddClick} isUnlocked={isUnlocked}/>
          : (
            <>
              <RandomPicker pool={watchlistFilms} onOpenFilm={openFilm}/>
              <div className="wl-wrap">
                <div className="cr" style={{ padding:'12px 0 14px' }}>
                  <span className="cr-label">Queued — {watchlistFilms.length} films</span>
                </div>
                <div className="cg d-comfy" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))' }}>
                  {paginatedWl.map(f => <FilmCard key={f.id} film={f} onSelect={openFilm}/>)}
                </div>
                {wlHasMore && <div ref={wlSentinel} style={{ height:1 }}/>}
              </div>
            </>
          )
      )}

      {/* ── Stats tab ── */}
      {tab === 'stats' && <CinemaStats watchedFilms={watchedFilms}/>}

      {/* ── Modals ── */}
      {selectedFilm && (
        <CinemaModal
          film={selectedFilm}
          onClose={closeFilm}
          onPrev={selectedIdx > 0                    ? () => setSelectedFilm(activeList[selectedIdx - 1]) : null}
          onNext={selectedIdx < activeList.length - 1 ? () => setSelectedFilm(activeList[selectedIdx + 1]) : null}
          onFindSimilar={() => handleFindSimilar(selectedFilm)}
          onShareCard={() => setShareFilm(selectedFilm)}
          onMarkRewatched={() => {
            toggleRewatch(selectedFilm.id);
            setSelectedFilm(f => ({ ...f, rewatched: !f.rewatched }));
            window.cinemaToast?.(`Rewatched · ${selectedFilm.title}`);
          }}
          onMarkWatched={() => {
            updateFilm(selectedFilm.id, { list: 'watched' });
            window.cinemaToast?.(`Moved to watched · ${selectedFilm.title}`);
            closeFilm();
          }}
          onEdit={() => handleEdit(selectedFilm)}
          onRemove={removeFilm}
          isWatchlist={selectedFilm.list === 'watchlist'}
          isUnlocked={isUnlocked}
        />
      )}

      {shareFilm && <ShareCardModal film={shareFilm} onClose={() => setShareFilm(null)}/>}

      {showPassword && (
        <PasswordModal
          onSuccess={() => { unlock(); if (pendingAction) { pendingAction(); setPendingAction(null); } }}
          onClose={() => { setShowPassword(false); setPendingAction(null); }}
        />
      )}

      {(showAdd || editFilm) && (
        <AddModal
          onClose={() => { setShowAdd(false); setEditFilm(null); }}
          onAdd={handleAdd}
          onUpdate={updateFilm}
          existingFilms={films}
          editFilm={editFilm}
        />
      )}

      {suggestions && (
        <SuggestionsSheet
          basedOn={suggestions.basedOn}
          picks={suggestions.picks}
          existingFilms={films}
          onClose={() => setSuggestions(null)}
          onAdd={(film) => requireUnlock(() => addFilm(film))}
          showToast={(msg) => window.cinemaToast?.(msg)}
        />
      )}

      {showImportExport && (
        <ImportExportModal
          onClose={() => setShowImportExport(false)}
          films={films}
          onImportFilm={addFilm}
          isUnlocked={isUnlocked}
        />
      )}

      {suggestionsLoading && (
        <div style={{ position:'fixed', bottom:80, left:'50%', transform:'translateX(-50%)',
          background:'var(--surface)', border:'1px solid var(--line)', borderRadius:10,
          padding:'10px 18px', fontFamily:"'Geist Mono',monospace", fontSize:10,
          color:'var(--ink-dim)', letterSpacing:'0.18em', textTransform:'uppercase',
          boxShadow:'var(--shadow-raised)', zIndex:9998, pointerEvents:'none',
          display:'flex', alignItems:'center', gap:8 }}>
          {Ico.spark} Finding similar films…
        </div>
      )}

      <ToastHost/>
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><AppInner/></ErrorBoundary>;
}
