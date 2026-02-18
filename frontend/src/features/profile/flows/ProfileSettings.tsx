"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/elements/Avatar";
import { ImageLightbox } from "@/components/elements/ImageLightbox";
import { cx } from "@/lib/classNames";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { DatePicker } from "@/components/elements/DatePicker";
import { Input } from "@/components/elements/Input";
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
  changeCurrentUserPassword,
  checkUsernameAvailability,
  deleteCurrentUser,
  getUserPosts,
  updateCurrentUser,
} from "@/services/users";
import {
  updatePost as updatePostRequest,
  deletePost as deletePostRequest,
} from "@/services/social";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { MapPostCard } from "@/features/social/lists/MapPostCard";
import { ZyraProfileRecap } from "@/features/zyra/cards/ZyraProfileRecap";
import { ShareZyraRecapCard } from "@/features/zyra/cards/ShareZyraRecapCard";
import { dispatchProfileAvatarUpdated } from "@/lib/mediaEvents";
import { ZYRA_AVATAR_SRC } from "@/lib/zyraAvatar";
import { resetAllStores } from "@/stores/utils/resetAllStores";
import type { MediaResponse } from "@/types/media";
import type { ProfileVisibility, UserProfileRequest } from "@/types/profile";
import type { JsonObject, JsonValue } from "@/types/shared";
import type { PostResponse } from "@/types/social";
import type { ReferralLinkResponse } from "@/types/referrals";

const MIN_INTERESTS = 3;
const USERNAME_MIN_LENGTH = 3;
const MOMENTS_PAGE_SIZE = 6;
const MAX_AVATAR_SIZE_MB = 10;
const MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;
const DELETE_PROFILE_CONFIRMATION_PHRASE = "DELETE MY PROFILE";
const readNumber = (value: JsonValue | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const readBoolean = (value: JsonValue | undefined) =>
  typeof value === "boolean" ? value : undefined;

const readString = (value: JsonValue | undefined) =>
  typeof value === "string" ? value : undefined;

const toNumber = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

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

const MATCH_GENDER_OPTIONS: LabeledOptionKey[] = [
  { value: "ANY", labelKey: "Any" },
  { value: "FEMALE", labelKey: "Women" },
  { value: "MALE", labelKey: "Men" },
  { value: "NON_BINARY", labelKey: "Non-binary" },
  { value: "OTHER", labelKey: "Other" },
];

const GEO_AVAILABILITY_OPTIONS: LabeledOptionKey[] = [
  { value: "MIXED", labelKey: "Mixed (in-person + remote)" },
  { value: "IN_PERSON", labelKey: "In person only" },
  { value: "REMOTE", labelKey: "Remote only" },
];

const DOMAIN_LABELS = {
  love: "Love",
  friendship: "Friendship",
  work: "Work",
  projects: "Projects",
  hobby: "Hobby & Experiences",
  growth: "Growth & Mentorship",
} as const;

type MatchDomainKey = keyof typeof DOMAIN_LABELS;
type DomainFlags = Record<MatchDomainKey, boolean>;

const DEFAULT_ACTIVE_DOMAINS: DomainFlags = {
  love: true,
  friendship: true,
  work: true,
  projects: true,
  hobby: true,
  growth: true,
};

const DOMAIN_KEYS = Object.keys(DOMAIN_LABELS) as MatchDomainKey[];

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
  const { t } = useT();

  const resolvedTitle = title ? t(title) : t("Profile");
  const resolvedSubtitle = subtitle
    ? t(subtitle)
    : t("One last step to make your matches more focused.");

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

  const matchGenderOptions = useMemo(
    () =>
      MATCH_GENDER_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  );

  const geoAvailabilityOptions = useMemo(
    () =>
      GEO_AVAILABILITY_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t],
  );

  const domainLabels = useMemo(
    () =>
      DOMAIN_KEYS.reduce<Record<MatchDomainKey, string>>((acc, key) => {
        acc[key] = t(DOMAIN_LABELS[key]);
        return acc;
      }, {} as Record<MatchDomainKey, string>),
    [t],
  );

  const router = useRouter();
  const { status, user, actions: authActions } = useAuth();
  const { actions: analyticsActions } = useAnalytics();
  const {
    profile,
    preferences,
    loading,
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
  const { hasPosition } = usePosition();
  const { tests, completedCount, actions: testsActions } = useTests();
  const { percentage: profileCompleteness } = useProfileCompletion();
  const displayPercentage = Math.min(100, Math.max(0, Number(profileCompleteness) || 0));

  const initializedRef = useRef(false);
  const analyticsTrackedRef = useRef(false);
  const profileInitializedRef = useRef(false);
  const preferencesInitializedRef = useRef(false);
  const interestsInitializedRef = useRef(false);
  const avatarInitializedRef = useRef(false);
  const momentsInitializedRef = useRef(false);
  const usernameInitializedRef = useRef(false);

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
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

  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [matchGender, setMatchGender] = useState("ANY");
  const [locationCityFilter, setLocationCityFilter] = useState("");
  const [locationCountryFilter, setLocationCountryFilter] = useState("");
  const [geoAvailability, setGeoAvailability] = useState("MIXED");
  const [feedRadiusKm, setFeedRadiusKm] = useState("");
  const [feedOnlyNearby, setFeedOnlyNearby] = useState(true);
  const [feedAutoTranslate, setFeedAutoTranslate] = useState(true);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [preferencesSaving, setPreferencesSaving] = useState(false);

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
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountEmailSaving, setAccountEmailSaving] = useState(false);
  const [accountEmailError, setAccountEmailError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Calcola se ci sono modifiche non salvate
  const isDirty = useMemo(() => {
    // Non considerare dirty se i dati non sono ancora stati caricati
    if (!profileInitializedRef.current) return false;
    if (!preferencesInitializedRef.current) return false;
    if (!interestsInitializedRef.current) return false;

    // Confronta profilo
    const profileChanged =
      fullName !== (profile?.fullName ?? "") ||
      birthDate !== (profile?.birthDate ?? "") ||
      city !== (profile?.city ?? "") ||
      country !== (profile?.country ?? "") ||
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

    // Confronta preferenze
    const storedFilters = (preferences?.matchmakingFilters ?? {}) as Record<
      string,
      JsonValue
    >;
    const storedFeed = (preferences?.feedPreferences ?? {}) as Record<
      string,
      JsonValue
    >;
    const preferencesChanged =
      ageMin !== (readNumber(storedFilters.ageMin)?.toString() ?? "") ||
      ageMax !== (readNumber(storedFilters.ageMax)?.toString() ?? "") ||
      distanceKm !== (readNumber(storedFilters.distanceKm)?.toString() ?? "") ||
      matchGender !== (readString(storedFilters.gender) ?? "ANY") ||
      locationCityFilter !== (readString(storedFilters.locationCity) ?? "") ||
      locationCountryFilter !==
        (readString(storedFilters.locationCountry) ?? "") ||
      geoAvailability !== (readString(storedFilters.geoAvailability) ?? "MIXED") ||
      feedRadiusKm !== (readNumber(storedFeed.radiusKm)?.toString() ?? "") ||
      feedOnlyNearby !== (readBoolean(storedFeed.onlyNearby) ?? true) ||
      feedAutoTranslate !== (readBoolean(storedFeed.autoTranslate) ?? true);

    // Confronta interessi
    const originalTagIds = interests?.tags.map((tag) => tag.id) ?? [];
    const interestsChanged =
      selectedTagIds.length !== originalTagIds.length ||
      !selectedTagIds.every((id) => originalTagIds.includes(id));

    return profileChanged || preferencesChanged || interestsChanged;
  }, [
    profile,
    preferences,
    interests,
    user?.username,
    fullName,
    birthDate,
    city,
    country,
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
    ageMin,
    ageMax,
    distanceKm,
    matchGender,
    locationCityFilter,
    locationCountryFilter,
    geoAvailability,
    feedRadiusKm,
    feedOnlyNearby,
    feedAutoTranslate,
    selectedTagIds,
  ]);

  // Hook per gestire il warning di modifiche non salvate
  const {
    showModal: showUnsavedModal,
    confirmNavigation,
    cancelNavigation,
  } = useUnsavedChanges({ isDirty });

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    authActions.hydrate();
    authActions.fetchMe().catch(() => undefined);
    userActions.fetchProfile().catch(() => undefined);
    userActions.fetchPreferences().catch(() => undefined);
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

  useEffect(() => {
    if (!profile || profileInitializedRef.current) return;
    setFullName(profile.fullName ?? "");
    setBirthDate(profile.birthDate ?? "");
    setCity(profile.city ?? "");
    setCountry(profile.country ?? "");
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
    profileInitializedRef.current = true;
  }, [profile]);

  useEffect(() => {
    if (!preferences || preferencesInitializedRef.current) return;
    const storedFilters = (preferences.matchmakingFilters ?? {}) as Record<
      string,
      JsonValue
    >;
    const storedFeed = (preferences.feedPreferences ?? {}) as Record<
      string,
      JsonValue
    >;

    setAgeMin(readNumber(storedFilters.ageMin)?.toString() ?? "");
    setAgeMax(readNumber(storedFilters.ageMax)?.toString() ?? "");
    setDistanceKm(readNumber(storedFilters.distanceKm)?.toString() ?? "");
    setMatchGender(readString(storedFilters.gender) ?? "ANY");
    setLocationCityFilter(readString(storedFilters.locationCity) ?? "");
    setLocationCountryFilter(readString(storedFilters.locationCountry) ?? "");
    setGeoAvailability(readString(storedFilters.geoAvailability) ?? "MIXED");

    setFeedRadiusKm(readNumber(storedFeed.radiusKm)?.toString() ?? "");
    setFeedOnlyNearby(readBoolean(storedFeed.onlyNearby) ?? true);
    setFeedAutoTranslate(readBoolean(storedFeed.autoTranslate) ?? true);

    preferencesInitializedRef.current = true;
  }, [preferences]);

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
        label: tag.name,
        selected: selectedTagIds.includes(tag.id),
      })),
    [tags, selectedTagIds],
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
        return name ? { id, label: name, tone: "accent" as const } : null;
      })
      .filter(
        (item): item is { id: string; label: string; tone: "accent" } =>
          item !== null,
      );
  }, [interests, selectedTagIds, tags]);

  const displayFirstName = useMemo(() => {
    const first = displayName.trim().split(" ")[0];
    return first || displayName;
  }, [displayName]);

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
    } catch (saveError) {
      setProfileError(resolveErrorMessage(saveError, "Error while saving."));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setPreferencesError(null);

    const minAgeValue = toNumber(ageMin);
    const maxAgeValue = toNumber(ageMax);
    const distanceValue = toNumber(distanceKm);
    const feedRadiusValue = toNumber(feedRadiusKm);

    if (
      minAgeValue !== null &&
      maxAgeValue !== null &&
      minAgeValue > maxAgeValue
    ) {
      setPreferencesError("Minimum age cannot be greater than maximum age.");
      return;
    }

    if ((distanceValue ?? 0) < 0 || (feedRadiusValue ?? 0) < 0) {
      setPreferencesError("Enter positive values for distances.");
      return;
    }

    const matchmakingFilters: JsonObject = {
      ageMin: minAgeValue,
      ageMax: maxAgeValue,
      distanceKm: distanceValue,
      gender: matchGender,
      locationCity: locationCityFilter.trim() || null,
      locationCountry: locationCountryFilter.trim() || null,
      geoAvailability,
      openToNewConnections: true,
      activeDomains: {
        ...DEFAULT_ACTIVE_DOMAINS,
      } as JsonObject,
      sharedInterests: true,
    };

    const feedPreferences: JsonObject = {
      radiusKm: feedRadiusValue,
      onlyNearby: feedOnlyNearby,
      autoTranslate: feedAutoTranslate,
    };

    setPreferencesSaving(true);
    try {
      await userActions.savePreferences({
        matchmakingFilters,
        feedPreferences,
      });
    } catch (saveError) {
      setPreferencesError(
        resolveErrorMessage(saveError, "Error while saving."),
      );
    } finally {
      setPreferencesSaving(false);
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
    preferencesError ??
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

  const handleChangePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError(null);
    if (passwordNew.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (passwordNew !== passwordConfirm) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    if (passwordNew === passwordCurrent) {
      setPasswordError("New password must be different from current password.");
      return;
    }
    setPasswordSaving(true);
    try {
      await changeCurrentUserPassword({
        currentPassword: passwordCurrent,
        newPassword: passwordNew,
      });
      setPasswordSuccess(true);
      setPasswordCurrent("");
      setPasswordNew("");
      setPasswordConfirm("");
      await authActions.logout();
      resetAllStores();
      router.replace("/login");
    } catch (err) {
      setPasswordError(resolveErrorMessage(err, "Unable to update password."));
    } finally {
      setPasswordSaving(false);
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
      const updated = await updateCurrentUser({ email: trimmed });
      authActions.setUser(updated);
      setAccountEmail(trimmed);
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
              {t("{name}, Your Profile Is {percent}% Complete.", {
                name: displayName,
                percent: displayPercentage,
              })}
            </h1>
            <p className="text-sm text-muted">{resolvedSubtitle}</p>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-surface-muted/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--accent-gradient-start)] to-[var(--accent-gradient-end)]"
              style={{ width: `${displayPercentage}%` }}
            />
          </div>
          <div className="mt-4 border-t border-border/70 pt-4">
            <p className="text-sm font-semibold text-foreground">
              {t("Just one thing left: What are you really looking for?")}
            </p>
            <p className="mt-2 text-sm text-muted">
              {t(
                "This helps Zyra reduce mismatches and show you only people and places that truly fit you."
              )}
            </p>
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center gap-3 p-5 text-center">
          <Avatar
            name={t("Zyra")}
            src={ZYRA_AVATAR_SRC}
            size="xl"
            className="border-2 border-white shadow-sm"
          />
          <p className="text-sm font-semibold text-foreground">
            &apos;{t("Define what you're looking for.")}&apos;
          </p>
          <p className="text-xs text-accent">{t("- Zyra")}</p>
        </Card>
      </div>

      <section className="space-y-4">
        <SectionHeader
          title={t("Zyra recap")}
          subtitle={t("Review and edit how Zyra describes you.")}
        />
        <ZyraProfileRecap onRecapLoaded={handleProfileRecapLoaded} />
        {profileRecapToShare ? (
          <ShareZyraRecapCard recap={profileRecapToShare} />
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
              <Input
                label={t("Lives in")}
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder={t("City, Country")}
              />
              <Input
                label={t("Born in")}
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                placeholder={t("City, Country")}
              />
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
            <form className="space-y-3" onSubmit={handleChangePassword}>
              <p className="text-sm font-semibold text-foreground">
                {t("Password")}
              </p>
              <Input
                label={t("Current password")}
                type="password"
                autoComplete="current-password"
                value={passwordCurrent}
                onChange={(e) => {
                  setPasswordError(null);
                  setPasswordCurrent(e.target.value);
                }}
                placeholder={t("Enter current password")}
              />
              <Input
                label={t("New password")}
                type="password"
                autoComplete="new-password"
                value={passwordNew}
                onChange={(e) => {
                  setPasswordError(null);
                  setPasswordNew(e.target.value);
                }}
                placeholder={t("At least 8 characters")}
              />
              <Input
                label={t("Confirm new password")}
                type="password"
                autoComplete="new-password"
                value={passwordConfirm}
                onChange={(e) => {
                  setPasswordError(null);
                  setPasswordConfirm(e.target.value);
                }}
                placeholder={t("Repeat new password")}
              />
              {passwordError ? (
                <p className="text-sm text-danger">{t(passwordError)}</p>
              ) : null}
              {passwordSuccess ? (
                <p className="text-sm text-success">
                  {t("Password updated. Redirecting to login...")}
                </p>
              ) : null}
              <Button
                type="submit"
                size="sm"
                loading={passwordSaving}
                loadingText={t("Saving")}
                disabled={passwordSaving}
              >
                {t("Save new password")}
              </Button>
            </form>
            <p className="text-xs text-muted">
              {t("For security, you will be signed out after changing your password.")}
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
    </div>
  );
};
