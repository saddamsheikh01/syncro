import { apiClient } from "../axiosConfig";
import { buildQueryParams } from "../utils/queryParams";
import type { MediaOwnerType, MediaResponse } from "../../types/media";
import type { PageResponse, Uuid } from "../../types/shared";

const MEDIA_UPLOAD_TIMEOUT_MS = 180_000;

export type MediaListParams = {
  ownerType: MediaOwnerType;
  ownerId: Uuid;
  page?: number;
  size?: number;
};

export type PostMediaListParams = {
  postId: Uuid;
  page?: number;
  size?: number;
};

export const getMediaByOwner = async (
  params: MediaListParams
): Promise<PageResponse<MediaResponse>> => {
  const { data } = await apiClient.get<PageResponse<MediaResponse>>("/media", {
    params: buildQueryParams(params),
  });
  return data;
};

export const uploadMedia = async (params: {
  file: File;
  ownerType: MediaOwnerType;
  ownerId: Uuid;
}): Promise<MediaResponse> => {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("ownerType", params.ownerType);
  formData.append("ownerId", params.ownerId);

  const { data } = await apiClient.post<MediaResponse>("/media", formData, {
    timeout: MEDIA_UPLOAD_TIMEOUT_MS,
  });
  return data;
};

export const getPostMedia = async (
  params: PostMediaListParams
): Promise<PageResponse<MediaResponse>> => {
  const { postId, ...pagination } = params;
  const { data } = await apiClient.get<PageResponse<MediaResponse>>(
    `/posts/${postId}/media`,
    { params: buildQueryParams(pagination) }
  );
  return data;
};

export const deletePostMedia = async (
  postId: Uuid,
  mediaId: Uuid
): Promise<void> => {
  await apiClient.delete(`/posts/${postId}/media/${mediaId}`);
};

export const uploadPostMedia = async (params: {
  postId: Uuid;
  file: File;
}): Promise<MediaResponse> => {
  const formData = new FormData();
  formData.append("file", params.file);

  const { data } = await apiClient.post<MediaResponse>(
    `/posts/${params.postId}/media`,
    formData,
    {
      timeout: MEDIA_UPLOAD_TIMEOUT_MS,
    }
  );
  return data;
};
