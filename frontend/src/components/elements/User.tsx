"use client";

import { useEffect } from "react";
import { useAuth, usePosition, useUser } from "@/hooks";
import { Card, CardBody, CardHeader } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { Logout } from "@/components/buttons/Logout";

const formatCoordinate = (value: number | null | undefined) => {
  if (typeof value !== "number") {
    return "-";
  }
  return value.toFixed(5);
};

const formatLocation = (city?: string | null, country?: string | null) => {
  const parts = [city?.trim(), country?.trim()].filter(Boolean);
  return parts.length ? parts.join(", ") : "-";
};

export const User = () => {
  const { user, status, actions: authActions, isAuthenticated } = useAuth();
  const { profile, actions: userActions } = useUser();
  const { position, hasPosition, actions: positionActions } = usePosition();

  useEffect(() => {
    authActions.hydrate();
    positionActions.hydrate();
  }, [authActions, positionActions]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    if (!profile) {
      userActions.fetchProfile().catch(() => undefined);
    }
    if (!position) {
      positionActions.fetchPosition().catch(() => undefined);
    }
  }, [
    isAuthenticated,
    position,
    positionActions,
    profile,
    userActions,
  ]);

  const email = user?.email ?? "-";
  const fullName = profile?.fullName?.trim() ?? "";
  const displayName = fullName || email;
  const cityCountry = formatLocation(profile?.city, profile?.country);
  const locationLabel = hasPosition
    ? `${formatCoordinate(position?.latitude)}, ${formatCoordinate(
        position?.longitude
      )}`
    : "Non disponibile";

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-foreground">Utente loggato</h3>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              {displayName || "-"}
            </p>
            <p className="text-xs text-subtle">{email}</p>
          </div>
          <Badge tone={hasPosition ? "accent" : "warning"} size="sm">
            {hasPosition ? "Posizione ok" : "Posizione assente"}
          </Badge>
        </div>
        <div className="grid gap-3 text-xs sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-border/60 bg-surface px-3 py-2 sm:col-span-2">
            <p className="text-subtle">Citta e paese</p>
            <p className="text-sm font-semibold text-foreground">{cityCountry}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border/60 bg-surface px-3 py-2 sm:col-span-2">
            <p className="text-subtle">Posizione</p>
            <p className="text-sm font-semibold text-foreground">
              {locationLabel}
            </p>
          </div>
        </div>
        {isAuthenticated ? (
          <Logout fullWidth />
        ) : null}
      </CardBody>
    </Card>
  );
};
