import type { HTMLAttributes } from "react";
import { EmptyState } from "@/components/elements/EmptyState";

const ChatIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-6 w-6"
    aria-hidden="true"
  >
    <path d="M5 7h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
  </svg>
);

export interface ConversationEmptyStateProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}

export const ConversationEmptyState = ({
  title = "Nessuna conversazione",
  description = "Inizia una chat per vedere i messaggi qui.",
  actionLabel = "Trova persone",
  actionHref = "/",
  ...props
}: ConversationEmptyStateProps) => (
  <EmptyState
    title={title}
    description={description}
    actionLabel={actionLabel}
    actionHref={actionHref}
    icon={<ChatIcon />}
    {...props}
  />
);
