"use client";

import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import type { PlaceSummaryResponse } from "@/types/catalog";
import { cx } from "@/lib/classNames";

// Tipo per il cluster (non esportato da @types/leaflet)
interface MarkerCluster {
  getChildCount(): number;
}

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

// Crea icona per i cluster
const createClusterIcon = (cluster: MarkerCluster) => {
  const count = cluster.getChildCount();
  let size: "sm" | "md" | "lg" = "sm";
  if (count >= 10) size = "md";
  if (count >= 50) size = "lg";

  const sizeMap = { sm: 32, md: 40, lg: 48 };
  const dimension = sizeMap[size];

  return L.divIcon({
    className: "cluster-marker",
    html: `<div style="
      width: ${dimension}px;
      height: ${dimension}px;
      background: var(--accent, #2f66f6);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: ${size === "lg" ? "16px" : size === "md" ? "14px" : "12px"};
    ">${count}</div>`,
    iconSize: [dimension, dimension],
    iconAnchor: [dimension / 2, dimension / 2],
  });
};

// Componente per gestire il centro della mappa
const MapController = ({
  userPosition,
  places,
  recenterTrigger,
}: {
  userPosition?: { latitude: number; longitude: number } | null;
  places: PlaceSummaryResponse[];
  recenterTrigger?: number;
}) => {
  const map = useMap();
  const initializedRef = useRef(false);
  const prevPlacesKeyRef = useRef("");
  const prevRecenterTriggerRef = useRef(recenterTrigger ?? 0);

  // Genera una chiave unica per i luoghi attuali
  const placesKey = useMemo(() => {
    if (places.length === 0) return "";
    // Usa i primi 5 ID + lunghezza come chiave
    const ids = places.slice(0, 5).map((p) => p.id).join(",");
    return `${ids}:${places.length}`;
  }, [places]);

  // Centra la mappa all'inizializzazione
  useEffect(() => {
    if (initializedRef.current) return;

    if (userPosition) {
      map.setView([userPosition.latitude, userPosition.longitude], FOCUSED_ZOOM);
      initializedRef.current = true;
      prevPlacesKeyRef.current = placesKey;
    } else if (places.length > 0) {
      const validPlaces = places.filter(
        (p) => p.latitude !== null && p.longitude !== null
      );
      if (validPlaces.length > 1) {
        const bounds = L.latLngBounds(
          validPlaces.map((p) => [p.latitude!, p.longitude!] as L.LatLngTuple)
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      } else if (validPlaces.length === 1) {
        map.setView(
          [validPlaces[0].latitude!, validPlaces[0].longitude!],
          FOCUSED_ZOOM
        );
      }
      initializedRef.current = true;
      prevPlacesKeyRef.current = placesKey;
    }
  }, [map, userPosition, places, placesKey]);

  // Ricentra la mappa quando cambiano i luoghi (es. dopo una ricerca)
  useEffect(() => {
    if (!initializedRef.current) return;
    if (places.length === 0) return;
    // Evita di ricentrare se i luoghi non sono cambiati
    if (placesKey === prevPlacesKeyRef.current) return;
    prevPlacesKeyRef.current = placesKey;

    const validPlaces = places.filter(
      (p) => p.latitude !== null && p.longitude !== null
    );
    if (validPlaces.length === 0) return;

    if (validPlaces.length > 1) {
      const bounds = L.latLngBounds(
        validPlaces.map((p) => [p.latitude!, p.longitude!] as L.LatLngTuple)
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (validPlaces.length === 1) {
      map.setView(
        [validPlaces[0].latitude!, validPlaces[0].longitude!],
        FOCUSED_ZOOM
      );
    }
  }, [map, places, placesKey]);

  // Ricentra sulla posizione utente quando recenterTrigger cambia
  useEffect(() => {
    if (!userPosition) return;
    if (recenterTrigger === undefined) return;
    if (recenterTrigger === prevRecenterTriggerRef.current) return;
    prevRecenterTriggerRef.current = recenterTrigger;

    map.setView([userPosition.latitude, userPosition.longitude], FOCUSED_ZOOM);
  }, [map, userPosition, recenterTrigger]);

  return null;
};

export interface MapContainerProps {
  places: PlaceSummaryResponse[];
  userPosition?: { latitude: number; longitude: number } | null;
  selectedPlaceId?: string | null;
  onPlaceSelect?: (place: PlaceSummaryResponse) => void;
  onMapReady?: (map: L.Map) => void;
  recenterTrigger?: number;
  className?: string;
}

export const MapContainer = ({
  places,
  userPosition,
  selectedPlaceId,
  onPlaceSelect,
  recenterTrigger,
  className,
}: MapContainerProps) => {
  // Filtra luoghi con coordinate valide
  const validPlaces = useMemo(
    () => places.filter((p) => p.latitude !== null && p.longitude !== null),
    [places]
  );

  // Memo per le icone
  const userIcon = useMemo(() => createUserIcon(), []);

  return (
    <LeafletMapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      className={cx("h-full w-full rounded-[var(--radius-lg)]", className)}
      style={{ minHeight: "400px" }}
      zoomControl={true}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <MapController userPosition={userPosition} places={validPlaces} recenterTrigger={recenterTrigger} />

      {/* Marker posizione utente */}
      {userPosition && (
        <Marker
          position={[userPosition.latitude, userPosition.longitude]}
          icon={userIcon}
          zIndexOffset={1000}
        >
          <Popup>La tua posizione</Popup>
        </Marker>
      )}

      {/* Cluster di marker per i luoghi */}
      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={createClusterIcon}
        maxClusterRadius={60}
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        zoomToBoundsOnClick={true}
      >
        {validPlaces.map((place) => {
          const isSelected = place.id === selectedPlaceId;
          return (
            <Marker
              key={place.id}
              position={[place.latitude!, place.longitude!]}
              icon={createPlaceIcon(isSelected)}
              zIndexOffset={isSelected ? 500 : 0}
              eventHandlers={{
                click: () => onPlaceSelect?.(place),
              }}
            />
          );
        })}
      </MarkerClusterGroup>
    </LeafletMapContainer>
  );
};
