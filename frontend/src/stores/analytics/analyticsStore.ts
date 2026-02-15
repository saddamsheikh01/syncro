import { trackEventsBatch } from "../../services/analytics";
import type { ApiError } from "../../types/api";
import type {
  AnalyticsBatchEventRequest,
  AnalyticsTrackInput,
} from "../../types/analytics";
import { createStore } from "../utils/createStore";
import { readStorage, writeStorage } from "../utils/storage";

const COOKIE_CONSENT_KEY = "syncro.cookie.consent";
const ANALYTICS_QUEUE_KEY = "syncro.analytics.queue";
const ANALYTICS_SESSION_KEY = "syncro.analytics.session_id";
const ANALYTICS_APP_OPENED_KEY = "syncro.analytics.app_opened";
const MAX_BATCH_SIZE = 50;

type CookieConsentData = {
  accepted: boolean;
  acceptedAt: string | null;
};

export type AnalyticsState = {
  lastEvent: AnalyticsBatchEventRequest | null;
  loading: boolean;
  error: ApiError | null;
  queueSize: number;
};

const initialState: AnalyticsState = {
  lastEvent: null,
  loading: false,
  error: null,
  queueSize: 0,
};

export const analyticsStore = createStore<AnalyticsState>(initialState);

let flushPromise: Promise<void> | null = null;
let listenersBound = false;

const readQueue = () =>
  readStorage<AnalyticsBatchEventRequest[]>(ANALYTICS_QUEUE_KEY, []);

const writeQueue = (events: AnalyticsBatchEventRequest[]) => {
  writeStorage(ANALYTICS_QUEUE_KEY, events.length > 0 ? events : null);
};

const generateUuid = () => {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  const random = Math.random().toString(16).slice(2);
  return `${Date.now()}-${random}`;
};

const resolveRoute = (inputRoute?: string | null) => {
  if (inputRoute && inputRoute.trim()) {
    return inputRoute.trim();
  }
  if (typeof window === "undefined") {
    return null;
  }
  const pathname = window.location.pathname || "/";
  const search = window.location.search || "";
  return `${pathname}${search}`;
};

const resolveConsentAnalytics = () => {
  const consent = readStorage<CookieConsentData | null>(COOKIE_CONSENT_KEY, null);
  return consent?.accepted === true;
};

const resolveSessionId = () => {
  if (typeof window === "undefined") {
    return null;
  }
  const existing = window.sessionStorage.getItem(ANALYTICS_SESSION_KEY);
  if (existing) {
    return existing;
  }
  const created = generateUuid();
  window.sessionStorage.setItem(ANALYTICS_SESSION_KEY, created);
  return created;
};

const resolveEventName = (payload: AnalyticsTrackInput) => {
  const rawEventName = payload.eventName ?? payload.eventType;
  if (!rawEventName) {
    throw new Error("Analytics event name mancante");
  }
  return rawEventName.trim().toUpperCase();
};

const buildEvent = (payload: AnalyticsTrackInput): AnalyticsBatchEventRequest => {
  const eventName = resolveEventName(payload);
  const eventId = generateUuid();
  const occurredAt = payload.occurredAt ?? new Date().toISOString();
  return {
    eventId,
    eventName,
    eventVersion: 1,
    idempotencyKey: eventId,
    sessionId: resolveSessionId() ?? generateUuid(),
    occurredAt,
    route: resolveRoute(payload.route),
    platform: "web",
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION?.trim() || "web",
    eventSource: "web",
    consentAnalytics: resolveConsentAnalytics(),
    userAgent:
      typeof navigator !== "undefined" && navigator.userAgent
        ? navigator.userAgent
        : null,
    payload: payload.payload ?? {},
  };
};

const enqueueEvent = (event: AnalyticsBatchEventRequest) => {
  const queue = readQueue();
  const nextQueue = [...queue, event];
  writeQueue(nextQueue);
  return nextQueue.length;
};

const dequeueChunk = (size: number) => {
  const queue = readQueue();
  if (queue.length === 0) {
    return 0;
  }
  const nextQueue = queue.slice(size);
  writeQueue(nextQueue);
  return nextQueue.length;
};

const setQueueSize = (queueSize: number) => {
  analyticsStore.setState({ queueSize });
};

const flushQueueInternal = async (): Promise<void> => {
  if (flushPromise) {
    return flushPromise;
  }

  flushPromise = (async () => {
    analyticsStore.setState({ loading: true, error: null, queueSize: readQueue().length });

    try {
      while (true) {
        const queue = readQueue();
        if (queue.length === 0) {
          break;
        }

        const chunk = queue.slice(0, MAX_BATCH_SIZE);

        try {
          await trackEventsBatch({ events: chunk });
        } catch (error) {
          analyticsStore.setState({
            loading: false,
            error: error as ApiError,
            queueSize: queue.length,
          });
          throw error;
        }

        const nextSize = dequeueChunk(chunk.length);
        setQueueSize(nextSize);
      }
    } finally {
      flushPromise = null;
      analyticsStore.setState({ loading: false, queueSize: readQueue().length });
    }
  })();

  return flushPromise;
};

const bindTransportListeners = () => {
  if (listenersBound || typeof window === "undefined") {
    return;
  }
  listenersBound = true;

  window.addEventListener("online", () => {
    void flushQueueInternal().catch(() => undefined);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      void flushQueueInternal().catch(() => undefined);
    }
  });
};

export const analyticsActions = {
  bootstrap: () => {
    bindTransportListeners();
    setQueueSize(readQueue().length);
    void flushQueueInternal().catch(() => undefined);
  },

  trackEvent: async (payload: AnalyticsTrackInput): Promise<void> => {
    let event: AnalyticsBatchEventRequest;
    try {
      event = buildEvent(payload);
    } catch (error) {
      // Analytics must never break the UI (and should not cause unhandled rejections).
      console.warn("[analytics] Unable to build event payload", error);
      return;
    }
    const queueSize = enqueueEvent(event);
    analyticsStore.setState({
      lastEvent: event,
      queueSize,
      error: null,
    });

    try {
      await flushQueueInternal();
    } catch {
      // Il retry verrà effettuato automaticamente su online/visibilità o al prossimo evento.
    }
  },

  trackScreenViewed: async (route: string): Promise<void> => {
    await analyticsActions.trackEvent({
      eventName: "SCREEN_VIEWED",
      route,
      payload: { route },
    });
  },

  markAppOpenedInSession: () => {
    if (typeof window === "undefined") {
      return false;
    }
    const alreadyTracked = window.sessionStorage.getItem(ANALYTICS_APP_OPENED_KEY);
    if (alreadyTracked === "1") {
      return false;
    }
    window.sessionStorage.setItem(ANALYTICS_APP_OPENED_KEY, "1");
    return true;
  },

  flushQueue: async (): Promise<void> => {
    await flushQueueInternal();
  },

  clearLastEvent: () => {
    analyticsStore.setState({ lastEvent: null });
  },
};
