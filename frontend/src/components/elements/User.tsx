"use client";

import { useEffect, useMemo } from "react";
import { useAuth, usePosition, useUser } from "@/hooks";
import { Card, CardBody, CardHeader } from "@/components/elements/Card";
import { Avatar } from "@/components/elements/Avatar";
import { Badge } from "@/components/elements/Badge";

const formatCoordinate = (value: number | null | undefined) => {
  if (typeof value !== "number") {
    return "-";
  }
  return value.toFixed(5);
};

const splitName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
};

const formatLocation = (city?: string | null, country?: string | null) => {
  const parts = [city?.trim(), country?.trim()].filter(Boolean);
  return parts.length ? parts.join(", ") : "-";
};

export const User = () => {
  const { user, actions: authActions, isAuthenticated } = useAuth();
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

  const fullName = profile?.fullName?.trim() ?? "";
  const { firstName, lastName } = useMemo(
    () => splitName(fullName),
    [fullName]
  );

  const email = user?.email ?? "-";
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
        <div className="flex items-center gap-3">
          <Avatar name={displayName} size="lg" />
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
          <div className="rounded-[var(--radius-md)] border border-border/60 bg-surface px-3 py-2">
            <p className="text-subtle">Nome</p>
            <p className="text-sm font-semibold text-foreground">
              {firstName || "-"}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border/60 bg-surface px-3 py-2">
            <p className="text-subtle">Cognome</p>
            <p className="text-sm font-semibold text-foreground">
              {lastName || "-"}
            </p>
          </div>
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
      </CardBody>
    </Card>
  );
};
