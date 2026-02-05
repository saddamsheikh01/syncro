import type { IsoDateTime } from "../shared";

export type ReferralLinkResponse = {
  code: string;
  usesCount: number;
  createdAt: IsoDateTime;
};
