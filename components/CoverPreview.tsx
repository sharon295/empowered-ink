"use client";

import { useEffect, useState } from "react";

// Covers are shown in a 2:3 portrait frame everywhere on the directory.
export const COVER_WIDTH = 1200;
export const COVER_HEIGHT = 1800;
export const COVER_MIN_WIDTH = 600;
export const COVER_MIN_HEIGHT = 900;
export const COVER_SIZE_HINT = `JPG or PNG. Best size: ${COVER_WIDTH} × ${COVER_HEIGHT} pixels (portrait, 2:3 ratio — the shape of a standard book cover). At least ${COVER_MIN_WIDTH} × ${COVER_MIN_HEIGHT}.`;

type Size = { width: number; height: number };

// Shows the chosen cover exactly as the directory will frame it, and says so
// plainly if the image is a different shape (it is cropped to fit) or small
// enough to look blurry. Never blocks the upload.
export default function CoverPreview({ file }: { file: File | null }) {
  const [url, setUrl] = useState<string | null>(null);
  const [size, setSize] = useState<Size | null>(null);

  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setUrl(objectUrl);
      setSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = objectUrl;
    return () => {
      URL.revokeObjectURL(objectUrl);
      setUrl(null);
      setSize(null);
    };
  }, [file]);

  if (!file || !url || !size) return null;

  const ratio = size.width / size.height;
  const offShape = Math.abs(ratio - 2 / 3) > 0.04;
  const tooSmall = size.width < COVER_MIN_WIDTH || size.height < COVER_MIN_HEIGHT;

  return (
    <div className="mt-3 flex items-start gap-4">
      <div className="aspect-[2/3] w-24 shrink-0 overflow-hidden border border-hairline bg-cover">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="How your cover will appear" className="h-full w-full object-cover" />
      </div>
      <div className="text-[12.5px] leading-snug text-soft" aria-live="polite">
        <p>
          This is how your cover will appear. Your image is {size.width} × {size.height} pixels.
        </p>
        {offShape && (
          <p className="mt-1.5 text-brass-text">
            It isn&rsquo;t the 2:3 cover shape, so the {ratio > 2 / 3 ? "sides" : "top and bottom"} are trimmed to
            fit. For the whole cover to show, upload an image that is {COVER_WIDTH} × {COVER_HEIGHT} pixels.
          </p>
        )}
        {tooSmall && (
          <p className="mt-1.5 text-brass-text">
            It is smaller than {COVER_MIN_WIDTH} × {COVER_MIN_HEIGHT}, so it may look blurry. A larger image will
            look sharper.
          </p>
        )}
        {!offShape && !tooSmall && <p className="mt-1.5">That&rsquo;s the right shape and size.</p>}
      </div>
    </div>
  );
}
