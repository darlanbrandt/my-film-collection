import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";

/**
 * SettingsPopover — floating card with Theme + Surface controls.
 *
 * Portalled to <body> with position:fixed so it escapes EVERY stacking context
 * (parent transforms / backdrop-filters / contain: layout, etc.). A full-page
 * scrim sits behind the popover catching outside clicks; in glass/liquid modes
 * the scrim applies a backdrop-filter blur to fade the page underneath.
 *
 * Props:
 *   open, onClose          — visibility control
 *   anchorRef              — ref to the trigger button (used to position popover under it)
 *   theme, onThemeChange   — 'dark' | 'light'
 *   surface, onSurfaceChange — 'neumorphic' | 'glass' | 'liquid' | 'neon' | 'clay'
 *
 * The Design-language row uses a grid layout once >3 options are defined so the
 * pills wrap to a 3×N grid instead of being squeezed onto one line.
 */
export function SettingsPopover({
  open, onClose,
  anchorRef,
  theme, onThemeChange,
  surface, onSurfaceChange,
}) {
  const [pos, setPos] = useState({ top: 60, right: 36 });
  const popRef = useRef(null);

  // Compute popover position from the anchor button's viewport rect.
  // Re-measure each time it opens so it follows the button after layout shifts.
  useEffect(() => {
    if (!open) return;
    const el = anchorRef?.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setPos({
        top: Math.round(r.bottom + 10),
        right: Math.round(window.innerWidth - r.right),
      });
    }
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const SURFACES = [
    { id: 'neumorphic', label: 'Cinéma' },
    { id: 'glass',      label: 'Glass' },
    { id: 'liquid',     label: 'iOS 26' },
    { id: 'neon',       label: 'Neon' },
    { id: 'clay',       label: 'Clay' },
  ];
  const surfaceSegClass = SURFACES.length > 3 ? 'sp-seg sp-seg--grid' : 'sp-seg';

  // Mirror theme + surface onto the portal wrapper so the popover's CSS
  // (keyed off `.sp-portal.sp-s-*` / `.sp-t-*`) applies even though it's
  // rendered outside the .cine-root tree.
  return ReactDOM.createPortal(
    <div className={`sp-portal sp-t-${theme} sp-s-${surface}`}>
      <div className="sp-scrim" onClick={onClose} aria-hidden="true" />
      <div
        ref={popRef}
        className="sp-popover"
        style={{ top: pos.top, right: pos.right }}
        role="dialog"
        aria-label="Settings">
        <button
          className="sp-close"
          onClick={onClose}
          aria-label="Close settings">×</button>

        <div className="sp-row">
          <div className="sp-label">Appearance</div>
          <div className="sp-seg" role="radiogroup" aria-label="Theme">
            {['light', 'dark'].map(t => (
              <button
                key={t}
                role="radio"
                aria-checked={theme === t}
                className={`sp-seg-opt ${theme === t ? 'on' : ''}`}
                onClick={() => onThemeChange(t)}>
                {t === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
        </div>

        <div className="sp-row">
          <div className="sp-label">Design language</div>
          <div className={surfaceSegClass} role="radiogroup" aria-label="Surface">
            {SURFACES.map(s => (
              <button
                key={s.id}
                role="radio"
                aria-checked={surface === s.id}
                className={`sp-seg-opt ${surface === s.id ? 'on' : ''}`}
                onClick={() => onSurfaceChange(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
