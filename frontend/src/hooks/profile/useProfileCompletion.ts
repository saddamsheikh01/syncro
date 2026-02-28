"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { useUser } from "../user/useUser";
import { useTags } from "../tags/useTags";
import { usePosition } from "../position/usePosition";
import { useTests } from "../insights/useTests";
import {
  calculateProfileCompletion,
  type ProfileCompletionResult,
} from "@/lib/profileCompletion";
import { getMediaByOwner } from "@/services/media";
import type { JsonValue } from "@/types/shared";

function readNumber(value: JsonValue): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Returns non-empty string, or "ANY" when key exists but value is empty (user chose "Any"). */
function readGender(value: JsonValue, keyExists: boolean): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  if (keyExists) return "ANY"; // "Any" preference counts as set
  return null;
}

export const useProfileCompletion = (): ProfileCompletionResult & {
  loading: boolean;
} => {
  const { user } = useAuth();
  const { profile, preferences, actions: userActions } = useUser();
  const { interests, actions: tagsActions } = useTags();
  const { hasPosition, actions: positionActions } = usePosition();
  const { tests, completedCount, actions: testsActions } = useTests();

  const fetchedRef = useRef(false);
  const avatarFetchedRef = useRef(false);
  const [hasAvatarMedia, setHasAvatarMedia] = useState(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    userActions.fetchProfile().catch(() => undefined);
    userActions.fetchPreferences().catch(() => undefined);
    positionActions.fetchPosition().catch(() => undefined);
    tagsActions.fetchUserInterests().catch(() => undefined);
    testsActions.fetchTests().catch(() => undefined);
    testsActions.fetchCompletedCount().catch(() => undefined);
  }, [userActions, positionActions, tagsActions, testsActions]);

  useEffect(() => {
    if (!user?.id || avatarFetchedRef.current) return;
    avatarFetchedRef.current = true;
    getMediaByOwner({
      ownerType: "USER_PROFILE",
      ownerId: user.id,
      page: 0,
      size: 1,
    })
      .then((response) => {
        setHasAvatarMedia(response.content.length > 0);
      })
      .catch(() => undefined);
  }, [user?.id]);

  // Only show loading when we have no data yet; once we have profile or tests, show percentage so we don't get stuck if profile fetch fails
  const loading = !profile && tests.length === 0 && completedCount === null;

  const result = useMemo(() => {
    const storedFilters = (preferences?.matchmakingFilters ?? {}) as Record<
      string,
      JsonValue
    >;
    // Count gender as "set" if the key exists (user has saved preferences), even when value is empty/"Any"/null
    const genderKeyExists = "gender" in storedFilters;

    return calculateProfileCompletion({
      profileFields: {
        username: user?.username?.trim() ? user.username.trim() : null,
        email: user?.email?.trim() ? user.email.trim() : null,
        fullName: profile?.fullName ?? null,
        birthDate: profile?.birthDate ?? null,
        city: profile?.city ?? null,
        country: profile?.country ?? null,
        jobTitle: profile?.jobTitle ?? null,
        companyName: profile?.companyName ?? null,
        bio: profile?.bio ?? null,
        traitsText: profile?.traitsText ?? null,
        lovesText: profile?.lovesText ?? null,
        dislikesText: profile?.dislikesText ?? null,
        goalsText: profile?.goalsText ?? null,
        valuesText: profile?.valuesText ?? null,
        relationshipStatus: profile?.relationshipStatus ?? null,
        orientation: profile?.orientation ?? null,
        childrenStatus: profile?.childrenStatus ?? null,
      },
      hasAvatar: Boolean(profile?.avatarUrl) || hasAvatarMedia,
      interestCount: interests?.tags?.length ?? 0,
      matchmakingFilterValues: {
        ageMin: readNumber(storedFilters.ageMin),
        ageMax: readNumber(storedFilters.ageMax),
        distanceKm: readNumber(storedFilters.distanceKm),
        gender: readGender(storedFilters.gender, genderKeyExists),
      },
      hasPosition,
      testsCompleted: completedCount ?? 0,
      testsTotal: tests.length,
    });
  }, [user?.username, user?.email, profile, preferences, interests, hasPosition, tests, completedCount, hasAvatarMedia]);

  return { ...result, loading };
};
