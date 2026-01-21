"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@/hooks";
import { Avatar } from "@/components/elements/Avatar";
import { getMediaByOwner } from "@/services/media";
import type { MediaResponse } from "@/types/media";

export const User = () => {
  const { user, isAuthenticated, actions: authActions } = useAuth();
  const { profile, actions: userActions } = useUser();

  const [avatar, setAvatar] = useState<MediaResponse | null>(null);
  const avatarLoadedRef = useRef(false);

  useEffect(() => {
    authActions.hydrate();
  }, [authActions]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!profile) {
      userActions.fetchProfile().catch(() => undefined);
    }
  }, [isAuthenticated, profile, userActions]);

  useEffect(() => {
    if (!user?.id || avatarLoadedRef.current) return;
    avatarLoadedRef.current = true;

    getMediaByOwner({
      ownerType: "USER_PROFILE",
      ownerId: user.id,
      page: 0,
      size: 1,
    })
      .then((response) => {
        setAvatar(response.content[0] ?? null);
      })
      .catch(() => undefined);
  }, [user?.id]);

  const email = user?.email ?? "";
  const fullName = profile?.fullName?.trim() ?? "";

  if (!isAuthenticated) return null;

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border/60 bg-surface-muted p-3">
      <Avatar
        name={fullName || email}
        src={avatar?.url}
        size="lg"
        className="shrink-0"
      />
      <div className="min-w-0 flex-1">
        {fullName && (
          <p className="truncate text-sm font-semibold text-foreground">
            {fullName}
          </p>
        )}
        {email && (
          <p className="truncate text-xs text-muted">{email}</p>
        )}
      </div>
    </div>
  );
};
