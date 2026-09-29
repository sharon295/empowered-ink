"use client";

import { useId, useState } from "react";

const MIN_CHARS = 75;
const MAX_CHARS = 100;

// Cuts at the last word break between 75 and 100 characters, so the preview
// never ends mid-word. Returns null when the text already fits.
export function previewOf(text: string): string | null {
  const clean = text.trim();
  if (clean.length <= MAX_CHARS) return null;
  const window = clean.slice(0, MAX_CHARS + 1);
  const lastSpace = window.lastIndexOf(" ");
  const cut = lastSpace >= MIN_CHARS ? lastSpace : MAX_CHARS;
  return clean.slice(0, cut).replace(/[\s,;:.–—-]+$/, "");
}

// Featured card description: a short preview with "Read more" that expands
// the full text in place.
export default function FeaturedDescription({ text, title }: { text: string; title: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const preview = previewOf(text);

  if (!preview) return <p className="text-[12.5px] leading-snug text-soft">{text.trim()}</p>;

  return (
    <div>
      <p id={id} className="text-[12.5px] leading-snug text-soft">
        {open ? text.trim() : `${preview}…`}
      </p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="mt-0.5 text-[12px] text-brass-text underline decoration-1 underline-offset-4 hover:text-ink"
      >
        {open ? "Show less" : "Read more"}
        <span className="sr-only"> about {title}</span>
      </button>
    </div>
  );
}
