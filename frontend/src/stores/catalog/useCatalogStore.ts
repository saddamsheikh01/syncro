"use client";

import { useStore } from "../utils/useStore";
import type { CatalogState } from "./catalogStore";
import { catalogStore } from "./catalogStore";

export const useCatalogStore = <Selected = CatalogState>(
  selector?: (state: CatalogState) => Selected
) => useStore(catalogStore, selector);
