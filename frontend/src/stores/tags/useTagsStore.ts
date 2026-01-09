"use client";

import { useStore } from "../utils/useStore";
import type { TagsState } from "./tagsStore";
import { tagsStore } from "./tagsStore";

export const useTagsStore = <Selected = TagsState>(
  selector?: (state: TagsState) => Selected
) => useStore(tagsStore, selector);
