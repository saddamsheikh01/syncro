"use client";

import { useStore } from "../utils/useStore";
import type { NotificationsState } from "./notificationsStore";
import { notificationsStore } from "./notificationsStore";

export const useNotificationsStore = <Selected = NotificationsState>(
  selector?: (state: NotificationsState) => Selected
) => useStore(notificationsStore, selector);
