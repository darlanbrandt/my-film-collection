/**
 * My Film Collection — Cinéma redesign
 *
 * Visual system: Cinéma (neumorphic, Bricolage Grotesque + Geist + Geist Mono)
 * Data layer: Supabase, Cloudflare Worker (TMDB/OMDB), unchanged from previous version
 *
 * NOTE: Update your index.html <head> fonts:
 * <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&family=Geist:wght@300..700&family=Geist+Mono:wght@300..700&display=swap" rel="stylesheet" />
 * And set: body { font-family: 'Geist', system-ui, sans-serif; }
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CINEMA_CSS = `
body { font-family: 'Geist', system-ui, sans-serif; }
.cine-root {
  --surface: #14141a;
  --surface-up: #1c1c24;
  --surface-down: #0b0b10;
  --shadow-l: rgba(80,80,110,0.18);
  --shadow-d: rgba(0,0,0,0.85);
  --ink: #ecead8;
  --ink-dim: #8c8678;
  --ink-soft: #5a5448;
  --line: rgba(255,255,255,0.06);
  --accent: var(--cine-accent, #d4a04a);
  --oscar: #f0b84a;
  --shadow-raised: -4px -4px 12px var(--shadow-l), 6px 6px 18px var(--shadow-d);
  --shadow-raised-sm: -2px -2px 6px var(--shadow-l), 3px 3px 8px var(--shadow-d);
  --shadow-pressed: inset -3px -3px 10px var(--shadow-l), inset 3px 3px 10px var(--shadow-d);
  --shadow-pressed-sm: inset -1px -1px 4px var(--shadow-l), inset 2px 2px 5px var(--shadow-d);
  background: var(--ink);
  color: var(--surface);
  font-family: 'Geist', system-ui, sans-serif;
  width: 100%; position: relative;
}
.cine-root * { box-sizing: border-box; }
.cine-display { font-family: 'Bricolage Grotesque','Geist',system-ui,sans-serif;
                font-variation-settings: 'wdth' 80,'wght' 700; letter-spacing: -0.02em; }
.cine-mono { font-family: 'Geist Mono',ui-monospace,monospace; letter-spacing: 0.16em;
             text-transform: uppercase; }
.cine-root.page { width:100%; min-height:100vh; height:auto; overflow:visible;
                  max-width:1320px; margin:0 auto; padding-bottom:64px; }
body.cine-host { background:#14141a; transition:background .25s; margin:0; }
body.cine-host.light { background:#ece4d2; }

/* Light mode */
.cine-root.light {
  --surface: #ece4d2;
  --surface-up: #f4ede0;
  --surface-down: #ddd3bd;
  --shadow-l: rgba(255,251,238,0.85);
  --shadow-d: rgba(125,95,55,0.22);
  --ink: #1a1610;
  --ink-dim: #5e5340;
  --ink-soft: #968a72;
  --line: rgba(60,40,20,0.08);
  --oscar: #b4882c;
}
.cine-root.light .ch-count { background: linear-gradient(180deg, var(--ink), color-mix(in oklch, var(--ink), white 30%));
                              -webkit-background-clip:text; background-clip:text;
                              text-shadow: 1px 1px 0 rgba(255,255,255,0.4); }
.cine-root.light .cm-grain { mix-blend-mode:multiply; opacity:0.18; }
.cine-root.light .cm-yearstamp { color:rgba(20,15,8,0.85); text-shadow:0 4px 30px rgba(255,255,255,0.4); }
.cine-root.light .cm-close,
.cine-root.light .cm-nav button { background:rgba(255,251,238,0.6); color:var(--ink); }
.cine-root.light .cm-genres span { background:rgba(255,251,238,0.55); color:rgba(20,15,8,0.85);
                                   box-shadow:inset 0 0 0 0.5px rgba(0,0,0,0.08); }
.cine-root.light .cm { background:rgba(236,228,210,0.65); }
.cine-root.light .cc-osc { background:rgba(255,251,238,0.85); }
.cine-root.light .cc-poster { box-shadow:inset 0 0 0 0.5px rgba(0,0,0,0.06),0 2px 6px rgba(0,0,0,0.12); }
.cine-root.light .cc.oscar .cc-poster { box-shadow:0 0 0 1.5px var(--oscar),0 0 12px rgba(180,138,48,0.25),0 4px 12px rgba(0,0,0,0.12); }
.cine-root.light .cm-btn.primary { color:#faf6e9; }
.cine-root.light .cc:hover .cc-glow { opacity:0.3; }
.cine-root.light .sg { background:rgba(236,228,210,0.6); }
.cine-root.light .sg-card .pst { box-shadow:inset 0 0 0 0.5px rgba(0,0,0,0.06),0 2px 6px rgba(0,0,0,0.12); }
.cine-root.light .sc { background:rgba(236,228,210,0.7); }
.cine-root.light .af { background:rgba(236,228,210,0.7); }

/* Header */
.ch { padding:24px 36px 8px; display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:28px;
      border-bottom:1px solid var(--line); }
.ch-count { font-family:'Bricolage Grotesque',sans-serif; font-variation-settings:'wdth' 75,'wght' 800;
            font-size:78px; line-height:0.85; letter-spacing:-0.04em; color:var(--ink);
            background:linear-gradient(180deg, var(--ink), color-mix(in oklch, var(--ink), black 18%));
            -webkit-background-clip:text; background-clip:text; text-shadow:1px 1px 0 rgba(0,0,0,0.6); }
.ch-mid h1 { font-family:'Bricolage Grotesque',sans-serif; font-variation-settings:'wdth' 95,'wght' 600;
             font-size:28px; line-height:1; margin:0; letter-spacing:-0.015em; }
.ch-mid .sub { margin-top:8px; font-family:'Geist Mono',monospace; font-size:10px;
               color:var(--ink-dim); letter-spacing:0.2em; text-transform:uppercase; }
.ch-tools { display:flex; gap:8px; align-items:center; }
.ch-pad { background:var(--surface); box-shadow:var(--shadow-pressed-sm); border-radius:8px;
          padding:8px 12px; font-family:'Geist Mono',monospace; font-size:10px; color:var(--ink-dim);
          letter-spacing:0.15em; text-transform:uppercase; display:flex; align-items:center; gap:8px; }
.ch-pad .dot { width:6px; height:6px; border-radius:50%; background:var(--accent); box-shadow:0 0 8px var(--accent); }
.ch-btn { width:38px; height:38px; border-radius:8px; border:0; background:var(--surface);
          box-shadow:var(--shadow-raised-sm); cursor:pointer; color:var(--ink-dim);
          display:flex; align-items:center; justify-content:center; transition:all .15s; }
.ch-btn:hover { color:var(--ink); }
.ch-btn:active { box-shadow:var(--shadow-pressed-sm); }

/* Tabs */
.ct { display:flex; gap:28px; padding:14px 36px 0; border-bottom:1px solid var(--line); }
.ct-tab { font-family:'Geist Mono',monospace; font-size:11px; letter-spacing:0.2em; text-transform:uppercase;
          color:var(--ink-soft); padding:12px 0; border:0; background:transparent; cursor:pointer; position:relative; }
.ct-tab .num { color:var(--ink-soft); margin-left:6px; font-size:9px; }
.ct-tab.on { color:var(--ink); }
.ct-tab.on::after { content:''; position:absolute; left:0; right:0; bottom:-1px; height:2px;
                    background:var(--accent); box-shadow:0 0 8px var(--accent); }

/* Filter row */
.cf { padding:18px 36px; display:flex; justify-content:space-between; align-items:center; gap:16px;
      flex-wrap:wrap; }
.cf-left { display:flex; gap:8px; align-items:center; flex:1; min-width:0; flex-wrap:wrap; }
.cf-chips { display:flex; gap:6px; flex-wrap:wrap; }
.cf-chip { font-family:'Geist Mono',monospace; font-size:10px; letter-spacing:0.16em; text-transform:uppercase;
           padding:8px 14px; border:0; border-radius:6px; background:var(--surface); color:var(--ink-dim);
           cursor:pointer; box-shadow:var(--shadow-raised-sm); transition:all .15s; white-space:nowrap; }
.cf-chip:hover { color:var(--ink); }
.cf-chip.on { color:var(--accent); box-shadow:var(--shadow-pressed-sm); }
.cf-search { display:flex; align-items:center; padding:8px 14px; background:var(--surface);
             border-radius:6px; box-shadow:var(--shadow-pressed-sm); gap:8px; }
.cf-search input { border:0; background:transparent; color:var(--ink); font-family:'Geist',sans-serif;
                   font-size:12px; outline:none; min-width:160px; }
.cf-search input::placeholder { color:var(--ink-soft); }
.cf-right { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.cf-sort { display:flex; align-items:center; gap:10px; color:var(--ink-dim); font-family:'Geist Mono',monospace;
           font-size:10px; letter-spacing:0.16em; text-transform:uppercase; padding:8px 14px;
           background:var(--surface); border-radius:6px; box-shadow:var(--shadow-pressed-sm); }
.cf-sort select { appearance:none; background:transparent; border:0; color:var(--ink);
                  font-family:'Geist Mono',monospace; font-size:10px; letter-spacing:0.1em;
                  text-transform:uppercase; cursor:pointer; padding-right:14px; }
.cf-view { display:flex; gap:4px; }
.cf-view button { font-family:'Geist Mono',monospace; font-size:10px; letter-spacing:0.16em;
                  text-transform:uppercase; padding:8px 10px; border:0; border-radius:6px;
                  background:var(--surface); color:var(--ink-dim); cursor:pointer;
                  box-shadow:var(--shadow-raised-sm); transition:all .15s; }
.cf-view button.on { color:var(--accent); box-shadow:var(--shadow-pressed-sm); }
.cf-count { font-family:'Geist Mono',monospace; font-size:10px; color:var(--ink-soft); letter-spacing:0.12em; }

/* Recently added strip */
.cr { padding:0 36px 18px; }
.cr-row { display:flex; gap:8px; align-items:center; overflow-x:auto; padding-bottom:4px; }
.cr-label { font-family:'Geist Mono',monospace; font-size:9px; color:var(--ink-soft);
            letter-spacing:0.22em; text-transform:uppercase; margin-right:12px; flex-shrink:0; }
.cr-item { width:50px; height:75px; border-radius:4px; overflow:hidden; box-shadow:var(--shadow-raised-sm);
           cursor:pointer; transition:transform .2s; flex-shrink:0; }
.cr-item:hover { transform:translateY(-3px); }
.cr-item > div { width:100%; height:100%; }

/* Grid */
.cg-wrap { padding:0 36px 36px; }
.cg { display:grid; gap:22px; }
.cg.d-compact { grid-template-columns:repeat(6,1fr); }
.cg.d-regular { grid-template-columns:repeat(5,1fr); }
.cg.d-comfy   { grid-template-columns:repeat(4,1fr); }
.cg.d-list    { grid-template-columns:1fr; gap:8px; }

/* Card */
.cc { background:var(--surface); border-radius:10px; padding:8px 8px 10px;
      box-shadow:var(--shadow-raised); cursor:pointer; transition:all .2s; position:relative; }
.cc:hover { transform:translateY(-3px); }
.cc:hover .cc-glow { opacity:1; }
.cc-glow { position:absolute; inset:-2px; border-radius:12px; background:var(--accent);
           opacity:0; filter:blur(20px); z-index:-1; transition:opacity .25s; }
.cc-poster { aspect-ratio:2/3; border-radius:5px; overflow:hidden;
             box-shadow:inset 0 0 0 0.5px rgba(255,255,255,0.04),0 2px 6px rgba(0,0,0,0.5); }
.cc-meta { padding:10px 4px 2px; }
.cc-title { font-family:'Bricolage Grotesque',sans-serif; font-size:13px; font-weight:600;
            line-height:1.18; color:var(--ink); margin:0; letter-spacing:-0.01em; }
.cc-credit { margin-top:5px; font-family:'Geist Mono',monospace; font-size:8.5px;
             color:var(--ink-dim); letter-spacing:0.14em; text-transform:uppercase; }
.cc-foot { margin-top:9px; display:flex; justify-content:space-between; align-items:center;
           padding-top:8px; border-top:1px solid var(--line); font-family:'Geist Mono',monospace;
           font-size:9px; color:var(--ink-soft); letter-spacing:0.12em; }
.cc-rating { display:inline-flex; gap:4px; align-items:center; color:var(--ink-dim); }
.cc-rating b { color:var(--ink); }
.cc.oscar .cc-poster { box-shadow:0 0 0 1.5px var(--oscar),0 0 20px rgba(240,184,74,0.25),0 4px 12px rgba(0,0,0,0.5); }
.cc.oscar .cc-glow { background:var(--oscar); opacity:0.18; }
.cc-osc { position:absolute; top:12px; right:12px; background:rgba(20,20,26,0.85);
          backdrop-filter:blur(6px); border-radius:4px; padding:4px 7px; color:var(--oscar);
          font-family:'Geist Mono',monospace; font-size:8.5px; letter-spacing:0.14em;
          display:inline-flex; gap:4px; align-items:center; box-shadow:0 0 0 0.5px rgba(240,184,74,0.4); }
/* List row */
.cc.list-row { display:flex; align-items:center; gap:12px; padding:8px 12px;
               border-radius:8px; box-shadow:var(--shadow-raised-sm); aspect-ratio:unset; }
.cc.list-row .cc-poster { width:40px; height:60px; aspect-ratio:unset; flex-shrink:0; border-radius:4px; }
.cc.list-row .cc-meta { padding:0; flex:1; min-width:0; }
.cc.list-row .cc-title { font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cc.list-row .cc-foot { border-top:0; margin-top:4px; padding-top:0; justify-content:flex-start; gap:10px; }
.cc.list-row:hover { transform:translateY(-1px); }

/* Detail modal */
.cm { position:absolute; inset:0; background:rgba(8,8,12,0.65); backdrop-filter:blur(14px);
      animation:cm-fade .25s ease both; z-index:10; overflow:auto; }
.cine-root.page .cm { position:fixed; }
.cine-root.page .cm-sheet { min-height:100vh; }
@keyframes cm-fade { from { opacity:0; } to { opacity:1; } }
@keyframes cm-enter { from { opacity:0; transform:scale(0.96) translateY(8px); } to { opacity:1; transform:none; } }
@keyframes kburn { 0% { transform:scale(1.04) translate(-1%,-0.6%); } 100% { transform:scale(1.15) translate(1.2%,0.8%); } }
.cm-sheet { min-height:100%; background:var(--surface); display:flex; flex-direction:column;
            position:relative; animation:cm-enter .35s cubic-bezier(.2,.7,.2,1) both; }
.cm-back { position:relative; height:380px; overflow:hidden; flex-shrink:0; }
.cm-back::after { content:''; position:absolute; inset:0;
                  background:linear-gradient(180deg,rgba(20,20,26,0.2) 0%,var(--surface) 95%); }
.cm-back-bg { position:absolute; inset:-5%; animation:kburn 24s ease-in-out infinite alternate; }
.cm-grain { position:absolute; inset:0; opacity:0.4; mix-blend-mode:overlay;
            background-image:radial-gradient(rgba(255,255,255,0.5) 0.5px, transparent 1px);
            background-size:3px 3px; }
.cm-close { position:absolute; top:20px; right:24px; z-index:4; width:38px; height:38px;
            border-radius:8px; border:0; background:rgba(20,20,26,0.7); backdrop-filter:blur(8px);
            cursor:pointer; color:var(--ink); font-size:18px; box-shadow:var(--shadow-raised-sm); }
.cm-nav { position:absolute; top:20px; left:24px; display:flex; gap:6px; z-index:4; }
.cm-nav button { width:38px; height:38px; border-radius:8px; border:0; background:rgba(20,20,26,0.7);
                 backdrop-filter:blur(8px); cursor:pointer; color:var(--ink); font-size:20px;
                 box-shadow:var(--shadow-raised-sm); display:flex; align-items:center; justify-content:center; }
.cm-eyebrow-over { position:absolute; bottom:32px; left:36px; right:36px; z-index:3;
                   display:flex; align-items:flex-end; justify-content:space-between; gap:24px; }
.cm-yearstamp { font-family:'Bricolage Grotesque',sans-serif; font-variation-settings:'wdth' 75,'wght' 800;
                font-size:96px; line-height:0.85; letter-spacing:-0.04em;
                color:rgba(255,255,255,0.92); text-shadow:0 4px 30px rgba(0,0,0,0.5); }
.cm-genres { display:flex; gap:6px; flex-wrap:wrap; }
.cm-genres span { padding:5px 10px; background:rgba(20,20,26,0.6); backdrop-filter:blur(8px);
                  border-radius:4px; font-family:'Geist Mono',monospace; font-size:9px;
                  color:rgba(255,255,255,0.85); letter-spacing:0.18em; text-transform:uppercase;
                  box-shadow:inset 0 0 0 0.5px rgba(255,255,255,0.15); }
.cm-body { padding:32px 36px 36px; display:grid; grid-template-columns:220px 1fr; gap:36px;
           margin-top:-80px; position:relative; z-index:2; }
.cm-poster { width:100%; aspect-ratio:2/3; border-radius:8px; overflow:hidden;
             box-shadow:var(--shadow-raised),0 16px 40px rgba(0,0,0,0.5); background:var(--surface); }
.cm-title { font-family:'Bricolage Grotesque',sans-serif; font-variation-settings:'wdth' 90,'wght' 700;
            font-size:56px; line-height:0.95; letter-spacing:-0.03em; margin:0;
            text-wrap:balance; color:var(--ink); }
.cm-dir { margin-top:12px; font-family:'Geist Mono',monospace; font-size:11px;
          color:var(--ink-dim); letter-spacing:0.18em; text-transform:uppercase; }
.cm-dir b { color:var(--ink); font-weight:500; }
.cm-divider { height:1px; background:var(--line); margin:24px 0; }
.cm-plot { font-size:16px; line-height:1.55; color:var(--ink); max-width:60ch; margin-bottom:28px; text-wrap:pretty; }
.cm-stats { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:28px; max-width:540px; }
.cm-stat { background:var(--surface); border-radius:8px; padding:14px 16px; box-shadow:var(--shadow-pressed-sm); }
.cm-stat .l { font-family:'Geist Mono',monospace; font-size:8.5px; color:var(--ink-soft);
              letter-spacing:0.18em; text-transform:uppercase; margin-bottom:6px; }
.cm-stat .v { font-family:'Bricolage Grotesque',sans-serif; font-variation-settings:'wdth' 85,'wght' 700;
              font-size:28px; line-height:1; letter-spacing:-0.02em; }
.cm-stat .v.osc { color:var(--accent); }
.cm-stat .vu { font-family:'Geist Mono',monospace; font-size:9px; color:var(--ink-soft);
               margin-left:2px; letter-spacing:0.1em; }
.cm-cast { margin-bottom:28px; }
.cm-cast h4 { font-family:'Geist Mono',monospace; font-size:9px; color:var(--ink-soft);
              letter-spacing:0.22em; margin:0 0 12px; text-transform:uppercase; font-weight:500; }
.cm-cast-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; max-width:480px; }
.cm-cast-grid div b { font-family:'Bricolage Grotesque',sans-serif; font-weight:600;
                      font-size:14px; display:block; }
.cm-cast-grid div span { display:block; font-family:'Geist Mono',monospace; font-size:8.5px;
                          color:var(--ink-soft); letter-spacing:0.16em; text-transform:uppercase; margin-top:3px; }
.cm-actions { display:flex; gap:8px; flex-wrap:wrap; }
.cm-btn { padding:13px 22px; border:0; border-radius:8px; background:var(--surface);
          box-shadow:var(--shadow-raised-sm); font-family:'Geist Mono',monospace; font-size:10px;
          letter-spacing:0.18em; text-transform:uppercase; color:var(--ink-dim); cursor:pointer; transition:all .15s; }
.cm-btn:hover { color:var(--ink); }
.cm-btn.primary { background:var(--accent); color:#1a1208;
                  box-shadow:-2px -2px 6px rgba(255,255,255,0.06),4px 4px 12px rgba(0,0,0,0.7),
                              0 0 20px color-mix(in oklch, var(--accent), transparent 60%); }

/* Stats */
.cs { padding:6px 36px 36px; display:grid; grid-template-columns:repeat(12,1fr); gap:14px; }
.cs-card { background:var(--surface); border-radius:12px; padding:22px 24px;
           box-shadow:var(--shadow-raised); position:relative; }
.cs-card .l { font-family:'Geist Mono',monospace; font-size:9px; color:var(--ink-soft);
              letter-spacing:0.22em; text-transform:uppercase; }
.cs-card .v { font-family:'Bricolage Grotesque',sans-serif; font-variation-settings:'wdth' 80,'wght' 800;
              font-size:60px; line-height:0.9; margin-top:14px; letter-spacing:-0.04em; color:var(--ink); }
.cs-card .vu { font-family:'Geist Mono',monospace; font-size:9px; color:var(--ink-soft);
               letter-spacing:0.18em; margin-top:8px; text-transform:uppercase; }
.cs-chart h4 { font-family:'Geist Mono',monospace; font-size:10px; color:var(--ink-soft);
               letter-spacing:0.22em; margin:0 0 18px; text-transform:uppercase; font-weight:500; }
.cs-bar-row { display:flex; align-items:center; gap:12px; margin-bottom:11px; }
.cs-bar-row .name { font-family:'Bricolage Grotesque',sans-serif; font-weight:500; font-size:13px;
                    width:130px; flex-shrink:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cs-bar-row .bar { flex:1; height:10px; background:var(--surface-down); border-radius:4px;
                   box-shadow:var(--shadow-pressed-sm); position:relative; overflow:hidden; }
.cs-bar-row .fill { position:absolute; inset:1px auto 1px 1px; border-radius:4px;
                    background:linear-gradient(90deg, var(--accent), color-mix(in oklch, var(--accent), white 25%));
                    box-shadow:0 0 12px color-mix(in oklch, var(--accent), transparent 50%); }
.cs-bar-row .num { font-family:'Geist Mono',monospace; font-size:10px; width:28px;
                   text-align:right; color:var(--ink-dim); }
.cs-osc-card { display:flex; align-items:center; gap:18px; }
.cs-osc-card .num-big { font-family:'Bricolage Grotesque',sans-serif; font-variation-settings:'wdth' 75,'wght' 800;
                        font-size:72px; line-height:0.85; letter-spacing:-0.04em; color:var(--accent); }

/* Empty state */
.ce { padding:60px 36px; display:flex; flex-direction:column; align-items:center;
      justify-content:center; min-height:460px; gap:28px; text-align:center; }
.ce-reel { width:180px; height:180px; border-radius:50%; background:var(--surface);
           box-shadow:var(--shadow-raised); display:flex; align-items:center; justify-content:center; position:relative; }
.ce-reel::before { content:''; position:absolute; inset:16px; border-radius:50%; box-shadow:var(--shadow-pressed); }
.ce h2 { font-family:'Bricolage Grotesque',sans-serif; font-variation-settings:'wdth' 90,'wght' 700;
         font-size:36px; margin:0; letter-spacing:-0.02em; color:var(--ink); }
.ce p { font-size:14px; color:var(--ink-dim); max-width:40ch; margin:0; line-height:1.5; }

/* Theme toggle */
.th-toggle { position:relative; width:76px; height:38px; border-radius:999px; background:var(--surface);
             box-shadow:var(--shadow-pressed-sm); cursor:pointer; padding:0; border:0; }
.th-thumb { position:absolute; top:4px; left:4px; width:30px; height:30px; border-radius:50%;
            background:var(--surface); box-shadow:var(--shadow-raised-sm);
            transition:left .28s cubic-bezier(.5,.0,.2,1),color .2s; display:flex; align-items:center;
            justify-content:center; color:var(--accent); }
.th-toggle.is-light .th-thumb { left:42px; }
.th-toggle .th-icons { position:absolute; inset:0; display:flex; align-items:center;
                        justify-content:space-between; padding:0 11px; color:var(--ink-soft);
                        pointer-events:none; opacity:0.5; }

/* Toast */
.cine-toast-host { position:fixed; left:50%; bottom:36px; transform:translateX(-50%); z-index:9999;
                   display:flex; flex-direction:column; gap:8px; align-items:center; pointer-events:none; }
@keyframes toast-in { from { opacity:0; transform:translateY(20px) scale(0.96); } to { opacity:1; transform:none; } }
@keyframes toast-out { to { opacity:0; transform:translateY(-6px); } }
.cine-toast { background:var(--accent); color:#1a1208; padding:13px 22px 13px 18px; border-radius:10px;
              font-family:'Geist Mono',monospace; font-size:10.5px; letter-spacing:0.16em;
              text-transform:uppercase; font-weight:500;
              box-shadow:-2px -2px 6px rgba(255,255,255,0.06),4px 4px 14px rgba(0,0,0,0.5),
                          0 0 28px color-mix(in oklch, var(--accent), transparent 55%);
              animation:toast-in .3s cubic-bezier(.2,.7,.2,1) both; display:flex; align-items:center; gap:10px; }
.cine-toast.leaving { animation:toast-out .25s ease both; }

/* Suggestions slide-up */
.sg { position:fixed; inset:0; background:rgba(8,8,12,0.6); backdrop-filter:blur(14px);
      z-index:200; display:flex; flex-direction:column; justify-content:flex-end; animation:cm-fade .25s ease both; }
@keyframes sg-up { from { transform:translateY(100%); } to { transform:none; } }
.sg-sheet { background:var(--surface); border-radius:24px 24px 0 0; max-height:78vh; display:flex;
            flex-direction:column; box-shadow:0 -16px 60px rgba(0,0,0,0.5);
            animation:sg-up .42s cubic-bezier(.2,.7,.2,1) both; overflow:hidden; }
.sg-hd { padding:14px 32px 18px; display:flex; flex-direction:column; align-items:center; gap:14px;
         border-bottom:1px solid var(--line); }
.sg-grab { width:44px; height:4px; border-radius:2px; background:var(--ink-soft); opacity:0.5; }
.sg-titlerow { display:flex; align-items:center; justify-content:space-between; width:100%; gap:16px; flex-wrap:wrap; }
.sg-titlerow h3 { font-family:'Bricolage Grotesque',sans-serif; font-variation-settings:'wdth' 88,'wght' 700;
                  font-size:30px; margin:0; letter-spacing:-0.025em; }
.sg-titlerow .sub { font-family:'Geist Mono',monospace; font-size:10px; color:var(--ink-dim);
                    letter-spacing:0.2em; text-transform:uppercase; }
.sg-titlerow .sub b { color:var(--accent); font-weight:500; }
.sg-titlerow .sg-opts { display:flex; align-items:center; gap:10px; }
.sg-close { width:38px; height:38px; border-radius:8px; border:0; background:var(--surface);
            box-shadow:var(--shadow-raised-sm); cursor:pointer; color:var(--ink); font-size:18px; }
.sg-body { padding:24px 32px 32px; overflow-y:auto; flex:1; min-height:0; }
.sg-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); gap:20px; }
.sg-card { background:var(--surface); border-radius:12px; padding:8px 8px 10px;
           box-shadow:var(--shadow-raised); position:relative; transition:transform .2s; }
.sg-card:hover { transform:translateY(-3px); }
.sg-card .pst { aspect-ratio:2/3; border-radius:6px; overflow:hidden;
                box-shadow:inset 0 0 0 0.5px rgba(255,255,255,0.04),0 2px 6px rgba(0,0,0,0.5); }
.sg-card .ttl { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:600;
                margin:10px 4px 4px; line-height:1.18; letter-spacing:-0.01em; }
.sg-card .meta { padding:0 4px; font-family:'Geist Mono',monospace; font-size:9px;
                  color:var(--ink-dim); letter-spacing:0.14em; text-transform:uppercase; }
.sg-card .actions { padding:12px 4px 4px; display:flex; gap:6px; align-items:center; }
.sg-card .add-btn { flex:1; padding:10px 8px; border:0; border-radius:6px; background:var(--accent);
                     color:#1a1208; font-family:'Geist Mono',monospace; font-size:9px; letter-spacing:0.16em;
                     text-transform:uppercase; cursor:pointer; font-weight:600;
                     box-shadow:-1px -1px 3px rgba(255,255,255,0.05),2px 2px 6px rgba(0,0,0,0.4); }
.sg-card .wl-toggle { width:34px; height:34px; border:0; border-radius:6px; background:var(--surface);
                       box-shadow:var(--shadow-raised-sm); cursor:pointer; color:var(--ink-soft);
                       display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.sg-card .wl-toggle.on { color:var(--accent); box-shadow:var(--shadow-pressed-sm); }
.sg-card.added { opacity:0.55; pointer-events:none; }
.sg-card.added .add-btn { background:transparent; box-shadow:var(--shadow-pressed-sm); color:var(--accent); }

/* Share card modal */
.sc { position:fixed; inset:0; background:rgba(8,8,12,0.7); backdrop-filter:blur(14px);
      z-index:200; display:flex; align-items:center; justify-content:center; padding:32px;
      animation:cm-fade .25s ease both; }
.sc-frame { background:var(--surface); border-radius:20px; box-shadow:var(--shadow-raised);
            padding:28px; max-width:620px; width:100%; display:flex; gap:32px;
            animation:cm-enter .35s cubic-bezier(.2,.7,.2,1) both; max-height:92vh; overflow:auto; }
.sc-preview-wrap { flex-shrink:0; }
.sc-canvas-preview { width:270px; height:480px; overflow:hidden; border-radius:16px;
                     box-shadow:var(--shadow-raised),0 12px 40px rgba(0,0,0,0.4); background:#000; }
.sc-canvas-preview canvas { width:100%; height:100%; display:block; border-radius:16px; }
.sc-info { flex:1; min-width:180px; padding-top:4px; }
.sc-info .l { font-family:'Geist Mono',monospace; font-size:10px; color:var(--ink-soft);
              letter-spacing:0.22em; text-transform:uppercase; }
.sc-info h3 { font-family:'Bricolage Grotesque',sans-serif; font-variation-settings:'wdth' 90,'wght' 700;
              font-size:28px; margin:6px 0 4px; letter-spacing:-0.025em; line-height:1.05; }
.sc-info .for { font-family:'Geist Mono',monospace; font-size:9.5px; color:var(--ink-dim);
                letter-spacing:0.18em; text-transform:uppercase; }
.sc-info .actions { display:flex; gap:8px; flex-wrap:wrap; margin-top:22px; }
.sc-info .dim-text { font-family:'Geist Mono',monospace; font-size:9px; color:var(--ink-soft);
                      letter-spacing:0.18em; margin-top:14px; text-transform:uppercase; }

/* Add film modal */
.af { position:fixed; inset:0; background:rgba(8,8,12,0.7); backdrop-filter:blur(14px);
      z-index:200; display:flex; align-items:center; justify-content:center; padding:32px;
      animation:cm-fade .25s ease both; }
.af-frame { background:var(--surface); border-radius:18px; box-shadow:var(--shadow-raised);
             padding:26px 28px; max-width:720px; width:100%; max-height:86vh; display:flex;
             flex-direction:column; animation:cm-enter .32s cubic-bezier(.2,.7,.2,1) both; overflow:hidden; }
.af-hd { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-shrink:0; }
.af-hd h3 { font-family:'Bricolage Grotesque',sans-serif; font-variation-settings:'wdth' 88,'wght' 700;
             font-size:24px; margin:0; letter-spacing:-0.02em; }
.af-search { display:flex; align-items:center; padding:14px 18px; background:var(--surface);
              border-radius:10px; box-shadow:var(--shadow-pressed-sm); gap:12px; margin-bottom:18px;
              color:var(--ink-soft); flex-shrink:0; }
.af-search input { flex:1; border:0; background:transparent; color:var(--ink); font:inherit;
                    font-size:14px; outline:none; }
.af-search input::placeholder { color:var(--ink-soft); }
.af-list { display:flex; flex-direction:column; gap:10px; overflow-y:auto; flex:1; min-height:0; }
.af-row { display:flex; gap:14px; padding:10px; background:var(--surface); border-radius:10px;
          box-shadow:var(--shadow-raised-sm); cursor:pointer; transition:transform .15s; align-items:flex-start;
          border:0; width:100%; text-align:left; color:var(--ink); }
.af-row:hover { transform:translateY(-1px); }
.af-row .thumb { width:50px; height:75px; border-radius:4px; overflow:hidden; flex-shrink:0; }
.af-row .info { flex:1; min-width:0; }
.af-row .info b { font-family:'Bricolage Grotesque',sans-serif; font-weight:600; font-size:15px;
                   display:block; line-height:1.2; }
.af-row .info .meta { font-family:'Geist Mono',monospace; font-size:9px; color:var(--ink-dim);
                       letter-spacing:0.16em; text-transform:uppercase; margin-top:4px; }
.af-row .info p { font-size:11.5px; line-height:1.4; color:var(--ink-dim); margin:6px 0 0;
                   display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.af-row .add { align-self:center; padding:10px 14px; background:var(--accent); color:#1a1208;
                font-family:'Geist Mono',monospace; font-size:9px; letter-spacing:0.18em;
                text-transform:uppercase; border:0; border-radius:6px; cursor:pointer; font-weight:600;
                box-shadow:-1px -1px 3px rgba(255,255,255,0.05),2px 2px 6px rgba(0,0,0,0.4); flex-shrink:0; }
.af-step { font-family:'Geist Mono',monospace; font-size:10px; color:var(--ink-soft);
           letter-spacing:0.18em; text-transform:uppercase; margin-bottom:14px; flex-shrink:0; }
.af-field { margin-bottom:12px; flex-shrink:0; }
.af-field label { font-family:'Geist Mono',monospace; font-size:9px; color:var(--ink-soft);
                  letter-spacing:0.18em; text-transform:uppercase; display:block; margin-bottom:6px; }
.af-field input, .af-field textarea, .af-field select {
  width:100%; padding:10px 14px; background:var(--surface); border:0; border-radius:8px;
  box-shadow:var(--shadow-pressed-sm); color:var(--ink); font-family:'Geist',sans-serif; font-size:13px;
  outline:none; appearance:none; }
.af-field textarea { resize:vertical; min-height:72px; }
.af-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.af-form-scroll { overflow-y:auto; flex:1; min-height:0; }
.af-form-scroll .af-field { flex-shrink:unset; }
.af-error { font-family:'Geist Mono',monospace; font-size:10px; color:#e05a5a;
            letter-spacing:0.12em; padding:10px 14px; background:rgba(220,80,80,0.1);
            border-radius:6px; margin-bottom:12px; flex-shrink:0; }
.af-footer { display:flex; gap:8px; margin-top:16px; flex-shrink:0; }
.af-wl-label { display:flex; align-items:center; gap:8px; font-family:'Geist Mono',monospace;
               font-size:10px; color:var(--ink-dim); letter-spacing:0.14em; text-transform:uppercase;
               cursor:pointer; margin-bottom:14px; flex-shrink:0; }
.af-wl-label input { accent-color:var(--accent); }

/* Random picker */
.rp { padding:24px 36px 8px; }
.rp-panel { background:var(--surface); border-radius:18px; padding:32px;
            box-shadow:var(--shadow-raised); display:flex; gap:32px; align-items:center; }
.rp-reel { width:140px; height:210px; flex-shrink:0; border-radius:8px; overflow:hidden;
            background:var(--surface-down); position:relative;
            box-shadow:var(--shadow-raised),inset 0 0 0 1px var(--line); transition:box-shadow .3s; }
.rp-reel.spinning { box-shadow:var(--shadow-raised),0 0 0 2px var(--accent),
                               0 0 32px color-mix(in oklch, var(--accent), transparent 55%); }
.rp-reel-placeholder { width:100%; height:100%; display:flex; align-items:center; justify-content:center;
                        color:var(--ink-soft); flex-direction:column; gap:8px;
                        font-family:'Geist Mono',monospace; font-size:10px; letter-spacing:0.2em; text-transform:uppercase; }
.rp-info { flex:1; min-width:0; }
.rp-info .l { font-family:'Geist Mono',monospace; font-size:10px; color:var(--ink-soft);
                letter-spacing:0.22em; text-transform:uppercase; }
.rp-info h2 { font-family:'Bricolage Grotesque',sans-serif; font-variation-settings:'wdth' 85,'wght' 700;
                font-size:40px; margin:8px 0; letter-spacing:-0.03em; line-height:0.96; }
.rp-info p { font-size:14px; line-height:1.55; color:var(--ink-dim); margin:0 0 20px; max-width:50ch; }
.rp-info .verdict { font-family:'Geist Mono',monospace; font-size:9px; color:var(--accent);
                     letter-spacing:0.22em; text-transform:uppercase; margin-top:2px; }
.rp-info .actions { display:flex; gap:8px; flex-wrap:wrap; }
.wl-wrap { padding:0 36px 36px; }

/* Import/Export inside .af-frame */
.io-section-title { font-family:'Geist Mono',monospace; font-size:10px; color:var(--ink-soft);
                    letter-spacing:0.22em; text-transform:uppercase; margin-bottom:10px; }
.io-divider { height:1px; background:var(--line); margin:20px 0; }
.io-row { display:flex; gap:8px; margin-bottom:8px; }
.io-progress-wrap { margin-bottom:16px; }
.io-progress-bar { height:8px; border-radius:4px; background:var(--surface-down);
                   box-shadow:var(--shadow-pressed-sm); overflow:hidden; position:relative; }
.io-progress-fill { position:absolute; inset:1px auto 1px 1px; border-radius:4px;
                    background:linear-gradient(90deg, var(--accent), color-mix(in oklch, var(--accent), white 25%));
                    transition:width .3s; }
.io-log { display:flex; flex-direction:column; gap:4px; max-height:220px; overflow-y:auto; }
.io-log-row { display:flex; align-items:center; gap:10px; padding:6px 10px; border-radius:6px;
              background:var(--surface); box-shadow:var(--shadow-raised-sm); }
.io-log-row .icon { width:18px; text-align:center; font-size:13px; flex-shrink:0; }
.io-log-row .name { font-size:12px; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.io-log-row .year { font-family:'Geist Mono',monospace; font-size:10px; color:var(--ink-dim); flex-shrink:0; }
.io-preview-list { max-height:280px; overflow-y:auto; display:flex; flex-direction:column; gap:4px; margin-bottom:14px; }
.io-preview-row { display:flex; align-items:center; gap:10px; padding:7px 10px; border-radius:7px;
                  box-shadow:var(--shadow-raised-sm); }
.io-preview-row.dup { background:rgba(200,60,60,0.08); box-shadow:none; opacity:0.65; }
.io-preview-row .icon { font-size:11px; width:18px; text-align:center; flex-shrink:0; }
.io-preview-row .ttl { font-size:13px; color:var(--ink); flex:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.io-preview-row .yr { font-family:'Geist Mono',monospace; font-size:10px; color:var(--ink-dim); flex-shrink:0; }
.io-done { text-align:center; padding:16px 0; }
.io-done .big { font-family:'Bricolage Grotesque',sans-serif; font-size:56px; line-height:0.9;
                font-variation-settings:'wdth' 80,'wght' 800; color:var(--accent); letter-spacing:-0.03em; }
.io-done .label { font-family:'Geist Mono',monospace; font-size:9px; color:var(--ink-soft);
                  letter-spacing:0.22em; text-transform:uppercase; margin-top:6px; }

/* Responsive */
@media (max-width:720px) {
  .cine-root.page .ch { padding:16px 18px 8px; grid-template-columns:1fr auto; gap:12px; }
  .cine-root.page .ch-mid { display:none; }
  .cine-root.page .ch-count { font-size:44px; }
  .cine-root.page .ct { padding:0 18px; gap:18px; overflow-x:auto; }
  .cine-root.page .cf { padding:14px 18px; flex-direction:column; align-items:stretch; }
  .cine-root.page .cf-chips { overflow-x:auto; flex-wrap:nowrap; }
  .cine-root.page .cr, .cine-root.page .cg-wrap, .cine-root.page .wl-wrap, .cine-root.page .rp { padding-left:18px; padding-right:18px; }
  .cine-root.page .cg.d-compact, .cine-root.page .cg.d-regular, .cine-root.page .cg.d-comfy { grid-template-columns:repeat(2,1fr) !important; gap:14px; }
  .cine-root.page .rp-panel { flex-direction:column; text-align:center; padding:24px; }
  .cine-root.page .cm-body { padding:18px; grid-template-columns:1fr; gap:18px; margin-top:-40px; }
  .cine-root.page .cm-title { font-size:32px; }
  .cine-root.page .cm-stats { grid-template-columns:repeat(2,1fr); }
  .cine-root.page .cs { grid-template-columns:1fr; padding:6px 18px 22px; }
  .cine-root.page .sg-grid { grid-template-columns:repeat(2,1fr); gap:14px; }
  .cine-root.page .sc-frame { flex-direction:column; padding:22px; }
}
`;

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return (
      <div style={{ padding:"2rem", textAlign:"center", color:"#e05a5a", fontFamily:"'Geist Mono',monospace" }}>
        <div style={{ fontSize:32, marginBottom:8 }}>😵</div>
        <div style={{ fontSize:13, marginBottom:4, letterSpacing:"0.1em", textTransform:"uppercase" }}>Something went wrong.</div>
        <button onClick={() => this.setState({ hasError: false })}
          style={{ marginTop:12, padding:"10px 22px", background:"#d4a04a", color:"#1a1208", border:"none", borderRadius:8, cursor:"pointer",
                   fontFamily:"'Geist Mono',monospace", fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase" }}>
          Try again
        </button>
      </div>
    );
    return this.props.children;
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || null;
const PROXY = "https://tmdb-proxy.darlanbrandt.workers.dev";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP = "https://image.tmdb.org/t/p/w1280";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const PAGE_SIZE = 20;

// ─── Mappers (data layer — unchanged) ────────────────────────────────────────
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

// ─── Film adapter (Supabase row → Cinéma shape) ───────────────────────────────
const POSTER_LAYOUTS = ['monolith','split','bands','numeral','frame','minimal','duo'];
const POSTER_PALETTES = [
  ['#0b0b14','#e9e3d5','#c64b29'], ['#1a0a05','#e85c2c','#f0d4a8'],
  ['#1a0610','#7b1f3a','#f4e3c6'], ['#0a0805','#c89a4a','#f3e8c8'],
  ['#1a3848','#e8c4a0','#a86848'], ['#1a0a14','#e8503a','#e8c878'],
  ['#1c0e08','#a8421f','#e8c98e'],
];
function hashStr(s) {
  let h=0; for (const c of (s||'')) h=(h*31+c.charCodeAt(0))>>>0; return h;
}
function adaptFilm(f) {
  const genre = Array.isArray(f.genre) ? f.genre : (f.genre||'').split(',').map(g=>g.trim()).filter(Boolean);
  const cast  = Array.isArray(f.actors) ? f.actors : (f.actors||'').split(',').map(a=>a.trim()).filter(Boolean);
  const year  = parseInt(f.year)||0;
  const h     = hashStr(f.title);
  return {
    ...f, year, genre, cast,
    imdb:    parseFloat(f.imdbRating)||0,
    oscars:  Number(f.awards)||0,
    decade:  Math.floor(year/10)*10,
    runtime: parseInt(f.runtime)||0,
    addedDays: f.created_at ? Math.floor((Date.now()-new Date(f.created_at))/86400000) : 0,
    poster_url: f.poster||null,
    backdrop_url: f.backdrop||null,
    // poster field overwritten with SVG config for FilmPoster fallback
    poster:  { layout: POSTER_LAYOUTS[h%POSTER_LAYOUTS.length], colors: POSTER_PALETTES[h%POSTER_PALETTES.length] },
  };
}

// ─── TMDB / OMDB (unchanged) ──────────────────────────────────────────────────
async function tmdbFetch(path, params={}) {
  const qs = new URLSearchParams({path,...params}).toString();
  const res = await fetch(`${PROXY}?${qs}`);
  if (!res.ok) throw new Error(`Proxy error ${res.status}`);
  return res.json();
}
async function fetchTmdbId(film) {
  if (film.tmdbId) return film.tmdbId;
  try {
    const params = {query:film.title, include_adult:"false", page:"1"};
    if (film.year) params.year = String(film.year);
    const d = await tmdbFetch("/search/movie", params);
    return d.results?.[0]?.id ? String(d.results[0].id) : null;
  } catch { return null; }
}
async function searchFilms(query, year, director, setStatus) {
  setStatus("Searching…");
  try {
    const fullQuery = [query,director].filter(Boolean).join(" ");
    const params = {query:fullQuery, include_adult:"false", page:"1"};
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
  const actors   = credits.cast?.slice(0,5).map(a=>a.name).join(", ")||"";
  const genre    = detail.genres?.map(g=>g.name).join(", ")||"";
  const country  = detail.production_countries?.[0]?.name||"";
  const poster   = detail.poster_path?`${TMDB_IMG}${detail.poster_path}`:(candidate.poster_path?`${TMDB_IMG}${candidate.poster_path}`:"");
  const backdrop = detail.backdrop_path?`${TMDB_BACKDROP}${detail.backdrop_path}`:"";
  const plot     = detail.overview||candidate.overview||"";
  const title    = detail.title||candidate.title;
  const year     = detail.release_date?.slice(0,4)||candidate.year||"";
  const runtime  = detail.runtime?`${detail.runtime} min`:"";
  let awards=0, imdbRating="", imdbId="";
  try {
    const tmdbImdbId = detail.imdb_id||"";
    const q = tmdbImdbId?`${PROXY}/omdb?imdbId=${tmdbImdbId}`:`${PROXY}/omdb?title=${encodeURIComponent(title)}&year=${year}`;
    const omdb = await(await fetch(q)).json();
    if (omdb.Awards){const m=omdb.Awards.match(/Won (\d+) Oscar/i);if(m)awards=parseInt(m[1]);}
    if (omdb.imdbRating&&omdb.imdbRating!=="N/A") imdbRating=omdb.imdbRating;
    if (omdb.imdbID) imdbId=omdb.imdbID;
  } catch {}
  return {title,year,genre,director:directorHint||director,country,actors,awards:String(awards),
          imdbRating,imdbId,tmdbId:String(detail.id||""),poster,backdrop,plot,runtime};
}

// ─── Storage Hook (unchanged, optimistic UI) ──────────────────────────────────
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
    const tempId=`temp_${Date.now()}`;
    const optimistic={...film,id:tempId,awards:Number(film.awards)||0,created_at:new Date().toISOString()};
    setFilms(prev=>[optimistic,...prev]);
    if(supabase){
      const{data,error}=await supabase.from("films").insert(filmToRow(film)).select().single();
      if(!error&&data) setFilms(prev=>prev.map(f=>f.id===tempId?rowToFilm(data):f));
      else setFilms(prev=>prev.filter(f=>f.id!==tempId));
    }
  };
  const updateFilm = async(id,updates)=>{
    const row={};
    const map={title:"title",year:"year",genre:"genre",director:"director",country:"country",actors:"actors",
               poster:"poster",plot:"plot",list:"list",rewatched:"rewatched"};
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
    const film=films.find(f=>f.id===id); if(!film) return;
    await updateFilm(id,{rewatched:!film.rewatched});
  };
  return{films,loading,addFilm,updateFilm,removeFilm,toggleRewatch};
}

// ─── Stats Hook (unchanged) ───────────────────────────────────────────────────
function useStats(watchedFilms) {
  const tally  = arr => arr.reduce((m,k)=>{m[k]=(m[k]||0)+1;return m;},{});
  const toRows = obj => Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const byDecade   = toRows(tally(watchedFilms.map(f=>decadeOf(f.year)).filter(d=>d!=="Unknown"))).sort((a,b)=>b[0]-a[0]);
  const byGenre    = toRows(tally(watchedFilms.flatMap(f=>(typeof f.genre==='string'?f.genre.split(',').map(g=>g.trim()):f.genre||[]).filter(Boolean))));
  const byDirector = toRows(tally(watchedFilms.map(f=>f.director).filter(Boolean)));
  const byCountry  = toRows(tally(watchedFilms.map(f=>f.country).filter(Boolean)));
  const totalOscars    = watchedFilms.reduce((s,f)=>s+(Number(f.awards)||0),0);
  const totalRuntime   = watchedFilms.reduce((s,f)=>s+(parseInt(f.runtime)||0),0);
  const totalHours     = Math.round(totalRuntime/60);
  const ratedFilms     = watchedFilms.filter(f=>f.imdbRating);
  const avgRating      = ratedFilms.length?(ratedFilms.reduce((s,f)=>s+parseFloat(f.imdbRating),0)/ratedFilms.length).toFixed(1):"-";
  const bestPicCount   = watchedFilms.filter(f=>Number(f.awards)>=1).length;
  return {byDecade,byGenre,byDirector,byCountry,totalOscars,totalHours,avgRating,bestPicCount};
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function decadeOf(year){const y=parseInt(year);return isNaN(y)?"Unknown":`${Math.floor(y/10)*10}`;}
function parseRuntime(r){if(!r)return 0;const m=String(r).match(/(\d+)/);return m?parseInt(m[1]):0;}

// CSV helpers (unchanged)
function parseCSV(text) {
  const lines = text.replace(/\r\n/g,"\n").replace(/\r/g,"\n").split("\n").filter(l=>l.trim());
  const headers = splitCSVLine(lines[0]);
  return lines.slice(1).map(line=>{const vals=splitCSVLine(line);const obj={};headers.forEach((h,i)=>{obj[h.trim()]=vals[i]?.trim()||"";});return obj;});
}
function splitCSVLine(line) {
  const result=[];let cur="";let inQ=false;
  for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'&&inQ&&line[i+1]==='"'){cur+='"';i++;}else if(ch==='"'){inQ=!inQ;}else if(ch===','&&!inQ){result.push(cur);cur="";}else{cur+=ch;}}
  result.push(cur);return result;
}
function downloadFile(content, filename, mimeType) {
  const blob=new Blob([content],{type:mimeType});const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
}
function exportJSON(films) {
  const data=films.map(f=>({title:f.title,year:f.year,genre:f.genre,director:f.director,country:f.country,
    actors:f.actors,awards:f.awards,imdbRating:f.imdbRating,imdbId:f.imdbId,poster:f.poster,
    backdrop:f.backdrop,plot:f.plot,runtime:f.runtime,rewatched:f.rewatched,list:f.list}));
  downloadFile(JSON.stringify(data,null,2),`my-film-collection-${new Date().toISOString().slice(0,10)}.json`,"application/json");
}
function exportCSV(films) {
  const headers=["title","year","genre","director","country","actors","awards","imdbRating","imdbId","runtime","rewatched","list","plot"];
  const escape=v=>{const s=String(v??"");return s.includes(",")||s.includes('"')||s.includes("\n")?`"${s.replace(/"/g,'""')}"`:s;};
  const rows=[headers.join(","),...films.map(f=>headers.map(h=>escape(f[h])).join(","))];
  downloadFile(rows.join("\n"),`my-film-collection-${new Date().toISOString().slice(0,10)}.csv`,"text/csv");
}

// ─── FilmPoster SVG (from film-data.jsx) ─────────────────────────────────────
function FilmPoster({ film }) {
  const { layout, colors } = film.poster||{layout:'minimal',colors:['#14141a','#d4a04a','#ecead8']};
  const [c0, c1, c2] = colors;
  const titleClean = (film.title||'').replace(/:\s*/g,' · ').toUpperCase();
  const titleWords = titleClean.split(' ');
  let art = null;
  if (layout === 'monolith') {
    art = (<g><rect width="200" height="300" fill={c1}/><rect x="120" y="40" width="50" height="220" fill={c0}/><text x="22" y="240" fill={c0} fontFamily="serif" fontSize="14" fontWeight="600" letterSpacing="0.04em">{titleWords[0]}</text><text x="22" y="258" fill={c0} fontFamily="serif" fontSize="14" fontWeight="600" letterSpacing="0.04em">{titleWords[1]||''}</text><text x="22" y="276" fill={c2} fontFamily="serif" fontSize="14" fontWeight="600" letterSpacing="0.04em">{titleWords.slice(2).join(' ')}</text><text x="22" y="42" fill={c0} fontSize="9" fontFamily="monospace" letterSpacing="0.2em">{film.year}</text></g>);
  } else if (layout === 'split') {
    art = (<g><rect width="200" height="300" fill={c0}/><polygon points="0,0 200,300 0,300" fill={c1}/><text x="100" y="160" textAnchor="middle" fill={c2} fontFamily="serif" fontSize="22" fontStyle="italic" fontWeight="500">{titleWords.slice(0,Math.ceil(titleWords.length/2)).join(' ')}</text><text x="100" y="186" textAnchor="middle" fill={c2} fontFamily="serif" fontSize="22" fontStyle="italic" fontWeight="500">{titleWords.slice(Math.ceil(titleWords.length/2)).join(' ')}</text><text x="100" y="278" textAnchor="middle" fill={c2} fontSize="9" fontFamily="monospace" letterSpacing="0.25em">{film.year}</text></g>);
  } else if (layout === 'bands') {
    art = (<g><rect width="200" height="300" fill={c0}/><rect y="80" width="200" height="50" fill={c1}/><rect y="170" width="200" height="50" fill={c1} opacity="0.6"/><text x="100" y="56" textAnchor="middle" fill={c2} fontSize="9" fontFamily="monospace" letterSpacing="0.3em">{(film.director||'').toUpperCase()}</text><text x="100" y="156" textAnchor="middle" fill={c0} fontFamily="serif" fontSize="20" fontWeight="700">{titleWords[0]}</text><text x="100" y="200" textAnchor="middle" fill={c2} fontFamily="serif" fontSize="14" fontWeight="500" letterSpacing="0.1em">{titleWords.slice(1).join(' ')}</text><text x="100" y="264" textAnchor="middle" fill={c2} fontSize="9" fontFamily="monospace" letterSpacing="0.25em">{film.year}</text></g>);
  } else if (layout === 'numeral') {
    const ys=String(film.year);
    art = (<g><rect width="200" height="300" fill={c0}/><text x="100" y="190" textAnchor="middle" fill={c1} fontFamily="serif" fontSize="140" fontWeight="700" letterSpacing="-0.04em">{ys.slice(2)}</text><text x="100" y="38" textAnchor="middle" fill={c2} fontSize="9" fontFamily="monospace" letterSpacing="0.3em">{ys.slice(0,2)} ·</text><text x="100" y="232" textAnchor="middle" fill={c2} fontFamily="serif" fontSize="13" fontWeight="600" letterSpacing="0.05em">{titleWords.slice(0,2).join(' ')}</text><text x="100" y="250" textAnchor="middle" fill={c2} fontFamily="serif" fontSize="13" fontWeight="600" letterSpacing="0.05em">{titleWords.slice(2).join(' ')}</text><text x="100" y="278" textAnchor="middle" fill={c2} fontSize="8" fontFamily="monospace" opacity="0.7" letterSpacing="0.2em">{(film.director||'').toUpperCase()}</text></g>);
  } else if (layout === 'frame') {
    art = (<g><rect width="200" height="300" fill={c1}/><rect x="14" y="14" width="172" height="272" fill={c0}/><rect x="14" y="14" width="172" height="272" fill="none" stroke={c2} strokeWidth="0.5"/><text x="100" y="148" textAnchor="middle" fill={c2} fontFamily="serif" fontSize="18" fontWeight="500" fontStyle="italic">{titleWords.slice(0,Math.ceil(titleWords.length/2)).join(' ')}</text><text x="100" y="172" textAnchor="middle" fill={c2} fontFamily="serif" fontSize="18" fontWeight="500" fontStyle="italic">{titleWords.slice(Math.ceil(titleWords.length/2)).join(' ')}</text><line x1="80" y1="195" x2="120" y2="195" stroke={c2} strokeWidth="0.6"/><text x="100" y="216" textAnchor="middle" fill={c2} fontSize="8" fontFamily="monospace" letterSpacing="0.3em">{film.year}</text></g>);
  } else if (layout === 'duo') {
    art = (<g><rect width="200" height="300" fill={c0}/><circle cx="100" cy="118" r="56" fill={c1}/><circle cx="100" cy="118" r="56" fill="none" stroke={c2} strokeWidth="0.6"/><text x="100" y="216" textAnchor="middle" fill={c1} fontFamily="serif" fontSize="16" fontWeight="600" fontStyle="italic">{titleWords.slice(0,Math.ceil(titleWords.length/2)).join(' ')}</text><text x="100" y="236" textAnchor="middle" fill={c1} fontFamily="serif" fontSize="16" fontWeight="600" fontStyle="italic">{titleWords.slice(Math.ceil(titleWords.length/2)).join(' ')}</text><text x="100" y="266" textAnchor="middle" fill={c2} fontSize="8" fontFamily="monospace" letterSpacing="0.3em">{film.year}</text></g>);
  } else {
    art = (<g><rect width="200" height="300" fill={c0}/><text x="100" y="148" textAnchor="middle" fill={c1} fontFamily="serif" fontSize="26" fontWeight="600">{titleWords[0]}</text><text x="100" y="178" textAnchor="middle" fill={c1} fontFamily="serif" fontSize="26" fontWeight="600">{titleWords.slice(1).join(' ')}</text><line x1="60" y1="208" x2="140" y2="208" stroke={c2} strokeWidth="0.6"/><text x="100" y="232" textAnchor="middle" fill={c2} fontSize="9" fontFamily="monospace" letterSpacing="0.3em">{film.year}</text><text x="100" y="270" textAnchor="middle" fill={c2} fontSize="8" fontFamily="monospace" opacity="0.6" letterSpacing="0.2em">{(film.director||'').toUpperCase()}</text></g>);
  }
  return (
    <svg viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice"
      style={{ display:'block', width:'100%', height:'100%' }} aria-label={`${film.title} poster`}>
      {art}
    </svg>
  );
}

// Poster image or SVG fallback
function PosterImg({ film, style }) {
  if (film.poster_url) {
    return <img src={film.poster_url} alt={film.title}
      style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', ...style }}
      onError={e=>{ e.target.style.display='none'; }} />;
  }
  return <FilmPoster film={film} />;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Ico = {
  sun:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
  moon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>,
  bookmark: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>,
  bookmarkOutline: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11"/></svg>,
  star:  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7 7 .8-5.3 4.9 1.6 7.3L12 18.3 5.7 22l1.6-7.3L2 9.8 9 9z"/></svg>,
  osc:   <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="9" r="5"/><path d="M9 13l-2 9 5-3 5 3-2-9"/></svg>,
  spark: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6z"/></svg>,
  dice:  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.2" fill="currentColor"/><circle cx="16" cy="8" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="8" cy="16" r="1.2" fill="currentColor"/><circle cx="16" cy="16" r="1.2" fill="currentColor"/></svg>,
  updown: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4"/></svg>,
  lock:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  grid:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  list:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>,
};

// ─── ThemeToggle ──────────────────────────────────────────────────────────────
function ThemeToggle({ value, onChange }) {
  const isLight = value === 'light';
  return (
    <button className={`th-toggle ${isLight ? 'is-light' : ''}`}
      onClick={() => onChange(isLight ? 'dark' : 'light')}
      aria-label={isLight ? 'Switch to dark mode' : 'Switch to light mode'}>
      <span className="th-icons">{Ico.moon}{Ico.sun}</span>
      <span className="th-thumb">{isLight ? Ico.sun : Ico.moon}</span>
    </button>
  );
}

// ─── ToastHost ────────────────────────────────────────────────────────────────
function ToastHost() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    window.cinemaToast = (msg, opts = {}) => {
      const id = Math.random().toString(36).slice(2);
      setItems(prev => [...prev, { id, msg, icon: opts.icon }]);
      setTimeout(() => setItems(prev => prev.map(t => t.id===id ? {...t, leaving:true} : t)), 2600);
      setTimeout(() => setItems(prev => prev.filter(t => t.id!==id)), 2900);
    };
    return () => { delete window.cinemaToast; };
  }, []);
  return (
    <div className="cine-toast-host">
      {items.map(t => (
        <div key={t.id} className={`cine-toast ${t.leaving ? 'leaving' : ''}`}>
          {t.icon || Ico.check}
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Film Card ────────────────────────────────────────────────────────────────
function FilmCard({ film, onSelect, layout='classic' }) {
  const f = adaptFilm(film);
  const isOscar = f.oscars > 0;
  if (layout === 'list') {
    return (
      <div className={`cc list-row ${isOscar ? 'oscar' : ''}`} onClick={() => onSelect(film)}>
        <div className="cc-glow"/>
        <div className="cc-poster"><PosterImg film={f}/></div>
        <div className="cc-meta">
          <h3 className="cc-title">{f.title}</h3>
          <div className="cc-foot">
            <span>{f.year}{f.director ? ` · ${f.director}` : ''}</span>
            {f.imdb > 0 && <span className="cc-rating">{Ico.star} <b>{f.imdb}</b></span>}
            {isOscar && <span style={{color:'var(--oscar)',fontFamily:'Geist Mono,monospace',fontSize:9,letterSpacing:'0.14em'}}>{Ico.osc} ×{f.oscars}</span>}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className={`cc classic ${isOscar ? 'oscar' : ''}`} onClick={() => onSelect(film)}>
      <div className="cc-glow"/>
      {isOscar && <span className="cc-osc">{Ico.osc} ×{f.oscars}</span>}
      <div className="cc-poster"><PosterImg film={f}/></div>
      <div className="cc-meta">
        <h3 className="cc-title">{f.title}</h3>
        <div className="cc-credit">{f.director}</div>
        <div className="cc-foot">
          <span>{f.year}{f.runtime > 0 ? ` · ${f.runtime}m` : ''}</span>
          {f.imdb > 0 && <span className="cc-rating">{Ico.star} <b>{f.imdb}</b></span>}
        </div>
      </div>
    </div>
  );
}

// ─── Recently Added Strip ─────────────────────────────────────────────────────
function RecentlyAdded({ films, onSelect }) {
  if (!films.length) return null;
  return (
    <div className="cr">
      <div className="cr-row">
        <span className="cr-label">Recently added →</span>
        {films.map(f => {
          const af = adaptFilm(f);
          return (
            <div key={f.id} className="cr-item" onClick={() => onSelect(f)}>
              <div><PosterImg film={af}/></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Cinema Modal (detail) ────────────────────────────────────────────────────
function CinemaModal({ film, onClose, onPrev, onNext, onFindSimilar, onShareCard, onMarkRewatched, onMarkWatched, onEdit, onRemove, isWatchlist, isUnlocked }) {
  const f = adaptFilm(film);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const hasBackdrop = !!f.backdrop_url;
  const backdropStyle = hasBackdrop
    ? { backgroundImage:`url(${f.backdrop_url})`, backgroundSize:'cover', backgroundPosition:'center' }
    : { background:`linear-gradient(135deg, ${f.poster.colors[0]} 0%, ${f.poster.colors[1]} 50%, ${f.poster.colors[2]} 100%)` };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'ArrowRight' && onNext) onNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="cm" onClick={onClose}>
      <div className="cm-sheet" onClick={e => e.stopPropagation()}>
        <div className="cm-back">
          <div className="cm-back-bg" style={backdropStyle}/>
          <div className="cm-grain"/>
          <div className="cm-eyebrow-over">
            <div className="cm-yearstamp">{f.year}</div>
            <div className="cm-genres">{f.genre.map(g => <span key={g}>{g}</span>)}</div>
          </div>
        </div>
        <div className="cm-nav">
          {onPrev && <button onClick={e=>{e.stopPropagation();onPrev();}}>‹</button>}
          {onNext && <button onClick={e=>{e.stopPropagation();onNext();}}>›</button>}
        </div>
        <button className="cm-close" onClick={onClose}>×</button>

        <div className="cm-body">
          <div>
            <div className="cm-poster"><PosterImg film={f}/></div>
          </div>
          <div className="cm-info">
            <h2 className="cm-title">{f.title}</h2>
            <div className="cm-dir">
              Directed by <b>{f.director}</b>{f.country ? ` · ${f.country}` : ''}{f.runtime > 0 ? ` · ${f.runtime} min` : ''}
            </div>
            <div className="cm-divider"/>
            <p className="cm-plot">{f.plot}</p>

            <div className="cm-stats">
              {f.imdb > 0 && (
                <div className="cm-stat"><div className="l">IMDb</div><div className="v">{f.imdb}<span className="vu">/10</span></div></div>
              )}
              <div className="cm-stat">
                <div className="l">Oscars</div>
                <div className={`v ${f.oscars > 0 ? 'osc' : ''}`}>{f.oscars}</div>
              </div>
              {f.runtime > 0 && (
                <div className="cm-stat"><div className="l">Runtime</div><div className="v">{f.runtime}<span className="vu">min</span></div></div>
              )}
              <div className="cm-stat"><div className="l">Era</div><div className="v">{f.decade}s</div></div>
            </div>

            {f.cast.length > 0 && (
              <div className="cm-cast">
                <h4>Featuring</h4>
                <div className="cm-cast-grid">
                  {f.cast.slice(0,6).map(c => (
                    <div key={c}><b>{c}</b><span>cast</span></div>
                  ))}
                </div>
              </div>
            )}

            <div className="cm-actions">
              {isUnlocked && (
                <>
                  {isWatchlist
                    ? <button className="cm-btn primary" onClick={() => { onMarkWatched(); }}>Mark Watched</button>
                    : <button className="cm-btn primary" onClick={() => onMarkRewatched()}>
                        {film.rewatched ? '↩ Rewatched ✓' : 'Mark Rewatched'}
                      </button>
                  }
                </>
              )}
              <button className="cm-btn" onClick={() => { onFindSimilar(); onClose(); }}>Find Similar</button>
              {isUnlocked && (
                <>
                  <button className="cm-btn" onClick={() => { onShareCard(); onClose(); }}>Share Card</button>
                  <button className="cm-btn" onClick={() => { onEdit(); onClose(); }}>Edit Entry</button>
                  {!confirmRemove
                    ? <button className="cm-btn" style={{color:'#e05a5a'}} onClick={() => setConfirmRemove(true)}>Remove</button>
                    : <>
                        <button className="cm-btn" style={{color:'#e05a5a',boxShadow:'var(--shadow-pressed-sm)'}}
                          onClick={() => { onRemove(film.id); onClose(); }}>Confirm remove</button>
                        <button className="cm-btn" onClick={() => setConfirmRemove(false)}>Cancel</button>
                      </>
                  }
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Suggestions Sheet ────────────────────────────────────────────────────────
function SuggestionsSheet({ basedOn, picks: initialPicks, existingFilms, onClose, onAdd, showToast }) {
  const [picks, setPicks] = useState(() => {
    const isDup = (title, year) => existingFilms.some(f =>
      f.title.trim().toLowerCase() === title.trim().toLowerCase() && String(f.year) === String(year)
    );
    return initialPicks.filter(p => !isDup(p.title, p.year));
  });
  const [loadingId, setLoadingId] = useState(null);
  const [addToWl, setAddToWl] = useState(false);

  const handlePick = async (pick) => {
    if (loadingId) return;
    setLoadingId(pick.tmdbId);
    try {
      const details = await getDetails({ tmdb_id: pick.tmdbId, poster_path: null, overview: '' }, null);
      const dup = existingFilms.find(f =>
        (details.imdbId && f.imdbId && details.imdbId === f.imdbId) ||
        (f.title.trim().toLowerCase() === details.title.trim().toLowerCase() && f.year === details.year)
      );
      if (!dup) {
        await onAdd({ ...details, awards: Number(details.awards)||0, rewatched: false, list: addToWl ? 'watchlist' : 'watched' });
        showToast(`"${details.title}" added to ${addToWl ? 'watchlist' : 'collection'}`);
      }
      setPicks(prev => prev.filter(p => p.tmdbId !== pick.tmdbId));
    } catch {}
    setLoadingId(null);
  };

  if (!picks.length) return (
    <div className="sg" onClick={onClose}>
      <div className="sg-sheet" onClick={e => e.stopPropagation()} style={{ padding: 40, textAlign: 'center' }}>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>All done!</div>
        <p style={{ fontFamily: "'Geist Mono',monospace", fontSize: 10, color: 'var(--ink-dim)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Your collection is growing.</p>
        <button className="cm-btn primary" style={{ marginTop: 20 }} onClick={onClose}>Done</button>
      </div>
    </div>
  );

  return (
    <div className="sg" onClick={onClose}>
      <div className="sg-sheet" onClick={e => e.stopPropagation()}>
        <div className="sg-hd">
          <div className="sg-grab"/>
          <div className="sg-titlerow">
            <div>
              <h3>You might also like</h3>
              <div className="sub">Based on <b>{basedOn}</b></div>
            </div>
            <div className="sg-opts">
              <label style={{ display:'flex', alignItems:'center', gap:6, fontFamily:"'Geist Mono',monospace",
                fontSize:10, color:'var(--ink-dim)', letterSpacing:'0.16em', textTransform:'uppercase', cursor:'pointer' }}>
                <input type="checkbox" checked={addToWl} onChange={e => setAddToWl(e.target.checked)}
                  style={{ accentColor:'var(--accent)' }}/>
                Watchlist
              </label>
              <button className="sg-close" onClick={onClose}>×</button>
            </div>
          </div>
        </div>
        <div className="sg-body">
          <div className="sg-grid">
            {picks.map(pick => {
              const isLoading = loadingId === pick.tmdbId;
              const af = { title: pick.title, year: pick.year, director: '', poster: { layout:'minimal', colors:['#14141a','#d4a04a','#ecead8'] }, poster_url: pick.poster };
              return (
                <div key={pick.tmdbId} className={`sg-card ${isLoading ? 'added' : ''}`}>
                  <div className="pst" style={{ position:'relative' }}>
                    <PosterImg film={af}/>
                    {isLoading && (
                      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.6)',
                                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>⏳</div>
                    )}
                  </div>
                  <div className="ttl">{pick.title}</div>
                  <div className="meta">{pick.year}</div>
                  <div className="actions">
                    <button className="add-btn" disabled={!!loadingId} onClick={() => handlePick(pick)}>
                      {isLoading ? '⏳' : '+ Add'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Share Card Modal ─────────────────────────────────────────────────────────
function ShareCardModal({ film, onClose }) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [generating, setGenerating] = useState(true);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const loadImage = (src) => new Promise((res, rej) => {
    const img = new Image(); img.crossOrigin = "anonymous";
    img.onload = () => res(img); img.onerror = rej; img.src = src;
  });
  const proxyUrl = (url) => url ? `${PROXY}/image?url=${encodeURIComponent(url)}` : null;

  useEffect(() => {
    (async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const W = 1080, H = 1920;
      canvas.width = W; canvas.height = H;
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      const af = adaptFilm(film);
      const [c0, c1] = af.poster.colors;
      bg.addColorStop(0, c0); bg.addColorStop(1, c1);
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
      if (film.poster) {
        try {
          const bgImg = await loadImage(proxyUrl(film.poster));
          if (!isIOS) { ctx.save(); ctx.filter = "blur(40px) brightness(0.25)"; ctx.drawImage(bgImg, -60, -60, W+120, H+120); ctx.restore(); }
          else { ctx.save(); ctx.globalAlpha = 0.15; ctx.drawImage(bgImg, 0, 0, W, H); ctx.restore(); }
        } catch {}
      }
      const ov = ctx.createLinearGradient(0, 0, 0, H);
      ov.addColorStop(0, "rgba(0,0,0,0.4)"); ov.addColorStop(1, "rgba(0,0,0,0.75)");
      ctx.fillStyle = ov; ctx.fillRect(0, 0, W, H);
      const PW = 640, PH = 960, PX = (W-640)/2, PY = (H-960)/2-120;
      if (film.poster) {
        try {
          const pi = await loadImage(proxyUrl(film.poster));
          const r = 24; ctx.save(); ctx.beginPath();
          ctx.moveTo(PX+r,PY); ctx.lineTo(PX+PW-r,PY); ctx.quadraticCurveTo(PX+PW,PY,PX+PW,PY+r);
          ctx.lineTo(PX+PW,PY+PH-r); ctx.quadraticCurveTo(PX+PW,PY+PH,PX+PW-r,PY+PH);
          ctx.lineTo(PX+r,PY+PH); ctx.quadraticCurveTo(PX,PY+PH,PX,PY+PH-r);
          ctx.lineTo(PX,PY+r); ctx.quadraticCurveTo(PX,PY,PX+r,PY); ctx.closePath();
          ctx.clip(); ctx.drawImage(pi, PX, PY, PW, PH); ctx.restore();
        } catch {}
      }
      const tY = PY + PH + 70; ctx.textAlign = "center";
      ctx.font = "bold 64px sans-serif"; ctx.fillStyle = "#ffffff";
      let title = film.title; const maxW = W-120;
      while (ctx.measureText(title+"…").width > maxW && title.length > 0) title = title.slice(0,-1);
      if (title !== film.title) title += "…";
      ctx.fillText(title, W/2, tY);
      const meta = [film.year, typeof film.genre === 'string' ? film.genre.split(',')[0].trim() : (film.genre||[])[0]].filter(Boolean).join(' · ');
      ctx.font = "36px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fillText(meta, W/2, tY+72);
      let eY = 0;
      if (film.imdbRating) { ctx.font = "bold 42px sans-serif"; ctx.fillStyle = "#d4a04a"; ctx.fillText(`★ ${film.imdbRating} / 10  IMDb`, W/2, tY+152); eY = 60; }
      if (Number(film.awards) > 0) { ctx.font = "36px sans-serif"; ctx.fillStyle = "#d4a04a"; ctx.fillText(`🏆 ${film.awards} Oscar${Number(film.awards)>1?"s":""}`, W/2, tY+152+eY); }
      ctx.strokeStyle = "rgba(255,255,255,0.15)"; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(W/2-120, H-160); ctx.lineTo(W/2+120, H-160); ctx.stroke();
      ctx.font = "32px sans-serif"; ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillText("My Film Collection", W/2, H-110);
      setGenerating(false); setReady(true);
    })();
  }, []);

  const download = () => {
    const dataUrl = canvasRef.current.toDataURL("image/png");
    if (isIOS) { const w = window.open(); w.document.write(`<img src="${dataUrl}" style="max-width:100%"/>`); w.document.title = film.title; }
    else { const l = document.createElement("a"); l.download = `${film.title.replace(/[^a-z0-9]/gi,"_")}_share.png`; l.href = dataUrl; l.click(); }
    window.cinemaToast?.('Download started · 1080×1920', { icon: Ico.check });
    onClose();
  };

  return (
    <div className="sc" onClick={onClose}>
      <div className="sc-frame" onClick={e => e.stopPropagation()}>
        <div className="sc-preview-wrap">
          <div className="sc-canvas-preview">
            {generating && (
              <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
                background:'var(--surface-down)', fontFamily:"'Geist Mono',monospace", fontSize:10,
                color:'var(--ink-soft)', letterSpacing:'0.2em', textTransform:'uppercase' }}>
                Generating…
              </div>
            )}
            <canvas ref={canvasRef} style={{ display: ready ? 'block' : 'none' }}/>
          </div>
        </div>
        <div className="sc-info">
          <div className="l">Share card</div>
          <h3>{film.title}</h3>
          <div className="for">1080 × 1920 · Stories format</div>
          <div className="actions">
            {ready && (
              <button className="cm-btn primary" onClick={download}>
                {isIOS ? '🖼 Open image' : '⬇ Download PNG'}
              </button>
            )}
            <button className="cm-btn" onClick={onClose}>Cancel</button>
          </div>
          <div className="dim-text">Rendered locally · TMDB &amp; OMDB data</div>
        </div>
      </div>
    </div>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function AddModal({ onClose, onAdd, onUpdate, existingFilms, editFilm }) {
  const isEdit = !!editFilm;
  const [query, setQuery] = useState('');
  const [yearQuery, setYearQuery] = useState('');
  const [directorQuery, setDirectorQuery] = useState('');
  const [step, setStep] = useState(isEdit ? 'edit' : 'search');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [addToWl, setAddToWl] = useState(false);
  const [form, setForm] = useState(isEdit ? {
    title:editFilm.title||'', year:editFilm.year||'', genre:editFilm.genre||'',
    director:editFilm.director||'', country:editFilm.country||'', actors:editFilm.actors||'',
    awards:String(editFilm.awards??''), imdbRating:editFilm.imdbRating||'', imdbId:editFilm.imdbId||'',
    poster:editFilm.poster||'', backdrop:editFilm.backdrop||'', plot:editFilm.plot||'', runtime:editFilm.runtime||''
  } : { title:'',year:'',genre:'',director:'',country:'',actors:'',awards:'',imdbRating:'',imdbId:'',poster:'',backdrop:'',plot:'',runtime:'' });
  const [err, setErr] = useState('');

  const doSearch = async () => {
    const q=query.trim().slice(0,100); const y=yearQuery.trim().slice(0,4).replace(/\D/g,''); const d=directorQuery.trim().slice(0,100);
    if (!q) return; setLoading(true); setErr('');
    try {
      const results = await searchFilms(q, y, d, setStatus);
      if (!results.length) { setErr("No results. Try a different title or fill in manually."); setForm(f=>({...f,title:query,year:yearQuery,director:directorQuery})); setStep('edit'); }
      else { setCandidates(results); setStep('confirm'); }
    } catch(e) { setErr(`Search error: ${e.message}`); }
    setStatus(''); setLoading(false);
  };

  const selectCandidate = async (c) => {
    setLoading(true); setErr(''); setStatus('Fetching details…');
    try { const f = await getDetails(c, directorQuery.trim()); setForm(f); setStep('edit'); }
    catch(e) { setErr(`Could not load details: ${e.message}`); setForm(f=>({...f,title:c.title,year:c.year,director:directorQuery.trim(),poster:c.poster_path?`${TMDB_IMG}${c.poster_path}`:''})); setStep('edit'); }
    setStatus(''); setLoading(false);
  };

  const handleSave = () => {
    if (!form.title.trim()) { setErr("Title is required."); return; }
    if (!form.year.trim() || isNaN(parseInt(form.year))) { setErr("A valid year is required."); return; }
    if (!isEdit) {
      const dup = existingFilms.find(f => (form.imdbId&&f.imdbId&&form.imdbId===f.imdbId)||(f.title.trim().toLowerCase()===form.title.trim().toLowerCase()&&f.year===form.year.trim()));
      if (dup) { setErr(`"${dup.title}" (${dup.year}) is already in your collection.`); return; }
      onAdd({ ...form, awards:Number(form.awards)||0, rewatched:false, list:addToWl?'watchlist':'watched' });
    } else {
      onUpdate(editFilm.id, { ...form, awards:Number(form.awards)||0 });
    }
    onClose();
  };

  return (
    <div className="af" onClick={onClose}>
      <div className="af-frame" onClick={e => e.stopPropagation()}>
        <div className="af-hd">
          <h3>{isEdit ? `Edit — ${editFilm.title}` : step==='search' ? 'Add a film' : step==='confirm' ? 'Select the correct film' : 'Review details'}</h3>
          <button className="sg-close" onClick={onClose}>×</button>
        </div>

        {step === 'search' && (
          <>
            <div className="af-search">
              {Ico.search}
              <input autoFocus value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSearch()} placeholder="Film title…"/>
              <input value={yearQuery} onChange={e=>setYearQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSearch()} placeholder="Year" style={{width:70}}/>
              <input value={directorQuery} onChange={e=>setDirectorQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSearch()} placeholder="Director (opt.)" style={{width:130}}/>
              <button className="af-row .add" style={{padding:'8px 14px',background:'var(--accent)',color:'#1a1208',border:0,borderRadius:6,cursor:'pointer',fontFamily:"'Geist Mono',monospace",fontSize:9,letterSpacing:'0.18em',textTransform:'uppercase',fontWeight:600}} onClick={doSearch} disabled={loading}>{loading?'…':'Search'}</button>
            </div>
            {status && <div className="af-step">{status}</div>}
            {err && <div className="af-error">{err}</div>}
            <label className="af-wl-label">
              <input type="checkbox" checked={addToWl} onChange={e=>setAddToWl(e.target.checked)}/> Add to watchlist instead of watched
            </label>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="af-step">Select the correct film</div>
            <div className="af-list">
              {candidates.map((c,i) => (
                <button key={i} className="af-row" onClick={() => !loading && selectCandidate(c)} disabled={loading}>
                  <div className="thumb">
                    {c.poster_path ? <img src={`https://image.tmdb.org/t/p/w92${c.poster_path}`} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={e=>e.target.style.display='none'}/> : <FilmPoster film={{title:c.title,year:c.year,poster:{layout:'minimal',colors:['#14141a','#d4a04a','#ecead8']},director:''}}/>}
                  </div>
                  <div className="info">
                    <b>{c.title} <span style={{fontWeight:400,color:'var(--ink-dim)'}}>({c.year})</span></b>
                    {c.original_title&&c.original_title!==c.title && <div className="meta">{c.original_title}</div>}
                    {c.overview && <p>{c.overview}</p>}
                  </div>
                </button>
              ))}
            </div>
            {status && <div className="af-step" style={{marginTop:10}}>{status}</div>}
            <div className="af-footer">
              <button className="cm-btn" onClick={()=>{setStep('search');setCandidates([]);}}>Back</button>
              <button className="cm-btn" onClick={()=>{setForm(f=>({...f,title:query,year:yearQuery,director:directorQuery}));setStep('edit');}}>Fill manually</button>
            </div>
          </>
        )}

        {step === 'edit' && (
          <>
            <div className="af-step">{isEdit ? 'Update any field and save.' : 'Review all fields before saving.'}</div>
            {err && <div className="af-error">{err}</div>}
            <div className="af-form-scroll">
              {form.poster && (
                <div style={{textAlign:'center',marginBottom:14}}>
                  <img src={form.poster} alt="poster" style={{height:140,borderRadius:6,objectFit:'cover'}} onError={e=>e.target.style.display='none'}/>
                </div>
              )}
              <div className="af-grid2">
                {[['Title','title'],['Year','year'],['Genre','genre'],['Director','director'],['Country','country'],['Oscars won','awards']].map(([label,k])=>(
                  <div key={k} className="af-field">
                    <label>{label}</label>
                    <input type={k==='awards'?'number':'text'} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>
                  </div>
                ))}
              </div>
              <div className="af-field"><label>Main cast (comma-separated)</label><input value={form.actors} onChange={e=>setForm(f=>({...f,actors:e.target.value}))}/></div>
              <div className="af-field"><label>Poster URL</label><input value={form.poster} onChange={e=>setForm(f=>({...f,poster:e.target.value}))}/></div>
              <div className="af-field"><label>Plot</label><textarea value={form.plot} onChange={e=>setForm(f=>({...f,plot:e.target.value}))}/></div>
              {form.imdbRating && <div className="af-step">IMDb: ★ {form.imdbRating}/10</div>}
            </div>
            <div className="af-footer">
              {!isEdit && <button className="cm-btn" onClick={()=>setStep('confirm')}>Back</button>}
              <button className="cm-btn primary" onClick={handleSave} style={{flex:2}}>{isEdit?'Save changes':'Add to collection'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Import / Export Modal ────────────────────────────────────────────────────
function ImportExportModal({ onClose, films, onImportFilm, isUnlocked }) {
  const fileRef = useRef(null);
  const cancelRef = useRef(false);
  const [step, setStep] = useState('menu');
  const [importType, setImportType] = useState(null);
  const [preview, setPreview] = useState([]);
  const [progress, setProgress] = useState({ done:0, total:0, added:0, failed:0 });
  const [log, setLog] = useState([]);

  const isDup = (title, year) => films.some(f =>
    f.title.trim().toLowerCase() === title.trim().toLowerCase() && String(f.year) === String(year)
  );

  const handleFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const text = await file.text();
    if (file.name.endsWith('.json')) {
      try {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error();
        setImportType('json');
        setPreview(parsed.filter(r=>r.title).map(r => ({ title:r.title||'', year:String(r.year||''), isDup:isDup(r.title,r.year), raw:r })));
        setStep('preview');
      } catch { alert("Invalid JSON backup file."); }
      return;
    }
    try {
      const rows = parseCSV(text);
      setImportType('letterboxd');
      setPreview(rows.filter(r=>r.Name?.trim()).map(r => ({
        title:r.Name?.trim()||'', year:String(r.Year?.trim()||''),
        isDup:isDup(r.Name?.trim(),r.Year?.trim()),
        rewatched:(r.Rewatch?.trim().toLowerCase()==='yes'), raw:r
      })));
      setStep('preview');
    } catch { alert("Could not parse CSV. Make sure it's a Letterboxd export."); }
  };

  const startImport = async () => {
    cancelRef.current = false;
    const toImport = preview.filter(p => !p.isDup);
    setProgress({ done:0, total:toImport.length, added:0, failed:0 });
    setLog([]); setStep('importing');
    let added=0, failed=0;
    for (let i=0; i<toImport.length; i++) {
      if (cancelRef.current) break;
      const item = toImport[i];
      setLog(prev => [{ title:item.title, year:item.year, status:'loading' }, ...prev.slice(0,19)]);
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
          if (!result) { failed++; setLog(prev=>[{...prev[0],status:'fail'},...prev.slice(1)]); setProgress(p=>({...p,done:i+1,added,failed})); continue; }
          const details = await getDetails({ tmdb_id:result.id, poster_path:result.poster_path, overview:result.overview }, null);
          await onImportFilm({ ...details, awards:Number(details.awards)||0, rewatched:item.rewatched??false, list:'watched' });
          added++;
          setLog(prev => [{ ...prev[0], status:'ok' }, ...prev.slice(1)]);
        }
      } catch { failed++; setLog(prev => [{ ...prev[0], status:'fail' }, ...prev.slice(1)]); }
      setProgress(p => ({ ...p, done:i+1, added, failed }));
      if (i < toImport.length-1) await new Promise(r => setTimeout(r, 350));
    }
    setProgress(p => ({ ...p, done:toImport.length, added, failed }));
    setStep('done');
  };

  return (
    <div className="af" onClick={onClose}>
      <div className="af-frame" onClick={e => e.stopPropagation()}>
        <div className="af-hd">
          <h3>{step==='menu'?'Import / Export':step==='preview'?`Preview — ${preview.length} films`:step==='importing'?'Importing…':'Done'}</h3>
          <button className="sg-close" onClick={onClose}>×</button>
        </div>

        {step === 'menu' && (
          <>
            <div className="io-section-title">Export your collection</div>
            <p style={{fontFamily:"'Geist',sans-serif",fontSize:12,color:'var(--ink-dim)',marginTop:0,marginBottom:12,lineHeight:1.6}}>Download a backup or open in Excel / Google Sheets.</p>
            <div className="io-row">
              <button className="cm-btn" style={{flex:1}} onClick={() => exportJSON(films)}>⬇ JSON backup</button>
              <button className="cm-btn" style={{flex:1}} onClick={() => exportCSV(films)}>⬇ CSV (Excel / Sheets)</button>
            </div>
            <div className="io-divider"/>
            <div className="io-section-title">Import films</div>
            {isUnlocked ? (
              <>
                <p style={{fontFamily:"'Geist',sans-serif",fontSize:12,color:'var(--ink-dim)',marginTop:0,marginBottom:14,lineHeight:1.6}}>
                  Restore a <b style={{color:'var(--ink)'}}>JSON backup</b> from this app, or import a <b style={{color:'var(--ink)'}}>Letterboxd CSV</b> (letterboxd.com → Settings → Import &amp; Export → Export your data).
                </p>
                <input ref={fileRef} type="file" accept=".json,.csv" onChange={handleFile} style={{display:'none'}}/>
                <button className="cm-btn primary" style={{width:'100%',padding:'13px'}} onClick={() => fileRef.current?.click()}>Choose file (.json or .csv)</button>
              </>
            ) : (
              <div style={{background:'var(--surface-down)',borderRadius:8,padding:'12px 14px',fontFamily:"'Geist Mono',monospace",fontSize:10,color:'var(--ink-soft)',letterSpacing:'0.16em',textTransform:'uppercase',display:'flex',alignItems:'center',gap:8}}>
                {Ico.lock} Unlock the collection to import films.
              </div>
            )}
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="af-step">{preview.filter(p=>!p.isDup).length} films to import · <span style={{color:'#e05a5a'}}>{preview.filter(p=>p.isDup).length} duplicates skipped</span>{importType==='letterboxd'?' · TMDB lookup required':''}</div>
            <div className="io-preview-list">
              {preview.map((p,i) => (
                <div key={i} className={`io-preview-row ${p.isDup?'dup':''}`} style={{background:p.isDup?undefined:'var(--surface)'}}>
                  <span className="icon">{p.isDup?'🔁':'🎬'}</span>
                  <span className="ttl">{p.title}</span>
                  <span className="yr">{p.year}{p.isDup?' · already in collection':''}</span>
                </div>
              ))}
            </div>
            <div className="af-footer">
              <button className="cm-btn" onClick={()=>{setStep('menu');setPreview([]);if(fileRef.current)fileRef.current.value='';}}>Back</button>
              <button className="cm-btn primary" style={{flex:2}} disabled={preview.filter(p=>!p.isDup).length===0} onClick={startImport}>
                Import {preview.filter(p=>!p.isDup).length} films
              </button>
            </div>
          </>
        )}

        {step === 'importing' && (
          <>
            <div className="io-progress-wrap">
              <div style={{display:'flex',justifyContent:'space-between',fontFamily:"'Geist Mono',monospace",fontSize:10,color:'var(--ink-dim)',letterSpacing:'0.14em',marginBottom:8}}>
                <span>{progress.done} of {progress.total}</span>
                <span style={{color:'var(--accent)'}}>✓ {progress.added} added</span>
              </div>
              <div className="io-progress-bar">
                <div className="io-progress-fill" style={{width:`${progress.total?Math.round(progress.done/progress.total*100):0}%`}}/>
              </div>
            </div>
            <div className="io-log">
              {log.map((entry,i) => (
                <div key={i} className="io-log-row">
                  <span className="icon">{entry.status==='loading'?'⏳':entry.status==='ok'?'✅':'❌'}</span>
                  <span className="name">{entry.title}</span>
                  <span className="year">{entry.year}</span>
                </div>
              ))}
            </div>
            <button className="cm-btn" style={{marginTop:14,width:'100%',color:'#e05a5a'}} onClick={() => cancelRef.current=true}>Cancel</button>
          </>
        )}

        {step === 'done' && (
          <div className="io-done">
            <div className="big">{progress.added}</div>
            <div className="label">Films added to your collection</div>
            {progress.failed > 0 && <div style={{fontFamily:"'Geist Mono',monospace",fontSize:10,color:'#e05a5a',letterSpacing:'0.14em',marginTop:8}}>{progress.failed} failed</div>}
            <button className="cm-btn primary" style={{marginTop:24}} onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Password Modal ───────────────────────────────────────────────────────────
function PasswordModal({ onSuccess, onClose }) {
  const [value, setValue] = useState('');
  const [err, setErr] = useState('');
  const submit = () => {
    if (value === APP_PASSWORD) { onSuccess(); onClose(); }
    else { setErr("Wrong password. Try again."); setValue(''); }
  };
  return (
    <div className="af" onClick={onClose}>
      <div className="af-frame" onClick={e => e.stopPropagation()} style={{maxWidth:380}}>
        <div className="af-hd">
          <h3>Unlock collection</h3>
          <button className="sg-close" onClick={onClose}>×</button>
        </div>
        <div className="af-step">This action is restricted to the collection owner.</div>
        <div className="af-field">
          <label>Password</label>
          <input type="password" value={value} autoFocus
            onChange={e=>{setValue(e.target.value);setErr('');}}
            onKeyDown={e=>e.key==='Enter'&&submit()}
            placeholder="Enter password…"/>
        </div>
        {err && <div className="af-error">{err}</div>}
        <div className="af-footer">
          <button className="cm-btn" onClick={onClose}>Cancel</button>
          <button className="cm-btn primary" style={{flex:2}} onClick={submit}>Unlock</button>
        </div>
      </div>
    </div>
  );
}

// ─── Random Picker ────────────────────────────────────────────────────────────
function RandomPicker({ pool, onOpenFilm }) {
  const [spinning, setSpinning] = useState(false);
  const [shown, setShown] = useState(null);
  const [picked, setPicked] = useState(null);

  const spin = () => {
    if (!pool.length) return;
    setSpinning(true); setPicked(null);
    let count = 0; const max = 18;
    const target = pool[Math.floor(Math.random() * pool.length)];
    const tick = () => {
      const t = pool[Math.floor(Math.random() * pool.length)]; setShown(t); count++;
      if (count >= max) { setShown(target); setPicked(target); setSpinning(false); window.cinemaToast?.(`Tonight: ${target.title}`, { icon: Ico.spark }); }
      else setTimeout(tick, 60 + count * 12);
    };
    tick();
  };

  const film = picked || shown;
  const af = film ? adaptFilm(film) : null;

  return (
    <div className="rp">
      <div className="rp-panel">
        <div className={`rp-reel ${spinning ? 'spinning' : ''}`}>
          {af ? <PosterImg film={af}/> : (
            <div className="rp-reel-placeholder">{Ico.dice}<span>spin</span></div>
          )}
        </div>
        <div className="rp-info">
          <div className="l">Can't decide?</div>
          <h2>{picked ? picked.title : (spinning ? '…' : 'Pick something for me')}</h2>
          {picked ? (
            <>
              <div className="verdict">{picked.director} · {picked.year}{af?.runtime>0?` · ${af.runtime} min`:''}</div>
              <p style={{marginTop:12}}>{picked.plot}</p>
              <div className="actions">
                <button className="cm-btn primary" onClick={() => onOpenFilm(picked)}>Open details</button>
                <button className="cm-btn" onClick={spin}>Try another</button>
              </div>
            </>
          ) : (
            <>
              <p>The projector will pick one film at random from your watchlist of {pool.length}. Use it on indecisive nights.</p>
              <div className="actions">
                <button className="cm-btn primary" onClick={spin} disabled={spinning}>
                  {spinning ? 'Spinning…' : 'Spin'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cinema Stats ─────────────────────────────────────────────────────────────
function CinemaStats({ watchedFilms }) {
  const { byDecade, byGenre, byDirector, byCountry, totalOscars, totalHours, avgRating, bestPicCount } = useStats(watchedFilms);
  const BarChart = ({ rows, label }) => {
    const max = Math.max(...rows.map(r=>r[1]), 1);
    return (
      <div className="cs-card cs-chart" style={{ gridColumn:'span 6' }}>
        <h4>{label}</h4>
        {rows.map(([name,n]) => (
          <div key={name} className="cs-bar-row">
            <span className="name">{name}{label.includes('decade') ? 's' : ''}</span>
            <span className="bar"><span className="fill" style={{ width:`calc(${(n/max)*100}% - 2px)` }}/></span>
            <span className="num">{n}</span>
          </div>
        ))}
        {rows.length === 0 && <div style={{fontFamily:"'Geist Mono',monospace",fontSize:10,color:'var(--ink-soft)',letterSpacing:'0.18em',textTransform:'uppercase'}}>No data yet</div>}
      </div>
    );
  };
  return (
    <div className="cs">
      <div className="cs-card" style={{gridColumn:'span 3'}}>
        <div className="l">Hours</div>
        <div className="v">{totalHours}</div>
        <div className="vu">≈ {Math.round(totalHours/24)} days at the cinema</div>
      </div>
      <div className="cs-card" style={{gridColumn:'span 3'}}>
        <div className="l">Films</div>
        <div className="v">{watchedFilms.length}</div>
        <div className="vu">{byCountry.length} countries represented</div>
      </div>
      <div className="cs-card" style={{gridColumn:'span 3'}}>
        <div className="l">Mean rating</div>
        <div className="v" style={{color:'var(--accent)'}}>{avgRating}</div>
        <div className="vu">IMDb · curated taste</div>
      </div>
      <div className="cs-card cs-osc-card" style={{gridColumn:'span 3'}}>
        <div>
          <div className="l">Oscars won</div>
          <div className="num-big">{totalOscars}</div>
        </div>
        <div style={{flex:1}}>
          <div className="l" style={{marginBottom:6}}>Across {bestPicCount} films</div>
        </div>
      </div>
      <BarChart rows={byDecade} label="By decade"/>
      <BarChart rows={byGenre} label="By genre"/>
      <BarChart rows={byDirector.slice(0,7)} label="Most-watched directors"/>
      <div className="cs-card cs-chart" style={{gridColumn:'span 12'}}>
        <h4>By country of origin</h4>
        <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'8px 32px'}}>
          {byCountry.map(([c,n])=>{
            const max = Math.max(...byCountry.map(r=>r[1]),1);
            return (
              <div key={c} className="cs-bar-row">
                <span className="name">{c}</span>
                <span className="bar"><span className="fill" style={{width:`calc(${(n/max)*100}% - 2px)`}}/></span>
                <span className="num">{n}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ isWatchlist, onAdd, isUnlocked }) {
  return (
    <div className="ce">
      <div className="ce-reel">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="1.2">
          <circle cx="12" cy="12" r="9"/>
          <circle cx="12" cy="12" r="2" fill="var(--ink-soft)" stroke="none"/>
          <circle cx="12" cy="5" r="1.2" fill="var(--ink-soft)" stroke="none"/>
          <circle cx="12" cy="19" r="1.2" fill="var(--ink-soft)" stroke="none"/>
          <circle cx="5" cy="12" r="1.2" fill="var(--ink-soft)" stroke="none"/>
          <circle cx="19" cy="12" r="1.2" fill="var(--ink-soft)" stroke="none"/>
        </svg>
      </div>
      <h2>{isWatchlist ? "The queue is empty." : "The reel hasn't started."}</h2>
      <p>{isWatchlist ? "Add films you want to watch next." : "Start building your personal film archive."}</p>
      {isUnlocked && <button className="cm-btn primary" style={{marginTop:4}} onClick={onAdd}>+ Add your first film</button>}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
function AppInner() {
  // Inject CSS once
  useEffect(() => {
    if (!document.getElementById('cinema-css')) {
      const s = document.createElement('style'); s.id = 'cinema-css';
      s.textContent = CINEMA_CSS; document.head.appendChild(s);
    }
  }, []);

  // Theme — dark/light, persisted in localStorage
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem('mfc_cinema_theme')||'dark'; } catch { return 'dark'; } });
  useEffect(() => {
    try { localStorage.setItem('mfc_cinema_theme', theme); } catch {}
    document.body.classList.add('cine-host');
    if (theme === 'light') document.body.classList.add('light');
    else document.body.classList.remove('light');
  }, [theme]);

  const { films, loading, addFilm, updateFilm, removeFilm, toggleRewatch } = useFilms();

  const [tab, setTab] = useState('watched');
  const [showAdd, setShowAdd] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (!APP_PASSWORD) return true;
    try { return sessionStorage.getItem('mfc_unlocked') === '1'; } catch { return false; }
  });
  const unlock = () => { setIsUnlocked(true); try { sessionStorage.setItem('mfc_unlocked','1'); } catch {} };

  const [search, setSearch] = useState('');
  const [filterDecade, setFilterDecade] = useState('all');
  const [sortBy, setSortBy] = useState('added');
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(1);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [editFilm, setEditFilm] = useState(null);
  const [shareFilm, setShareFilm] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const scrollRef = useRef(0);
  const openFilm = (film) => { scrollRef.current = window.scrollY; setSelectedFilm(film); };
  const closeFilm = () => setSelectedFilm(null);
  useEffect(() => { if (!selectedFilm) window.scrollTo({ top: scrollRef.current, behavior: 'instant' }); }, [selectedFilm]);

  useEffect(() => { setPage(1); }, [tab, search, filterDecade, sortBy]);

  const requireUnlock = (action) => { if (isUnlocked) action(); else { setPendingAction(()=>action); setShowPassword(true); } };
  const handleAddClick = () => requireUnlock(() => setShowAdd(true));
  const handleEdit = (film) => requireUnlock(() => setEditFilm(film));

  const fetchSuggestions = async (tmdbId, basedOn) => {
    setSuggestionsLoading(true);
    try {
      const d = await tmdbFetch(`/movie/${tmdbId}/recommendations`);
      const picks = (d.results||[]).slice(0,6).map(r => ({
        tmdbId: String(r.id), title: r.title,
        year: r.release_date?.slice(0,4)||'?',
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

  const watchedFilms   = films.filter(f => f.list !== 'watchlist');
  const watchlistFilms = films.filter(f => f.list === 'watchlist');

  const recentlyAdded = [...watchedFilms]
    .filter(f => !String(f.id).startsWith('temp_'))
    .sort((a,b) => new Date(b.created_at)-new Date(a.created_at))
    .slice(0,4);

  // All unique decades from watched films
  const allDecades = useMemo(() => {
    const ds = new Set(watchedFilms.map(f => decadeOf(f.year)).filter(d => d !== 'Unknown'));
    return [...ds].sort((a,b) => b-a);
  }, [watchedFilms]);

  const sortFilms = (arr, by) => {
    const a = [...arr];
    if (by === 'added') return a.sort((x,y) => new Date(y.created_at)-new Date(x.created_at));
    if (by === 'title') return a.sort((x,y) => x.title.localeCompare(y.title));
    if (by === 'year')  return a.sort((x,y) => parseInt(y.year)-parseInt(x.year));
    if (by === 'rating') return a.sort((x,y) => parseFloat(y.imdbRating||0)-parseFloat(x.imdbRating||0));
    if (by === 'oscars') return a.sort((x,y) => Number(y.awards)-Number(x.awards));
    return a;
  };

  const filteredWatched = useMemo(() => {
    let list = watchedFilms;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(f => [f.title,f.director,f.actors,f.country,f.genre].some(v=>v?.toLowerCase().includes(q)));
    }
    if (filterDecade !== 'all') list = list.filter(f => decadeOf(f.year) === filterDecade);
    return sortFilms(list, sortBy);
  }, [watchedFilms, search, filterDecade, sortBy]);

  const paginated = filteredWatched.slice(0, page * PAGE_SIZE);
  const hasMore = paginated.length < filteredWatched.length;

  // For modal prev/next
  const activeList = tab === 'watchlist' ? watchlistFilms : filteredWatched;
  const selectedIdx = selectedFilm ? activeList.findIndex(f => f.id === selectedFilm.id) : -1;

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh',
      background:'#14141a', fontFamily:"'Geist Mono',monospace", fontSize:10,
      color:'#5a5448', letterSpacing:'0.3em', textTransform:'uppercase' }}>
      Loading collection…
    </div>
  );

  return (
    <div className={`cine-root page ${theme === 'light' ? 'light' : ''}`}
      style={{ '--cine-accent': '#d4a04a' }}>

      {/* Header */}
      <div className="ch">
        <div className="ch-count">{watchedFilms.length}</div>
        <div className="ch-mid">
          <h1>My Film Collection</h1>
          <div className="sub">{watchedFilms.length} watched · {watchlistFilms.length} on watchlist</div>
        </div>
        <div className="ch-tools">
          {!isUnlocked ? (
            <button className="ch-btn" onClick={() => setShowPassword(true)} title="Unlock">{Ico.lock}</button>
          ) : (
            <div className="ch-pad"><div className="dot"/><span>Unlocked</span></div>
          )}
          <button className="ch-btn" onClick={() => setShowImportExport(true)} title="Import / Export">{Ico.updown}</button>
          <ThemeToggle value={theme} onChange={setTheme}/>
        </div>
      </div>

      {/* Tabs */}
      <div className="ct">
        {[['watched','Watched',watchedFilms.length],['watchlist','Watchlist',watchlistFilms.length],['stats','Stats',0]].map(([id,label,count]) => (
          <button key={id} className={`ct-tab ${tab===id?'on':''}`} onClick={() => setTab(id)}>
            {label}
            {count > 0 && <span className="num">{count}</span>}
          </button>
        ))}
        {isUnlocked && (
          <button className="ct-tab" style={{marginLeft:'auto',color:'var(--accent)'}} onClick={handleAddClick}>
            {Ico.plus} <span style={{marginLeft:6}}>Add film</span>
          </button>
        )}
      </div>

      {/* Watched tab */}
      {tab === 'watched' && (
        <>
          <RecentlyAdded films={recentlyAdded} onSelect={openFilm}/>
          <div className="cf">
            <div className="cf-left">
              <div className="cf-search">
                {Ico.search}
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search films, directors…"/>
              </div>
              <div className="cf-chips">
                <button className={`cf-chip ${filterDecade==='all'?'on':''}`} onClick={()=>setFilterDecade('all')}>All decades</button>
                {allDecades.map(d => (
                  <button key={d} className={`cf-chip ${filterDecade===d?'on':''}`} onClick={()=>setFilterDecade(filterDecade===d?'all':d)}>{d}s</button>
                ))}
              </div>
            </div>
            <div className="cf-right">
              <div className="cf-sort">
                <span>Sort by</span>
                <select value={sortBy} onChange={e=>{setSortBy(e.target.value);setPage(1);}}>
                  <option value="added">Added</option>
                  <option value="title">Title</option>
                  <option value="year">Year</option>
                  <option value="rating">Rating</option>
                  <option value="oscars">Oscars</option>
                </select>
              </div>
              <span className="cf-count">{filteredWatched.length} film{filteredWatched.length!==1?'s':''}</span>
              <div className="cf-view">
                <button className={viewMode==='grid'?'on':''} onClick={()=>setViewMode('grid')}>{Ico.grid}</button>
                <button className={viewMode==='list'?'on':''} onClick={()=>setViewMode('list')}>{Ico.list}</button>
              </div>
            </div>
          </div>

          {filteredWatched.length === 0 ? (
            <EmptyState isWatchlist={false} onAdd={handleAddClick} isUnlocked={isUnlocked}/>
          ) : (
            <div className="cg-wrap">
              <div className={viewMode==='list' ? 'cg d-list' : 'cg d-compact'}>
                {paginated.map(f => <FilmCard key={f.id} film={f} onSelect={openFilm} layout={viewMode==='list'?'list':'classic'}/>)}
              </div>
              {hasMore && (
                <div style={{textAlign:'center',marginTop:24}}>
                  <button className="cm-btn" onClick={()=>setPage(p=>p+1)}>
                    Load more ({filteredWatched.length-paginated.length} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Watchlist tab */}
      {tab === 'watchlist' && (
        <>
          {watchlistFilms.length === 0 ? (
            <EmptyState isWatchlist={true} onAdd={handleAddClick} isUnlocked={isUnlocked}/>
          ) : (
            <>
              <RandomPicker pool={watchlistFilms} onOpenFilm={openFilm}/>
              <div className="wl-wrap">
                <div className="cr" style={{padding:'12px 0 14px'}}>
                  <span className="cr-label">Queued — {watchlistFilms.length} films</span>
                </div>
                <div className="cg d-comfy" style={{gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))'}}>
                  {watchlistFilms.map(f => <FilmCard key={f.id} film={f} onSelect={openFilm}/>)}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Stats tab */}
      {tab === 'stats' && <CinemaStats watchedFilms={watchedFilms}/>}

      {/* Detail modal */}
      {selectedFilm && (
        <CinemaModal
          film={selectedFilm}
          onClose={closeFilm}
          onPrev={selectedIdx > 0 ? () => setSelectedFilm(activeList[selectedIdx-1]) : null}
          onNext={selectedIdx < activeList.length-1 ? () => setSelectedFilm(activeList[selectedIdx+1]) : null}
          onFindSimilar={() => handleFindSimilar(selectedFilm)}
          onShareCard={() => setShareFilm(selectedFilm)}
          onMarkRewatched={() => { toggleRewatch(selectedFilm.id); setSelectedFilm(f => ({...f, rewatched:!f.rewatched})); window.cinemaToast?.(`Rewatched · ${selectedFilm.title}`, { icon: Ico.check }); }}
          onMarkWatched={() => { updateFilm(selectedFilm.id,{list:'watched'}); window.cinemaToast?.(`Moved to watched · ${selectedFilm.title}`, { icon: Ico.check }); closeFilm(); }}
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
          onAdd={handleAdd} onUpdate={updateFilm}
          existingFilms={films} editFilm={editFilm}
        />
      )}

      {suggestions && (
        <SuggestionsSheet
          basedOn={suggestions.basedOn}
          picks={suggestions.picks}
          existingFilms={films}
          onClose={() => setSuggestions(null)}
          onAdd={addFilm}
          showToast={(msg) => window.cinemaToast?.(msg, { icon: Ico.check })}
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