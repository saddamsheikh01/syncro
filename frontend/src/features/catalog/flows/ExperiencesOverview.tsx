"use client";

import { useEffect, useRef } from "react";
import { usePosition } from "@/hooks";
import { ViatorExperiencesSection } from "@/features/catalog/sections/ViatorExperiencesSection";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { useT } from "@/hooks";

export const ExperiencesOverview = () => {
  const { t } = useT();
  const { permission, hasPosition, actions: positionActions } = usePosition();
  const locationRequestedRef = useRef(false);

  // On section entry: request location once if permission unknown. If granted, ViatorExperiencesSection defaults to "near me".
  useEffect(() => {
    if (permission !== "unknown" || locationRequestedRef.current) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    locationRequestedRef.current = true;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          positionActions.setPermission("granted");
          await positionActions.savePosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy ?? undefined,
          });
        } catch {
          positionActions.setPermission("denied");
        }
      },
      () => {
        positionActions.setPermission("denied");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [permission, positionActions]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <SectionHeader
        title={t("Experiences")}
        subtitle={t("Experiences near you. Change city or use filters to search elsewhere.")}
      />
      <ViatorExperiencesSection
        title={t("Experiences")}
        subtitle={t("Curated activities near you.")}
        actionLabel={t("See all on map")}
        actionHref="/places?filter=experiences"
        pageSize={12}
        showLoadMore={true}
        hideSectionTitle={true}
      />
    </div>
  );
};
