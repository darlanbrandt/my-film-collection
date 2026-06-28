import React, { useState, useRef } from "react";
import { tmdbFetch, getDetails } from "../lib/tmdb.js";
import { parseCSV, exportJSON, exportCSV } from "../lib/exportImport.js";
import { Ico } from "./icons.jsx";

export function ImportExportModal({ onClose, films, onImportFilm, onExport, isUnlocked }) {
  const fileRef   = useRef(null);
  const cancelRef = useRef(false);

  const [step,       setStep]       = useState('menu');
  const [importType, setImportType] = useState(null);
  const [preview,    setPreview]    = useState([]);
  const [progress,   setProgress]   = useState({ done:0, total:0, added:0, failed:0 });
  const [log,        setLog]        = useState([]);

  const isDup = (title, year) => films.some(f =>
    f.title.trim().toLowerCase() === title.trim().toLowerCase() && String(f.year) === String(year)
  );

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();

    if (file.name.endsWith('.json')) {
      try {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error();
        setImportType('json');
        setPreview(parsed.filter(r => r.title).map(r => ({
          title: r.title || '', year: String(r.year || ''),
          isDup: isDup(r.title, r.year), raw: r,
        })));
        setStep('preview');
      } catch { alert("Invalid JSON backup file."); }
      return;
    }

    try {
      const rows = parseCSV(text);
      setImportType('letterboxd');
      setPreview(rows.filter(r => r.Name?.trim()).map(r => ({
        title:     r.Name?.trim() || '',
        year:      String(r.Year?.trim() || ''),
        isDup:     isDup(r.Name?.trim(), r.Year?.trim()),
        rewatched: r.Rewatch?.trim().toLowerCase() === 'yes',
        raw:       r,
      })));
      setStep('preview');
    } catch { alert("Could not parse CSV. Make sure it's a Letterboxd export."); }
  };

  const startImport = async () => {
    cancelRef.current = false;
    const toImport = preview.filter(p => !p.isDup);
    setProgress({ done:0, total:toImport.length, added:0, failed:0 });
    setLog([]); setStep('importing');
    let added = 0, failed = 0;

    for (let i = 0; i < toImport.length; i++) {
      if (cancelRef.current) break;
      const item = toImport[i];
      setLog(prev => [{ title:item.title, year:item.year, status:'loading' }, ...prev.slice(0, 19)]);
      try {
        if (importType === 'json') {
          await onImportFilm({ ...item.raw, awards:Number(item.raw.awards)||0, rewatched:item.raw.rewatched??false, list:item.raw.list||'watched' });
          added++;
          setLog(prev => [{ ...prev[0], status:'ok' }, ...prev.slice(1)]);
        } else {
          const params = { query:item.title, include_adult:"false", page:"1" };
          if (item.year) params.year = item.year;
          const d = await tmdbFetch("/search/movie", params);
          const result = d.results?.[0];
          if (!result) {
            failed++;
            setLog(prev => [{ ...prev[0], status:'fail' }, ...prev.slice(1)]);
            setProgress(p => ({ ...p, done:i+1, added, failed }));
            continue;
          }
          const details = await getDetails({ tmdb_id:result.id, poster_path:result.poster_path, overview:result.overview }, null);
          await onImportFilm({ ...details, awards:Number(details.awards)||0, rewatched:item.rewatched??false, list:'watched' });
          added++;
          setLog(prev => [{ ...prev[0], status:'ok' }, ...prev.slice(1)]);
        }
      } catch {
        failed++;
        setLog(prev => [{ ...prev[0], status:'fail' }, ...prev.slice(1)]);
      }
      setProgress(p => ({ ...p, done:i+1, added, failed }));
      if (i < toImport.length - 1) await new Promise(r => setTimeout(r, 350));
    }
    setProgress(p => ({ ...p, done:toImport.length, added, failed }));
    setStep('done');
  };

  return (
    <div className="af" onClick={onClose}>
      <div className="af-frame" onClick={e => e.stopPropagation()}>
        <div className="af-hd">
          <h3>
            {step === 'menu'      ? 'Import / Export'
           : step === 'preview'   ? `Preview — ${preview.length} films`
           : step === 'importing' ? 'Importing…'
           :                        'Done'}
          </h3>
          <button className="sg-close" onClick={onClose}>×</button>
        </div>

        {step === 'menu' && (
          <>
            <div className="io-section-title">Export your collection</div>
            <p style={{ fontFamily:"'Geist',sans-serif", fontSize:12, color:'var(--ink-dim)', marginTop:0, marginBottom:12, lineHeight:1.6 }}>
              Download a backup or open in Excel / Google Sheets.
            </p>
            <div className="io-row">
              <button className="cm-btn" style={{ flex:1 }} onClick={() => onExport(exportJSON)}>⬇ JSON backup</button>
              <button className="cm-btn" style={{ flex:1 }} onClick={() => onExport(exportCSV)}>⬇ CSV (Excel / Sheets)</button>
            </div>
            <div className="io-divider"/>
            <div className="io-section-title">Import films</div>
            {isUnlocked ? (
              <>
                <p style={{ fontFamily:"'Geist',sans-serif", fontSize:12, color:'var(--ink-dim)', marginTop:0, marginBottom:14, lineHeight:1.6 }}>
                  Restore a <b style={{ color:'var(--ink)' }}>JSON backup</b> from this app, or import a{' '}
                  <b style={{ color:'var(--ink)' }}>Letterboxd CSV</b> (letterboxd.com → Settings → Import &amp; Export → Export your data).
                </p>
                <input ref={fileRef} type="file" accept=".json,.csv" onChange={handleFile} style={{ display:'none' }}/>
                <button className="cm-btn primary" style={{ width:'100%', padding:'13px' }}
                  onClick={() => fileRef.current?.click()}>
                  Choose file (.json or .csv)
                </button>
              </>
            ) : (
              <div style={{ background:'var(--surface-down)', borderRadius:8, padding:'12px 14px',
                fontFamily:"'Geist Mono',monospace", fontSize:10, color:'var(--ink-soft)',
                letterSpacing:'0.16em', textTransform:'uppercase', display:'flex', alignItems:'center', gap:8 }}>
                {Ico.lock} Unlock the collection to import films.
              </div>
            )}
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="af-step">
              {preview.filter(p => !p.isDup).length} films to import ·{' '}
              <span style={{ color:'#e05a5a' }}>{preview.filter(p => p.isDup).length} duplicates skipped</span>
              {importType === 'letterboxd' ? ' · TMDB lookup required' : ''}
            </div>
            <div className="io-preview-list">
              {preview.map((p, i) => (
                <div key={i} className={`io-preview-row ${p.isDup ? 'dup' : ''}`}
                  style={{ background: p.isDup ? undefined : 'var(--surface)' }}>
                  <span className="icon">{p.isDup ? '🔁' : '🎬'}</span>
                  <span className="ttl">{p.title}</span>
                  <span className="yr">{p.year}{p.isDup ? ' · already in collection' : ''}</span>
                </div>
              ))}
            </div>
            <div className="af-footer">
              <button className="cm-btn" onClick={() => { setStep('menu'); setPreview([]); if (fileRef.current) fileRef.current.value = ''; }}>Back</button>
              <button className="cm-btn primary" style={{ flex:2 }}
                disabled={preview.filter(p => !p.isDup).length === 0}
                onClick={startImport}>
                Import {preview.filter(p => !p.isDup).length} films
              </button>
            </div>
          </>
        )}

        {step === 'importing' && (
          <>
            <div className="io-progress-wrap">
              <div style={{ display:'flex', justifyContent:'space-between', fontFamily:"'Geist Mono',monospace",
                fontSize:10, color:'var(--ink-dim)', letterSpacing:'0.14em', marginBottom:8 }}>
                <span>{progress.done} of {progress.total}</span>
                <span style={{ color:'var(--accent)' }}>✓ {progress.added} added</span>
              </div>
              <div className="io-progress-bar">
                <div className="io-progress-fill"
                  style={{ width:`${progress.total ? Math.round(progress.done / progress.total * 100) : 0}%` }}/>
              </div>
            </div>
            <div className="io-log">
              {log.map((entry, i) => (
                <div key={i} className="io-log-row">
                  <span className="icon">{entry.status === 'loading' ? '⏳' : entry.status === 'ok' ? '✅' : '❌'}</span>
                  <span className="name">{entry.title}</span>
                  <span className="year">{entry.year}</span>
                </div>
              ))}
            </div>
            <button className="cm-btn" style={{ marginTop:14, width:'100%', color:'#e05a5a' }}
              onClick={() => cancelRef.current = true}>Cancel</button>
          </>
        )}

        {step === 'done' && (
          <div className="io-done">
            <div className="big">{progress.added}</div>
            <div className="label">Films added to your collection</div>
            {progress.failed > 0 && (
              <div style={{ fontFamily:"'Geist Mono',monospace", fontSize:10, color:'#e05a5a', letterSpacing:'0.14em', marginTop:8 }}>
                {progress.failed} failed
              </div>
            )}
            <button className="cm-btn primary" style={{ marginTop:24 }} onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}
