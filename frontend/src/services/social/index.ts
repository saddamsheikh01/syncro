import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type {
  ChatConversationResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  CommentResponse,
  ConnectionResponse,
  ConnectionStatusResponse,
  CreateCommentRequest,
  CreateConversationRequest,
  CreatePostRequest,
  SendConnectionRequest,
  UpdatePostRequest,
  PostResponse,
  PostReactionType,
  PostScope,
  PostMood,
  PostTimeframe,
} from "../../types/social";
import type { PageResponse, Uuid } from "../../types/shared";

export type FeedParams = {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  scope?: PostScope;
  mood?: PostMood;
  timeframe?: PostTimeframe;
  city?: string;
  minAge?: number;
  maxAge?: number;
  gender?: string;
  minCompatibility?: number;
  page?: number;
  size?: number;
};

export type PostSearchParams = {
  q: string;
  page?: number;
  size?: number;
};

export type PageParams = {
  page?: number;
  size?: number;
};

export const getFeed = async (
  params: FeedParams = {}
): Promise<PageResponse<PostResponse>> => {
  const { data } = await apiClient.get<PageResponse<PostResponse>>("/posts", {
    params: buildQueryParams(params),
  });
  return data;
};

export const getPostById = async (postId: Uuid): Promise<PostResponse> => {
  const { data } = await apiClient.get<PostResponse>(`/posts/${postId}`);
  return data;
};

export const createPost = async (
  payload: CreatePostRequest
): Promise<PostResponse> => {
  const { data } = await apiClient.post<PostResponse>("/posts", payload);
  return data;
};

export const updatePost = async (
  postId: Uuid,
  payload: UpdatePostRequest
): Promise<PostResponse> => {
  const { data } = await apiClient.put<PostResponse>(`/posts/${postId}`, payload);
  return data;
};

export const deletePost = async (postId: Uuid): Promise<void> => {
  await apiClient.delete(`/posts/${postId}`);
};

export const likePost = async (postId: Uuid): Promise<void> => {
  await apiClient.post(`/posts/${postId}/likes`);
};

export const unlikePost = async (postId: Uuid): Promise<void> => {
  await apiClient.delete(`/posts/${postId}/likes`);
};

export const reactToPost = async (
  postId: Uuid,
  reaction: PostReactionType
): Promise<void> => {
  await apiClient.post(`/posts/${postId}/reactions`, { reaction });
};

export const removeReaction = async (postId: Uuid): Promise<void> => {
  await apiClient.delete(`/posts/${postId}/reactions`);
};

export const searchPosts = async (
  params: PostSearchParams
): Promise<PageResponse<PostResponse>> => {
  const { data } = await apiClient.get<PageResponse<PostResponse>>(
    "/posts/search",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const getConversations = async (
  params: PageParams = {}
): Promise<PageResponse<ChatConversationResponse>> => {
  const { data } = await apiClient.get<PageResponse<ChatConversationResponse>>(
    "/chats",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const createConversation = async (
  payload: CreateConversationRequest
): Promise<ChatConversationResponse> => {
  const { data } = await apiClient.post<ChatConversationResponse>(
    "/chats",
    payload
  );
  return data;
};

export const getMessages = async (
  conversationId: Uuid,
  params: PageParams = {}
): Promise<PageResponse<ChatMessageResponse>> => {
  const { data } = await apiClient.get<PageResponse<ChatMessageResponse>>(
    `/chats/${conversationId}/messages`,
    { params: buildQueryParams(params) }
  );
  return data;
};

export const sendMessage = async (
  conversationId: Uuid,
  payload: ChatMessageRequest
): Promise<ChatMessageResponse> => {
  const { data } = await apiClient.post<ChatMessageResponse>(
    `/chats/${conversationId}/messages`,
    payload
  );
  return data;
};

// Comments API
export const getComments = async (
  postId: Uuid,
  params: PageParams = {}
): Promise<PageResponse<CommentResponse>> => {
  const { data } = await apiClient.get<PageResponse<CommentResponse>>(
    `/posts/${postId}/comments`,
    { params: buildQueryParams(params) }
  );
  return data;
};

export const createComment = async (
  postId: Uuid,
  payload: CreateCommentRequest
): Promise<CommentResponse> => {
  const { data } = await apiClient.post<CommentResponse>(
    `/posts/${postId}/comments`,
    payload
  );
  return data;
};

export const deleteComment = async (
  postId: Uuid,
  commentId: Uuid
): Promise<void> => {
  await apiClient.delete(`/posts/${postId}/comments/${commentId}`);
};

// Connections API
export const sendConnectionRequest = async (
  payload: SendConnectionRequest
): Promise<ConnectionResponse> => {
  const { data } = await apiClient.post<ConnectionResponse>(
    "/connections",
    payload
  );
  return data;
};

export const acceptConnection = async (
  connectionId: Uuid
): Promise<ConnectionResponse> => {
  const { data } = await apiClient.post<ConnectionResponse>(
    `/connections/${connectionId}/accept`
  );
  return data;
};

export const rejectConnection = async (
  connectionId: Uuid
): Promise<ConnectionResponse> => {
  const { data } = await apiClient.post<ConnectionResponse>(
    `/connections/${connectionId}/reject`
  );
  return data;
};

export const getConnections = async (
  params: PageParams = {}
): Promise<PageResponse<ConnectionResponse>> => {
  const { data } = await apiClient.get<PageResponse<ConnectionResponse>>(
    "/connections",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const getPendingConnections = async (
  params: PageParams = {}
): Promise<PageResponse<ConnectionResponse>> => {
  const { data } = await apiClient.get<PageResponse<ConnectionResponse>>(
    "/connections/pending",
    { params: buildQueryParams(params) }
  );
  return data;
};

export const getConnectionStatusWith = async (
  userId: Uuid
): Promise<ConnectionStatusResponse> => {
  const { data } = await apiClient.get<ConnectionStatusResponse>(
    "/connections/status",
    { params: { userId } }
  );
  return data;
};
