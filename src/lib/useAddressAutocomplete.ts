import { useEffect, useRef, type RefObject } from "react";
import { loadGoogleMaps } from "./google-maps-loader";

export type AddressFields = {
  rue: string;
  numero: string;
  codePostal: string;
  commune: string;
};

// TODO: migrer vers google.maps.places.PlaceAutocompleteElement (Autocomplete est legacy / déprécié).
export function useAddressAutocomplete(
  inputRef: RefObject<HTMLInputElement | null>,
  onSelect: (f: AddressFields) => void,
  enabled: boolean = true,
) {
  const instanceRef = useRef<any>(null);
  const listenerRef = useRef<any>(null);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const destroy = () => {
      if (listenerRef.current && window.google?.maps?.event) {
        window.google.maps.event.removeListener(listenerRef.current);
      }
      listenerRef.current = null;
      if (instanceRef.current && window.google?.maps?.event) {
        window.google.maps.event.clearInstanceListeners(instanceRef.current);
      }
      instanceRef.current = null;
    };

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !inputRef.current) return;
        destroy();

        const ac = new google.maps.places.Autocomplete(inputRef.current, {
          types: ["address"],
          componentRestrictions: { country: "be" },
          fields: ["address_components", "formatted_address"],
        });
        listenerRef.current = ac.addListener("place_changed", () => {
          const place = ac.getPlace();
          if (!place.address_components) return;
          const get = (t: string) =>
            place.address_components?.find((c: any) => c.types.includes(t))?.long_name ?? "";
          onSelectRef.current({
            rue: get("route"),
            numero: get("street_number"),
            codePostal: get("postal_code"),
            commune: get("locality"),
          });
        });
        instanceRef.current = ac;
      })
      .catch((err) => console.error("[Maps]", err));

    return () => {
      cancelled = true;
      destroy();
    };
  }, [enabled, inputRef]);
}
