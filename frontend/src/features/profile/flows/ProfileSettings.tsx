"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/elements/Avatar";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { DatePicker } from "@/components/elements/DatePicker";
import { Input } from "@/components/elements/Input";
import { Loader } from "@/components/elements/Loader";
import { Select } from "@/components/elements/Select";
import { Switch } from "@/components/elements/Switch";
import { Logout } from "@/components/buttons/Logout";
import { InterestPickerGrid } from "@/features/onboarding/forms/InterestPickerGrid";
import { ProfileSummaryCard } from "@/features/profile/cards/ProfileSummaryCard";
import { TestCountCard } from "@/components/ui/TestCountCard";
import { ZyraProfileRecap } from "@/features/zyra/cards/ZyraProfileRecap";
import { VisibilitySelector } from "@/features/profile/forms/VisibilitySelector";
import { SelectedTagsRow } from "@/features/tags/lists/SelectedTagsRow";
import { useAnalytics, useAuth, useTags, useTests, useUser } from "@/hooks";
import { getMediaByOwner, uploadMedia } from "@/services/media";
import { checkUsernameAvailability } from "@/services/users";
import type { MediaResponse } from "@/types/media";
import type { ProfileVisibility, UserProfileRequest } from "@/types/profile";
import type { JsonObject, JsonValue } from "@/types/shared";

const VISIBILITY_OPTIONS: Array<{
  value: ProfileVisibility;
  label: string;
  description: string;
}> = [
  {
    value: "PUBLIC",
    label: "Pubblico",
    description: "Mostra il tuo profilo completo.",
  },
  {
    value: "PARTIAL",
    label: "Parziale",
    description: "Nasconde alcuni dettagli sensibili.",
  },
  {
    value: "PRIVATE",
    label: "Privato",
    description: "Profilo visibile solo nei match.",
  },
];

const GENDER_OPTIONS = [
  { value: "ANY", label: "Qualsiasi" },
  { value: "FEMALE", label: "Donna" },
  { value: "MALE", label: "Uomo" },
  { value: "NON_BINARY", label: "Non binary" },
];

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 8;
const USERNAME_MIN = 3;
const USERNAME_MAX = 30;
const USERNAME_PATTERN = new RegExp(`^[a-z0-9]{${USERNAME_MIN},${USERNAME_MAX}}$`);
const USERNAME_RESERVED = [
  "riccardociviero",
  "michelasardo",
  "admin",
  "support",
  "syncro",
];

const RELATIONSHIP_OPTIONS = [
  { value: "", label: "Non specificato" },
  { value: "SINGLE", label: "Single" },
  { value: "IN_RELATIONSHIP", label: "In relazione" },
  { value: "MARRIED", label: "Sposato/a" },
  { value: "SEPARATED", label: "Separato/a" },
  { value: "COMPLICATED", label: "Situazione complicata" },
  { value: "OTHER", label: "Altro" },
];

const ORIENTATION_OPTIONS = [
  { value: "", label: "Non specificato" },
  { value: "HETERO", label: "Etero" },
  { value: "GAY", label: "Gay" },
  { value: "BI", label: "Bisessuale" },
  { value: "ASEXUAL", label: "Asessuale" },
  { value: "OTHER", label: "Altro" },
];

const CHILDREN_OPTIONS = [
  { value: "", label: "Non specificato" },
  { value: "NO_CHILDREN", label: "Nessun figlio" },
  { value: "HAS_CHILDREN", label: "Ha figli" },
  { value: "WANTS_CHILDREN", label: "Vuole figli" },
  { value: "DOES_NOT_WANT", label: "Non vuole figli" },
  { value: "UNDECIDED", label: "Indeciso/a" },
];

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

const normalizeUsernameInput = (value: string) => value.trim().toLowerCase();

const isReservedUsername = (value: string) =>
  USERNAME_RESERVED.some((reserved) => value.includes(reserved));

const validateUsernameInput = (value: string) => {
  if (!value) return null;
  if (!USERNAME_PATTERN.test(value)) {
    return `Solo lettere e numeri (${USERNAME_MIN}-${USERNAME_MAX} caratteri).`;
  }
  if (isReservedUsername(value)) {
    return "Username non disponibile.";
  }
  return null;
};

export interface ProfileSettingsProps {
  title?: string;
  subtitle?: string;
}

export const ProfileSettings = ({
  title = "Profilo",
  subtitle = "Gestisci il tuo profilo e le preferenze principali.",
}: ProfileSettingsProps) => {
  const router = useRouter();
  const { status, user, actions: authActions } = useAuth();
  const { actions: analyticsActions } = useAnalytics();
  const { completedCount, countLoading, actions: testsActions } = useTests();
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

  const initializedRef = useRef(false);
  const analyticsTrackedRef = useRef(false);
  const profileInitializedRef = useRef(false);
  const preferencesInitializedRef = useRef(false);
  const interestsInitializedRef = useRef(false);
  const avatarInitializedRef = useRef(false);
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
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [orientation, setOrientation] = useState("");
  const [childrenStatus, setChildrenStatus] = useState("");
  const [visibility, setVisibility] = useState<ProfileVisibility>("PUBLIC");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSaving, setUsernameSaving] = useState(false);

  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [gender, setGender] = useState("ANY");
  const [sharedInterests, setSharedInterests] = useState(true);
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    authActions.hydrate();
    authActions.fetchMe().catch(() => undefined);
    userActions.fetchProfile().catch(() => undefined);
    userActions.fetchPreferences().catch(() => undefined);
    tagsActions.fetchTags().catch(() => undefined);
    tagsActions.fetchUserInterests().catch(() => undefined);
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
    setRelationshipStatus(profile.relationshipStatus ?? "");
    setOrientation(profile.orientation ?? "");
    setChildrenStatus(profile.childrenStatus ?? "");
    setVisibility(profile.visibility ?? "PUBLIC");
    profileInitializedRef.current = true;
  }, [profile]);

  useEffect(() => {
    if (!user || usernameInitializedRef.current) return;
    setUsername(user.username ?? "");
    usernameInitializedRef.current = true;
  }, [user]);

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
    setGender(readString(storedFilters.gender) ?? "ANY");
    setSharedInterests(readBoolean(storedFilters.sharedInterests) ?? true);

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
          resolveErrorMessage(
            loadError,
            "Errore durante il caricamento della foto profilo."
          )
        );
      })
      .finally(() => setAvatarLoading(false));
  }, [user?.id]);

  const normalizedUsername = normalizeUsernameInput(username);
  const currentUsername = normalizeUsernameInput(user?.username ?? "");
  const usernameValidationError = validateUsernameInput(normalizedUsername);
  const isSameUsername =
    normalizedUsername.length > 0 && normalizedUsername === currentUsername;

  useEffect(() => {
    if (!usernameInitializedRef.current) return;
    setUsernameError(null);
    setUsernameAvailable(null);
    setUsernameChecking(false);
    if (!normalizedUsername) return;
    if (usernameValidationError) return;
    if (isSameUsername) {
      setUsernameAvailable(true);
      return;
    }
    let active = true;
    setUsernameChecking(true);
    const timeout = setTimeout(() => {
      checkUsernameAvailability(normalizedUsername)
        .then((response) => {
          if (!active) return;
          setUsernameAvailable(response.available);
        })
        .catch(() => {
          if (!active) return;
          setUsernameError("Impossibile verificare lo username.");
        })
        .finally(() => {
          if (!active) return;
          setUsernameChecking(false);
        });
    }, 400);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [isSameUsername, normalizedUsername, usernameValidationError]);

  const displayName =
    profile?.fullName?.trim() || user?.username || user?.email || "Profilo";
  const locationLabel = [profile?.city, profile?.country]
    .filter(Boolean)
    .join(", ");

  const interestItems = useMemo(
    () =>
      tags.map((tag) => ({
        id: tag.id,
        label: tag.name,
        selected: selectedTagIds.includes(tag.id),
      })),
    [tags, selectedTagIds]
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
          item !== null
      );
  }, [interests, selectedTagIds, tags]);

  const summaryTags = useMemo(
    () => selectedTags.map((tag) => tag.label).slice(0, 6),
    [selectedTags]
  );

  const usernameChanged = normalizedUsername !== currentUsername;
  const usernameAvailabilityError =
    !usernameValidationError && usernameAvailable === false
      ? "Username gia in uso."
      : null;
  const usernameInputError =
    usernameError ?? usernameValidationError ?? usernameAvailabilityError;
  const usernameHint = (() => {
    if (usernameInputError) return undefined;
    if (!normalizedUsername) {
      return `Facoltativo. Solo lettere e numeri (${USERNAME_MIN}-${USERNAME_MAX}).`;
    }
    if (usernameChecking) return "Verifica disponibilita in corso.";
    if (isSameUsername) return "E il tuo username attuale.";
    if (usernameAvailable) return "Disponibile.";
    return `Solo lettere e numeri (${USERNAME_MIN}-${USERNAME_MAX}).`;
  })();
  const canSaveUsername =
    usernameChanged &&
    !usernameInputError &&
    !usernameChecking &&
    normalizedUsername.length > 0 &&
    usernameAvailable === true;

  const handleVisibilityToggle = (index: number) => {
    const next = VISIBILITY_OPTIONS[index];
    if (next) {
      setVisibility(next.value);
    }
  };

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
      setProfileError("Inserisci il nome completo.");
      return;
    }

    if (!trimmedCity || !trimmedCountry) {
      setProfileError("Inserisci citta e paese di residenza.");
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
      setProfileError(
        resolveErrorMessage(saveError, "Errore durante il salvataggio.")
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveUsername = async () => {
    setUsernameError(null);
    if (!normalizedUsername) {
      setUsernameError("Inserisci uno username.");
      return;
    }
    if (usernameValidationError) {
      setUsernameError(usernameValidationError);
      return;
    }
    if (!isSameUsername && usernameAvailable !== true) {
      setUsernameError("Username non disponibile.");
      return;
    }

    setUsernameSaving(true);
    try {
      await userActions.updateUser({ username: normalizedUsername });
      setUsername(normalizedUsername);
      setUsernameAvailable(true);
    } catch (saveError) {
      setUsernameError(
        resolveErrorMessage(saveError, "Errore durante il salvataggio.")
      );
    } finally {
      setUsernameSaving(false);
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
      setPreferencesError("L'eta minima non puo superare l'eta massima.");
      return;
    }

    if ((distanceValue ?? 0) < 0 || (feedRadiusValue ?? 0) < 0) {
      setPreferencesError("Inserisci valori positivi per le distanze.");
      return;
    }

    const matchmakingFilters: JsonObject = {
      ageMin: minAgeValue,
      ageMax: maxAgeValue,
      distanceKm: distanceValue,
      gender,
      sharedInterests,
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
        resolveErrorMessage(saveError, "Errore durante il salvataggio.")
      );
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleInterestToggle = (id: string, nextSelected: boolean) => {
    setInterestsError(null);
    if (nextSelected && selectedTagIds.length >= MAX_INTERESTS) {
      setInterestsError(
        `Puoi scegliere al massimo ${MAX_INTERESTS} interessi.`
      );
      return;
    }

    setSelectedTagIds((prev) =>
      nextSelected ? [...prev, id] : prev.filter((item) => item !== id)
    );
  };

  const handleSaveInterests = async () => {
    setInterestsError(null);

    if (selectedTagIds.length < MIN_INTERESTS) {
      setInterestsError(`Seleziona almeno ${MIN_INTERESTS} interessi.`);
      return;
    }

    setInterestsSaving(true);
    try {
      await tagsActions.updateUserInterests({ tagIds: selectedTagIds });
    } catch (saveError) {
      setInterestsError(
        resolveErrorMessage(saveError, "Errore durante il salvataggio.")
      );
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
      setAvatarError("Utente non disponibile.");
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
    } catch (uploadError) {
      setAvatarError(
        resolveErrorMessage(uploadError, "Errore durante il caricamento.")
      );
    } finally {
      setAvatarLoading(false);
      event.target.value = "";
    }
  };

  const isAuthLoading = status === "loading";
  const isTagsReady = tags.length > 0;
  const isTagsLoading = tagsLoading && !isTagsReady;
  const mergedError =
    profileError ?? preferencesError ?? interestsError ?? avatarError;
  const baseError = error?.message ?? tagsError?.message;
  const showError = mergedError || baseError;
  const testsDescription = countLoading
    ? "Sto calcolando i test completati."
    : completedCount === 0
      ? "Completa il primo micro-test per attivare Zyra."
      : completedCount != null && completedCount < 3
        ? "Continua con altri test per affinare il profilo."
        : "Ottimo lavoro: il tuo profilo è ben definito.";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
          Impostazioni account
        </p>
        <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </header>

      <ProfileSummaryCard
        name={displayName}
        username={normalizedUsername || user?.username || undefined}
        location={locationLabel || undefined}
        jobTitle={jobTitle || undefined}
        companyName={companyName || undefined}
        avatarUrl={avatar?.url}
        tags={summaryTags}
      />

      <TestCountCard
        title="I tuoi test"
        count={completedCount}
        loading={countLoading}
        description={testsDescription}
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => router.push("/tests")}
          >
            Vai ai test
          </Button>
        }
      />

      <ZyraProfileRecap />

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="space-y-4 p-5">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Informazioni profilo
            </h3>
            <p className="text-sm text-muted">
              Mantieni aggiornati i dati principali del profilo.
            </p>
          </div>
          <Input
            label="Nome completo"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Nome e cognome"
            required
          />
          <DatePicker
            label="Data di nascita"
            value={birthDate}
            onValueChange={setBirthDate}
            placeholder="Seleziona una data"
            maxYear={new Date().getFullYear()}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Citta"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="Milano"
            />
            <Input
              label="Paese"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
              placeholder="Italia"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Posizione lavorativa"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              placeholder="Product Designer"
            />
            <Input
              label="Azienda"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Syncro"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Biografia
            </label>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              placeholder="Raccontaci qualcosa di te..."
              maxLength={500}
              rows={4}
              className="w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <p className="text-xs text-subtle">{bio.length}/500 caratteri</p>
          </div>
          <Button
            size="sm"
            loading={profileSaving || isAuthLoading}
            loadingText="Salvataggio"
            onClick={handleSaveProfile}
          >
            Salva profilo
          </Button>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  Foto profilo
                </h3>
                <p className="text-sm text-muted">
                  Aggiorna l&apos;immagine principale del tuo profilo.
                </p>
              </div>
              {avatarLoading ? <Loader size="sm" /> : null}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={displayName} src={avatar?.url} size="lg" />
              <div className="space-y-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleAvatarSelect}
                  loading={avatarLoading}
                  loadingText="Upload"
                >
                  Carica nuova foto
                </Button>
                <p className="text-xs text-subtle">PNG o JPG, max 5 MB.</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatarUpload}
            />
          </Card>

          <Card className="space-y-4 p-5">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Username
              </h3>
              <p className="text-sm text-muted">
                Identificativo pubblico univoco del tuo profilo.
              </p>
            </div>
            <Input
              label="Username"
              value={username}
              onChange={(event) =>
                setUsername(normalizeUsernameInput(event.target.value))
              }
              placeholder="es. sararossi"
              autoComplete="off"
              maxLength={USERNAME_MAX}
              error={usernameInputError ?? undefined}
              hint={usernameHint}
              rightSlot={usernameChecking ? <Loader size="sm" /> : null}
            />
            <Button
              size="sm"
              variant="secondary"
              loading={usernameSaving}
              loadingText="Salvataggio"
              disabled={!canSaveUsername}
              onClick={handleSaveUsername}
            >
              Salva username
            </Button>
          </Card>

          <VisibilitySelector
            items={VISIBILITY_OPTIONS.map((option) => ({
              label: option.label,
              description: option.description,
              selected: visibility === option.value,
            }))}
            onItemToggle={handleVisibilityToggle}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Profilo personale
            </h3>
            <p className="text-sm text-muted">
              Sezioni guidate per raccontarti in modo piu accurato.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Cosa mi caratterizza
            </label>
            <textarea
              value={traitsText}
              onChange={(event) => setTraitsText(event.target.value)}
              placeholder="Descrivi il tuo tratto distintivo..."
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <p className="text-xs text-subtle">{traitsText.length}/500</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Cosa amo
            </label>
            <textarea
              value={lovesText}
              onChange={(event) => setLovesText(event.target.value)}
              placeholder="Passioni, interessi, momenti..."
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <p className="text-xs text-subtle">{lovesText.length}/500</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Cosa non sopporto
            </label>
            <textarea
              value={dislikesText}
              onChange={(event) => setDislikesText(event.target.value)}
              placeholder="Cose o situazioni che eviti..."
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <p className="text-xs text-subtle">{dislikesText.length}/500</p>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4 p-5">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Obiettivi e valori
              </h3>
              <p className="text-sm text-muted">
                Cosa cerchi e quali valori ti guidano.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Cosa cerco / obiettivi di vita
              </label>
              <textarea
                value={goalsText}
                onChange={(event) => setGoalsText(event.target.value)}
                placeholder="Obiettivi personali o di relazione..."
                maxLength={500}
                rows={3}
                className="w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <p className="text-xs text-subtle">{goalsText.length}/500</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Il mio credo / valori
              </label>
              <textarea
                value={valuesText}
                onChange={(event) => setValuesText(event.target.value)}
                placeholder="Valori personali e principi..."
                maxLength={500}
                rows={3}
                className="w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <p className="text-xs text-subtle">{valuesText.length}/500</p>
            </div>
          </Card>

          <Card className="space-y-4 p-5">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                Informazioni personali
              </h3>
              <p className="text-sm text-muted">
                Dettagli opzionali per un match piu preciso.
              </p>
            </div>

            <Select
              label="Stato relazionale"
              options={RELATIONSHIP_OPTIONS}
              value={relationshipStatus}
              onValueChange={setRelationshipStatus}
              placeholder="Seleziona"
            />
            <Select
              label="Orientamento"
              options={ORIENTATION_OPTIONS}
              value={orientation}
              onValueChange={setOrientation}
              placeholder="Seleziona"
            />
            <Select
              label="Figli"
              options={CHILDREN_OPTIONS}
              value={childrenStatus}
              onValueChange={setChildrenStatus}
              placeholder="Seleziona"
            />
            <Button
              size="sm"
              variant="secondary"
              loading={profileSaving || isAuthLoading}
              loadingText="Salvataggio"
              onClick={handleSaveProfile}
            >
              Salva profilo
            </Button>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        {isTagsLoading ? (
          <Card className="flex items-center gap-3 p-5">
            <Loader size="sm" />
            <p className="text-sm text-muted">Caricamento interessi...</p>
          </Card>
        ) : (
          <InterestPickerGrid
            items={interestItems}
            maxSelections={MAX_INTERESTS}
            hint={`Seleziona almeno ${MIN_INTERESTS} interessi.`}
            onItemToggle={handleInterestToggle}
          />
        )}
        {selectedTags.length ? (
          <Card className="p-5">
            <SelectedTagsRow title="Selezionati" items={selectedTags} />
          </Card>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            loading={interestsSaving}
            loadingText="Salvataggio"
            onClick={handleSaveInterests}
          >
            Salva interessi
          </Button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 p-5">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Preferenze matchmaking
            </h3>
            <p className="text-sm text-muted">
              Definisci i filtri principali per i match.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Eta minima"
              type="number"
              min={18}
              value={ageMin}
              onChange={(event) => setAgeMin(event.target.value)}
              placeholder="18"
            />
            <Input
              label="Eta massima"
              type="number"
              min={18}
              value={ageMax}
              onChange={(event) => setAgeMax(event.target.value)}
              placeholder="45"
            />
          </div>
          <Input
            label="Distanza massima (km)"
            type="number"
            min={1}
            value={distanceKm}
            onChange={(event) => setDistanceKm(event.target.value)}
            placeholder="25"
          />
          <Select
            label="Genere"
            options={GENDER_OPTIONS}
            value={gender}
            onValueChange={setGender}
          />
          <Switch
            label="Interessi in comune"
            description="Mostra priorita a chi condivide i tuoi tag."
            checked={sharedInterests}
            onChange={(event) => setSharedInterests(event.target.checked)}
          />
        </Card>

        <Card className="space-y-4 p-5">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">
              Preferenze feed
            </h3>
            <p className="text-sm text-muted">
              Regola come visualizzare i post vicino a te.
            </p>
          </div>
          <Input
            label="Raggio feed (km)"
            type="number"
            min={1}
            value={feedRadiusKm}
            onChange={(event) => setFeedRadiusKm(event.target.value)}
            placeholder="10"
          />
          <Switch
            label="Mostra solo contenuti vicini"
            description="Filtra i post oltre il raggio selezionato."
            checked={feedOnlyNearby}
            onChange={(event) => setFeedOnlyNearby(event.target.checked)}
          />
          <Switch
            label="Traduci contenuti automaticamente"
            description="Abilita la traduzione automatica dei contenuti."
            checked={feedAutoTranslate}
            onChange={(event) => setFeedAutoTranslate(event.target.checked)}
          />
        </Card>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          loading={preferencesSaving || loading}
          loadingText="Salvataggio"
          onClick={handleSavePreferences}
        >
          Salva preferenze
        </Button>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h3 className="text-base font-semibold text-foreground">
            Sicurezza account
          </h3>
          <p className="text-sm text-muted">
            Esci dal tuo account quando necessario.
          </p>
          <Logout size="sm" />
        </Card>
      </section>

      {showError ? (
        <Card className="border-danger/30 bg-danger/10 p-4">
          <p className="text-sm text-danger">
            {mergedError ?? baseError ?? "Errore inatteso."}
          </p>
        </Card>
      ) : null}
    </div>
  );
};
