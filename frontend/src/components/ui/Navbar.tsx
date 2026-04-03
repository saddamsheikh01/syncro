"use client";

import type { HTMLAttributes } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/elements/Card";
import { Avatar } from "@/components/elements/Avatar";
import { NotificationBell } from "@/components/ui/NotificationBell";
import { LanguageSwitch } from "@/components/ui/LanguageSwitch";
import { ZyraSearchBar } from "@/features/zyra/search/ZyraSearchBar";
import { useAuth, useT, useUser } from "@/hooks";
import { cx } from "@/lib/classNames";
import { getMediaByOwner } from "@/services/media";
import { getAdminAccess } from "@/services/auth";
import {
  PROFILE_AVATAR_UPDATED_EVENT,
  type ProfileAvatarUpdatedDetail,
} from "@/lib/mediaEvents";
import { useExpatsModeStore } from "@/stores/expatsMode/useExpatsModeStore";
import { expatsModeActions } from "@/stores/expatsMode/expatsModeStore";
import { getActivationState } from "@/services/expats";
import Image from "next/image";

const HeaderProfile = () => {
  const { t } = useT();
  const { user, isAuthenticated, status, actions: authActions } = useAuth();
  const { profile, actions: userActions } = useUser();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarReloadTick, setAvatarReloadTick] = useState(0);

  useEffect(() => {
    authActions.hydrate();
  }, [authActions]);

  useEffect(() => {
    if (!isAuthenticated || profile || status !== "authenticated") return;
    userActions.fetchProfile().catch(() => undefined);
  }, [isAuthenticated, profile, status, userActions]);

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

  // Public display name: profile Full Name (from profile) first, then username (Settings), then email
  const displayName = useMemo(() => {
    const fullName = profile?.fullName?.trim();
    const username = user?.username?.trim();
    const email = user?.email?.trim();
    return fullName || username || email || t("User");
  }, [profile?.fullName, t, user?.email, user?.username]);

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
          {t("View Profile")}
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

const ExpatsModeToggle = () => {
  const { t } = useT();
  const router = useRouter();
  const isExpatsModeActive = useExpatsModeStore((s) => s.isExpatsModeActive);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    expatsModeActions.rehydrate();
  }, []);

  const handleClick = async () => {
    if (isExpatsModeActive) {
      expatsModeActions.setActive(false);
      return;
    }
    setIsChecking(true);
    try {
      const state = await getActivationState();
      expatsModeActions.setActive(true);
      router.push("/expats/activation");
    } catch {
      expatsModeActions.setActive(true);
      router.push("/expats/budget");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isChecking}
      className={cx(
        "group relative flex items-center gap-2.5 overflow-hidden rounded-xl px-5 py-2.5 text-xs font-extrabold uppercase tracking-widest transition-all duration-300 disabled:opacity-60",
        isExpatsModeActive
          ? "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white shadow-[0_4px_20px_rgba(59,130,246,0.45)] hover:shadow-[0_6px_28px_rgba(59,130,246,0.6)] hover:scale-[1.03]"
          : "border border-blue-200/60 bg-white/80 text-blue-500 shadow-sm backdrop-blur hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
      )}
      aria-pressed={isExpatsModeActive}
      aria-label={t("Expats Mode")}
    >
      {isExpatsModeActive && (
        <span className="absolute inset-0 bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,0.15)_50%,transparent_70%)] animate-[shimmer_2.5s_ease-in-out_infinite]" />
      )}
      <Image
        src="/icons/new-icons/expats.png"
        alt=""
        width={22}
        height={22}
        className={cx(
          "relative h-[22px] w-[22px] transition-transform duration-300",
          isExpatsModeActive && "drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]"
        )}
      />
      <span className="relative">{isChecking ? t("…") : t("Expats Mode")}</span>
    </button>
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
      <div className="flex items-center gap-6">
        <div className="shrink-0 pl-3">
          <ExpatsModeToggle />
        </div>

        <div className="flex-1">
          <div className="mx-auto max-w-[560px]">
            <ZyraSearchBar />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3 pr-2">
          <SuperAdminRedirect />
          <NotificationBell />
          <HeaderProfile />
          <LanguageSwitch variant="expat" />
        </div>
      </div>
    </Card>
  </header>
);
