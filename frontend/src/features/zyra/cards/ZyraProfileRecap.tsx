"use client";

import { useCallback, useEffect, useState } from "react";
import type { HTMLAttributes } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/buttons/Button";
import { ZyraMark } from "@/features/zyra/elements/ZyraMark";
import { cx } from "@/lib/classNames";
import { getProfileRecap, getProfileRecapForUser } from "@/services/zyra";
import { useUser } from "@/hooks";

export interface ZyraProfileRecapProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  userId?: string;
}

export const ZyraProfileRecap = ({
  className,
  title = "Il tuo profilo secondo Zyra",
  userId,
  ...props
}: ZyraProfileRecapProps) => {
  const { profile, actions: userActions } = useUser();
  const [recap, setRecap] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecap, setEditedRecap] = useState("");
  const [saving, setSaving] = useState(false);

  const isOwnProfile = !userId;
  // Usa il recap salvato nel profilo solo se è il proprio profilo
  const savedRecap = isOwnProfile ? profile?.zyraRecap : null;

  // Inizializza dal profilo salvato o genera da Zyra (solo per il proprio profilo)
  useEffect(() => {
    if (isOwnProfile && savedRecap && !recap) {
      setRecap(savedRecap);
      setEditedRecap(savedRecap);
    }
  }, [isOwnProfile, savedRecap, recap]);

  const fetchRecap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = userId
        ? await getProfileRecapForUser(userId)
        : await getProfileRecap();
      setRecap(response.recap);
      setEditedRecap(response.recap);
    } catch {
      setError("Impossibile generare il riepilogo. Riprova.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Genera solo se non c'è recap salvato
  useEffect(() => {
    if (!savedRecap && !recap && !loading) {
      fetchRecap();
    }
  }, [savedRecap, recap, loading, fetchRecap]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedRecap(recap ?? "");
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedRecap(recap ?? "");
  };

  const handleSave = async () => {
    if (!editedRecap.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await userActions.saveProfile({ zyraRecap: editedRecap.trim() });
      setRecap(editedRecap.trim());
      setIsEditing(false);
    } catch {
      setError("Errore durante il salvataggio. Riprova.");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    await fetchRecap();
    // Salva automaticamente il nuovo recap generato
    if (!userId && recap) {
      try {
        await userActions.saveProfile({ zyraRecap: recap });
      } catch {
        // Ignora errori di salvataggio durante rigenerazione
      }
    }
  };

  const displayRecap = recap;

  return (
    <div
      className={cx(
        "zyra-surface relative overflow-hidden rounded-[var(--radius-lg)] border border-zyra-border p-5 shadow-sm",
        className
      )}
      {...props}
    >
      <div className="relative space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ZyraMark size="sm" />
            <div className="space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zyra-text">
                Zyra AI
              </p>
              <p className="text-xs text-subtle">{title}</p>
            </div>
          </div>
          <span className="rounded-full border border-zyra-border/60 bg-zyra-surface-soft px-2 py-0.5 text-[10px] font-semibold text-zyra-text">
            AI
          </span>
        </div>

        <div className="min-h-[60px]">
          {loading ? (
            <div className="flex items-center gap-2 py-2 text-subtle">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zyra-text border-t-transparent" />
              <span className="text-sm">
                {userId
                  ? "Zyra sta analizzando questo profilo..."
                  : "Zyra sta analizzando il tuo profilo..."}
              </span>
            </div>
          ) : error && !displayRecap ? (
            <div className="space-y-3">
              <p className="text-sm text-danger">{error}</p>
              <Button size="sm" variant="secondary" onClick={fetchRecap}>
                Riprova
              </Button>
            </div>
          ) : isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editedRecap}
                onChange={(e) => setEditedRecap(e.target.value)}
                className="w-full resize-none rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                rows={8}
                placeholder="Scrivi il tuo profilo..."
              />
              {error && <p className="text-sm text-danger">{error}</p>}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  loading={saving}
                  loadingText="Salvataggio"
                >
                  Salva
                </Button>
                <Button size="sm" variant="secondary" onClick={handleCancel}>
                  Annulla
                </Button>
              </div>
            </div>
          ) : displayRecap ? (
            <div className="space-y-2 text-sm leading-relaxed text-foreground">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: (props) => <p className="text-inherit" {...props} />,
                  ul: (props) => (
                    <ul className="list-disc space-y-1 pl-4 text-inherit" {...props} />
                  ),
                  ol: (props) => (
                    <ol className="list-decimal space-y-1 pl-4 text-inherit" {...props} />
                  ),
                  li: (props) => <li className="text-inherit" {...props} />,
                  a: (props) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-current/40 transition hover:decoration-current"
                    />
                  ),
                  strong: (props) => <strong className="font-semibold" {...props} />,
                  em: (props) => <em className="italic" {...props} />,
                  blockquote: (props) => (
                    <blockquote className="border-l-2 border-border-strong pl-3 text-inherit" {...props} />
                  ),
                  code: (props) => (
                    <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-[12px]" {...props} />
                  ),
                  pre: (props) => (
                    <pre className="overflow-x-auto rounded-[var(--radius-md)] bg-surface-muted p-3 text-[12px]" {...props} />
                  ),
                }}
              >
                {displayRecap}
              </ReactMarkdown>
            </div>
          ) : null}
        </div>

        {!loading && !isEditing && displayRecap ? (
          <div className="flex items-center justify-between border-t border-border/40 pt-3">
            <p className="text-[10px] text-subtle">
              {userId
                ? "Generato da Zyra in base al profilo"
                : "Generato da Zyra in base al tuo profilo"}
            </p>
            <div className="flex gap-2">
              {isOwnProfile && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEdit}
                  className="text-foreground hover:bg-surface-muted"
                >
                  Modifica
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleRegenerate}
                className="text-zyra-text hover:bg-zyra-surface-soft"
              >
                Rigenera
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
