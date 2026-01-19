import type { IsoDateTime, Uuid } from "../shared";

export type PostResponse = {
  id: Uuid;
  userId: Uuid;
  content: string;
  language: string | null;
  latitude: number | null;
  longitude: number | null;
  likeCount: number;
  likedByMe: boolean;
  createdAt: IsoDateTime;
};

export type CreatePostRequest = {
  content: string;
  language?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type CreateConversationRequest = {
  otherUserId: Uuid;
};

export type ChatParticipantInfo = {
  userId: Uuid;
  fullName: string | null;
  avatarUrl: string | null;
};

export type ChatConversationResponse = {
  id: Uuid;
  participantIds: Uuid[];
  participants: ChatParticipantInfo[];
  lastMessage: ChatMessageResponse | null;
  createdAt: IsoDateTime;
};

export type ChatMessageRequest = {
  content: string;
};

export type ChatMessageResponse = {
  id: Uuid;
  conversationId: Uuid;
  userId: Uuid;
  content: string;
  createdAt: IsoDateTime;
};
