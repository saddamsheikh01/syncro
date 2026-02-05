"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    google?: typeof google;
    initGoogleMaps?: () => void;
  }
}

type LoadStatus = "idle" | "loading" | "loaded" | "error";

let loadStatus: LoadStatus = "idle";
const callbacks: Array<() => void> = [];

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export const useGoogleMapsScript = () => {
  const hasApiKey = GOOGLE_MAPS_API_KEY.length > 0;
  const [isLoaded, setIsLoaded] = useState(loadStatus === "loaded");
  const [errorState, setErrorState] = useState<string | null>(null);

  useEffect(() => {
    if (!hasApiKey) return;
    if (loadStatus === "loaded") return;
    if (loadStatus === "error") return;

    const onLoad = () => {
      setIsLoaded(true);
    };

    callbacks.push(onLoad);

    if (loadStatus === "loading") {
      return () => {
        const index = callbacks.indexOf(onLoad);
        if (index > -1) callbacks.splice(index, 1);
      };
    }

    loadStatus = "loading";

    // Callback globale per quando lo script è caricato
    window.initGoogleMaps = () => {
      loadStatus = "loaded";
      callbacks.forEach((cb) => cb());
      callbacks.length = 0;
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    script.onerror = () => {
      loadStatus = "error";
      setErrorState("Error loading Google Maps");
    };

    document.head.appendChild(script);

    return () => {
      const index = callbacks.indexOf(onLoad);
      if (index > -1) callbacks.splice(index, 1);
    };
  }, [hasApiKey]);

  const error = !hasApiKey
    ? "Google Maps API key is not configured"
    : loadStatus === "error"
      ? "Error loading Google Maps"
      : errorState;

  return { isLoaded, error, google: isLoaded ? window.google : undefined };
};
