import { useState, useEffect } from "react";

// Tracks whether the viewport is phone-sized so the UI can swap in the mobile
// layout (bottom nav, sheets, full-bleed detail) without touching desktop.
export function useIsMobile(query = "(max-width: 640px)") {
  const get = () =>
    typeof window !== "undefined" && window.matchMedia(query).matches;
  const [isMobile, setIsMobile] = useState(get);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    onChange();
    return () => mq.removeEventListener("change", onChange);
  }, [query]);

  return isMobile;
}
