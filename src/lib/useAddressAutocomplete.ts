import { useEffect, useRef, type RefObject } from "react";
import { loadGoogleMaps } from "./google-maps-loader";

export type AddressFields = {
  rue: string;
  numero: string;
  codePostal: string;
  commune: string;
};

export function useAddressAutocomplete(
  inputRef: RefObject<HTMLInputElement | null>,
  onSelect: (f: AddressFields) => void,
  enabled: boolean = true,
) {
  const instanceRef = useRef<any>(null);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let listener: any = null;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !inputRef.current) return;
        // Si l'input est remonté, recréer l'instance
        if (instanceRef.current?._input === inputRef.current) return;

        const ac = new google.maps.places.Autocomplete(inputRef.current, {
          types: ["address"],
          componentRestrictions: { country: "be" },
          fields: ["address_components", "formatted_address"],
        });
        listener = ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          if (!place.address_components) return;
          const get = (t: string) =>
            place.address_components?.find((c: any) => c.types.includes(t))?.long_name ?? "";
          onSelect({
            rue: get("route"),
            numero: get("street_number"),
            codePostal: get("postal_code"),
            commune: get("locality"),
          });
        });
        instanceRef.current = ac;
        instanceRef.current._input = inputRef.current;
      })
      .catch((err) => console.error("[Maps]", err));

    return () => {
      cancelled = true;
      if (listener && window.google?.maps?.event) {
        window.google.maps.event.removeListener(listener);
      }
      if (instanceRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(instanceRef.current);
      }
      instanceRef.current = null;
    };
  }, [enabled, inputRef, onSelect]);
}
