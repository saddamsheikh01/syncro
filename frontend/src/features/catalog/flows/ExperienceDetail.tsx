"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/elements/Card";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Button } from "@/components/buttons/Button";
import { Badge } from "@/components/elements/Badge";
import { Tag } from "@/components/elements/Tag";
import { AffiliationLinkBox } from "@/features/catalog/sections/AffiliationLinkBox";
import { ShareLinkDropdown } from "@/features/catalog/sections/ShareLinkDropdown";
import { useCatalog, useFavorites, useT } from "@/hooks";
import { isUuid } from "@/lib/validators";
import { getShareableExperienceUrl } from "@/lib/siteUrl";
import { getRuntimeBcp47 } from "@/i18n/runtimeLocale";

export interface ExperienceDetailProps {
  experienceId: string;
}

export const ExperienceDetail = ({ experienceId }: ExperienceDetailProps) => {
  const router = useRouter();
  const { t } = useT();
  const { experienceDetail, loading, error, actions } = useCatalog();
  const { items: favorites, actions: favoritesActions } = useFavorites();
  const bootstrappedRef = useRef(false);
  const favoritesBootstrappedRef = useRef(false);
  const isValidId = isUuid(experienceId);
  const [savingFavorite, setSavingFavorite] = useState(false);

  const isFavorite = useMemo(
    () => favorites.some((fav) => fav.experience?.id === experienceId),
    [favorites, experienceId]
  );

  const handleToggleFavorite = useCallback(async () => {
    if (savingFavorite) return;
    setSavingFavorite(true);
    try {
      if (isFavorite) {
        await favoritesActions.removeFavorite({ experienceId });
      } else {
        await favoritesActions.addFavorite({ experienceId });
      }
    } catch {
      // Error handled by store
    } finally {
      setSavingFavorite(false);
    }
  }, [experienceId, isFavorite, savingFavorite, favoritesActions]);

  useEffect(() => {
    if (!isValidId) {
      actions.clearDetails();
      return;
    }
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;
    actions.fetchExperience(experienceId).catch(() => undefined);
    return () => actions.clearDetails();
  }, [actions, experienceId, isValidId]);

  useEffect(() => {
    if (favoritesBootstrappedRef.current) return;
    favoritesBootstrappedRef.current = true;
    favoritesActions.fetchFavorites({ type: "EXPERIENCE" }).catch(() => undefined);
  }, [favoritesActions]);

  if (!isValidId) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <ErrorState
          title={t("Invalid experience")}
          description={t(
            "The requested experience does not exist or is unavailable."
          )}
          actionLabel={t("Back to experiences")}
          actionHref="/experiences"
        />
      </div>
    );
  }

  const isInitialLoading = loading && !experienceDetail;

  if (isInitialLoading) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">{t("Loading experience...")}</p>
        </Card>
      </div>
    );
  }

  if (error && !experienceDetail) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <ErrorState
          title={t("Unable to load experience")}
          description={error.message}
          actionLabel={t("Back to experiences")}
          actionHref="/experiences"
        />
      </div>
    );
  }

  if (!experienceDetail) {
    return null;
  }

  const affiliationLink = experienceDetail.affiliationLinks?.[0];
  const bookingUrl = experienceDetail.bookingUrl ?? affiliationLink?.url;
  const isViatorExperience = experienceDetail.provider?.toUpperCase() === "VIATOR";

  const formatDuration = (minutes: number | null): string | undefined => {
    if (!minutes) return undefined;
    if (minutes < 60) return t("{count} minutes", { count: minutes });
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0
      ? t("{hours} hours and {minutes} minutes", { hours, minutes: mins })
      : t("{count} hours", { count: hours });
  };

  const formatPrice = (
    price: number | null,
    currency: string | null
  ): string | undefined => {
    if (price == null) return undefined;
    const curr = currency ?? "EUR";
    return new Intl.NumberFormat(getRuntimeBcp47(), {
      style: "currency",
      currency: curr,
    }).format(price);
  };

  const hasDiscount =
    experienceDetail.originalPrice &&
    experienceDetail.price &&
    experienceDetail.originalPrice > experienceDetail.price;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <button
        type="button"
        onClick={() => router.back()}
        className="self-start text-sm text-muted hover:text-foreground"
      >
        &larr; {t("Back")}
      </button>

      <Card className="space-y-4 p-5">
        {/* Immagine principale */}
        <div className="overflow-hidden rounded-[var(--radius-lg)] bg-surface-muted">
          {experienceDetail.imageUrl ? (
            <img
              src={experienceDetail.imageUrl}
              alt={experienceDetail.name}
              className="h-48 w-full object-cover"
            />
          ) : (
            <div className="h-48 w-full" />
          )}
        </div>

        {/* Gallery immagini */}
        {experienceDetail.images && experienceDetail.images.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {experienceDetail.images.slice(0, 5).map((img, idx) => (
              <div
                key={idx}
                className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-surface-muted"
              >
                <img
                  src={img}
                  alt={`${experienceDetail.name} ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-foreground">
                {experienceDetail.name}
              </h1>
              {(experienceDetail.locationName || experienceDetail.place) && (
                <p className="text-sm text-muted">
                  {experienceDetail.locationName ?? experienceDetail.place?.name}
                </p>
              )}
            </div>
            {experienceDetail.category && (
              <Badge tone="accent">{experienceDetail.category.name}</Badge>
            )}
          </div>

          {/* Rating e recensioni */}
          {experienceDetail.rating != null && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-sm">
                <span className="text-yellow-500">★</span>
                <span className="font-medium">{experienceDetail.rating.toFixed(1)}</span>
              </span>
              {experienceDetail.reviewCount != null && experienceDetail.reviewCount > 0 && (
                <span className="text-sm text-muted">
                  {t("({count} reviews)", {
                    count: experienceDetail.reviewCount,
                  })}
                </span>
              )}
            </div>
          )}

          {/* Prezzo e durata */}
          <div className="flex flex-wrap items-center gap-4">
            {experienceDetail.price != null && (
              <div className="flex items-center gap-2">
                {hasDiscount && (
                  <span className="text-sm text-subtle line-through">
                    {formatPrice(experienceDetail.originalPrice, experienceDetail.priceCurrency)}
                  </span>
                )}
                <span className="text-lg font-semibold text-foreground">
                  {formatPrice(experienceDetail.price, experienceDetail.priceCurrency)}
                </span>
                <span className="text-xs text-muted">{t("per person")}</span>
              </div>
            )}
            {experienceDetail.durationMinutes && (
              <span className="text-sm text-muted">
                {t("Duration: {value}", {
                  value: formatDuration(experienceDetail.durationMinutes) ?? "",
                })}
              </span>
            )}
          </div>

        </div>

        {experienceDetail.description && (
          <p className="text-sm text-muted">{experienceDetail.description}</p>
        )}

        {experienceDetail.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {experienceDetail.tags.map((tag) => (
              <Tag key={tag.id} tone="neutral">
                {tag.name}
              </Tag>
            ))}
          </div>
        )}

        {/* Pulsanti azione */}
        <div className="flex flex-wrap gap-3 pt-2">
          {bookingUrl && (
            <Button
              onClick={() =>
                window.open(bookingUrl, "_blank", "noopener,noreferrer")
              }
            >
              {isViatorExperience ? t("Book on Viator") : t("Book now")}
            </Button>
          )}
          <Button
            variant={isFavorite ? "outline" : "secondary"}
            onClick={handleToggleFavorite}
            loading={savingFavorite}
            loadingText={isFavorite ? t("Removing...") : t("Saving...")}
          >
            {isFavorite ? t("Remove from favorites") : t("Save to favorites")}
          </Button>
          <ShareLinkDropdown
            shareUrl={getShareableExperienceUrl(experienceId)}
            shareText={experienceDetail.name}
            variant="ghost"
          />
        </div>
      </Card>

      {/* Highlights */}
      {experienceDetail.highlights && experienceDetail.highlights.length > 0 && (
        <Card className="space-y-3 p-5">
          <h3 className="text-base font-semibold text-foreground">
            {t("Highlights")}
          </h3>
          <ul className="space-y-2">
            {experienceDetail.highlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-muted">
                <span className="text-accent">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Cosa è incluso / escluso */}
      {((experienceDetail.inclusions && experienceDetail.inclusions.length > 0) ||
        (experienceDetail.exclusions && experienceDetail.exclusions.length > 0)) && (
        <Card className="space-y-4 p-5">
          {experienceDetail.inclusions && experienceDetail.inclusions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">
                {t("What's included")}
              </h3>
              <ul className="space-y-1">
                {experienceDetail.inclusions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted">
                    <span className="text-green-500">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {experienceDetail.exclusions && experienceDetail.exclusions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">
                {t("What's not included")}
              </h3>
              <ul className="space-y-1">
                {experienceDetail.exclusions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted">
                    <span className="text-red-400">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Informazioni aggiuntive */}
      {(experienceDetail.languages?.length ||
        experienceDetail.meetingPoint ||
        experienceDetail.cancellationPolicy ||
        experienceDetail.minParticipants ||
        experienceDetail.maxParticipants) && (
        <Card className="space-y-3 p-5">
          <h3 className="text-base font-semibold text-foreground">
            {t("Information")}
          </h3>
          <div className="space-y-2 text-sm text-muted">
            {experienceDetail.languages && experienceDetail.languages.length > 0 && (
              <p>
                <span className="font-medium text-foreground">
                  {t("Languages:")}
                </span>{" "}
                {experienceDetail.languages.join(", ")}
              </p>
            )}
            {experienceDetail.meetingPoint && (
              <p>
                <span className="font-medium text-foreground">
                  {t("Meeting point:")}
                </span>{" "}
                {experienceDetail.meetingPoint}
              </p>
            )}
            {(experienceDetail.minParticipants || experienceDetail.maxParticipants) && (
              <p>
                <span className="font-medium text-foreground">
                  {t("Participants:")}
                </span>{" "}
                {experienceDetail.minParticipants
                  ? t("min {count}", { count: experienceDetail.minParticipants })
                  : null}
                {experienceDetail.minParticipants && experienceDetail.maxParticipants
                  ? t(" - ")
                  : null}
                {experienceDetail.maxParticipants
                  ? t("max {count}", { count: experienceDetail.maxParticipants })
                  : null}
              </p>
            )}
            {experienceDetail.cancellationPolicy && (
              <p>
                <span className="font-medium text-foreground">
                  {t("Cancellation:")}
                </span>{" "}
                {experienceDetail.cancellationPolicy}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Luogo / Mappa */}
      {(experienceDetail.place || (experienceDetail.latitude && experienceDetail.longitude)) && (
        <Card className="space-y-3 p-5">
          <h3 className="text-base font-semibold text-foreground">
            {t("Location")}
          </h3>
          {experienceDetail.place && (
            <p className="text-sm text-muted">{experienceDetail.place.name}</p>
          )}
          {(experienceDetail.latitude && experienceDetail.longitude) ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps?q=${experienceDetail.latitude},${experienceDetail.longitude}`,
                  "_blank"
                )
              }
            >
              {t("Open in Google Maps")}
            </Button>
          ) : experienceDetail.place?.latitude && experienceDetail.place?.longitude ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps?q=${experienceDetail.place!.latitude},${experienceDetail.place!.longitude}`,
                  "_blank"
                )
              }
            >
              {t("Open in Google Maps")}
            </Button>
          ) : null}
        </Card>
      )}

      {/* Affiliazione link (se diverso da bookingUrl) */}
      {affiliationLink && affiliationLink.url !== experienceDetail.bookingUrl && (
        <AffiliationLinkBox
          title={t("Book this experience")}
          href={affiliationLink.url}
          provider={affiliationLink.provider ?? undefined}
        />
      )}
    </div>
  );
};
