export type Uuid = string;
export type IsoDate = string;
export type IsoDateTime = string;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export type SortState = {
  sorted: boolean;
  unsorted: boolean;
  empty: boolean;
};

export type PageableState = {
  sort: SortState;
  offset: number;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  unpaged: boolean;
};

export type PageResponse<T> = {
  content: T[];
  pageable: PageableState;
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: SortState;
  numberOfElements: number;
  first: boolean;
  empty: boolean;
};
