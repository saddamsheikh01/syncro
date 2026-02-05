"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useGoogleMapsScript } from "@/hooks/useGoogleMapsScript";
import { cx } from "@/lib/classNames";

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
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
}

export const PlacesAutocomplete = ({
  placeholder = "Search for a place...",
  onPlaceSelect,
  onClear,
  className,
  defaultValue = "",
  disabled = false,
  types,
  componentRestrictions,
  locationBias,
}: PlacesAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded, error } = useGoogleMapsScript();
  const [inputValue, setInputValue] = useState(defaultValue);

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

      const result: PlaceResult = {
        placeId: place.place_id,
        name: place.name || "",
        address: place.formatted_address || "",
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        types: place.types,
      };

      setInputValue(place.name || place.formatted_address || "");
      onPlaceSelect?.(result);
    });
  }, [types, componentRestrictions, locationBias, onPlaceSelect]);

  useEffect(() => {
    if (isLoaded) {
      initAutocomplete();
    }

    return () => {
      if (autocompleteRef.current) {
        window.google?.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, initAutocomplete]);

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
          placeholder={placeholder}
          disabled
          className="w-full rounded-[var(--radius-md)] border border-border/70 bg-surface px-4 py-2.5 text-sm text-muted placeholder-subtle outline-none"
        />
        <p className="mt-1 text-xs text-danger">{error}</p>
      </div>
    );
  }

  return (
    <div className={cx("relative", className)}>
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
          placeholder={placeholder}
          disabled={disabled || !isLoaded}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className={cx(
            "w-full rounded-[var(--radius-md)] border border-border/70 bg-surface py-2.5 pl-10 pr-10 text-sm text-foreground placeholder-subtle outline-none transition",
            "focus:border-accent/40 focus:ring-2 focus:ring-accent/20",
            disabled && "cursor-not-allowed opacity-60"
          )}
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted hover:bg-surface-muted hover:text-foreground"
            aria-label="Clear"
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
          <span className="text-xs text-muted">Loading...</span>
        </div>
      )}
    </div>
  );
};
