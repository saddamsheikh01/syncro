import type { Uuid } from "../shared";

export type TagResponse = {
  id: Uuid;
  name: string;
};

export type TagListResponse = {
  tags: TagResponse[];
};

export type UpdateUserInterestsRequest = {
  tagIds: Uuid[];
};

export type UserInterestsResponse = {
  userId: Uuid;
  tags: TagResponse[];
};
