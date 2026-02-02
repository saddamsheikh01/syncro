"use client";

import { useId, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { UnsavedChangesModal } from "@/components/ui/UnsavedChangesModal";
import { Textarea } from "@/components/elements/Textarea";
import { Switch } from "@/components/elements/Switch";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { cx } from "@/lib/classNames";

export type PostComposerPayload = {
  content: string;
  files: File[];
  includePosition: boolean;
};

export interface PostComposerModalProps {
  open: boolean;
  loading?: boolean;
  error?: string | null;
  positionAvailable?: boolean;
  positionLabel?: string;
  onClose: () => void;
  onSubmit: (payload: PostComposerPayload) => Promise<void>;
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["image/", "video/"];

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes)) return "";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
};

const isValidFileType = (file: File) =>
  ALLOWED_TYPES.some((type) => file.type.startsWith(type));

const isValidFileSize = (file: File) => file.size <= MAX_FILE_SIZE_BYTES;

export const PostComposerModal = ({
  open,
  loading = false,
  error,
  positionAvailable = false,
  positionLabel,
  onClose,
  onSubmit,
}: PostComposerModalProps) => {
  const inputId = useId();
  const [content, setContent] = useState("");
  const [includePosition, setIncludePosition] = useState(positionAvailable);
  const [files, setFiles] = useState<File[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const hasUnsavedChanges = content.trim().length > 0 || files.length > 0;

  const resetForm = () => {
    setContent("");
    setFiles([]);
    setLocalError(null);
    setIncludePosition(positionAvailable);
    setShowConfirmClose(false);
  };

  const handleClose = () => {
    if (loading) return;
    if (hasUnsavedChanges) {
      setShowConfirmClose(true);
      return;
    }
    resetForm();
    onClose();
  };

  const handleConfirmClose = () => {
    resetForm();
    onClose();
  };

  const handleCancelClose = () => {
    setShowConfirmClose(false);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const nextFiles = Array.from(event.target.files);
    if (!nextFiles.length) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    for (const file of nextFiles) {
      if (!isValidFileType(file)) {
        errors.push(`"${file.name}" non è un formato valido. Usa immagini o video.`);
        continue;
      }
      if (!isValidFileSize(file)) {
        errors.push(`"${file.name}" supera il limite di ${MAX_FILE_SIZE_MB} MB.`);
        continue;
      }
      validFiles.push(file);
    }

    if (errors.length > 0) {
      setLocalError(errors.join(" "));
    } else {
      setLocalError(null);
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }

    event.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    setLocalError(null);
    const trimmed = content.trim();

    if (!trimmed) {
      setLocalError("Scrivi qualcosa prima di pubblicare.");
      return;
    }

    await onSubmit({
      content: trimmed,
      files,
      includePosition: includePosition && positionAvailable,
    });
  };

  const fileItems = useMemo(
    () =>
      files.map((file, index) => ({
        key: `${file.name}-${index}`,
        name: file.name,
        size: formatFileSize(file.size),
      })),
    [files]
  );

  return (
    <Modal
      open={open}
      title="Crea un post"
      description="Condividi un pensiero o una foto con la community."
      onClose={handleClose}
    >
      <div className="space-y-4">
        <Textarea
          label="Testo"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Cosa stai vivendo oggi?"
          rows={4}
        />

        <Card className="space-y-3 border-dashed border-border/70 bg-surface-muted p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Media allegati
              </p>
              <p className="text-xs text-subtle">
                Aggiungi immagini o video (max {MAX_FILE_SIZE_MB} MB per file).
              </p>
            </div>
            <label
              htmlFor={inputId}
              className={cx(
                "inline-flex items-center rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground",
                loading && "cursor-not-allowed opacity-60"
              )}
            >
              Aggiungi media
            </label>
            <input
              id={inputId}
              type="file"
              multiple
              accept="image/*,video/*"
              className="sr-only"
              onChange={handleFileChange}
              disabled={loading}
            />
          </div>

          {fileItems.length ? (
            <div className="space-y-2">
              {fileItems.map((file, index) => (
                <div
                  key={file.key}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border/60 bg-surface px-3 py-2 text-xs text-foreground"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{file.name}</p>
                    {file.size ? (
                      <p className="text-[11px] text-subtle">{file.size}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="text-[11px] font-semibold text-subtle hover:text-foreground"
                    disabled={loading}
                  >
                    Rimuovi
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-subtle">
              Nessun media selezionato.
            </p>
          )}
        </Card>

        <Switch
          label="Usa la mia posizione"
          description={
            positionAvailable
              ? positionLabel
                ? `Posizione: ${positionLabel}`
                : "Aggiunge la geolocalizzazione al post."
              : "Attiva la posizione per usarla nei post."
          }
          checked={includePosition}
          onChange={(event) => setIncludePosition(event.target.checked)}
          disabled={!positionAvailable || loading}
        />

        {localError || error ? (
          <Card className="border-danger/30 bg-danger/10 p-3">
            <p className="text-xs text-danger">
              {localError ?? error ?? "Errore durante la pubblicazione."}
            </p>
          </Card>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Annulla
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            loadingText="Pubblicazione"
          >
            Pubblica
          </Button>
        </div>
      </div>

      <UnsavedChangesModal
        open={showConfirmClose}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
        title="Post non pubblicato"
        description="Hai scritto un post che non è stato pubblicato. Se esci adesso, il contenuto andrà perso."
      />
    </Modal>
  );
};
