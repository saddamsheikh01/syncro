"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@/components/elements/Avatar";
import { ImageLightbox } from "@/components/elements/ImageLightbox";
import { cx } from "@/lib/classNames";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { DatePicker } from "@/components/elements/DatePicker";
import { Input } from "@/components/elements/Input";
import {
  PlacesAutocomplete,
  type PlaceResult,
} from "@/components/elements/PlacesAutocomplete";
import { Select } from "@/components/elements/Select";
import { Loader } from "@/components/elements/Loader";
import { InterestPickerGrid } from "@/features/onboarding/forms/InterestPickerGrid";
import { SelectedTagsRow } from "@/features/tags/lists/SelectedTagsRow";
import { Modal } from "@/components/ui/Modal";
import { UnsavedChangesModal } from "@/components/ui/UnsavedChangesModal";
import {
  useAnalytics,
  useAuth,
  usePosition,
  useProfileCompletion,
  useTags,
  useTests,
  useUser,
  useUnsavedChanges,
  useT,
} from "@/hooks";
import {
  getMediaByOwner,
  uploadMedia,
  deletePostMedia,
  uploadPostMedia,
  getPostMedia,
} from "@/services/media";
import { getMyReferralLink } from "@/services/referrals";
import {
  checkUsernameAvailability,
  deleteCurrentUser,
  getUserPosts,
  updateCurrentUser,
} from "@/services/users";
import { requestPasswordReset } from "@/services/auth";
import {
  updatePost as updatePostRequest,
  deletePost as deletePostRequest,
} from "@/services/social";
import { EmailVerificationOtpModal } from "@/features/auth/components/EmailVerificationOtpModal";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { MapPostCard } from "@/features/social/lists/MapPostCard";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { MapTestListItem } from "@/features/insights/lists/MapTestListItem";
import { TestsHelperCard } from "@/features/insights/cards/TestsHelperCard";
import { InsightsDbLanguageDisclaimer } from "@/features/insights/elements/InsightsDbLanguageDisclaimer";
import { INSIGHT_COPY_KEYS } from "@/lib/insightsCopy";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";
import { ZyraProfileRecap } from "@/features/zyra/cards/ZyraProfileRecap";
import { ShareZyraRecapCard } from "@/features/zyra/cards/ShareZyraRecapCard";
import {
  getProfileRecapPending,
  regenerateProfileRecap,
} from "@/services/zyra";
import { toInterestTranslationKey } from "@/lib/interestEmoji";
import { dispatchProfileAvatarUpdated } from "@/lib/mediaEvents";
import { resetAllStores } from "@/stores/utils/resetAllStores";
import type { MediaResponse } from "@/types/media";
import type { ProfileVisibility, UserProfileRequest } from "@/types/profile";
import type { PostResponse } from "@/types/social";
import type { ReferralLinkResponse } from "@/types/referrals";

const MIN_INTERESTS = 3;
const USERNAME_MIN_LENGTH = 3;
const MOMENTS_PAGE_SIZE = 6;
const MAX_AVATAR_SIZE_MB = 10;
const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;
const DELETE_PROFILE_CONFIRMATION_PHRASE = "DELETE MY PROFILE";
const resolveErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (message) return String(message);
  }
  return fallback;
};

const normalizeUsername = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, "");

const PHONE_PATTERN = /^\+?[1-9]\d{7,14}$/;

const normalizePhone = (value: string) => value.trim().replace(/[\s()-]/g, "");

type LabeledOptionKey = { value: string; labelKey: string };

const RELATIONSHIP_OPTIONS: LabeledOptionKey[] = [
  { value: "SINGLE", labelKey: "Single" },
  { value: "IN_RELATIONSHIP", labelKey: "In a relationship" },
  { value: "MARRIED", labelKey: "Married" },
  { value: "SEPARATED", labelKey: "Separated" },
  { value: "COMPLICATED", labelKey: "It's complicated" },
  { value: "OTHER", labelKey: "Other" },
];

const CHILDREN_OPTIONS: LabeledOptionKey[] = [
  { value: "NO_CHILDREN", labelKey: "No children" },
  { value: "HAS_CHILDREN", labelKey: "Has children" },
  { value: "WANTS_CHILDREN", labelKey: "Wants children" },
  { value: "DOES_NOT_WANT", labelKey: "Does not want children" },
  { value: "UNDECIDED", labelKey: "Undecided" },
];

const ORIENTATION_OPTIONS: LabeledOptionKey[] = [
  { value: "HETERO", labelKey: "Straight" },
  { value: "GAY", labelKey: "Gay" },
  { value: "BI", labelKey: "Bisexual" },
  { value: "ASEXUAL", labelKey: "Asexual" },
  { value: "OTHER", labelKey: "Other" },
];

const PROFILE_GENDER_OPTIONS: LabeledOptionKey[] = [
  { value: "MALE", labelKey: "Male" },
  { value: "FEMALE", labelKey: "Female" },
  { value: "NON_BINARY", labelKey: "Non-binary" },
  { value: "OTHER", labelKey: "Other" },
  { value: "PREFER_NOT_TO_SAY", labelKey: "Prefer not to say" },
];

const PROFILE_COMPLETION_SUGGESTION_LABELS = {
  tests: "Complete Insights",
  astrology: "Complete Birth chart",
  profile: "Fill Out Profile",
  interests: "Select Interests",
  avatar: "Add a Photo",
  location: "Enable Location",
} as const;

export interface ProfileSettingsProps {
  title?: string;
  subtitle?: string;
  /** When true, show Account section (email, password, delete) — used on /settings page */
  showAccountSection?: boolean;
}

export const ProfileSettings = ({
  title,
  subtitle,
  showAccountSection = false,
}: ProfileSettingsProps) => {
  const { t, locale } = useT();

  const resolvedTitle = title ? t(title) : t("Profile");

  const profileGenderOptions = useMemo(
    () =>
      PROFILE_GENDER_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  );

  const orientationOptions = useMemo(
    () =>
      ORIENTATION_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  );

  const childrenOptions = useMemo(
    () =>
      CHILDREN_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  );

  const relationshipOptions = useMemo(
    () =>
      RELATIONSHIP_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  );

  const router = useRouter();
  const pathname = usePathname();
  const { status, user, actions: authActions } = useAuth();
  const { actions: analyticsActions } = useAnalytics();
  const {
    profile,
    error,
    actions: userActions,
  } = useUser();
  const {
    tags,
    interests,
    loading: tagsLoading,
    error: tagsError,
    actions: tagsActions,
  } = useTags();
  usePosition();
  const {
    tests,
    completedCount,
    loading: testsLoading,
    error: testsError,
    countLoading,
    actions: testsActions,
  } = useTests();
  const {
    percentage: profileCompleteness,
    categories: profileCompletionCategories,
    loading: profileCompletionLoading,
  } = useProfileCompletion();
  const displayPercentage = Math.min(100, Math.max(0, Math.round(Number(profileCompleteness) || 0)));
  const profileIsComplete = !profileCompletionLoading && displayPercentage >= 100;

  const completionSuggestions = useMemo(() => {
    const remaining = Math.max(0, 100 - displayPercentage);
    const rawItems = Object.entries(profileCompletionCategories)
      .filter(([, score]) => score.ratio < 1)
      .map(([key, score]) => {
        const labelKey =
          PROFILE_COMPLETION_SUGGESTION_LABELS[
            key as keyof typeof PROFILE_COMPLETION_SUGGESTION_LABELS
          ];
        if (!labelKey) return null;
        const potential = Math.round(score.weight - score.points);
        if (potential <= 0) return null;
        return { id: key, label: t(labelKey), potential };
      })
      .filter(
        (item): item is { id: string; label: string; potential: number } =>
          Boolean(item),
      );

    const sorted = rawItems.sort((a, b) => b.potential - a.potential);
    let remainingAcc = remaining;
    const items: { id: string; label: string; detail: string }[] = [];
    for (const item of sorted) {
      const displayed = Math.min(item.potential, remainingAcc);
      if (displayed <= 0) continue;
      remainingAcc -= displayed;
      items.push({ id: item.id, label: item.label, detail: `+${displayed}%` });
    }
    return items;
  }, [profileCompletionCategories, displayPercentage, t]);

  const topCompletionSuggestion = completionSuggestions[0];
  const astrologyCompleted = profile?.hasBirthChart === true;
  const insightTestItems = useMemo(() => {
    const ASTRO_SLUG = "astrology";
    const fromApi = tests.map((test) => {
      const copyKeys = test.testType ? INSIGHT_COPY_KEYS[test.testType] : null;
      const title = copyKeys ? t(copyKeys.titleKey) : test.title;
      const description = copyKeys ? t(copyKeys.descriptionKey) : (test.description ?? undefined);
      return {
        testType: test.testType,
        title,
        description,
        href: `/insights/${test.id}`,
        onOpen: () => {
          void analyticsActions.trackEvent({
            eventName: "INSIGHT_OPENED_FROM_LIST",
            payload: { testId: test.id, testType: test.testType, completed: test.completed },
          });
        },
        actionLabel: t("View Insights"),
        completed: test.completed,
      };
    });
    const birthChartItem = {
      testType: "ASTRO" as const,
      title: t("Birth chart"),
      description: t("Used for compatibility. Add place and optional time for better accuracy."),
      href: `/insights/${ASTRO_SLUG}`,
      onOpen: () => {
        void analyticsActions.trackEvent({
          eventName: "INSIGHT_OPENED_FROM_LIST",
          payload: { testId: ASTRO_SLUG, testType: "ASTRO", completed: astrologyCompleted },
        });
      },
      actionLabel: t("View Insights"),
      completed: astrologyCompleted,
    };
    return [...fromApi, birthChartItem];
  }, [analyticsActions, astrologyCompleted, t, tests]);
  const totalInsightTests = tests.length + 1;
  const resolvedSubtitle = subtitle
    ? t(subtitle)
    : profileIsComplete
      ? t("All required information has been filled in.")
      : t("Complete your profile to get more accurate matches.");

  const initializedRef = useRef(false);
  const analyticsTrackedRef = useRef(false);
  const profileInitializedRef = useRef<string | boolean>(false);
  const interestsInitializedRef = useRef(false);
  const avatarInitializedRef = useRef(false);
  const momentsInitializedRef = useRef(false);
  const usernameInitializedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { pendingRefresh } = await getProfileRecapPending();
        if (cancelled || !pendingRefresh) return;
        setRecapRegenerating(true);
        try {
          await regenerateProfileRecap(locale ?? undefined);
          if (!cancelled) setRecapRefreshTrigger((prev) => prev + 1);
        } finally {
          if (!cancelled) setRecapRegenerating(false);
        }
      } catch {
        // ignore: recap will still load from cache/DB
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [bio, setBio] = useState("");
  const [traitsText, setTraitsText] = useState("");
  const [lovesText, setLovesText] = useState("");
  const [dislikesText, setDislikesText] = useState("");
  const [goalsText, setGoalsText] = useState("");
  const [valuesText, setValuesText] = useState("");
  const [profileGender, setProfileGender] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [orientation, setOrientation] = useState("");
  const [childrenStatus, setChildrenStatus] = useState("");
  const [visibility, setVisibility] = useState<ProfileVisibility>("PUBLIC");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [recapRefreshTrigger, setRecapRefreshTrigger] = useState(0);
  const [recapRegenerating, setRecapRegenerating] = useState(false);

  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null,
  );
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [interestsError, setInterestsError] = useState<string | null>(null);
  const [interestsSaving, setInterestsSaving] = useState(false);

  const [avatar, setAvatar] = useState<MediaResponse | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarLightbox, setAvatarLightbox] = useState(false);
  const [recentPosts, setRecentPosts] = useState<PostResponse[]>([]);
  const [recentPostsPage, setRecentPostsPage] = useState(0);
  const [recentPostsHasMore, setRecentPostsHasMore] = useState(false);
  const [recentPostsLoading, setRecentPostsLoading] = useState(false);
  const [recentPostsError, setRecentPostsError] = useState<string | null>(null);
  const [postActionError, setPostActionError] = useState<string | null>(null);
  const [referralLink, setReferralLink] = useState<ReferralLinkResponse | null>(
    null,
  );
  const [referralError, setReferralError] = useState<string | null>(null);
  const [referralCopied, setReferralCopied] = useState(false);
  const [deleteProfileModalOpen, setDeleteProfileModalOpen] = useState(false);
  const [deleteProfileConfirmation, setDeleteProfileConfirmation] =
    useState("");
  const [deleteProfileLoading, setDeleteProfileLoading] = useState(false);
  const [deleteProfileError, setDeleteProfileError] = useState<string | null>(
    null,
  );
  const [profileRecapToShare, setProfileRecapToShare] = useState<string | null>(
    null,
  );
  const [passwordResetSending, setPasswordResetSending] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountEmailSaving, setAccountEmailSaving] = useState(false);
  const [accountEmailError, setAccountEmailError] = useState<string | null>(null);
  const [emailVerificationModalOpen, setEmailVerificationModalOpen] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isDirty = useMemo(() => {
    if (!profileInitializedRef.current) return false;
    if (!interestsInitializedRef.current) return false;

    const profileChanged =
      fullName !== (profile?.fullName ?? "") ||
      birthDate !== (profile?.birthDate ?? "") ||
      city !== (profile?.city ?? "") ||
      country !== (profile?.country ?? "") ||
      birthPlace !== (profile?.birthPlace ?? "") ||
      jobTitle !== (profile?.jobTitle ?? "") ||
      companyName !== (profile?.companyName ?? "") ||
      bio !== (profile?.bio ?? "") ||
      traitsText !== (profile?.traitsText ?? "") ||
      lovesText !== (profile?.lovesText ?? "") ||
      dislikesText !== (profile?.dislikesText ?? "") ||
      goalsText !== (profile?.goalsText ?? "") ||
      valuesText !== (profile?.valuesText ?? "") ||
      profileGender !== (profile?.gender ?? "") ||
      relationshipStatus !== (profile?.relationshipStatus ?? "") ||
      orientation !== (profile?.orientation ?? "") ||
      childrenStatus !== (profile?.childrenStatus ?? "") ||
      visibility !== (profile?.visibility ?? "PUBLIC");

    const originalTagIds = interests?.tags.map((tag) => tag.id) ?? [];
    const interestsChanged =
      selectedTagIds.length !== originalTagIds.length ||
      !selectedTagIds.every((id) => originalTagIds.includes(id));

    return profileChanged || interestsChanged;
  }, [
    profile,
    interests,
    fullName,
    birthDate,
    city,
    country,
    birthPlace,
    jobTitle,
    companyName,
    bio,
    traitsText,
    lovesText,
    dislikesText,
    goalsText,
    valuesText,
    profileGender,
    relationshipStatus,
    orientation,
    childrenStatus,
    visibility,
    selectedTagIds,
  ]);

  const {
    showModal: showUnsavedModal,
    confirmNavigation,
    cancelNavigation,
  } = useUnsavedChanges({ isDirty });

  useEffect(() => {
    if (pathname !== "/profile") return;
    if (typeof window !== "undefined" && window.location.hash === "#insights") {
      router.replace("/profile", { scroll: false });
    }
  }, [pathname, router]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    authActions.hydrate();
    authActions.fetchMe().catch(() => undefined);
    userActions.fetchProfile().catch(() => undefined);
    tagsActions.fetchTags().catch(() => undefined);
    tagsActions.fetchUserInterests().catch(() => undefined);
    testsActions.fetchTests().catch(() => undefined);
    testsActions.fetchCompletedCount().catch(() => undefined);
  }, [authActions, tagsActions, testsActions, userActions]);

  useEffect(() => {
    if (analyticsTrackedRef.current) return;
    if (status !== "authenticated") return;
    analyticsTrackedRef.current = true;
    analyticsActions
      .trackEvent({ eventType: "PROFILE_VIEWED" })
      .catch(() => undefined);
  }, [analyticsActions, status]);

  // Sync form state from profile whenever profile loads or updates (e.g. after save)
  useEffect(() => {
    if (!profile) return;
    const profileUpdatedAt = profile.updatedAt ?? "";
    if (profileInitializedRef.current === profileUpdatedAt) return;
    profileInitializedRef.current = profileUpdatedAt;
    setFullName(profile.fullName ?? "");
    setBirthDate(profile.birthDate ?? "");
    setCity(profile.city ?? "");
    setCountry(profile.country ?? "");
    setBirthPlace(profile.birthPlace ?? "");
    setJobTitle(profile.jobTitle ?? "");
    setCompanyName(profile.companyName ?? "");
    setBio(profile.bio ?? "");
    setTraitsText(profile.traitsText ?? "");
    setLovesText(profile.lovesText ?? "");
    setDislikesText(profile.dislikesText ?? "");
    setGoalsText(profile.goalsText ?? "");
    setValuesText(profile.valuesText ?? "");
    setProfileGender(profile.gender ?? "");
    setRelationshipStatus(profile.relationshipStatus ?? "");
    setOrientation(profile.orientation ?? "");
    setChildrenStatus(profile.childrenStatus ?? "");
    setVisibility(profile.visibility ?? "PUBLIC");
  }, [profile]);

  useEffect(() => {
    if (!interests || interestsInitializedRef.current) return;
    setSelectedTagIds(interests.tags.map((tag) => tag.id));
    interestsInitializedRef.current = true;
  }, [interests]);

  useEffect(() => {
    if (user?.email !== undefined) setAccountEmail(user.email ?? "");
  }, [user?.email]);

  useEffect(() => {
    if (!user?.id || avatarInitializedRef.current) return;
    avatarInitializedRef.current = true;
    setAvatarLoading(true);
    setAvatarError(null);
    getMediaByOwner({
      ownerType: "USER_PROFILE",
      ownerId: user.id,
      page: 0,
      size: 1,
    })
      .then((response) => {
        setAvatar(response.content[0] ?? null);
      })
      .catch((loadError) => {
        setAvatarError(
          resolveErrorMessage(loadError, "Error loading profile photo."),
        );
      })
      .finally(() => setAvatarLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || usernameInitializedRef.current) return;
    usernameInitializedRef.current = true;
    setUsername(user.username ?? "");
    setPhone(user.phone ?? "");
    setUsernameAvailable(user.username ? true : null);
  }, [user?.id, user?.phone, user?.username]);

  useEffect(() => {
    if (!usernameInitializedRef.current) return;
    const normalized = normalizeUsername(username);
    const current = normalizeUsername(user?.username ?? "");

    if (!normalized) {
      setUsernameAvailable(null);
      setUsernameChecking(false);
      return;
    }

    if (normalized.length < USERNAME_MIN_LENGTH) {
      setUsernameAvailable(null);
      setUsernameChecking(false);
      return;
    }

    if (normalized === current) {
      setUsernameAvailable(true);
      setUsernameChecking(false);
      return;
    }

    setUsernameChecking(true);
    const timeout = window.setTimeout(() => {
      checkUsernameAvailability(normalized)
        .then((response) => {
          setUsernameAvailable(response.available);
        })
        .catch((loadError) => {
          setUsernameError(
            resolveErrorMessage(loadError, "Error checking username."),
          );
          setUsernameAvailable(null);
        })
        .finally(() => setUsernameChecking(false));
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [username, user?.username]);

  useEffect(() => {
    if (!user?.id || momentsInitializedRef.current) return;
    momentsInitializedRef.current = true;
    setRecentPostsLoading(true);
    setRecentPostsError(null);
    getUserPosts(user.id, { page: 0, size: MOMENTS_PAGE_SIZE })
      .then((response) => {
        setRecentPosts(response.content ?? []);
        setRecentPostsPage(response.number ?? 0);
        setRecentPostsHasMore(!response.last);
      })
      .catch((loadError) => {
        setRecentPostsError(
          resolveErrorMessage(loadError, "Error loading moments."),
        );
      })
      .finally(() => setRecentPostsLoading(false));
  }, [user?.id]);

  const displayName =
    profile?.fullName?.trim() || user?.username || user?.email || t("Profile");

  const interestItems = useMemo(
    () =>
      tags.map((tag) => ({
        id: tag.id,
        label: t(toInterestTranslationKey(tag.name)),
        selected: selectedTagIds.includes(tag.id),
      })),
    [tags, selectedTagIds, t],
  );

  const selectedTags = useMemo(() => {
    const fallbackTags = interests?.tags ?? [];
    const tagById = new Map(tags.map((tag) => [tag.id, tag.name]));
    const ids = selectedTagIds.length
      ? selectedTagIds
      : fallbackTags.map((tag) => tag.id);

    return ids
      .map((id) => {
        const name =
          tagById.get(id) ?? fallbackTags.find((tag) => tag.id === id)?.name;
        return name ? { id, label: t(toInterestTranslationKey(name)), tone: "accent" as const } : null;
      })
      .filter(
        (item): item is { id: string; label: string; tone: "accent" } =>
          item !== null,
      );
  }, [interests, selectedTagIds, tags, t]);

  const normalizedUsername = normalizeUsername(username);
  const currentUsername = normalizeUsername(user?.username ?? "");
  const usernameChanged = normalizedUsername !== currentUsername;
  const usernameValid = normalizedUsername.length >= USERNAME_MIN_LENGTH;
  const canSaveUsername =
    usernameChanged &&
    usernameValid &&
    usernameAvailable === true &&
    !usernameChecking &&
    !usernameSaving;

  const usernameHint = useMemo(() => {
    if (!normalizedUsername) return t("Choose a unique username.");
    if (!usernameValid) {
      return t("Minimum {count} characters.", { count: USERNAME_MIN_LENGTH });
    }
    if (usernameChecking) return t("Checking availability...");
    if (usernameAvailable === true) return t("Username available.");
    if (usernameAvailable === false) return t("Username not available.");
    return t("Checking availability...");
  }, [
    normalizedUsername,
    t,
    usernameAvailable,
    usernameChecking,
    usernameValid,
  ]);

  const normalizedPhone = normalizePhone(phone);
  const currentPhone = normalizePhone(user?.phone ?? "");
  const phoneChanged = normalizedPhone !== currentPhone;
  const phoneValid =
    normalizedPhone.length === 0 || PHONE_PATTERN.test(normalizedPhone);
  const canSavePhone = phoneChanged && phoneValid && !phoneSaving;

  const phoneHint = useMemo(() => {
    if (!normalizedPhone) return t("Add your number if you want.");
    if (!phoneValid) return t("Use an international format, e.g. +393331234567.");
    return t("Phone looks good.");
  }, [normalizedPhone, phoneValid, t]);

  const handleSaveProfile = async () => {
    setProfileError(null);
    const trimmedName = fullName.trim();
    const trimmedCity = city.trim();
    const trimmedCountry = country.trim();
    const trimmedJobTitle = jobTitle.trim();
    const trimmedCompanyName = companyName.trim();
    const trimmedBio = bio.trim();
    const trimmedTraits = traitsText.trim();
    const trimmedLoves = lovesText.trim();
    const trimmedDislikes = dislikesText.trim();
    const trimmedGoals = goalsText.trim();
    const trimmedValues = valuesText.trim();

    if (!trimmedName) {
      setProfileError("Enter your full name.");
      return;
    }

    if (!trimmedCity || !trimmedCountry) {
      setProfileError("Enter your city and country of residence.");
      return;
    }

    const payload: UserProfileRequest = {
      fullName: trimmedName,
      birthDate: birthDate || null,
      city: trimmedCity,
      country: trimmedCountry,
      birthPlace: birthPlace.trim() ? birthPlace.trim() : "",
      jobTitle: trimmedJobTitle,
      companyName: trimmedCompanyName,
      bio: trimmedBio || null,
      traitsText: trimmedTraits,
      lovesText: trimmedLoves,
      dislikesText: trimmedDislikes,
      goalsText: trimmedGoals,
      valuesText: trimmedValues,
      gender: profileGender || null,
      relationshipStatus,
      orientation,
      childrenStatus,
      visibility,
    };

    setProfileSaving(true);
    try {
      await userActions.saveProfile(payload);
      setFullName(trimmedName);
      setCity(trimmedCity);
      setCountry(trimmedCountry);
      setJobTitle(trimmedJobTitle);
      setCompanyName(trimmedCompanyName);
      // Ensure global profile (e.g. navbar display name) is updated
      await userActions.fetchProfile().catch(() => undefined);
    } catch (saveError) {
      setProfileError(resolveErrorMessage(saveError, "Error while saving."));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleInterestToggle = (id: string, nextSelected: boolean) => {
    setInterestsError(null);
    setSelectedTagIds((prev) =>
      nextSelected ? [...prev, id] : prev.filter((item) => item !== id),
    );
  };

  const handleSaveInterests = async () => {
    setInterestsError(null);

    if (selectedTagIds.length < MIN_INTERESTS) {
      setInterestsError(
        t("Select at least {count} interests.", { count: MIN_INTERESTS }),
      );
      return;
    }

    setInterestsSaving(true);
    try {
      await tagsActions.updateUserInterests({ tagIds: selectedTagIds });
    } catch (saveError) {
      setInterestsError(resolveErrorMessage(saveError, "Error while saving."));
    } finally {
      setInterestsSaving(false);
    }
  };

  const handleAvatarSelect = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!user?.id) {
      setAvatarError("User unavailable.");
      event.target.value = "";
      return;
    }
    if (!file.type.startsWith("image/")) {
      setAvatarError("Unsupported file type. Use an image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setAvatarError(
        t("Image is too large. Maximum size is {size} MB.", {
          size: MAX_AVATAR_SIZE_MB,
        }),
      );
      event.target.value = "";
      return;
    }

    setAvatarError(null);
    setAvatarLoading(true);
    try {
      const uploaded = await uploadMedia({
        file,
        ownerType: "USER_PROFILE",
        ownerId: user.id,
      });
      setAvatar(uploaded);
      dispatchProfileAvatarUpdated({
        userId: user.id,
        avatarUrl: uploaded.url,
      });
    } catch (uploadError) {
      setAvatarError(
        resolveErrorMessage(uploadError, "Error while uploading."),
      );
    } finally {
      setAvatarLoading(false);
      event.target.value = "";
    }
  };

  const handleSaveUsername = async () => {
    setUsernameError(null);
    if (!normalizedUsername) {
      setUsernameError("Enter a valid username.");
      return;
    }
    if (!usernameValid) {
      setUsernameError(
        t("Minimum {count} characters.", { count: USERNAME_MIN_LENGTH }),
      );
      return;
    }
    if (usernameAvailable === false) {
      setUsernameError("Username unavailable.");
      return;
    }

    setUsernameSaving(true);
    try {
      await userActions.updateUser({ username: normalizedUsername });
    } catch (saveError) {
      setUsernameError(resolveErrorMessage(saveError, "Error while saving."));
    } finally {
      setUsernameSaving(false);
    }
  };

  const handleSavePhone = async () => {
    setPhoneError(null);
    if (!phoneValid) {
      setPhoneError("Use an international format, e.g. +393331234567.");
      return;
    }

    setPhoneSaving(true);
    try {
      await userActions.updateUser({ phone: normalizedPhone || "" });
      setPhone(normalizedPhone);
    } catch (saveError) {
      setPhoneError(resolveErrorMessage(saveError, "Error while saving."));
    } finally {
      setPhoneSaving(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    getMyReferralLink()
      .then((response) => {
        if (!active) return;
        setReferralLink(response);
        setReferralError(null);
      })
      .catch((error) => {
        if (!active) return;
        setReferralError(resolveErrorMessage(error, "Error loading referral."));
      });

    return () => {
      active = false;
    };
  }, [user?.id]);

  const isAuthLoading = status === "loading";
  const canConfirmProfileDeletion =
    deleteProfileConfirmation.trim() === DELETE_PROFILE_CONFIRMATION_PHRASE &&
    !deleteProfileLoading;
  const isTagsReady = tags.length > 0;
  const isTagsLoading = tagsLoading && !isTagsReady;
  const mergedError =
    profileError ??
    interestsError ??
    avatarError ??
    usernameError ??
    phoneError;
  const baseError = error?.message ?? tagsError?.message;
  const showError = mergedError || baseError;

  const referralUrl = useMemo(() => {
    if (!referralLink?.code) return "";
    if (typeof window === "undefined") {
      return `/register?ref=${referralLink.code}`;
    }
    return `${window.location.origin}/register?ref=${referralLink.code}`;
  }, [referralLink?.code]);

  const referralLoading = Boolean(user?.id) && !referralLink && !referralError;

  const handleCopyReferral = async () => {
    if (!referralUrl) return;
    try {
      await navigator.clipboard.writeText(referralUrl);
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2000);
    } catch {
      setReferralError("Unable to copy the link.");
    }
  };

  const handleOpenDeleteProfileModal = () => {
    setDeleteProfileError(null);
    setDeleteProfileConfirmation("");
    setDeleteProfileModalOpen(true);
  };

  const handleCloseDeleteProfileModal = () => {
    if (deleteProfileLoading) return;
    setDeleteProfileModalOpen(false);
    setDeleteProfileError(null);
  };

  const handleSendPasswordResetLink = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    const email = user?.email?.trim().toLowerCase();
    if (!email) {
      setPasswordError("No email configured on your account.");
      return;
    }

    setPasswordResetSending(true);
    try {
      const response = await requestPasswordReset({ email });
      setPasswordSuccess(
        response.message ||
          "If the email is registered, you will receive reset instructions shortly.",
      );
    } catch (err) {
      setPasswordError(resolveErrorMessage(err, "Unable to request password reset."));
    } finally {
      setPasswordResetSending(false);
    }
  };

  const handleSaveAccountEmail = async () => {
    const trimmed = accountEmail.trim();
    if (!trimmed) {
      setAccountEmailError("Email is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setAccountEmailError("Please enter a valid email address.");
      return;
    }
    if (trimmed === user?.email?.trim()) return;
    setAccountEmailError(null);
    setAccountEmailSaving(true);
    try {
      const response = await updateCurrentUser({ email: trimmed });
      setAccountEmail(trimmed);
      if (response.user) {
        authActions.setUser(response.user);
      }
      if (response.requiresVerification?.email) {
        setEmailToVerify(response.requiresVerification.email);
        setEmailVerificationModalOpen(true);
      }
    } catch (err) {
      setAccountEmailError(resolveErrorMessage(err, "Unable to update email."));
    } finally {
      setAccountEmailSaving(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!canConfirmProfileDeletion) {
      setDeleteProfileError(
        t('Type \"{phrase}\" to continue.', {
          phrase: DELETE_PROFILE_CONFIRMATION_PHRASE,
        }),
      );
      return;
    }

    setDeleteProfileLoading(true);
    setDeleteProfileError(null);
    try {
      await deleteCurrentUser({
        confirmationPhrase: deleteProfileConfirmation.trim(),
      });
      resetAllStores();
      authActions.clearSession();
      router.replace("/login");
    } catch (deleteError) {
      setDeleteProfileError(
        resolveErrorMessage(deleteError, "Unable to delete your profile."),
      );
    } finally {
      setDeleteProfileLoading(false);
    }
  };

  const handleProfileRecapLoaded = useCallback((nextRecap: string) => {
    setProfileRecapToShare(nextRecap);
  }, []);

  const handleEditPost = useCallback(
    async (
      postId: string,
      payload: { content: string; mediaToDelete?: string[]; newFiles?: File[] },
    ) => {
      setPostActionError(null);
      try {
        const updated = await updatePostRequest(postId, {
          content: payload.content,
        });
        setRecentPosts((prev) =>
          prev.map((p) => (p.id === postId ? updated : p)),
        );

        if (payload.mediaToDelete?.length) {
          for (const mediaId of payload.mediaToDelete) {
            await deletePostMedia(postId, mediaId);
          }
        }

        if (payload.newFiles?.length) {
          for (const file of payload.newFiles) {
            await uploadPostMedia({ postId, file });
          }
        }

        if (payload.mediaToDelete?.length || payload.newFiles?.length) {
          const mediaPage = await getPostMedia({ postId, page: 0, size: 20 });
          const previews = mediaPage.content.map((m) => ({
            id: m.id,
            url: m.url,
            mediaType: m.mediaType,
            createdAt: m.createdAt,
          }));
          setRecentPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, media: previews } : p)),
          );
        }
      } catch (error) {
        const message = resolveErrorMessage(
          error,
          "Error while updating the post.",
        );
        setPostActionError(message);
        throw new Error(message);
      }
    },
    [],
  );

  const handleDeletePost = useCallback(async (postId: string) => {
    setPostActionError(null);
    try {
      await deletePostRequest(postId);
      setRecentPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (error) {
      const message = resolveErrorMessage(
        error,
        "Error while deleting the post.",
      );
      setPostActionError(message);
      throw new Error(message);
    }
  }, []);

  const handleLoadMorePosts = useCallback(() => {
    if (recentPostsLoading || !recentPostsHasMore || !user?.id) return;
    setRecentPostsLoading(true);
    getUserPosts(user.id, {
      page: recentPostsPage + 1,
      size: MOMENTS_PAGE_SIZE,
    })
      .then((response) => {
        setRecentPosts((prev) => [...prev, ...(response.content ?? [])]);
        setRecentPostsPage(response.number ?? recentPostsPage + 1);
        setRecentPostsHasMore(!response.last);
      })
      .catch((loadError) => {
        setRecentPostsError(
          resolveErrorMessage(loadError, "Error loading moments."),
        );
      })
      .finally(() => setRecentPostsLoading(false));
  }, [recentPostsHasMore, recentPostsLoading, recentPostsPage, user?.id]);

  const postItems = useMemo(
    () =>
      recentPosts.map((post) => ({
        post,
        authorName: displayName,
        avatarUrl: avatar?.url ?? profile?.avatarUrl ?? undefined,
        currentUserId: user?.id,
        onEditPost: handleEditPost,
        onDeletePost: handleDeletePost,
      })),
    [
      recentPosts,
      displayName,
      avatar?.url,
      profile?.avatarUrl,
      user?.id,
      handleEditPost,
      handleDeletePost,
    ],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="grid gap-4 lg:grid-cols-[1.4fr,1fr]">
        <Card className="p-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
              {resolvedTitle}
            </p>
            <h1 className="text-2xl font-semibold text-foreground">
              {profileCompletionLoading
                ? t("Loading profile…")
                : t("{name}, Your Profile Is {percent}% Complete.", {
                    name: displayName,
                    percent: displayPercentage,
                  })}
            </h1>
            <p className="text-sm text-muted">{resolvedSubtitle}</p>
          </div>
          {!profileCompletionLoading ? (
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-muted/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)] transition-all duration-500 ease-out"
                style={{ width: `${displayPercentage}%` }}
              />
            </div>
          ) : null}
          {!profileCompletionLoading ? (
            <div className="mt-4 border-t border-border/70 pt-4">
              <p className="text-sm font-semibold text-foreground">
                {profileIsComplete
                  ? t("Profile completed")
                  : topCompletionSuggestion
                    ? `${topCompletionSuggestion.label} ${topCompletionSuggestion.detail}`
                    : t("Complete your profile to get more accurate matches.")}
              </p>
              <p className="mt-2 text-sm text-muted">
                {profileIsComplete
                  ? t("All required information has been filled in.")
                  : t(
                      "This helps Zyra reduce mismatches and show you only people and places that truly fit you."
                    )}
              </p>
            </div>
          ) : null}
        </Card>
      </div>

      <section className="space-y-4">
        <SectionHeader
          title={t("Zyra recap")}
          subtitle={t("Review and edit how Zyra describes you.")}
        />
        <ZyraProfileRecap
          onRecapLoaded={handleProfileRecapLoaded}
          recapRefreshTrigger={recapRefreshTrigger}
          regenerating={recapRegenerating}
        />
        {profileRecapToShare ? (
          <ShareZyraRecapCard recap={profileRecapToShare} userId={user?.id} />
        ) : null}
      </section>

      <section id="profile" className="space-y-4">
        <SectionHeader
          title={t("Who you are to Syncro")}
          subtitle={t("Keep your profile fresh and aligned with your goals.")}
        />
        <Card className="p-6">
          <div className="grid gap-4 lg:grid-cols-[220px,1fr]">
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => avatar?.url && setAvatarLightbox(true)}
                className={cx(
                  "flex-shrink-0 rounded-full transition-transform hover:scale-105",
                  avatar?.url && "cursor-pointer",
                )}
                aria-label={t("View profile photo")}
                disabled={!avatar?.url}
              >
                <Avatar name={displayName} src={avatar?.url} size="2xl" />
              </button>
              {avatarLightbox && avatar?.url ? (
                <ImageLightbox
                  src={avatar.url}
                  alt={displayName}
                  onClose={() => setAvatarLightbox(false)}
                />
              ) : null}
              <Button
                size="sm"
                variant="secondary"
                onClick={handleAvatarSelect}
                loading={avatarLoading}
                loadingText={t("Upload")}
              >
                {t("Update photo")}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarUpload}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label={t("Full name")}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder={t("E.g. Marco / Mark / M")}
                required
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("Lives in")}
                </label>
                <PlacesAutocomplete
                  placeholder={t("City, Country")}
                  types={["(cities)"]}
                  fetchAddressComponents
                  value={[city, country].filter(Boolean).join(", ")}
                  onPlaceSelect={(place: PlaceResult) => {
                    if (place.city !== undefined && place.country !== undefined) {
                      setCity(place.city);
                      setCountry(place.country);
                    } else {
                      setCity(place.address || place.name);
                      setCountry("");
                    }
                  }}
                  onClear={() => {
                    setCity("");
                    setCountry("");
                  }}
                  onInputChange={(v) => {
                    setCity(v);
                    setCountry("");
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  {t("Born in")}
                </label>
                <PlacesAutocomplete
                  placeholder={t("City, Country")}
                  types={["(cities)"]}
                  value={birthPlace}
                  onPlaceSelect={(place: PlaceResult) => {
                    setBirthPlace(place.address || place.name);
                  }}
                  onClear={() => setBirthPlace("")}
                  onInputChange={setBirthPlace}
                />
              </div>
              <DatePicker
                label={t("Date of birth")}
                value={birthDate}
                onValueChange={setBirthDate}
                placeholder={t("DD / MM / YYYY")}
                maxYear={new Date().getFullYear()}
              />
              <Input
                label={t("Work")}
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                placeholder={t("E.g. Software Developer")}
              />
              <Input
                label={t("Works at")}
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder={t("E.g. Freelance / Startup / Company")}
              />
              <Input
                label={t("What defines me")}
                value={traitsText}
                onChange={(event) => setTraitsText(event.target.value)}
                placeholder={t("E.g. Curious, Adventurous, Empathetic")}
              />
              <Input
                label={t("Current focus")}
                value={goalsText}
                onChange={(event) => setGoalsText(event.target.value)}
                placeholder={t("E.g. Work, Personal Growth, Relationships")}
              />
              <Input
                label={t("Beliefs & worldview")}
                value={valuesText}
                onChange={(event) => setValuesText(event.target.value)}
                placeholder={t("E.g. Spiritual, Atheist, Catholic...")}
              />
              <Input
                label={t("Deal breakers")}
                value={dislikesText}
                onChange={(event) => setDislikesText(event.target.value)}
                placeholder={t("E.g. Lack of communication, Dishonesty...")}
              />
              <Input
                label={t("What I'm seeking")}
                value={lovesText}
                onChange={(event) => setLovesText(event.target.value)}
                placeholder={t("E.g. A genuine relationship, meaningful connections")}
              />
              <Select
                label={t("Gender identity")}
                value={profileGender}
                onValueChange={setProfileGender}
                options={profileGenderOptions}
                placeholder={t("Select gender")}
              />
              <Select
                label={t("Sexual orientation")}
                value={orientation}
                onValueChange={setOrientation}
                options={orientationOptions}
                placeholder={t("Select orientation")}
              />
              <Select
                label={t("Children")}
                value={childrenStatus}
                onValueChange={setChildrenStatus}
                options={childrenOptions}
                placeholder={t("Select children status")}
              />
              <Select
                label={t("Relationship status")}
                value={relationshipStatus}
                onValueChange={setRelationshipStatus}
                options={relationshipOptions}
                placeholder={t("Select relationship")}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              size="sm"
              loading={profileSaving || isAuthLoading}
              loadingText={t("Saving")}
              onClick={handleSaveProfile}
            >
              {t("Save profile")}
            </Button>
          </div>
        </Card>

      </section>

      <section id="interests" className="space-y-4">
        <SectionHeader
          title={t("What are you into right now?")}
          subtitle={t("Select what you're into at the moment.")}
        />
        {isTagsLoading ? (
          <Card className="flex items-center gap-3 p-5">
            <Loader size="sm" />
            <p className="text-sm text-muted">{t("Loading interests...")}</p>
          </Card>
        ) : (
          <InterestPickerGrid
            items={interestItems}
            hint={t("Select at least {count} interests.", { count: MIN_INTERESTS })}
            onItemToggle={handleInterestToggle}
          />
        )}
        {selectedTags.length ? (
          <Card className="p-5">
            <SelectedTagsRow title={t("Selected")} items={selectedTags} />
          </Card>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            loading={interestsSaving}
            loadingText={t("Saving")}
            onClick={handleSaveInterests}
          >
            {t("Save interests")}
          </Button>
        </div>
      </section>

      <section id="insights" className="space-y-4">
        <SectionHeader
          title={t("Improve Your Matches")}
          subtitle={t("Your progress drives more precise results.")}
        />
        <div className="grid gap-4 lg:grid-cols-[1.6fr,1fr]">
          <TestsHelperCard
            completedCount={completedCount}
            totalTests={totalInsightTests}
            loading={countLoading && completedCount == null}
          />
          <Card className="flex flex-col justify-between gap-4 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zyra-glow/40">
                <ZyraMark size="sm" glow={false} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Zyra</p>
                <p className="text-xs text-muted">
                  {t("Clear signals lead to better matches.")}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted">
              {t("The more you answer, the fewer mismatches you get.")}
            </p>
            <p className="text-xs text-subtle">{t("— Zyra")}</p>
          </Card>
        </div>
        <InsightsDbLanguageDisclaimer />
        {testsLoading && tests.length === 0 ? (
          <Card className="flex items-center gap-3 p-5">
            <Loader size="sm" />
            <p className="text-sm text-muted">{t("Loading insights...")}</p>
          </Card>
        ) : null}
        {testsError ? (
          <ErrorState
            title={t("Unable to load insights")}
            description={testsError.message}
          />
        ) : null}
        {!testsLoading && !testsError && insightTestItems.length === 0 ? (
          <EmptyState
            title={t("No insights available")}
            description={t("Check back later for new profiling insights.")}
          />
        ) : null}
        {insightTestItems.length > 0 ? (
          <Card className="p-5">
            <MapTestListItem items={insightTestItems} />
          </Card>
        ) : null}
      </section>

      <Card className="space-y-3 p-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">
            {t("Referral link")}
          </h2>
          <p className="text-sm text-muted">
            {t("Invite friends to Syncro with your personal link.")}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input
            label={t("Your referral link")}
            value={referralUrl}
            readOnly
            placeholder={referralLoading ? t("Loading...") : t("Not available")}
          />
          <div className="flex items-end">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleCopyReferral}
              disabled={!referralUrl || referralLoading}
            >
              {referralCopied ? t("Copied") : t("Copy link")}
            </Button>
          </div>
        </div>
        {referralError ? (
          <p className="text-xs text-danger">{t(referralError)}</p>
        ) : (
          <p className="text-xs text-subtle">
            {t("Used {count} times", { count: referralLink?.usesCount ?? 0 })}
          </p>
        )}
      </Card>

      {showAccountSection ? (
        <section id="account" className="space-y-4">
          <SectionHeader
            title={t("Account")}
            subtitle={t("Email, password and account deletion.")}
          />
          <Card className="space-y-4 p-5">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                label={t("Email")}
                type="email"
                autoComplete="email"
                value={accountEmail}
                onChange={(e) => {
                  setAccountEmailError(null);
                  setAccountEmail(e.target.value);
                }}
                placeholder={t("Your email address")}
                error={accountEmailError ? t(accountEmailError) : undefined}
              />
              <div className="flex items-end">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleSaveAccountEmail}
                  loading={accountEmailSaving}
                  loadingText={t("Saving")}
                  disabled={
                    accountEmailSaving ||
                    accountEmail.trim() === (user?.email ?? "").trim()
                  }
                >
                  {t("Save email")}
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                label={t("Username")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("Choose a unique username")}
                error={usernameError ? t(usernameError) : undefined}
                hint={usernameHint}
              />
              <div className="flex items-end">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleSaveUsername}
                  loading={usernameSaving}
                  loadingText={t("Saving")}
                  disabled={!canSaveUsername}
                >
                  {t("Save username")}
                </Button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                label={t("Phone")}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("e.g. +393331234567")}
                error={phoneError ? t(phoneError) : undefined}
                hint={phoneHint}
              />
              <div className="flex items-end">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleSavePhone}
                  loading={phoneSaving}
                  loadingText={t("Saving")}
                  disabled={!canSavePhone}
                >
                  {t("Save phone")}
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                {t("Password")}
              </p>
              <p className="text-sm text-muted">
                {t(
                  "For security, password changes happen through a reset link sent to your email."
                )}
              </p>
              <p className="text-sm text-muted">
                {t("Destination email")}:{" "}
                <span className="font-medium text-foreground">{user?.email ?? "-"}</span>
              </p>
              {passwordError ? (
                <p className="text-sm text-danger">{t(passwordError)}</p>
              ) : null}
              {passwordSuccess ? (
                <p className="text-sm text-success">{t(passwordSuccess)}</p>
              ) : null}
              {passwordSuccess ? (
                <p className="text-xs text-muted">
                  {t("If you don't see the email, check your spam or junk folder.")}
                </p>
              ) : null}
              <Button
                type="button"
                size="sm"
                loading={passwordResetSending}
                loadingText={t("Sending...")}
                disabled={passwordResetSending}
                onClick={handleSendPasswordResetLink}
              >
                {t("Send reset link")}
              </Button>
            </div>
            <p className="text-xs text-muted">
              {t("Use the email link to set the new password securely.")}
            </p>
            <div className="border-t border-border/70 pt-4">
              <h3 className="text-sm font-semibold text-danger">
                {t("Danger zone")}
              </h3>
              <p className="mt-1 text-xs text-danger/90">
                {t("Deleting your profile is permanent and cannot be undone.")}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={handleOpenDeleteProfileModal}
                >
                  {t("Delete profile")}
                </Button>
                <p className="text-xs text-danger/80">
                  {t("You will need to type a confirmation phrase.")}
                </p>
              </div>
            </div>
          </Card>
        </section>
      ) : null}

      <section className="space-y-4">
        <SectionHeader
          title={t("My Moments")}
          subtitle={t("Moments that matter. Even if they're just for you.")}
        />

        {postActionError ? (
          <Card className="flex flex-wrap items-start justify-between gap-3 border-danger/30 bg-danger/10 p-4">
            <p className="text-sm text-danger">{t(postActionError)}</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPostActionError(null)}
            >
              {t("Close")}
            </Button>
          </Card>
        ) : null}

        {recentPostsLoading && recentPosts.length === 0 ? (
          <Card className="flex items-center gap-3 p-5">
            <Loader size="sm" />
            <p className="text-sm text-muted">{t("Loading moments...")}</p>
          </Card>
        ) : recentPostsError ? (
          <Card className="border-danger/30 bg-danger/10 p-4">
            <p className="text-sm text-danger">{t(recentPostsError)}</p>
          </Card>
        ) : recentPosts.length === 0 ? (
          <Card className="p-5">
            <p className="text-sm text-muted">{t("No moments available.")}</p>
          </Card>
        ) : (
          <MapPostCard items={postItems} />
        )}

        {recentPostsHasMore ? (
          <div className="flex justify-center">
            <Button
              variant="secondary"
              size="md"
              onClick={handleLoadMorePosts}
              loading={recentPostsLoading}
              loadingText={t("Loading")}
            >
              {t("Load more")}
            </Button>
          </div>
        ) : null}
      </section>

      {showError ? (
        <Card className="border-danger/30 bg-danger/10 p-4">
          <p className="text-sm text-danger">
            {t(mergedError ?? baseError ?? "Unexpected error.")}
          </p>
        </Card>
      ) : null}

      <Modal
        open={deleteProfileModalOpen}
        title={t("Delete your profile")}
        description={t("This action permanently removes your account and data.")}
        onClose={handleCloseDeleteProfileModal}
        secondaryAction={{
          label: t("Cancel"),
          onClick: handleCloseDeleteProfileModal,
          variant: "secondary",
          disabled: deleteProfileLoading,
        }}
        primaryAction={{
          label: t("Delete permanently"),
          onClick: handleDeleteProfile,
          variant: "danger",
          disabled: !canConfirmProfileDeletion,
          loading: deleteProfileLoading,
          loadingText: t("Deleting"),
        }}
      >
        <div className="space-y-3">
          <p className="text-sm text-muted">
            {t("Type {phrase} to confirm.", {
              phrase: DELETE_PROFILE_CONFIRMATION_PHRASE,
            })}
          </p>
          <Input
            label={t("Confirmation phrase")}
            value={deleteProfileConfirmation}
            onChange={(event) => {
              setDeleteProfileError(null);
              setDeleteProfileConfirmation(event.target.value);
            }}
            placeholder={DELETE_PROFILE_CONFIRMATION_PHRASE}
            autoComplete="off"
          />
          {deleteProfileError ? (
            <p className="text-xs text-danger">{t(deleteProfileError)}</p>
          ) : null}
        </div>
      </Modal>

      <UnsavedChangesModal
        open={showUnsavedModal}
        onConfirm={confirmNavigation}
        onCancel={cancelNavigation}
      />

      <EmailVerificationOtpModal
        open={emailVerificationModalOpen}
        email={emailToVerify}
        onClose={() => setEmailVerificationModalOpen(false)}
        onSuccess={() => setEmailVerificationModalOpen(false)}
      />
    </div>
  );
};
