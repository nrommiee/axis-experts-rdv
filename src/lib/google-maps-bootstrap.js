/* eslint-disable */
// Google Maps JavaScript API inline bootstrap snippet.
// Source: https://developers.google.com/maps/documentation/javascript/load-maps-js-api
//
// This snippet defines window.google.maps.importLibrary synchronously
// as a stub that buffers calls until the real script loads. Calling
// importLibrary("places") is safe regardless of the actual script
// load state — subsequent calls are replayed once the script is ready.
//
// We keep the minified form intentionally: it's Google's recommended
// copy-paste. Do not refactor.
export function installGoogleMapsBootstrap(config) {
  ((g) => {
    var h, a, k, p = "The Google Maps JavaScript API",
        c = "google", l = "importLibrary", q = "__ib__",
        m = document, b = window;
    b = b[c] || (b[c] = {});
    var d = b.maps || (b.maps = {}),
        r = new Set(),
        e = new URLSearchParams(),
        u = () => h || (h = new Promise(async (f, n) => {
          await (a = m.createElement("script"));
          e.set("libraries", [...r] + "");
          for (k in g) e.set(
            k.replace(/[A-Z]/g, (t) => "_" + t[0].toLowerCase()),
            g[k]
          );
          e.set("callback", c + ".maps." + q);
          a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
          d[q] = f;
          a.onerror = () => h = n(Error(p + " could not load."));
          a.nonce = m.querySelector("script[nonce]")?.nonce || "";
          m.head.append(a);
        }));
    d[l]
      ? console.warn(p + " only loads once. Ignoring:", g)
      : d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n));
  })(config);
}
