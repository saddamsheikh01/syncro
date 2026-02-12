"use client";

import type { HTMLAttributes } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/elements/Card";
import { Avatar } from "@/components/elements/Avatar";
import { NavIcon } from "@/components/ui/NavIcon";
import { ZyraSearchBar } from "@/features/zyra/search/ZyraSearchBar";
import { useAuth, useUser } from "@/hooks";
import { cx } from "@/lib/classNames";
import { getMediaByOwner } from "@/services/media";
import { getAdminAccess } from "@/services/auth";
import {
  PROFILE_AVATAR_UPDATED_EVENT,
  type ProfileAvatarUpdatedDetail,
} from "@/lib/mediaEvents";

const NotificationBell = () => (
  <button
    type="button"
    aria-label="Notifiche"
    className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-surface text-subtle shadow-sm transition hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
  >
    <NavIcon name="bell" className="h-4 w-4" />
  </button>
);

const HeaderProfile = () => {
  const { user, isAuthenticated, actions: authActions } = useAuth();
  const { profile, actions: userActions } = useUser();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarReloadTick, setAvatarReloadTick] = useState(0);

  useEffect(() => {
    authActions.hydrate();
  }, [authActions]);

  useEffect(() => {
    if (!isAuthenticated || profile) return;
    userActions.fetchProfile().catch(() => undefined);
  }, [isAuthenticated, profile, userActions]);

  useEffect(() => {
    if (!user?.id) return;
    getMediaByOwner({
      ownerType: "USER_PROFILE",
      ownerId: user.id,
      page: 0,
      size: 1,
    })
      .then((response) => {
        setAvatarUrl(response.content[0]?.url ?? null);
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
        setAvatarUrl(response.content[0]?.url ?? null);
      })
      .catch(() => undefined);
  }, [avatarReloadTick, user?.id]);

  const displayName = useMemo(() => {
    const fullName = profile?.fullName?.trim();
    const username = user?.username?.trim();
    const email = user?.email?.trim();
    return fullName || username || email || "User";
  }, [profile?.fullName, user?.username, user?.email]);

  if (!isAuthenticated) return null;

  return (
    <Link
      href="/profile"
      className="flex items-center gap-3 rounded-full border border-transparent px-2 py-1 transition hover:border-border/70 hover:bg-surface-muted/70"
    >
      <Avatar name={displayName} src={avatarUrl ?? undefined} size="sm" />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
        <p className="truncate text-[11px] text-subtle">
          Live profile · Syncro is learning from you
        </p>
      </div>
    </Link>
  );
};

const SuperAdminRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checkedEmail, setCheckedEmail] = useState<string | null>(null);
  const normalizedEmail = user?.email?.trim().toLowerCase() ?? null;

  useEffect(() => {
    if (!isAuthenticated || !normalizedEmail) {
      return;
    }

    let active = true;
    getAdminAccess()
      .then((response) => {
        if (!active) return;
        setIsSuperAdmin(response.superAdmin);
        setCheckedEmail(normalizedEmail);
      })
      .catch(() => {
        if (!active) return;
        setIsSuperAdmin(false);
        setCheckedEmail(normalizedEmail);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated, normalizedEmail]);

  const canShow =
    isAuthenticated &&
    Boolean(normalizedEmail) &&
    checkedEmail === normalizedEmail &&
    isSuperAdmin;

  if (!canShow) return null;

  return (
    <Link
      href="/admin/login"
      className="rounded-full border border-border/70 bg-surface px-3 py-2 text-xs font-semibold text-foreground transition hover:border-accent/40 hover:bg-accent-soft"
    >
      Admin
    </Link>
  );
};

export interface NavbarProps extends HTMLAttributes<HTMLElement> {
  position?: "fixed" | "absolute";
}

export const Navbar = ({
  className,
  position = "fixed",
  ...props
}: NavbarProps) => (
  <header
    className={cx(
      position,
      "left-72 right-6 top-4 z-30",
      className
    )}
    {...props}
  >
    <Card className="rounded-[var(--radius-xl)] border-border/70 bg-surface/90 p-3 shadow-md backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="mx-auto max-w-[560px]">
            <ZyraSearchBar />
          </div>
        </div>

        <div className="flex items-center gap-3 pr-2">
          <SuperAdminRedirect />
          <NotificationBell />
          <HeaderProfile />
        </div>
      </div>
    </Card>
  </header>
);
