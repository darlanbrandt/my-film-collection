import React, { useState } from "react";
import { searchFilms, getDetails } from "../lib/tmdb.js";
import { TMDB_IMG } from "../lib/constants.js";
import { FilmPoster } from "./FilmPoster.jsx";
import { Ico } from "./icons.jsx";

export function AddModal({ onClose, onAdd, onUpdate, existingFilms, editFilm }) {
  const isEdit = !!editFilm;
  const [query,         setQuery]         = useState('');
  const [yearQuery,     setYearQuery]     = useState('');
  const [directorQuery, setDirectorQuery] = useState('');
  const [step,          setStep]          = useState(isEdit ? 'edit' : 'search');
  const [loading,       setLoading]       = useState(false);
  const [status,        setStatus]        = useState('');
  const [candidates,    setCandidates]    = useState([]);
  const [addToWl,       setAddToWl]       = useState(false);
  const [form,          setForm]          = useState(isEdit ? {
    title: editFilm.title || '', year: editFilm.year || '', genre: editFilm.genre || '',
    director: editFilm.director || '', country: editFilm.country || '', actors: editFilm.actors || '',
    awards: String(editFilm.awards ?? ''), imdbRating: editFilm.imdbRating || '', imdbId: editFilm.imdbId || '',
    poster: editFilm.poster || '', backdrop: editFilm.backdrop || '', plot: editFilm.plot || '', runtime: editFilm.runtime || '',
  } : { title:'', year:'', genre:'', director:'', country:'', actors:'', awards:'', imdbRating:'', imdbId:'', poster:'', backdrop:'', plot:'', runtime:'' });
  const [err, setErr] = useState('');

  const doSearch = async () => {
    const q = query.trim().slice(0, 100);
    const y = yearQuery.trim().slice(0, 4).replace(/\D/g, '');
    const d = directorQuery.trim().slice(0, 100);
    if (!q) return;
    setLoading(true); setErr('');
    try {
      const results = await searchFilms(q, y, d, setStatus);
      if (!results.length) {
        setErr("No results. Try a different title or fill in manually.");
        setForm(f => ({ ...f, title: query, year: yearQuery, director: directorQuery }));
        setStep('edit');
      } else { setCandidates(results); setStep('confirm'); }
    } catch (e) { setErr(`Search error: ${e.message}`); }
    setStatus(''); setLoading(false);
  };

  const selectCandidate = async (c) => {
    setLoading(true); setErr(''); setStatus('Fetching details…');
    try { const f = await getDetails(c, directorQuery.trim()); setForm(f); setStep('edit'); }
    catch (e) {
      setErr(`Could not load details: ${e.message}`);
      setForm(f => ({ ...f, title: c.title, year: c.year, director: directorQuery.trim(),
        poster: c.poster_path ? `${TMDB_IMG}${c.poster_path}` : '' }));
      setStep('edit');
    }
    setStatus(''); setLoading(false);
  };

  const handleSave = () => {
    if (!form.title.trim()) { setErr("Title is required."); return; }
    if (!form.year.trim() || isNaN(parseInt(form.year))) { setErr("A valid year is required."); return; }
    if (!isEdit) {
      const dup = existingFilms.find(f =>
        (form.imdbId && f.imdbId && form.imdbId === f.imdbId) ||
        (f.title.trim().toLowerCase() === form.title.trim().toLowerCase() && f.year === form.year.trim())
      );
      if (dup) { setErr(`"${dup.title}" (${dup.year}) is already in your collection.`); return; }
      onAdd({ ...form, awards: Number(form.awards) || 0, rewatched: false, list: addToWl ? 'watchlist' : 'watched' });
    } else {
      onUpdate(editFilm.id, { ...form, awards: Number(form.awards) || 0 });
    }
    onClose();
  };

  return (
    <div className="af" onClick={onClose}>
      <div className="af-frame" onClick={e => e.stopPropagation()}>
        <div className="af-hd">
          <h3>{isEdit ? `Edit — ${editFilm.title}` : step === 'search' ? 'Add a film' : step === 'confirm' ? 'Select the correct film' : 'Review details'}</h3>
          <button className="sg-close" onClick={onClose}>×</button>
        </div>

        {step === 'search' && (
          <>
            <div className="af-search">
              {Ico.search}
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="Film title…"/>
              <input value={yearQuery} onChange={e => setYearQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="Year" style={{ width: 70 }}/>
              <input value={directorQuery} onChange={e => setDirectorQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()} placeholder="Director (opt.)" style={{ width: 130 }}/>
              <button style={{ padding:'8px 14px', background:'var(--accent)', color:'#1a1208', border:0, borderRadius:6,
                cursor:'pointer', fontFamily:"'Geist Mono',monospace", fontSize:9, letterSpacing:'0.18em',
                textTransform:'uppercase', fontWeight:600 }}
                onClick={doSearch} disabled={loading}>{loading ? '…' : 'Search'}</button>
            </div>
            {status && <div className="af-step">{status}</div>}
            {err    && <div className="af-error">{err}</div>}
            <label className="af-wl-label">
              <input type="checkbox" checked={addToWl} onChange={e => setAddToWl(e.target.checked)}/>
              Add to watchlist instead of watched
            </label>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="af-step">Select the correct film</div>
            <div className="af-list">
              {candidates.map((c, i) => (
                <button key={i} className="af-row" onClick={() => !loading && selectCandidate(c)} disabled={loading}>
                  <div className="thumb">
                    {c.poster_path
                      ? <img src={`https://image.tmdb.org/t/p/w92${c.poster_path}`} alt=""
                          style={{ width:'100%', height:'100%', objectFit:'cover' }}
                          onError={e => e.target.style.display = 'none'}/>
                      : <FilmPoster film={{ title:c.title, year:c.year,
                          poster:{ layout:'minimal', colors:['#14141a','#d4a04a','#ecead8'] }, director:'' }}/>
                    }
                  </div>
                  <div className="info">
                    <b>{c.title} <span style={{ fontWeight:400, color:'var(--ink-dim)' }}>({c.year})</span></b>
                    {c.original_title && c.original_title !== c.title && <div className="meta">{c.original_title}</div>}
                    {c.overview && <p>{c.overview}</p>}
                  </div>
                </button>
              ))}
            </div>
            {status && <div className="af-step" style={{ marginTop:10 }}>{status}</div>}
            <div className="af-footer">
              <button className="cm-btn" onClick={() => { setStep('search'); setCandidates([]); }}>Back</button>
              <button className="cm-btn" onClick={() => { setForm(f => ({ ...f, title:query, year:yearQuery, director:directorQuery })); setStep('edit'); }}>Fill manually</button>
            </div>
          </>
        )}

        {step === 'edit' && (
          <>
            <div className="af-step">{isEdit ? 'Update any field and save.' : 'Review all fields before saving.'}</div>
            {err && <div className="af-error">{err}</div>}
            <div className="af-form-scroll">
              {form.poster && (
                <div style={{ textAlign:'center', marginBottom:14 }}>
                  <img src={form.poster} alt="poster" style={{ height:140, borderRadius:6, objectFit:'cover' }}
                    onError={e => e.target.style.display = 'none'}/>
                </div>
              )}
              <div className="af-grid2">
                {[['Title','title'],['Year','year'],['Genre','genre'],['Director','director'],['Country','country'],['Oscars won','awards']].map(([label, k]) => (
                  <div key={k} className="af-field">
                    <label>{label}</label>
                    <input type={k === 'awards' ? 'number' : 'text'} value={form[k]}
                      onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}/>
                  </div>
                ))}
              </div>
              <div className="af-field">
                <label>Main cast (comma-separated)</label>
                <input value={form.actors} onChange={e => setForm(f => ({ ...f, actors: e.target.value }))}/>
              </div>
              <div className="af-field">
                <label>Poster URL</label>
                <input value={form.poster} onChange={e => setForm(f => ({ ...f, poster: e.target.value }))}/>
              </div>
              <div className="af-field">
                <label>Plot</label>
                <textarea value={form.plot} onChange={e => setForm(f => ({ ...f, plot: e.target.value }))}/>
              </div>
              {form.imdbRating && <div className="af-step">IMDb: ★ {form.imdbRating}/10</div>}
            </div>
            <div className="af-footer">
              {!isEdit && <button className="cm-btn" onClick={() => setStep('confirm')}>Back</button>}
              <button className="cm-btn primary" onClick={handleSave} style={{ flex: 2 }}>
                {isEdit ? 'Save changes' : 'Add to collection'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
