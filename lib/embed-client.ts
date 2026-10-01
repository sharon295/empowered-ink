"use client";

// Messages between the directory (inside an iframe) and public/embed.js on the
// host page. The iframe is sized to its full content, so it never scrolls
// itself: the host page reports where the iframe sits in its viewport, and the
// directory uses that for continuous scroll and "Back to top".

export type HostViewport = {
  iframeTop: number; // iframe's top edge relative to the host viewport (negative once scrolled past)
  viewportHeight: number;
  // The iframe's current height on the host page; null from older embed.js.
  frameHeight: number | null;
};

const SOURCE = "empowered-ink";
const HOST_SOURCE = "empowered-ink-host";

let latest: HostViewport | null = null;
const listeners = new Set<(v: HostViewport) => void>();
let listening = false;

function ensureListening() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.source !== HOST_SOURCE || data.type !== "viewport") return;
    if (event.source !== window.parent) return;
    latest = {
      iframeTop: Number(data.iframeTop) || 0,
      viewportHeight: Number(data.viewportHeight) || 0,
      frameHeight: typeof data.frameHeight === "number" ? data.frameHeight : null,
    };
    for (const fn of listeners) fn(latest);
  });
}

export function isEmbedded(): boolean {
  return typeof window !== "undefined" && window.parent !== window;
}

export function hostViewport(): HostViewport | null {
  return latest;
}

export function onHostViewport(fn: (v: HostViewport) => void): () => void {
  ensureListening();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function postToHost(type: string, payload: Record<string, unknown> = {}) {
  if (!isEmbedded()) return;
  window.parent.postMessage({ source: SOURCE, type, ...payload }, "*");
}

// Scrolls so the element's top is at the top of the reader's screen, whether
// or not the directory is embedded.
export function scrollToElement(el: HTMLElement, offset = 16) {
  const top = el.getBoundingClientRect().top + window.scrollY - offset;
  if (isEmbedded() && latest) postToHost("scroll-to", { top });
  else window.scrollTo({ top, behavior: "smooth" });
}
