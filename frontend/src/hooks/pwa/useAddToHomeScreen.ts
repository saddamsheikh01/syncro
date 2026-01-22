"use client";

import { useState, useCallback, useEffect } from "react";

type DeviceType = "ios" | "android" | "other";

interface A2HSState {
  mounted: boolean;
  shouldShow: boolean;
  deviceType: DeviceType;
  isStandalone: boolean;
}

interface AddToHomeScreenState {
  shouldShow: boolean;
  deviceType: DeviceType;
  isStandalone: boolean;
  dismiss: () => void;
  dismissPermanently: () => void;
}

const STORAGE_KEY = "syncro_a2hs_dismissed";
const DISMISS_DURATION_DAYS = 7;

const getDeviceType = (): DeviceType => {
  const ua = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) {
    return "ios";
  }

  if (/android/.test(ua)) {
    return "android";
  }

  return "other";
};

const isInStandaloneMode = (): boolean => {
  if ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone) {
    return true;
  }

  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }

  return false;
};

const isDismissed = (): boolean => {
  const dismissed = localStorage.getItem(STORAGE_KEY);
  if (!dismissed) return false;

  try {
    const { permanent, until } = JSON.parse(dismissed);

    if (permanent) return true;

    if (until && new Date(until) > new Date()) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
};

const isLocalhost = (): boolean => {
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1";
};

const initialState: A2HSState = {
  mounted: false,
  shouldShow: false,
  deviceType: "other",
  isStandalone: false,
};

export const useAddToHomeScreen = (): AddToHomeScreenState => {
  const [state, setState] = useState<A2HSState>(initialState);

  useEffect(() => {
    const device = getDeviceType();
    const standalone = isInStandaloneMode();
    const dismissed = isDismissed();
    const isDev = isLocalhost();
    const isMobile = device === "ios" || device === "android";

    // eslint-disable-next-line react-hooks/set-state-in-effect -- Sync with browser APIs on mount
    setState({
      mounted: true,
      deviceType: device,
      isStandalone: standalone,
      shouldShow: (isMobile || isDev) && !standalone && !dismissed,
    });
  }, []);

  const dismiss = useCallback(() => {
    const until = new Date();
    until.setDate(until.getDate() + DISMISS_DURATION_DAYS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      permanent: false,
      until: until.toISOString()
    }));

    setState((prev) => ({ ...prev, shouldShow: false }));
  }, []);

  const dismissPermanently = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      permanent: true
    }));

    setState((prev) => ({ ...prev, shouldShow: false }));
  }, []);

  return {
    shouldShow: state.mounted && state.shouldShow,
    deviceType: state.deviceType,
    isStandalone: state.isStandalone,
    dismiss,
    dismissPermanently,
  };
};
