"use client";

import { useEffect, useId, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { UnsavedChangesModal } from "@/components/ui/UnsavedChangesModal";
import { Textarea } from "@/components/elements/Textarea";
import { Switch } from "@/components/elements/Switch";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Select } from "@/components/elements/Select";
import { Avatar } from "@/components/elements/Avatar";
import { Loader } from "@/components/elements/Loader";
import { cx } from "@/lib/classNames";
import { searchUsers } from "@/services/users";
import type { UserSummaryResponse } from "@/types/profile";
import type {
  PostMood,
  PostScope,
  PostTimeframe,
} from "@/types/social";

export type PostComposerPayload = {
  content: string;
  files: File[];
  includePosition: boolean;
  scope?: PostScope | null;
  mood?: PostMood | null;
  timeframe?: PostTimeframe | null;
  taggedUserIds?: string[];
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
const MAX_MEDIA_FILES = 6;
const ALLOWED_TYPES = ["image/", "video/"];

const SCOPE_OPTIONS = [
  { label: "Select a scope", value: "" },
  { label: "Friendship", value: "AMICIZIA" },
  { label: "Experiences", value: "ESPERIENZE" },
  { label: "Work", value: "LAVORO" },
  { label: "Wellness", value: "BENESSERE" },
];

const MOOD_OPTIONS = [
  { label: "Select a mood", value: "" },
  { label: "Calm", value: "SERENO" },
  { label: "Excited", value: "ENTUSIASTA" },
  { label: "Social", value: "SOCIEVOLE" },
  { label: "Reflective", value: "RIFLESSIVO" },
  { label: "Relaxed", value: "RILASSATO" },
  { label: "Energized", value: "CARICO" },
  { label: "Curious", value: "CURIOSO" },
  { label: "Adventurous", value: "AVVENTUROSO" },
];

const TIMEFRAME_OPTIONS = [
  { label: "Select a time", value: "" },
  { label: "Now", value: "ORA" },
  { label: "Today", value: "OGGI" },
];

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
  const [scope, setScope] = useState<"" | PostScope>("");
  const [mood, setMood] = useState<"" | PostMood>("");
  const [timeframe, setTimeframe] = useState<"" | PostTimeframe>("");
  const [tagQuery, setTagQuery] = useState("");
  const [tagResults, setTagResults] = useState<UserSummaryResponse[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<UserSummaryResponse[]>([]);
  const [tagLoading, setTagLoading] = useState(false);

  const taggedUserIds = useMemo(
    () => taggedUsers.map((user) => user.userId),
    [taggedUsers]
  );

  const hasUnsavedChanges =
    content.trim().length > 0 ||
    files.length > 0 ||
    scope !== "" ||
    mood !== "" ||
    timeframe !== "" ||
    taggedUsers.length > 0;

  const resetForm = () => {
    setContent("");
    setFiles([]);
    setLocalError(null);
    setIncludePosition(positionAvailable);
    setScope("");
    setMood("");
    setTimeframe("");
    setTagQuery("");
    setTagResults([]);
    setTaggedUsers([]);
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

  useEffect(() => {
    const query = tagQuery.trim();
    if (query.length < 2) return;

    let active = true;
    const timeout = setTimeout(() => {
      setTagLoading(true);
      searchUsers({ q: query, size: 5 })
        .then((response) => {
          if (!active) return;
          const filtered = response.content.filter(
            (user) => !taggedUserIds.includes(user.userId)
          );
          setTagResults(filtered);
        })
        .catch(() => {
          if (!active) return;
          setTagResults([]);
        })
        .finally(() => {
          if (!active) return;
          setTagLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [tagQuery, taggedUserIds]);

  const handleTagQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTagQuery(value);
    if (value.trim().length < 2) {
      setTagResults([]);
      setTagLoading(false);
    }
  };

  const handleAddTaggedUser = (user: UserSummaryResponse) => {
    setTaggedUsers((prev) => {
      if (prev.some((item) => item.userId === user.userId)) {
        return prev;
      }
      if (prev.length >= 10) {
        setLocalError("You can tag up to 10 people.");
        return prev;
      }
      return [...prev, user];
    });
    setTagQuery("");
    setTagResults([]);
  };

  const handleRemoveTaggedUser = (userId: string) => {
    setTaggedUsers((prev) => prev.filter((item) => item.userId !== userId));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (!selectedFiles.length) return;

    const validationErrors: string[] = [];
    const validFiles: File[] = [];

    for (const file of selectedFiles) {
      if (!isValidFileType(file)) {
        validationErrors.push(
          `"${file.name}" is not a valid format. Use images or videos.`
        );
        continue;
      }
      if (!isValidFileSize(file)) {
        validationErrors.push(
          `"${file.name}" exceeds the ${MAX_FILE_SIZE_MB} MB limit.`
        );
        continue;
      }
      validFiles.push(file);
    }

    const remainingSlots = Math.max(0, MAX_MEDIA_FILES - files.length);
    const acceptedFiles = validFiles.slice(0, remainingSlots);

    if (remainingSlots === 0 || validFiles.length > acceptedFiles.length) {
      validationErrors.push(`You can attach up to ${MAX_MEDIA_FILES} files.`);
    }

    if (acceptedFiles.length) {
      setFiles((prev) => [...prev, ...acceptedFiles]);
    }

    setLocalError(validationErrors.length ? validationErrors.join(" ") : null);
    event.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    setLocalError(null);
    const trimmed = content.trim();

    if (!trimmed) {
      setLocalError("Write something before publishing.");
      return;
    }

    await onSubmit({
      content: trimmed,
      files,
      includePosition: includePosition && positionAvailable,
      scope: scope || null,
      mood: mood || null,
      timeframe: timeframe || null,
      taggedUserIds,
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
      title="Create a post"
      description="Share a thought or a photo with the community."
      onClose={handleClose}
    >
      <div className="space-y-4">
        <Textarea
          label="Text"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="What are you experiencing today?"
          rows={4}
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <Select
            label="Scope"
            options={SCOPE_OPTIONS}
            value={scope}
            onValueChange={(value) => setScope(value as "" | PostScope)}
          />
          <Select
            label="Mood"
            options={MOOD_OPTIONS}
            value={mood}
            onValueChange={(value) => setMood(value as "" | PostMood)}
          />
          <Select
            label="Time"
            options={TIMEFRAME_OPTIONS}
            value={timeframe}
            onValueChange={(value) => setTimeframe(value as "" | PostTimeframe)}
          />
        </div>

        <Card className="space-y-3 border-dashed border-border/70 bg-surface-muted p-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              People with you
            </p>
            <p className="text-xs text-subtle">
              Tag up to 10 people who were with you.
            </p>
          </div>
          <Input
            label="Search people"
            value={tagQuery}
            onChange={handleTagQueryChange}
            placeholder="Search by name or username"
          />
          {tagLoading ? (
            <div className="flex items-center gap-2 text-xs text-subtle">
              <Loader size="sm" />
              Searching...
            </div>
          ) : null}
          {tagResults.length ? (
            <div className="space-y-2">
              {tagResults.map((user) => (
                <button
                  key={user.userId}
                  type="button"
                  onClick={() => handleAddTaggedUser(user)}
                  className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border/70 bg-surface px-3 py-2 text-left text-xs text-foreground hover:border-border-strong"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={user.fullName ?? user.username ?? "User"} src={user.avatarUrl ?? undefined} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {user.fullName ?? user.username ?? "Syncro user"}
                      </p>
                      {user.username ? (
                        <p className="truncate text-[11px] text-subtle">
                          @{user.username}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-accent">
                    Add
                  </span>
                </button>
              ))}
            </div>
          ) : null}
          {taggedUsers.length ? (
            <div className="flex flex-wrap gap-2">
              {taggedUsers.map((user) => (
                <span
                  key={user.userId}
                  className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface px-3 py-1.5 text-xs text-foreground"
                >
                  <Avatar
                    name={user.fullName ?? user.username ?? "User"}
                    src={user.avatarUrl ?? undefined}
                    size="sm"
                  />
                  <span className="max-w-[120px] truncate">
                    {user.fullName ?? user.username ?? "User"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTaggedUser(user.userId)}
                    className="text-[10px] font-semibold text-subtle hover:text-foreground"
                  >
                    Remove
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </Card>

        <Card className="space-y-3 border-dashed border-border/70 bg-surface-muted p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
              Attached media
              </p>
              <p className="text-xs text-subtle">
                Add images or videos (max {MAX_FILE_SIZE_MB} MB each, up to{" "}
                {MAX_MEDIA_FILES} files).
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor={inputId}
                className={cx(
                  "inline-flex items-center rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground",
                  loading && "cursor-not-allowed opacity-60"
                )}
              >
                Add media
              </label>
              <input
                id={inputId}
                type="file"
                accept="image/*,video/*"
                multiple
                className="sr-only"
                onChange={handleFileChange}
                disabled={loading}
              />
            </div>
          </div>

          {fileItems.length ? (
            <div className="space-y-2">
              {fileItems.map((file, index) => (
                <div
                  key={file.key}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border/70 bg-surface px-3 py-2 text-xs text-foreground"
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
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-subtle">
              No media selected.
            </p>
          )}
        </Card>

        <Switch
          label="Use my location"
          description={
            positionAvailable
              ? positionLabel
                ? `Location: ${positionLabel}`
                : "Adds geolocation to the post."
              : "Enable location to use it in posts."
          }
          checked={includePosition}
          onChange={(event) => setIncludePosition(event.target.checked)}
          disabled={!positionAvailable || loading}
        />

        {localError || error ? (
          <Card className="border-danger/30 bg-danger/10 p-3">
            <p className="text-xs text-danger">
              {localError ?? error ?? "Error while publishing."}
            </p>
          </Card>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            loadingText="Publishing"
          >
            Publish
          </Button>
        </div>
      </div>

      <UnsavedChangesModal
        open={showConfirmClose}
        onConfirm={handleConfirmClose}
        onCancel={handleCancelClose}
        title="Post not published"
        description="You wrote a post that hasn&apos;t been published. If you leave now, the content will be lost."
      />
    </Modal>
  );
};
