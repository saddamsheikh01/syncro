import type { IsoDateTime, Uuid } from "../shared";

export type MediaType = "IMAGE" | "VIDEO";
export type MediaOwnerType = "USER_PROFILE" | "POST" | "PLACE" | "EXPERIENCE";

export type MediaResponse = {
  id: Uuid;
  url: string;
  mediaType: MediaType;
  ownerType: MediaOwnerType;
  ownerId: Uuid;
  createdAt: IsoDateTime;
};
