import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type {
  ChatConversationResponse,
  ChatMessageRequest,
  ChatMessageResponse,
  CommentResponse,
  CreateCommentRequest,
  CreateConversationRequest,
  CreatePostRequest,
  PostResponse,
} from "../../types/social";
import type { PageResponse, Uuid } from "../../types/shared";

export type FeedParams = {
  lat?: number;
  lng?: number;
  radiusKm?: number;
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

export const createPost = async (
  payload: CreatePostRequest
): Promise<PostResponse> => {
  const { data } = await apiClient.post<PostResponse>("/posts", payload);
  return data;
};

export const likePost = async (postId: Uuid): Promise<void> => {
  await apiClient.post(`/posts/${postId}/likes`);
};

export const unlikePost = async (postId: Uuid): Promise<void> => {
  await apiClient.delete(`/posts/${postId}/likes`);
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
