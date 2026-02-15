"use client";

import { useEffect, useRef, type HTMLAttributes } from "react";
import type { ChatMessageResponse } from "@/types/social";
import type { Uuid } from "@/types/shared";
import { Loader } from "@/components/elements/Loader";
import { Skeleton } from "@/components/elements/Skeleton";
import { cx } from "@/lib/classNames";
import { MapMessageBubble } from "../lists/MapMessageBubble";
import { useT } from "@/hooks";

export interface MessageListProps extends HTMLAttributes<HTMLDivElement> {
  messages: ChatMessageResponse[];
  currentUserId: Uuid;
  loading?: boolean;
  emptyMessage?: string;
}

const MessageListSkeleton = () => (
  <div className="flex flex-col gap-3 p-4">
    <div className="flex justify-start">
      <Skeleton className="h-16 w-2/3" />
    </div>
    <div className="flex justify-end">
      <Skeleton className="h-12 w-1/2" />
    </div>
    <div className="flex justify-start">
      <Skeleton className="h-20 w-3/4" />
    </div>
    <div className="flex justify-end">
      <Skeleton className="h-14 w-2/3" />
    </div>
  </div>
);

export const MessageList = ({
  className,
  messages,
  currentUserId,
  loading = false,
  emptyMessage,
  ...props
}: MessageListProps) => {
  const { t } = useT();
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages.length);
  const resolvedEmptyMessage =
    emptyMessage ?? t("No messages yet. Start the conversation!");

  useEffect(() => {
    if (containerRef.current && messages.length > prevMessagesLength.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    prevMessagesLength.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    if (containerRef.current && messages.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, []);

  if (loading && messages.length === 0) {
    return (
      <div className={cx("flex-1 overflow-y-auto", className)} {...props}>
        <MessageListSkeleton />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div
        className={cx(
          "flex flex-1 items-center justify-center p-6",
          className
        )}
        {...props}
      >
        <p className="text-center text-sm text-muted">
          {resolvedEmptyMessage}
        </p>
      </div>
    );
  }

  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div
      ref={containerRef}
      className={cx("flex-1 overflow-y-auto", className)}
      {...props}
    >
      <div className="flex flex-col gap-3 p-4">
        {loading ? (
          <div className="flex justify-center py-2">
            <Loader size="sm" />
          </div>
        ) : null}
        <MapMessageBubble
          messages={sortedMessages}
          currentUserId={currentUserId}
        />
      </div>
    </div>
  );
};
