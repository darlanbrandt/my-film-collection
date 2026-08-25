import React, { useState } from "react";
import { APP_PASSWORD } from "../lib/constants.js";

const LockIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7.5a4 4 0 0 1 8 0V11"/>
  </svg>
);
const EyeIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

export function PasswordModal({ onSuccess, onClose, isMobile }) {
  const [value, setValue] = useState('');
  const [err,   setErr]   = useState('');
  const [show,  setShow]  = useState(false);
  const [stay,  setStay]  = useState(true);

  const submit = () => {
    if (value === APP_PASSWORD) { onSuccess(isMobile ? stay : false); onClose(); }
    else { setErr("Wrong password. Try again."); setValue(''); }
  };

  // Mobile: a bottom sheet matching the redesigned unlock flow.
  if (isMobile) {
    return (
      <div className="msheet pwsheet" onClick={onClose}>
        <div className="msheet-panel" onClick={e => e.stopPropagation()}>
          <div className="msheet-grab"/>
          <div className="pw-body">
            <div className="pw-lock">{LockIcon}</div>
            <h3 className="pw-title">Unlock editing</h3>
            <p className="pw-sub">Browsing stays open. The password is only needed to add, edit or remove films.</p>
            <div className="pw-input">
              <input type={show ? 'text' : 'password'} value={value} autoFocus
                onChange={e => { setValue(e.target.value); setErr(''); }}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="Password…"/>
              <button className="pw-eye" onClick={() => setShow(s => !s)} aria-label="Toggle visibility">{EyeIcon}</button>
            </div>
            {err && <div className="af-error" style={{ marginTop: 10 }}>{err}</div>}
            <button className="pw-unlock" onClick={submit}>Unlock</button>
            <button className={`pw-stay ${stay ? 'on' : ''}`} onClick={() => setStay(s => !s)}>
              <span className="pw-switch"><span/></span>
              Stay unlocked on this phone
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="af" onClick={onClose}>
      <div className="af-frame" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="af-hd">
          <h3>Unlock collection</h3>
          <button className="sg-close" onClick={onClose}>×</button>
        </div>
        <div className="af-step">This action is restricted to the collection owner.</div>
        <div className="af-field">
          <label>Password</label>
          <input type="password" value={value} autoFocus
            onChange={e => { setValue(e.target.value); setErr(''); }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="Enter password…"/>
        </div>
        {err && <div className="af-error">{err}</div>}
        <div className="af-footer">
          <button className="cm-btn" onClick={onClose}>Cancel</button>
          <button className="cm-btn primary" style={{ flex: 2 }} onClick={submit}>Unlock</button>
        </div>
      </div>
    </div>
  );
}
