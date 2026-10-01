"use client";

import { useEffect, useState } from "react";

// Covers are shown in a 2:3 portrait frame everywhere on the directory.
export const COVER_WIDTH = 1200;
export const COVER_HEIGHT = 1800;
export const COVER_SIZE_HINT = `Front cover only — no 3D mockups, spines, back covers or photos of the book. It must be ${COVER_WIDTH} × ${COVER_HEIGHT} pixels (portrait), JPG or PNG.`;
// Shown to authors only.
export const COVER_APPROVAL_RULE = "Listings that don’t follow these image instructions will not be approved.";

type Size = { width: number; height: number };

// Shows the chosen cover exactly as the directory will frame it and says
// plainly whether it meets the required size. It never blocks the upload:
// the owner makes the final call when approving. `forAuthor` adds the
// "will not be approved" wording used on the public form.
export default function CoverPreview({ file, forAuthor = false }: { file: File | null; forAuthor?: boolean }) {
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
  const rightShape = Math.abs(ratio - COVER_WIDTH / COVER_HEIGHT) <= 0.02;
  const bigEnough = size.width >= COVER_WIDTH && size.height >= COVER_HEIGHT;
  const meetsRule = rightShape && bigEnough;

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
        {meetsRule ? (
          <p className="mt-1.5">That&rsquo;s the right size.</p>
        ) : (
          <p className="mt-1.5 font-medium text-red-700">
            {rightShape
              ? `It is smaller than the required ${COVER_WIDTH} × ${COVER_HEIGHT} pixels.`
              : `It is not the required ${COVER_WIDTH} × ${COVER_HEIGHT} pixels, so the ${
                  ratio > COVER_WIDTH / COVER_HEIGHT ? "sides" : "top and bottom"
                } would be trimmed.`}{" "}
            {forAuthor
              ? "Please upload the front cover at the required size, or your listing will not be approved."
              : "Replace it with a front cover at the required size."}
          </p>
        )}
      </div>
    </div>
  );
}
