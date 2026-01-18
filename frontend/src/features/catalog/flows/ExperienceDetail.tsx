"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/elements/Card";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Button } from "@/components/buttons/Button";
import { Badge } from "@/components/elements/Badge";
import { Tag } from "@/components/elements/Tag";
import { AffiliationLinkBox } from "@/features/catalog/sections/AffiliationLinkBox";
import { useCatalog } from "@/hooks";
import { isUuid } from "@/lib/validators";

export interface ExperienceDetailProps {
  experienceId: string;
}

export const ExperienceDetail = ({ experienceId }: ExperienceDetailProps) => {
  const router = useRouter();
  const { experienceDetail, loading, error, actions } = useCatalog();
  const bootstrappedRef = useRef(false);
  const isValidId = isUuid(experienceId);

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

  if (!isValidId) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <ErrorState
          title="Esperienza non valida"
          description="L'esperienza richiesta non esiste o non e disponibile."
          actionLabel="Torna alle esperienze"
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
          <p className="text-sm text-muted">Caricamento esperienza...</p>
        </Card>
      </div>
    );
  }

  if (error && !experienceDetail) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
        <ErrorState
          title="Impossibile caricare l'esperienza"
          description={error.message}
          actionLabel="Torna alle esperienze"
          actionHref="/experiences"
        />
      </div>
    );
  }

  if (!experienceDetail) {
    return null;
  }

  const affiliationLink = experienceDetail.affiliationLinks?.[0];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <button
        type="button"
        onClick={() => router.back()}
        className="self-start text-sm text-muted hover:text-foreground"
      >
        &larr; Indietro
      </button>

      <Card className="space-y-4 p-5">
        <div className="overflow-hidden rounded-[var(--radius-lg)] bg-surface-muted">
          <div className="h-48 w-full" />
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-foreground">
                {experienceDetail.name}
              </h1>
              {experienceDetail.place && (
                <p className="text-sm text-muted">
                  Presso {experienceDetail.place.name}
                </p>
              )}
            </div>
            {experienceDetail.category && (
              <Badge tone="accent">{experienceDetail.category.name}</Badge>
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

        {affiliationLink && (
          <AffiliationLinkBox
            title="Prenota questa esperienza"
            href={affiliationLink.url}
            provider={affiliationLink.provider ?? undefined}
          />
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          {affiliationLink && (
            <Button
              onClick={() => window.open(affiliationLink.url, "_blank")}
            >
              Prenota
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: experienceDetail.name,
                  url: window.location.href,
                });
              }
            }}
          >
            Condividi
          </Button>
        </div>
      </Card>

      {experienceDetail.place && (
        <Card className="space-y-3 p-5">
          <h3 className="text-base font-semibold text-foreground">Luogo</h3>
          <p className="text-sm text-muted">{experienceDetail.place.name}</p>
          {experienceDetail.place.latitude &&
            experienceDetail.place.longitude && (
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
                Apri in Google Maps
              </Button>
            )}
        </Card>
      )}
    </div>
  );
};
