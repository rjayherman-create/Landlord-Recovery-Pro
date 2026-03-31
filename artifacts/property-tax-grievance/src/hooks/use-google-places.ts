import { useEffect, useRef } from "react";

interface PlaceResult {
  address: string;
  county: string;
  state: string;
}

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined;

function loadMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.maps?.places) { resolve(); return; }
    if (document.getElementById("gmap-script")) {
      const existing = document.getElementById("gmap-script")!;
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.id = "gmap-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export function useGooglePlaces(
  onSelect: (result: PlaceResult) => void
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    if (!MAPS_KEY) return;

    loadMapsScript().then(() => {
      if (!inputRef.current) return;
      const g = (window as any).google;
      if (!g?.maps?.places) return;

      autocompleteRef.current = new g.maps.places.Autocomplete(
        inputRef.current,
        { types: ["address"], componentRestrictions: { country: "us" } }
      );

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        if (!place?.address_components) return;

        const formatted = place.formatted_address ?? "";
        let county = "";
        let state = "";

        place.address_components.forEach((c: any) => {
          if (c.types.includes("administrative_area_level_2")) county = c.long_name;
          if (c.types.includes("administrative_area_level_1")) state = c.short_name;
        });

        onSelect({ address: formatted, county, state });
      });
    }).catch(() => {});

    return () => {
      if (autocompleteRef.current) {
        (window as any).google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  return { inputRef, isEnabled: !!MAPS_KEY };
}
