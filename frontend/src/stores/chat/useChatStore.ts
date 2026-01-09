"use client";

import { useStore } from "../utils/useStore";
import type { ChatState } from "./chatStore";
import { chatStore } from "./chatStore";

export const useChatStore = <Selected = ChatState>(
  selector?: (state: ChatState) => Selected
) => useStore(chatStore, selector);
