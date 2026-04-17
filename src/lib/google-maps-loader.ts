declare global {
  interface Window {
    google: any;
  }
}

let loadPromise: Promise<typeof window.google> | null = null;

/**
 * Load the Google Maps JS API and the `places` library.
 *
 * Uses the Dynamic Library Import pattern
 * (https://developers.google.com/maps/documentation/javascript/load-maps-js-api):
 * the bootstrap script exposes google.maps.importLibrary(), and
 * libraries are awaited on demand. This avoids the race condition
 * where script.onload fires before libraries are attached when
 * using loading=async.
 */
export function loadGoogleMaps(): Promise<typeof window.google> {
  if (typeof window === "undefined") return Promise.reject("SSR");
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    // NOTE: no `libraries=` param — places is loaded on demand
    // below via importLibrary(). `loading=async` is required for
    // importLibrary to function correctly.
    s.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&loading=async`;
    s.async = true;
    s.defer = true;
    s.dataset.gmapsLoader = "1";
    s.onload = async () => {
      try {
        // Wait for the places library to actually be attached to
        // window.google.maps. importLibrary() is idempotent and
        // resolves immediately on subsequent calls.
        if (typeof window.google?.maps?.importLibrary !== "function") {
          throw new Error("importLibrary unavailable after script load");
        }
        await window.google.maps.importLibrary("places");
        if (!window.google?.maps?.places) {
          throw new Error("Places namespace missing after importLibrary");
        }
        resolve(window.google);
      } catch (err) {
        loadPromise = null;
        reject(err);
      }
    };
    s.onerror = () => {
      loadPromise = null;
      reject(new Error("Script failed"));
    };
    document.head.appendChild(s);
  });
  return loadPromise;
}
