"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@/hooks";
import { Avatar } from "@/components/elements/Avatar";
import { NavIcon } from "@/components/ui/NavIcon";
import { getMediaByOwner } from "@/services/media";
import {
  PROFILE_AVATAR_UPDATED_EVENT,
  type ProfileAvatarUpdatedDetail,
} from "@/lib/mediaEvents";
import type { MediaResponse } from "@/types/media";

export const User = () => {
  const { user, isAuthenticated, actions: authActions } = useAuth();
  const { profile, actions: userActions } = useUser();

  const [avatar, setAvatar] = useState<MediaResponse | null>(null);
  const [avatarReloadTick, setAvatarReloadTick] = useState(0);
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

  useEffect(() => {
    if (!user?.id) return;
    const handleAvatarUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<ProfileAvatarUpdatedDetail>;
      if (customEvent.detail?.userId !== user.id) return;
      setAvatarReloadTick((prev) => prev + 1);
    };
    window.addEventListener(PROFILE_AVATAR_UPDATED_EVENT, handleAvatarUpdated);
    return () => {
      window.removeEventListener(
        PROFILE_AVATAR_UPDATED_EVENT,
        handleAvatarUpdated
      );
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || avatarReloadTick === 0) return;
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
  }, [avatarReloadTick, user?.id]);

  const email = user?.email ?? "";
  const username = user?.username?.trim() ?? "";
  const fullName = profile?.fullName?.trim() ?? "";
  const location = [profile?.city, profile?.country].filter(Boolean).join(", ");
  const displayName = fullName || username || email || "User";
  const showUsername = Boolean(username) && username !== displayName;
  const showEmail = Boolean(email) && email !== displayName && !location;

  if (!isAuthenticated) return null;

  return (
    <Link
      href="/profile"
      className="group relative flex items-center gap-4 rounded-[var(--radius-lg)] border border-border/70 bg-surface p-4 shadow-sm transition-all duration-200 hover:border-accent/30 hover:shadow-md"
    >
      <div className="relative">
        <Avatar
          name={fullName || email}
          src={avatar?.url}
          size="xl"
          className="ring-2 ring-surface ring-offset-2 ring-offset-background"
        />
        <div className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-success ring-2 ring-surface">
          <div className="h-1.5 w-1.5 rounded-full bg-white" />
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate text-base font-semibold text-foreground">
          {displayName}
        </p>
        {showUsername ? (
          <p className="truncate text-xs text-subtle">@{username}</p>
        ) : null}
        {location ? (
          <p className="flex items-center gap-1.5 truncate text-xs text-muted">
            <NavIcon name="map-pin" className="h-3 w-3 shrink-0" />
            {location}
          </p>
        ) : showEmail ? (
          <p className="truncate text-xs text-muted">{email}</p>
        ) : null}
      </div>

      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-muted text-subtle transition-colors group-hover:bg-accent/10 group-hover:text-accent">
        <NavIcon name="chevron-right" className="h-4 w-4" />
      </div>
    </Link>
  );
};
