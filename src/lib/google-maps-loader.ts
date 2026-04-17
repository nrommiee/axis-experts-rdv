import { installGoogleMapsBootstrap } from "./google-maps-bootstrap.js";

declare global {
  interface Window {
    google: any;
  }
}

let loadPromise: Promise<typeof window.google> | null = null;

/**
 * Load the Google Maps JS API and the `places` library.
 *
 * Uses Google's official inline bootstrap snippet, isolated in
 * google-maps-bootstrap.js to avoid TS strict-mode issues. The snippet
 * defines window.google.maps.importLibrary synchronously as a stub
 * that buffers calls until the real script loads.
 *
 * Call sites don't need to care about timing — importLibrary("places")
 * resolves when the library is actually ready, whether the script has
 * started loading or not.
 *
 * https://developers.google.com/maps/documentation/javascript/load-maps-js-api
 */
export function loadGoogleMaps(): Promise<typeof window.google> {
  if (typeof window === "undefined") return Promise.reject("SSR");

  // Fast path: places library already attached (HMR, navigation,
  // previous load).
  if (window.google?.maps?.places) return Promise.resolve(window.google);

  // Concurrent callers at the same tick share the same promise.
  if (loadPromise) return loadPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY missing"));
  }

  loadPromise = new Promise((resolve, reject) => {
    try {
      // Install the bootstrap stub if not already present. Idempotent:
      // the snippet itself warns and no-ops if called twice.
      if (!window.google?.maps?.importLibrary) {
        installGoogleMapsBootstrap({ key: apiKey, v: "weekly" });
      }

      // Awaiting importLibrary("places") triggers the actual script
      // load (if not started) and resolves when places is attached.
      window.google.maps
        .importLibrary("places")
        .then(() => {
          if (!window.google?.maps?.places) {
            throw new Error("Places namespace missing after importLibrary");
          }
          resolve(window.google);
        })
        .catch((err: unknown) => {
          loadPromise = null;
          reject(err);
        });
    } catch (err) {
      loadPromise = null;
      reject(err);
    }
  });

  return loadPromise;
}
