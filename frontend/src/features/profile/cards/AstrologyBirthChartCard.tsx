"use client";

import { useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { DatePicker } from "@/components/elements/DatePicker";
import { Input } from "@/components/elements/Input";
import { TimePicker } from "@/components/elements/TimePicker";
import { useT } from "@/hooks";
import { calculateAndSaveAstrology } from "@/services/astrology";
import { geocodePlace, getTimezoneForCoordinates } from "@/services/geocoding";
import type { AstrologyCalculationResponse } from "@/types/astrology";

const formatPlacement = (sign: string, degree: number) =>
  `${sign} ${degree.toFixed(1)}°`;

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
  const { t } = useT();
  const [birthDate, setBirthDate] = useState(initialBirthDate ?? "");
  const [birthTime, setBirthTime] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<AstrologyCalculationResponse | null>(null);
  const [interpretation, setInterpretation] = useState<string | null>(initialInterpretation ?? null);

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
          <div className="rounded-lg border border-border/70 bg-surface-muted/50 p-3">
            <p className="mb-2 text-sm font-medium text-foreground">
              {t("Your chart has been saved.")}
            </p>
            <ul className="space-y-1 text-sm text-muted">
              <li>Sun: {formatPlacement(result.sun.sign, result.sun.degreeInSign)}</li>
              <li>Moon: {formatPlacement(result.moon.sign, result.moon.degreeInSign)}</li>
              {result.ascendant ? (
                <li>
                  Ascendant:{" "}
                  {formatPlacement(result.ascendant.sign, result.ascendant.degreeInSign)}
                </li>
              ) : null}
              <li>Venus: {formatPlacement(result.venus.sign, result.venus.degreeInSign)}</li>
              <li>Mars: {formatPlacement(result.mars.sign, result.mars.degreeInSign)}</li>
            </ul>
          </div>
          {interpretation ? (
            <div className="rounded-lg border border-border/70 bg-surface-muted/30 p-3">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                {t("What Zyra says")}
              </p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{interpretation}</p>
            </div>
          ) : null}
        </div>
      ) : initialInterpretation ? (
        <div className="mt-4 rounded-lg border border-border/70 bg-surface-muted/30 p-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
            {t("What Zyra says")}
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{initialInterpretation}</p>
        </div>
      ) : null}

      <div className="mt-4">
        <Button
          size="sm"
          loading={loading}
          loadingText={t("Calculating…")}
          onClick={handleCalculateAndSave}
          disabled={loading}
        >
          {t("Calculate & save birth chart")}
        </Button>
      </div>
    </Card>
  );
};
