// ─── CSV parser ───────────────────────────────────────────────────────────────
export function parseCSV(text) {
  const lines   = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter(l => l.trim());
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const vals = splitCSVLine(line);
    const obj  = {};
    headers.forEach((h, i) => { obj[h.trim()] = vals[i]?.trim() || ""; });
    return obj;
  });
}

export function splitCSVLine(line) {
  const result = []; let cur = ""; let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' && inQ && line[i + 1] === '"') { cur += '"'; i++; }
    else if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { result.push(cur); cur = ""; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

// ─── Download helper ──────────────────────────────────────────────────────────
export function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── Exporters ────────────────────────────────────────────────────────────────
export function exportJSON(films) {
  const data = films.map(f => ({
    title: f.title, year: f.year, genre: f.genre, director: f.director,
    country: f.country, actors: f.actors, awards: f.awards,
    imdbRating: f.imdbRating, imdbId: f.imdbId, poster: f.poster,
    backdrop: f.backdrop, plot: f.plot, runtime: f.runtime,
    rewatched: f.rewatched, list: f.list,
  }));
  downloadFile(
    JSON.stringify(data, null, 2),
    `my-film-collection-${new Date().toISOString().slice(0, 10)}.json`,
    "application/json",
  );
}

export function exportCSV(films) {
  const headers = ["title","year","genre","director","country","actors","awards",
                   "imdbRating","imdbId","runtime","rewatched","list","plot"];
  const escape  = v => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [headers.join(","), ...films.map(f => headers.map(h => escape(f[h])).join(","))];
  downloadFile(
    rows.join("\n"),
    `my-film-collection-${new Date().toISOString().slice(0, 10)}.csv`,
    "text/csv",
  );
}
