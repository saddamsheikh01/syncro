"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { DatePicker } from "@/components/elements/DatePicker";
import { Input } from "@/components/elements/Input";
import { TimePicker } from "@/components/elements/TimePicker";
import { useT } from "@/hooks";
import { calculateAndSaveAstrology } from "@/services/astrology";
import { geocodePlace, getTimezoneForCoordinates } from "@/services/geocoding";
import type { AstrologyCalculationResponse } from "@/types/astrology";

const formatSignLabel = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return value;
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const PLANET_TONE: Record<"sun" | "moon" | "ascendant" | "venus" | "mars", string> = {
  sun: "border-amber-200/70 bg-amber-50/70",
  moon: "border-blue-200/70 bg-blue-50/70",
  ascendant: "border-violet-200/70 bg-violet-50/70",
  venus: "border-rose-200/70 bg-rose-50/70",
  mars: "border-emerald-200/70 bg-emerald-50/70",
};

export interface AstrologyBirthChartCardProps {
  /** Pre-fill birth date from profile (YYYY-MM-DD) */
  initialBirthDate?: string | null;
  /** Cached Zyra interpretation from profile (shown until user recalculates) */
  initialInterpretation?: string | null;
  /** Called after successful save so parent can refresh profile */
  onSaved?: () => void;
}

export const AstrologyBirthChartCard = ({
  initialBirthDate = "",
  initialInterpretation = null,
  onSaved,
}: AstrologyBirthChartCardProps) => {
  const router = useRouter();
  const { t } = useT();
  const degreeFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }),
    []
  );
  const [birthDate, setBirthDate] = useState(initialBirthDate ?? "");
  const [birthTime, setBirthTime] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<AstrologyCalculationResponse | null>(null);
  const [interpretation, setInterpretation] = useState<string | null>(initialInterpretation ?? null);

  const placementCards = useMemo(() => {
    if (!result) return [];
    const formatPlacement = (sign: string, degree: number) =>
      `${formatSignLabel(sign)} ${degreeFormatter.format(degree)}°`;
    return [
      {
        key: "sun" as const,
        label: t("Sun"),
        value: formatPlacement(result.sun.sign, result.sun.degreeInSign),
      },
      {
        key: "moon" as const,
        label: t("Moon"),
        value: formatPlacement(result.moon.sign, result.moon.degreeInSign),
      },
      ...(result.ascendant
        ? [
            {
              key: "ascendant" as const,
              label: t("Ascendant"),
              value: formatPlacement(
                result.ascendant.sign,
                result.ascendant.degreeInSign
              ),
            },
          ]
        : []),
      {
        key: "venus" as const,
        label: t("Venus"),
        value: formatPlacement(result.venus.sign, result.venus.degreeInSign),
      },
      {
        key: "mars" as const,
        label: t("Mars"),
        value: formatPlacement(result.mars.sign, result.mars.degreeInSign),
      },
    ];
  }, [degreeFormatter, result, t]);

  const handleCalculateAndSave = async () => {
    setError(null);
    setSuccess(false);
    setInterpretation(null);
    if (!birthDate.trim()) {
      setError(t("Enter your date of birth."));
      return;
    }
    if (!placeOfBirth.trim()) {
      setError(t("Enter your place of birth (e.g. city, country)."));
      return;
    }

    setLoading(true);
    try {
      const geo = await geocodePlace(placeOfBirth.trim());
      if (!geo) {
        setError(t("Could not find this place. Try a more specific name (e.g. city, country)."));
        setLoading(false);
        return;
      }

      const birthTimezone = birthTime.trim()
        ? await getTimezoneForCoordinates(geo.latitude, geo.longitude)
        : null;

      const response = await calculateAndSaveAstrology({
        birthDate: birthDate.trim(),
        birthTime: birthTime.trim() || null,
        birthLatitude: geo.latitude,
        birthLongitude: geo.longitude,
        birthTimezone: birthTimezone ?? undefined,
      });
      setResult(response);
      setSuccess(true);
      setInterpretation(response.interpretation ?? null);
      onSaved?.();
    } catch (e) {
      const message =
        e && typeof e === "object" && "message" in e
          ? String((e as { message: string }).message)
          : t("Failed to calculate birth chart.");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">
          {t("Birth chart (astrology)")}
        </h2>
        <p className="text-sm text-muted">
          {t(
            "Used for compatibility. Enter place of birth (e.g. city, country); time is optional (needed for Ascendant)."
          )}
        </p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <DatePicker
          label={t("Date of birth")}
          value={birthDate}
          onValueChange={setBirthDate}
          placeholder="YYYY-MM-DD"
          maxYear={new Date().getFullYear()}
        />
        <TimePicker
          label={t("Time of birth (optional)")}
          value={birthTime}
          onValueChange={setBirthTime}
          placeholder={t("HH:MM")}
          startHour={0}
          endHour={23}
          stepMinutes={15}
        />
        <Input
          label={t("Place of birth")}
          value={placeOfBirth}
          onChange={(e) => setPlaceOfBirth(e.target.value)}
          placeholder={t("e.g. Rome, Italy or Islamabad, Pakistan")}
          className="sm:col-span-2"
        />
      </div>

      {error ? (
        <p className="mt-3 text-sm text-danger">{error}</p>
      ) : null}
      {success && result ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success/15 text-xs font-semibold text-success">
                ✓
              </span>
              <p className="text-sm font-medium text-foreground">
                {t("Your chart has been saved.")}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {placementCards.map((item) => (
                <div
                  key={item.key}
                  className={`rounded-xl border p-3 ${PLANET_TONE[item.key]}`}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
            {!result.ascendant ? (
              <p className="mt-2 text-xs text-muted">
                {t("Add birth time to include your Ascendant.")}
              </p>
            ) : null}
          </div>
          {interpretation ? (
            <div className="rounded-xl border border-zyra-border/70 bg-zyra-glow/10 p-3">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zyra-text">
                {t("What Zyra says")}
              </p>
              <p className="text-sm whitespace-pre-wrap text-foreground">{interpretation}</p>
            </div>
          ) : null}
        </div>
      ) : initialInterpretation ? (
        <div className="mt-4 rounded-xl border border-zyra-border/70 bg-zyra-glow/10 p-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-zyra-text">
            {t("What Zyra says")}
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground">{initialInterpretation}</p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <Button
          size="sm"
          loading={loading}
          loadingText={t("Calculating…")}
          onClick={handleCalculateAndSave}
          disabled={loading}
        >
          {t("Calculate & save birth chart")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => router.push("/profile")}
        >
          {t("Go to profile")}
        </Button>
      </div>
    </Card>
  );
};
