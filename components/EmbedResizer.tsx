"use client";

import { useEffect } from "react";
import { isEmbedded, onHostViewport, postToHost } from "@/lib/embed-client";

// When shown inside an iframe, tells the host page how tall the content is so
// the iframe fits it with no inner scrollbar (same approach as the member
// directory). Measures #ei-root rather than <body>, which stretches to at
// least the iframe's current height.
//
// The host script (public/embed.js) may start listening before or after this
// page renders, so a single height message isn't enough: whenever the host
// reports an iframe height that doesn't match the content, the height is sent
// again. That keeps the two in step whichever side loads first.
export default function EmbedResizer() {
  useEffect(() => {
    if (!isEmbedded()) return;
    const root = document.getElementById("ei-root");
    if (!root) return;

    const contentHeight = () => Math.ceil(root.getBoundingClientRect().bottom + window.scrollY);

    let last = 0;
    const send = (force = false) => {
      const height = contentHeight();
      if (!force && height === last) return;
      last = height;
      postToHost("height", { height });
    };

    let heardFromHost = false;
    let lastResend = 0;
    const offHost = onHostViewport((host) => {
      const firstMessage = !heardFromHost;
      heardFromHost = true;
      // The host sizes the iframe to the content, so the iframe never needs
      // a scrollbar of its own.
      document.documentElement.style.overflowY = "hidden";
      const mismatch = host.frameHeight !== null && Math.abs(host.frameHeight - contentHeight()) > 1;
      const now = Date.now();
      if ((firstMessage || mismatch) && now - lastResend > 250) {
        lastResend = now;
        send(true);
      }
    });

    send();
    const observer = new ResizeObserver(() => send());
    observer.observe(root);
    const onLoad = () => send();
    window.addEventListener("load", onLoad);
    return () => {
      observer.disconnect();
      offHost();
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return null;
}
