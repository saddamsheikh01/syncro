"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useT } from "@/hooks";
import { useGoogleMapsScript } from "@/hooks/useGoogleMapsScript";
import { cx } from "@/lib/classNames";

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  /** City/locality when fetchAddressComponents is used */
  city?: string;
  /** Country when fetchAddressComponents is used */
  country?: string;
  types?: string[];
}

export interface PlacesAutocompleteProps {
  placeholder?: string;
  onPlaceSelect?: (place: PlaceResult) => void;
  onClear?: () => void;
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  // Filtri opzionali
  types?: string[]; // es. ["restaurant", "cafe"]
  componentRestrictions?: { country: string | string[] };
  locationBias?: { lat: number; lng: number; radius: number };
  /** If true, fetches place details for address_components and sets city/country on PlaceResult */
  fetchAddressComponents?: boolean;
  /** Controlled value for display (e.g. "City, Country"); when set, input shows this instead of internal state */
  value?: string;
  /** Called when the user types in the input (e.g. to clear city/country when editing) */
  onInputChange?: (value: string) => void;
}

interface AddressComponent {
  long_name: string;
  types: string[];
}

function parseAddressComponents(
  components: AddressComponent[] | undefined
): { city: string; country: string } {
  let city = "";
  let country = "";
  if (!components?.length) return { city, country };
  for (const c of components) {
    if (c.types.includes("locality")) city = c.long_name;
    else if (c.types.includes("administrative_area_level_1") && !city) city = c.long_name;
    else if (c.types.includes("country")) country = c.long_name;
  }
  return { city, country };
}

export const PlacesAutocomplete = ({
  placeholder,
  onPlaceSelect,
  onClear,
  className,
  defaultValue = "",
  disabled = false,
  types,
  componentRestrictions,
  locationBias,
  fetchAddressComponents = false,
  value,
  onInputChange,
}: PlacesAutocompleteProps) => {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const placesServiceRef = useRef<unknown>(null);
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const { isLoaded, error } = useGoogleMapsScript();
  const [inputValue, setInputValue] = useState(defaultValue);
  const displayValue = value !== undefined ? value : inputValue;
  const effectivePlaceholder = placeholder ?? t("Search for a place...");

  const initAutocomplete = useCallback(() => {
    if (!inputRef.current || !window.google?.maps?.places) return;

    const options: google.maps.places.AutocompleteOptions = {
      fields: ["place_id", "name", "formatted_address", "geometry", "types"],
    };

    if (types && types.length > 0) {
      options.types = types;
    }

    if (componentRestrictions) {
      options.componentRestrictions = componentRestrictions;
    }

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      options
    );

    // Location bias per dare priorità ai risultati vicini
    if (locationBias) {
      const circle = new window.google.maps.Circle({
        center: { lat: locationBias.lat, lng: locationBias.lng },
        radius: locationBias.radius,
      });
      autocompleteRef.current.setBounds(circle.getBounds()!);
    }

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();

      if (!place?.place_id || !place.geometry?.location) {
        return;
      }

      const baseResult: PlaceResult = {
        placeId: place.place_id,
        name: place.name || "",
        address: place.formatted_address || "",
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        types: place.types,
      };

      if (valueRef.current === undefined) {
        setInputValue(place.name || place.formatted_address || "");
      }

      if (fetchAddressComponents && placesServiceRef.current) {
        const service = placesServiceRef.current as {
          getDetails(
            req: { placeId: string; fields: string[] },
            cb: (place: { address_components?: AddressComponent[] } | null, status: string) => void
          ): void;
        };
        service.getDetails(
          {
            placeId: place.place_id,
            fields: ["address_components", "formatted_address"],
          },
          (detailPlace: { address_components?: AddressComponent[] } | null, status: string) => {
            if (status !== "OK" || !detailPlace) {
              onPlaceSelect?.(baseResult);
              return;
            }
            const { city, country } = parseAddressComponents(detailPlace.address_components);
            onPlaceSelect?.({ ...baseResult, city, country });
          }
        );
      } else {
        onPlaceSelect?.(baseResult);
      }
    });
  }, [types, componentRestrictions, locationBias, fetchAddressComponents, onPlaceSelect]);

  useEffect(() => {
    if (value !== undefined) setInputValue(value);
  }, [value]);

  useEffect(() => {
    if (!isLoaded) return;
    if (fetchAddressComponents && mapDivRef.current && window.google?.maps?.places) {
      const g = (window as Window & { google?: { maps?: { places?: { PlacesService?: new (div: HTMLDivElement) => unknown } } } }).google;
      if (g?.maps?.places?.PlacesService && mapDivRef.current) {
        placesServiceRef.current = new g.maps.places.PlacesService(mapDivRef.current);
      }
    }
    initAutocomplete();

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      placesServiceRef.current = null;
    };
  }, [isLoaded, fetchAddressComponents, initAutocomplete]);

  const handleClear = () => {
    setInputValue("");
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
    onClear?.();
  };

  if (error) {
    return (
      <div className={cx("relative", className)}>
        <input
          type="text"
          placeholder={effectivePlaceholder}
          disabled
          className="w-full rounded-[var(--radius-md)] border border-border/70 bg-surface px-4 py-2.5 text-sm text-muted placeholder-subtle outline-none"
        />
        <p className="mt-1 text-xs text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className={cx("relative", className)}>
      {fetchAddressComponents && <div ref={mapDivRef} className="sr-only" aria-hidden />}
      <div className="relative">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder={effectivePlaceholder}
          disabled={disabled || !isLoaded}
          value={displayValue}
          onChange={(e) => {
            const v = e.target.value;
            setInputValue(v);
            onInputChange?.(v);
          }}
          className={cx(
            "w-full rounded-[var(--radius-md)] border border-border/70 bg-surface py-2.5 pl-10 pr-10 text-sm text-foreground placeholder-subtle outline-none transition",
            "focus:border-accent/40 focus:ring-2 focus:ring-accent/20",
            disabled && "cursor-not-allowed opacity-60"
          )}
        />
        {displayValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-surface-muted hover:text-foreground"
            aria-label={t("Clear")}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius-md)] bg-surface/80">
          <span className="text-xs text-muted">{t("Loading...")}</span>
        </div>
      )}
    </div>
  );
};
