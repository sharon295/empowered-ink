"use client";

import { useEffect } from "react";
import { isEmbedded, postToHost } from "@/lib/embed-client";

// When shown inside an iframe, tells the host page how tall the content is so
// the iframe fits it with no inner scrollbar (same approach as the member
// directory). Measures #ei-root rather than <body>, which stretches to at
// least the iframe's current height.
export default function EmbedResizer() {
  useEffect(() => {
    if (!isEmbedded()) return;
    const root = document.getElementById("ei-root");
    if (!root) return;

    let last = 0;
    const send = () => {
      const height = Math.ceil(root.getBoundingClientRect().bottom + window.scrollY);
      if (height === last) return;
      last = height;
      postToHost("height", { height });
    };

    send();
    const observer = new ResizeObserver(send);
    observer.observe(root);
    window.addEventListener("load", send);
    return () => {
      observer.disconnect();
      window.removeEventListener("load", send);
    };
  }, []);

  return null;
}
