"use client";

import { useContext } from "react";
import { I18nContext } from "@/i18n/I18nProvider";

export const useT = () => {
  return useContext(I18nContext);
};

