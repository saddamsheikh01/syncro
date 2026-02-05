"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useGoogleMapsScript } from "@/hooks/useGoogleMapsScript";
import type { PlaceSummaryResponse } from "@/types/catalog";
import { cx } from "@/lib/classNames";
import { Loader } from "@/components/elements/Loader";

const DEFAULT_CENTER = { lat: 41.9028, lng: 12.4964 }; // Roma
const DEFAULT_ZOOM = 6;
const FOCUSED_ZOOM = 14;

export interface GoogleMapContainerProps {
  places: PlaceSummaryResponse[];
  userPosition?: { latitude: number; longitude: number } | null;
  selectedPlaceId?: string | null;
  onPlaceSelect?: (place: PlaceSummaryResponse) => void;
  recenterTrigger?: number;
  className?: string;
}

export const GoogleMapContainer = ({
  places,
  userPosition,
  selectedPlaceId,
  onPlaceSelect,
  recenterTrigger,
  className,
}: GoogleMapContainerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map());
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const prevRecenterTriggerRef = useRef(recenterTrigger ?? 0);
  const prevPlacesKeyRef = useRef("");

  const { isLoaded, error } = useGoogleMapsScript();
  const [mapReady, setMapReady] = useState(false);

  // Filtra luoghi con coordinate valide
  const validPlaces = useMemo(
    () => places.filter((p) => p.latitude !== null && p.longitude !== null),
    [places]
  );
  const placesKey = useMemo(() => {
    if (validPlaces.length === 0) return "";
    const ids = validPlaces.slice(0, 5).map((p) => p.id).join(",");
    return `${ids}:${validPlaces.length}`;
  }, [validPlaces]);

  // Inizializza la mappa
  useEffect(() => {
    if (!isLoaded || !mapRef.current || googleMapRef.current) return;

    const initMap = async () => {
      const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;

      const center = userPosition
        ? { lat: userPosition.latitude, lng: userPosition.longitude }
        : DEFAULT_CENTER;

      googleMapRef.current = new Map(mapRef.current!, {
        center,
        zoom: userPosition ? FOCUSED_ZOOM : DEFAULT_ZOOM,
        mapId: "syncro-map",
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: "greedy",
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      setMapReady(true);
    };

    initMap();
  }, [isLoaded, userPosition]);

  // Crea marker per un luogo
  const createPlaceMarker = useCallback(
    async (place: PlaceSummaryResponse, isSelected: boolean) => {
      if (
        !googleMapRef.current ||
        place.latitude === null ||
        place.longitude === null
      ) {
        return null;
      }

      const { AdvancedMarkerElement } = await google.maps.importLibrary(
        "marker"
      ) as google.maps.MarkerLibrary;

      const markerContent = document.createElement("div");
      markerContent.innerHTML = `
        <div style="
          width: ${isSelected ? 44 : 36}px;
          height: ${isSelected ? 44 : 36}px;
          background: ${isSelected ? "#2f66f6" : "#ffffff"};
          border: ${isSelected ? "3px solid white" : "2px solid #e3e5ea"};
          border-radius: 12px;
          box-shadow: ${isSelected ? "0 4px 12px rgba(47,102,246,0.4)" : "0 2px 8px rgba(0,0,0,0.15)"};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        ">
          <svg width="${isSelected ? 22 : 18}" height="${isSelected ? 22 : 18}" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? "white" : "#2f66f6"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;

      const marker = new AdvancedMarkerElement({
        map: googleMapRef.current,
        position: { lat: place.latitude, lng: place.longitude },
        content: markerContent,
        title: place.name,
      });

      marker.addListener("click", () => {
        onPlaceSelect?.(place);
      });

      return marker;
    },
    [onPlaceSelect]
  );

  // Crea marker per la posizione utente
  const createUserMarker = useCallback(async () => {
    if (!googleMapRef.current || !userPosition) return null;

    const { AdvancedMarkerElement } = await google.maps.importLibrary(
      "marker"
    ) as google.maps.MarkerLibrary;

    const markerContent = document.createElement("div");
    markerContent.innerHTML = `
      <div style="
        width: 24px;
        height: 24px;
        background: #18a957;
        border: 4px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>
    `;

    const marker = new AdvancedMarkerElement({
      map: googleMapRef.current,
      position: { lat: userPosition.latitude, lng: userPosition.longitude },
      content: markerContent,
      title: "Your location",
      zIndex: 1000,
    });

    return marker;
  }, [userPosition]);

  // Gestisci i marker dei luoghi
  useEffect(() => {
    if (!mapReady || !googleMapRef.current) return;

    const updateMarkers = async () => {
      // Rimuovi marker non più presenti
      const currentIds = new Set(validPlaces.map((p) => p.id));
      markersRef.current.forEach((marker, id) => {
        if (!currentIds.has(id)) {
          marker.map = null;
          markersRef.current.delete(id);
        }
      });

      // Aggiungi/aggiorna marker
      for (const place of validPlaces) {
        const existingMarker = markersRef.current.get(place.id);
        const isSelected = place.id === selectedPlaceId;

        if (existingMarker) {
          // Aggiorna lo stile se cambia la selezione
          const content = existingMarker.content as HTMLElement;
          if (content) {
            const div = content.querySelector("div");
            if (div) {
              div.style.width = isSelected ? "44px" : "36px";
              div.style.height = isSelected ? "44px" : "36px";
              div.style.background = isSelected ? "#2f66f6" : "#ffffff";
              div.style.border = isSelected ? "3px solid white" : "2px solid #e3e5ea";
              div.style.boxShadow = isSelected
                ? "0 4px 12px rgba(47,102,246,0.4)"
                : "0 2px 8px rgba(0,0,0,0.15)";
              const svg = div.querySelector("svg");
              if (svg) {
                svg.setAttribute("width", isSelected ? "22" : "18");
                svg.setAttribute("height", isSelected ? "22" : "18");
                svg.setAttribute("stroke", isSelected ? "white" : "#2f66f6");
              }
            }
          }
        } else {
          // Crea nuovo marker
          const marker = await createPlaceMarker(place, isSelected);
          if (marker) {
            markersRef.current.set(place.id, marker);
          }
        }
      }

      // Adatta i bounds se ci sono luoghi e non è già inizializzato
      if (validPlaces.length > 0 && placesKey !== prevPlacesKeyRef.current) {
        const bounds = new google.maps.LatLngBounds();
        validPlaces.forEach((place) => {
          if (place.latitude !== null && place.longitude !== null) {
            bounds.extend({ lat: place.latitude, lng: place.longitude });
          }
        });
        if (userPosition) {
          bounds.extend({ lat: userPosition.latitude, lng: userPosition.longitude });
        }
        googleMapRef.current!.fitBounds(bounds, 50);
        prevPlacesKeyRef.current = placesKey;
      }
    };

    updateMarkers();
  }, [mapReady, validPlaces, selectedPlaceId, createPlaceMarker, userPosition, placesKey]);

  // Gestisci marker posizione utente
  useEffect(() => {
    if (!mapReady || !googleMapRef.current) return;

    const updateUserMarker = async () => {
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null;
        userMarkerRef.current = null;
      }

      if (userPosition) {
        userMarkerRef.current = await createUserMarker();
      }
    };

    updateUserMarker();
  }, [mapReady, userPosition, createUserMarker]);

  // Ricentra sulla posizione utente quando recenterTrigger cambia
  useEffect(() => {
    if (!mapReady || !googleMapRef.current || !userPosition) return;
    if (recenterTrigger === undefined) return;
    if (recenterTrigger === prevRecenterTriggerRef.current) return;
    prevRecenterTriggerRef.current = recenterTrigger;

    googleMapRef.current.panTo({
      lat: userPosition.latitude,
      lng: userPosition.longitude,
    });
    googleMapRef.current.setZoom(FOCUSED_ZOOM);
  }, [mapReady, userPosition, recenterTrigger]);

  // Centra sul luogo selezionato
  useEffect(() => {
    if (!mapReady || !googleMapRef.current || !selectedPlaceId) return;

    const selectedPlace = validPlaces.find((p) => p.id === selectedPlaceId);
    if (
      selectedPlace &&
      selectedPlace.latitude !== null &&
      selectedPlace.longitude !== null
    ) {
      googleMapRef.current.panTo({
        lat: selectedPlace.latitude,
        lng: selectedPlace.longitude,
      });
    }
  }, [mapReady, selectedPlaceId, validPlaces]);

  if (error) {
    return (
      <div
        className={cx(
          "flex h-full min-h-[400px] items-center justify-center rounded-[var(--radius-lg)] bg-surface-muted",
          className
        )}
      >
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={cx(
          "flex h-full min-h-[400px] items-center justify-center rounded-[var(--radius-lg)] bg-surface-muted",
          className
        )}
      >
        <Loader size="md" />
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={cx("h-full w-full rounded-[var(--radius-lg)]", className)}
      style={{ minHeight: "400px" }}
    />
  );
};
