"use client";

import { useMemo } from "react";
import { tagsActions } from "../../stores/tags/tagsStore";
import { useTagsStore } from "../../stores/tags/useTagsStore";

export const useTags = () => {
  const state = useTagsStore();

  const actions = useMemo(
    () => ({
      fetchTags: tagsActions.fetchTags,
      fetchUserInterests: tagsActions.fetchUserInterests,
      updateUserInterests: tagsActions.updateUserInterests,
    }),
    []
  );

  return {
    ...state,
    hasInterests: Boolean(state.interests?.tags?.length),
    actions,
  };
};
