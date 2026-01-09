"use client";

import { useStore } from "../utils/useStore";
import type { FeedState } from "./feedStore";
import { feedStore } from "./feedStore";

export const useFeedStore = <Selected = FeedState>(
  selector?: (state: FeedState) => Selected
) => useStore(feedStore, selector);
