"use client";

import { useState, useEffect } from "react";
import { useT } from "@/hooks";

interface MicroTestCountdownProps {
  expiresAt: string;
}

export default function MicroTestCountdown({ expiresAt }: MicroTestCountdownProps) {
  const { t } = useT();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const expires = new Date(expiresAt).getTime();
  const diff = expires - now;

  if (diff <= 0) return <span className="mt-countdown mt-countdown--expired">{t("Expired")}</span>;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return (
    <>
      <span className="mt-countdown">
        {days > 0
          ? t("Expires in {days} days", { days: String(days) })
          : t("Expires in {hours} hours", { hours: String(hours) })}
      </span>
      <style>{`
        .mt-countdown {
          font-size: 0.75rem;
          color: #ca8a04;
          font-weight: 600;
        }
        .mt-countdown--expired {
          color: #dc2626;
        }
      `}</style>
    </>
  );
}
