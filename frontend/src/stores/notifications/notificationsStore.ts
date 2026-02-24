import type { ApiError } from "../../types/api";
import type { IsoDateTime, Uuid } from "../../types/shared";
import type { UserNotificationResponse } from "../../types/notifications";
import { createStore } from "../utils/createStore";
import {
  getNotifications,
  getNotificationUnreadCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationsListParams,
} from "../../services/notifications";

const DEFAULT_PAGE_SIZE = 20;

export type NotificationsState = {
  notifications: UserNotificationResponse[];
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  unreadOnly: boolean;
  page: number;
  size: number;
  totalPages: number;
  hasMore: boolean;
  error: ApiError | null;
  lastFetchedAt: IsoDateTime | null;
};

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  refreshing: false,
  loadingMore: false,
  unreadOnly: false,
  page: 0,
  size: DEFAULT_PAGE_SIZE,
  totalPages: 0,
  hasMore: false,
  error: null,
  lastFetchedAt: null,
};

export const notificationsStore = createStore<NotificationsState>(initialState);

const sortByCreatedAtDesc = (
  notifications: UserNotificationResponse[]
): UserNotificationResponse[] =>
  [...notifications].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );

const setFetchState = (silent: boolean, active: boolean) => {
  notificationsStore.setState(
    silent
      ? { refreshing: active }
      : { loading: active, refreshing: active }
  );
};

const mergeNotifications = (
  current: UserNotificationResponse[],
  incoming: UserNotificationResponse[]
) => {
  const existingIds = new Set(current.map((notification) => notification.id));
  const merged = [...current];
  incoming.forEach((notification) => {
    if (existingIds.has(notification.id)) return;
    merged.push(notification);
  });
  return merged;
};

const setLastFetchedAt = () => new Date().toISOString();

export const notificationsActions = {
  fetchNotifications: async (
    params: NotificationsListParams = {},
    options: { silent?: boolean; append?: boolean } = {}
  ): Promise<UserNotificationResponse[]> => {
    const currentState = notificationsStore.getState();
    const silent = options.silent ?? false;
    const append = options.append ?? false;
    const resolvedUnreadOnly = params.unreadOnly ?? currentState.unreadOnly;
    const resolvedSize = params.size ?? currentState.size;
    const resolvedPage =
      params.page ?? (append ? currentState.page + 1 : 0);

    if (append) {
      notificationsStore.setState({ loadingMore: true, error: null });
    } else {
      setFetchState(silent, true);
      notificationsStore.setState({ error: null });
    }

    try {
      const response = await getNotifications({
        unreadOnly: resolvedUnreadOnly,
        page: resolvedPage,
        size: resolvedSize,
      });

      const nextNotifications = append
        ? mergeNotifications(currentState.notifications, response.content)
        : sortByCreatedAtDesc(response.content);

      notificationsStore.setState({
        notifications: nextNotifications,
        loading: false,
        refreshing: false,
        loadingMore: false,
        unreadOnly: resolvedUnreadOnly,
        page: response.number,
        size: response.size,
        totalPages: response.totalPages,
        hasMore: !response.last,
        error: null,
        lastFetchedAt: setLastFetchedAt(),
      });
      return nextNotifications;
    } catch (error) {
      notificationsStore.setState({
        loading: false,
        refreshing: false,
        loadingMore: false,
        error: error as ApiError,
      });
      throw error;
    }
  },

  fetchUnreadCount: async (
    options: { silent?: boolean; trackLoading?: boolean } = {}
  ): Promise<number> => {
    const silent = options.silent ?? true;
    const trackLoading = options.trackLoading ?? true;

    if (trackLoading) {
      setFetchState(silent, true);
    }

    try {
      const response = await getNotificationUnreadCount();
      if (trackLoading) {
        notificationsStore.setState({
          unreadCount: response.count,
          loading: false,
          refreshing: false,
          error: null,
          lastFetchedAt: setLastFetchedAt(),
        });
      } else {
        notificationsStore.setState({
          unreadCount: response.count,
          error: null,
          lastFetchedAt: setLastFetchedAt(),
        });
      }
      return response.count;
    } catch (error) {
      if (trackLoading) {
        notificationsStore.setState({
          loading: false,
          refreshing: false,
          error: error as ApiError,
        });
      } else {
        notificationsStore.setState({ error: error as ApiError });
      }
      throw error;
    }
  },

  sync: async (
    params: NotificationsListParams = {},
    options: { silent?: boolean } = {}
  ): Promise<UserNotificationResponse[]> => {
    const notifications = await notificationsActions.fetchNotifications(
      params,
      options
    );
    await notificationsActions.fetchUnreadCount({ silent: true });
    return notifications;
  },

  setUnreadOnly: async (
    unreadOnly: boolean,
    options: { silent?: boolean } = {}
  ): Promise<UserNotificationResponse[]> => {
    const size = notificationsStore.getState().size;
    return notificationsActions.fetchNotifications(
      { unreadOnly, page: 0, size },
      { silent: options.silent ?? true }
    );
  },

  loadMore: async (
    options: { silent?: boolean } = {}
  ): Promise<UserNotificationResponse[]> => {
    const state = notificationsStore.getState();
    if (!state.hasMore || state.loadingMore) {
      return state.notifications;
    }
    return notificationsActions.fetchNotifications(
      {
        unreadOnly: state.unreadOnly,
        page: state.page + 1,
        size: state.size,
      },
      { silent: options.silent ?? true, append: true }
    );
  },

  markAsRead: async (
    notificationId: Uuid
  ): Promise<UserNotificationResponse> => {
    const previous = notificationsStore
      .getState()
      .notifications.find((notification) => notification.id === notificationId);

    const updated = await markNotificationAsRead(notificationId);

    notificationsStore.setState((state) => ({
      notifications: sortByCreatedAtDesc(
        state.notifications
          .map((notification) =>
            notification.id === notificationId ? updated : notification
          )
          .filter((notification) => !state.unreadOnly || notification.readAt === null)
      ),
      unreadCount:
        previous && previous.readAt === null
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      error: null,
    }));

    return updated;
  },

  markAllAsRead: async (): Promise<void> => {
    await markAllNotificationsAsRead();
    const now = new Date().toISOString();

    notificationsStore.setState((state) => ({
      notifications: state.unreadOnly
        ? []
        : state.notifications.map((notification) =>
            notification.readAt
              ? notification
              : { ...notification, readAt: now }
          ),
      unreadCount: 0,
      hasMore: state.unreadOnly ? false : state.hasMore,
      error: null,
    }));
  },

  clear: () => {
    notificationsStore.setState({
      notifications: [],
      unreadCount: 0,
      loading: false,
      refreshing: false,
      loadingMore: false,
      unreadOnly: false,
      page: 0,
      size: DEFAULT_PAGE_SIZE,
      totalPages: 0,
      hasMore: false,
      error: null,
      lastFetchedAt: null,
    });
  },
};
