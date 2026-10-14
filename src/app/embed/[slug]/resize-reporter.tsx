"use client";

import { useEffect } from "react";

/** Tells the parent page (widget.js) how tall the widget is, so the iframe fits without scrolling. */
export function ResizeReporter() {
  useEffect(() => {
    const el = document.getElementById("menuva-embed");
    if (!el || window.parent === window) return;
    const send = () => window.parent.postMessage({ menuva: true, height: el.scrollHeight }, "*");
    const ro = new ResizeObserver(send);
    ro.observe(el);
    send();
    return () => ro.disconnect();
  }, []);
  return null;
}
