import type { IsoDateTime } from "../shared";

export type ApiErrorResponse = {
  timestamp: IsoDateTime;
  status: number;
  error: string;
  message: string;
  path: string;
};

export type ApiErrorCode = "HTTP_ERROR" | "NETWORK_ERROR" | "TIMEOUT" | "UNKNOWN";

export type ApiError = {
  code: ApiErrorCode;
  status: number;
  message: string;
  error?: string;
  path?: string;
  timestamp?: IsoDateTime;
};
