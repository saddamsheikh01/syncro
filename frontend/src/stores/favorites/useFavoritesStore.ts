"use client";

import { useStore } from "../utils/useStore";
import type { FavoritesState } from "./favoritesStore";
import { favoritesStore } from "./favoritesStore";

export const useFavoritesStore = <Selected = FavoritesState>(
  selector?: (state: FavoritesState) => Selected
) => useStore(favoritesStore, selector);
