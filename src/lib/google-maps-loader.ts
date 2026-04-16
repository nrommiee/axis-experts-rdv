declare global {
  interface Window {
    google: any;
  }
}

let loadPromise: Promise<typeof window.google> | null = null;

export function loadGoogleMaps(): Promise<typeof window.google> {
  if (typeof window === "undefined") return Promise.reject("SSR");
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
    s.async = true;
    s.defer = true;
    s.dataset.gmapsLoader = "1";
    s.onload = () => {
      if (window.google?.maps?.places) resolve(window.google);
      else {
        loadPromise = null;
        reject(new Error("Places API missing"));
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
