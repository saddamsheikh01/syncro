import type { ChatMessageResponse } from "@/types/social";
import type { Uuid } from "@/types/shared";
import { MessageBubble } from "../elements/MessageBubble";

export interface MapMessageBubbleProps {
  messages: ChatMessageResponse[];
  currentUserId: Uuid;
}

export const MapMessageBubble = ({
  messages,
  currentUserId,
}: MapMessageBubbleProps) => (
  <>
    {messages.map((message) => (
      <MessageBubble
        key={message.id}
        content={message.content}
        createdAt={message.createdAt}
        isOwn={message.userId === currentUserId}
      />
    ))}
  </>
);
