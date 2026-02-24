import type { IsoDateTime, Uuid } from "../shared";

export type ConnectionStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type ConnectionContext = "WORK" | "FRIENDSHIP" | "PROJECTS" | "LOVE" | "OTHER";

export type ConnectionResponse = {
  id: Uuid;
  fromUserId: Uuid;
  toUserId: Uuid;
  status: ConnectionStatus;
  context: ConnectionContext;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
};

export type SendConnectionRequest = {
  toUserId: Uuid;
  context: ConnectionContext;
};

export type ConnectionStatusResponse = {
  status: ConnectionStatus | null;
};

export type PostScope = "AMICIZIA" | "ESPERIENZE" | "LAVORO" | "BENESSERE";

export type PostMood =
  | "SERENO"
  | "ENTUSIASTA"
  | "SOCIEVOLE"
  | "RIFLESSIVO"
  | "RILASSATO"
  | "CARICO"
  | "CURIOSO"
  | "AVVENTUROSO";

export type PostTimeframe = "ORA" | "OGGI";

export type PostReactionType = "LIKE" | "LOVE" | "LAUGH" | "WOW" | "SUPPORT";

export type PostMediaPreviewResponse = {
  id: Uuid;
  url: string;
  mediaType: "IMAGE" | "VIDEO";
  createdAt: IsoDateTime;
};

export type TaggedUserResponse = {
  userId: Uuid;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
};

export type PostSummaryResponse = {
  id: Uuid;
  userId: Uuid;
  content: string;
  scope: PostScope | null;
  mood: PostMood | null;
  timeframe: PostTimeframe | null;
  createdAt: IsoDateTime;
};

export type PostResponse = {
  id: Uuid;
  userId: Uuid;
  content: string;
  language: string | null;
  latitude: number | null;
  longitude: number | null;
  scope: PostScope | null;
  mood: PostMood | null;
  timeframe: PostTimeframe | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  reactions: Record<PostReactionType, number> | Record<string, number>;
  myReaction: PostReactionType | null;
  favoritedByMe: boolean;
  matchScore?: number | null;
  taggedUsers: TaggedUserResponse[];
  media?: PostMediaPreviewResponse[];
  createdAt: IsoDateTime;
};

export type CreatePostRequest = {
  content: string;
  language?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  scope?: PostScope | null;
  mood?: PostMood | null;
  timeframe?: PostTimeframe | null;
  taggedUserIds?: Uuid[] | null;
};

export type UpdatePostRequest = {
  content: string;
};

export type CommentResponse = {
  id: Uuid;
  postId: Uuid;
  userId: Uuid;
  username: string | null;
  userFullName: string | null;
  userAvatarUrl: string | null;
  content: string;
  createdAt: IsoDateTime;
};

export type CreateCommentRequest = {
  content: string;
};

export type CreateConversationRequest = {
  otherUserId: Uuid;
};

export type ChatParticipantInfo = {
  userId: Uuid;
  fullName: string | null;
  avatarUrl: string | null;
  profileIncomplete?: boolean;
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
