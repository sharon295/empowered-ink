/*
 * Empowered Ink embed helper, for the host (magazine) page.
 *
 *   <iframe id="empowered-ink" src="https://YOUR-APP/empowered-ink"
 *           title="Empowered Ink book directory"
 *           style="display:block;width:100%;border:0;min-height:900px"></iframe>
 *   <script src="https://YOUR-APP/embed.js" defer></script>
 *
 * - sizes the iframe to its content (no inner scrollbar)
 * - tells the directory where it sits on screen, for continuous scroll and
 *   "Back to top"
 * - keeps ?q= and ?category= in this page's address bar, so searches can be
 *   shared, and passes them into the directory on load
 * - returns the reader to the same place when they come back with Back
 */
(function () {
  var frame = document.getElementById("empowered-ink");
  if (!frame) return;

  var appOrigin;
  try {
    appOrigin = new URL(frame.src, location.href).origin;
  } catch {
    return;
  }
  var SCROLL_KEY = "ei-host-scroll:" + location.pathname;

  // Pass this page's search into the directory.
  var here = new URLSearchParams(location.search);
  if (here.get("q") || here.get("category")) {
    var src = new URL(frame.src, location.href);
    ["q", "category"].forEach(function (k) {
      if (here.get(k)) src.searchParams.set(k, here.get(k));
    });
    frame.src = src.toString();
  }

  function sendViewport() {
    if (!frame.contentWindow) return;
    var rect = frame.getBoundingClientRect();
    frame.contentWindow.postMessage(
      { source: "empowered-ink-host", type: "viewport", iframeTop: rect.top, viewportHeight: window.innerHeight },
      appOrigin
    );
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      sendViewport();
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  frame.addEventListener("load", sendViewport);

  var savedScroll = null;
  try {
    savedScroll = sessionStorage.getItem(SCROLL_KEY);
    sessionStorage.removeItem(SCROLL_KEY);
  } catch {}
  window.addEventListener("pagehide", function () {
    try {
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    } catch {}
  });

  window.addEventListener("message", function (event) {
    if (event.origin !== appOrigin || event.source !== frame.contentWindow) return;
    var data = event.data || {};
    if (data.source !== "empowered-ink") return;

    if (data.type === "height" && data.height > 0) {
      frame.style.height = data.height + "px";
      frame.style.minHeight = "0";
      if (savedScroll !== null && document.documentElement.scrollHeight >= Number(savedScroll)) {
        window.scrollTo(0, Number(savedScroll));
        savedScroll = null;
      }
      sendViewport();
    } else if (data.type === "scroll-to") {
      var top = frame.getBoundingClientRect().top + window.scrollY + (Number(data.top) || 0) - 16;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    } else if (data.type === "state") {
      var url = new URL(location.href);
      ["q", "category"].forEach(function (k) {
        if (data[k]) url.searchParams.set(k, data[k]);
        else url.searchParams.delete(k);
      });
      history.replaceState(history.state, "", url);
    }
  });
})();
