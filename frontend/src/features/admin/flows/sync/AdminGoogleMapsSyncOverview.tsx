"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Loader } from "@/components/elements/Loader";
import { formatNumber } from "@/features/admin/lib/formatters";
import {
  getGoogleMapsSyncStatus,
  syncGoogleMapsNearby,
  syncGoogleMapsPlace,
  syncGoogleMapsSearch,
} from "@/services/admin";
import type { ApiError } from "@/types/api";
import type {
  GoogleMapsSyncResponse,
  GoogleMapsSyncStatusResponse,
} from "@/types/admin";

const parseOptionalNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
};

const parseOptionalInteger = (value: string): number | null => {
  const parsed = parseOptionalNumber(value);
  if (parsed == null) {
    return null;
  }
  return Math.round(parsed);
};

export const AdminGoogleMapsSyncOverview = () => {
  const [status, setStatus] = useState<GoogleMapsSyncStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  const [lastAction, setLastAction] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GoogleMapsSyncResponse | null>(null);

  const [nearbyLat, setNearbyLat] = useState("");
  const [nearbyLng, setNearbyLng] = useState("");
  const [nearbyRadius, setNearbyRadius] = useState("5000");
  const [nearbyType, setNearbyType] = useState("point_of_interest");
  const [nearbyMaxResults, setNearbyMaxResults] = useState("20");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchLat, setSearchLat] = useState("");
  const [searchLng, setSearchLng] = useState("");
  const [searchRadius, setSearchRadius] = useState("5000");
  const [searchMaxResults, setSearchMaxResults] = useState("20");

  const [googlePlaceId, setGooglePlaceId] = useState("");

  const loadStatus = useCallback(async () => {
    setStatusLoading(true);
    setError(null);

    try {
      const response = await getGoogleMapsSyncStatus();
      setStatus(response);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const runAction = async (
    action: string,
    task: () => Promise<GoogleMapsSyncResponse>
  ) => {
    setRunningAction(action);
    setError(null);

    try {
      const response = await task();
      setLastAction(action);
      setLastResult(response);
      await loadStatus();
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setRunningAction(null);
    }
  };

  const handleNearbySync = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await runAction("Nearby Sync", async () =>
      syncGoogleMapsNearby({
        latitude: Number(nearbyLat),
        longitude: Number(nearbyLng),
        radiusMeters: parseOptionalInteger(nearbyRadius),
        type: nearbyType.trim() || null,
        maxResults: parseOptionalInteger(nearbyMaxResults),
      })
    );
  };

  const handleSearchSync = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await runAction("Text Search Sync", async () =>
      syncGoogleMapsSearch({
        query: searchQuery.trim(),
        latitude: parseOptionalNumber(searchLat),
        longitude: parseOptionalNumber(searchLng),
        radiusMeters: parseOptionalInteger(searchRadius),
        maxResults: parseOptionalInteger(searchMaxResults),
      })
    );
  };

  const handlePlaceSync = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await runAction("Single Place Sync", async () =>
      syncGoogleMapsPlace(googlePlaceId.trim())
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Sync Google Maps</h1>
        <p className="mt-1 text-sm text-muted">
          Sincronizzazione catalogo luoghi da Google Maps API.
        </p>
      </div>

      <Card className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-foreground">Stato integrazione</h2>
          <Button size="sm" variant="outline" onClick={() => void loadStatus()}>
            Aggiorna stato
          </Button>
        </div>

        {statusLoading ? (
          <div className="flex items-center gap-3">
            <Loader size="sm" />
            <p className="text-sm text-muted">Verifica configurazione Google Maps...</p>
          </div>
        ) : (
          <p className="text-sm text-muted">
            <span className="font-semibold text-foreground">Configurata:</span>{" "}
            {status?.configured ? "SI" : "NO"}
            {" · "}
            {status?.message ?? "N/A"}
          </p>
        )}
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">Sync nearby</h2>
        <form className="grid gap-3 lg:grid-cols-3" onSubmit={handleNearbySync}>
          <Input
            label="Latitude"
            value={nearbyLat}
            onChange={(event) => setNearbyLat(event.target.value)}
            required
          />
          <Input
            label="Longitude"
            value={nearbyLng}
            onChange={(event) => setNearbyLng(event.target.value)}
            required
          />
          <Input
            label="Radius (meters)"
            value={nearbyRadius}
            onChange={(event) => setNearbyRadius(event.target.value)}
          />
          <Input
            label="Type"
            value={nearbyType}
            onChange={(event) => setNearbyType(event.target.value)}
          />
          <Input
            label="Max results"
            value={nearbyMaxResults}
            onChange={(event) => setNearbyMaxResults(event.target.value)}
          />
          <div className="flex items-end">
            <Button
              type="submit"
              size="sm"
              loading={runningAction === "Nearby Sync"}
              loadingText="Sincronizzazione"
            >
              Avvia nearby sync
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">Sync text search</h2>
        <form className="grid gap-3 lg:grid-cols-3" onSubmit={handleSearchSync}>
          <Input
            label="Query"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            required
          />
          <Input
            label="Latitude (optional)"
            value={searchLat}
            onChange={(event) => setSearchLat(event.target.value)}
          />
          <Input
            label="Longitude (optional)"
            value={searchLng}
            onChange={(event) => setSearchLng(event.target.value)}
          />
          <Input
            label="Radius (meters)"
            value={searchRadius}
            onChange={(event) => setSearchRadius(event.target.value)}
          />
          <Input
            label="Max results"
            value={searchMaxResults}
            onChange={(event) => setSearchMaxResults(event.target.value)}
          />
          <div className="flex items-end">
            <Button
              type="submit"
              size="sm"
              loading={runningAction === "Text Search Sync"}
              loadingText="Sincronizzazione"
            >
              Avvia text search sync
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">Sync singolo place ID</h2>
        <form className="grid gap-3 lg:grid-cols-[1fr,auto]" onSubmit={handlePlaceSync}>
          <Input
            label="Google Place ID"
            value={googlePlaceId}
            onChange={(event) => setGooglePlaceId(event.target.value)}
            required
          />
          <div className="flex items-end">
            <Button
              type="submit"
              size="sm"
              loading={runningAction === "Single Place Sync"}
              loadingText="Sincronizzazione"
            >
              Avvia sync place
            </Button>
          </div>
        </form>
      </Card>

      {error ? (
        <Card className="space-y-2 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">Errore sincronizzazione</p>
          <p className="text-sm text-muted">{error.message}</p>
        </Card>
      ) : null}

      {lastResult ? (
        <Card className="space-y-3 p-5">
          <h2 className="text-base font-semibold text-foreground">
            Ultimo risultato: {lastAction}
          </h2>
          <p className="text-sm text-muted">{lastResult.message}</p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">Totale trovati:</span>{" "}
              {formatNumber(lastResult.totalFound)}
            </p>
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">Creati:</span>{" "}
              {formatNumber(lastResult.created)}
            </p>
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">Aggiornati:</span>{" "}
              {formatNumber(lastResult.updated)}
            </p>
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">Errori:</span>{" "}
              {formatNumber(lastResult.errors)}
            </p>
          </div>

          {lastResult.errorMessages.length ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Error messages</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
                {lastResult.errorMessages.map((message, index) => (
                  <li key={`${message}-${index}`}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
};
