/**
 * fullscreen api polyfill
 * Adapted from https://shaka-player-demo.appspot.com/docs/api/lib_polyfill_fullscreen.js.html
 * @author Chris Ferdinandi
 * @license MIT
 */
(() => {
  if (window.Document && window.document) {
    // eslint-disable-next-line no-restricted-syntax
    let proto = Element.prototype;
    proto.requestFullscreen =
      proto.requestFullscreen ||
      proto.mozRequestFullScreen ||
      proto.msRequestFullscreen ||
      proto.webkitRequestFullscreen;

    // eslint-disable-next-line no-restricted-syntax
    proto = Document.prototype;
    proto.exitFullscreen =
      proto.exitFullscreen ||
      proto.mozCancelFullScreen ||
      proto.msExitFullscreen ||
      proto.webkitCancelFullScreen;

    if (!("fullscreenElement" in document)) {
      Object.defineProperty(document, "fullscreenElement", {
        get: () => {
          return (
            document.mozFullScreenElement ||
            document.msFullscreenElement ||
            document.webkitCurrentFullScreenElement ||
            document.webkitFullscreenElement
          );
        }
      });
      Object.defineProperty(document, "fullscreenEnabled", {
        get: () => {
          return (
            document.mozFullScreenEnabled ||
            document.msFullscreenEnabled ||
            document.webkitFullscreenEnabled
          );
        }
      });
    }
    const proxy = event => {
      event.target.dispatchEvent(
        new CustomEvent(
          event.type.replace(/^(webkit|moz|MS)/, "").toLowerCase(),
          {
            bubbles: event.bubbles,
            cancelable: event.cancelable
          }
        )
      );
    };

    document.addEventListener("webkitfullscreenchange", proxy);
    document.addEventListener("webkitfullscreenerror", proxy);
    document.addEventListener("mozfullscreenchange", proxy);
    document.addEventListener("mozfullscreenerror", proxy);
    document.addEventListener("MSFullscreenChange", proxy);
    document.addEventListener("MSFullscreenError", proxy);
  }
})();
