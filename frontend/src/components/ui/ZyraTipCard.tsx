"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar } from "@/components/elements/Avatar";
import { Button } from "@/components/buttons/Button";
import { useAuth, useZyra } from "@/hooks";
import { cx } from "@/lib/classNames";
import { ZYRA_AVATAR_SRC } from "@/lib/zyraAvatar";
import { storeZyraSeedMessage } from "@/lib/zyraSeed";

const QUICK_REPLIES = [
  "Sounds good, let's go!",
  "Yes, tell me more",
  "Not now, thanks",
];

const DEFAULT_MAIN_PROMPT =
  "Want to improve your matches right away?";

export const ZyraTipCard = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { loadingSuggestions, actions } = useZyra();
  const [replyValue, setReplyValue] = useState("");
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    actions.fetchSuggestions({ size: 2 }).catch(() => undefined);
  }, [actions]);

  const greetingName = user?.username || user?.email?.split("@")[0] || "there";

  const handleSend = (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    storeZyraSeedMessage(trimmed);
    setReplyValue("");
    router.push("/chat");
  };

  return (
    <div
      className={cx(
        "rounded-[var(--radius-xl)] border border-white/70 bg-[#f7f1f7] p-4 shadow-sm",
        "transition-all duration-300 hover:shadow-md"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar name="Zyra" src={ZYRA_AVATAR_SRC} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-foreground">Zyra</p>
          <p className="text-xs text-muted">
            Your Personal AI On Syncro.
          </p>
          <p className="text-xs text-muted">
            She Guides You, Advises You,
            <br />
            And Explains Your Matches.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 rounded-[var(--radius-lg)] bg-[#eef2f9] px-3 py-3 text-xs text-muted">
        <p className="text-xs font-semibold text-foreground">
          {loadingSuggestions ? "Thinking..." : `Hi ${greetingName}! ${DEFAULT_MAIN_PROMPT}`}
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_REPLIES.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => handleSend(label)}
              className="rounded-full bg-[#e1e8f4] px-3 py-1 text-[10px] font-medium text-muted transition hover:text-foreground"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-white px-3 py-2">
          <input
            type="text"
            placeholder="Type your reply..."
            value={replyValue}
            onChange={(event) => setReplyValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSend(replyValue);
              }
            }}
            className="flex-1 bg-transparent text-[11px] text-muted outline-none placeholder:text-subtle"
            aria-label="Type your reply"
          />
          <button
            type="button"
            onClick={() => handleSend(replyValue)}
            disabled={!replyValue.trim()}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Send reply"
          >
            <svg
              className="h-3 w-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <Link href="/chat" className="mt-4 block">
        <Button size="sm" fullWidth>
          Continue The Chat With Zyra
        </Button>
      </Link>
      <p className="mt-2 text-center text-[10px] text-subtle">
        The More You Interact, The Better Your Matches Become.
      </p>
    </div>
  );
};
