"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PlaceSummaryResponse } from "@/types/catalog";
import { cx } from "@/lib/classNames";

const DEFAULT_CENTER: L.LatLngExpression = [41.9028, 12.4964]; // Roma
const DEFAULT_ZOOM = 6;
const FOCUSED_ZOOM = 14;

// Crea icona per la posizione utente (verde)
const createUserIcon = () =>
  L.divIcon({
    className: "user-location-marker",
    html: `<div style="
      width: 24px;
      height: 24px;
      background: #18a957;
      border: 4px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

// Crea icona per i luoghi
const createPlaceIcon = (selected: boolean) =>
  L.divIcon({
    className: selected ? "place-marker-selected" : "place-marker",
    html: `<div style="
      width: ${selected ? 40 : 32}px;
      height: ${selected ? 40 : 32}px;
      background: ${selected ? "#2f66f6" : "#ffffff"};
      border: ${selected ? "3px solid white" : "2px solid #e3e5ea"};
      border-radius: 14px;
      box-shadow: ${selected ? "0 4px 12px rgba(47,102,246,0.4)" : "0 2px 8px rgba(0,0,0,0.15)"};
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="${selected ? 20 : 16}" height="${selected ? 20 : 16}" viewBox="0 0 24 24" fill="none" stroke="${selected ? "white" : "#2f66f6"}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>`,
    iconSize: [selected ? 40 : 32, selected ? 40 : 32],
    iconAnchor: [selected ? 20 : 16, selected ? 40 : 32],
    popupAnchor: [0, selected ? -40 : -32],
  });

export interface MapContainerProps {
  places: PlaceSummaryResponse[];
  userPosition?: { latitude: number; longitude: number } | null;
  selectedPlaceId?: string | null;
  onPlaceSelect?: (place: PlaceSummaryResponse) => void;
  onMapReady?: (map: L.Map) => void;
  className?: string;
}

export const MapContainer = ({
  places,
  userPosition,
  selectedPlaceId,
  onPlaceSelect,
  onMapReady,
  className,
}: MapContainerProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Inizializza la mappa una sola volta
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      boxZoom: true,
      keyboard: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    onMapReady?.(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Aggiorna marker posizione utente
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Rimuovi marker precedente
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (!userPosition) return;

    const { latitude, longitude } = userPosition;

    // Centra la mappa
    map.setView([latitude, longitude], FOCUSED_ZOOM);

    // Aggiungi marker utente
    userMarkerRef.current = L.marker([latitude, longitude], {
      icon: createUserIcon(),
      zIndexOffset: 1000,
    })
      .addTo(map)
      .bindPopup("La tua posizione");
  }, [userPosition]);

  // Aggiorna marker dei luoghi
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Rimuovi marker precedenti
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Filtra luoghi con coordinate valide
    const validPlaces = places.filter(
      (place) => place.latitude !== null && place.longitude !== null
    );

    if (validPlaces.length === 0) return;

    // Aggiungi marker per ogni luogo
    validPlaces.forEach((place) => {
      const isSelected = place.id === selectedPlaceId;
      const marker = L.marker([place.latitude!, place.longitude!], {
        icon: createPlaceIcon(isSelected),
        zIndexOffset: isSelected ? 500 : 0,
      })
        .addTo(map)
        .on("click", () => {
          onPlaceSelect?.(place);
        });

      markersRef.current.push(marker);
    });

    // Fit bounds se non c'è posizione utente
    if (!userPosition && validPlaces.length > 1) {
      const bounds = L.latLngBounds(
        validPlaces.map((p) => [p.latitude!, p.longitude!] as L.LatLngTuple)
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (!userPosition && validPlaces.length === 1) {
      map.setView(
        [validPlaces[0].latitude!, validPlaces[0].longitude!],
        FOCUSED_ZOOM
      );
    }
  }, [places, selectedPlaceId, userPosition, onPlaceSelect]);

  return (
    <div
      ref={mapRef}
      className={cx("h-full w-full rounded-[var(--radius-lg)]", className)}
      style={{ minHeight: "400px" }}
    />
  );
};
