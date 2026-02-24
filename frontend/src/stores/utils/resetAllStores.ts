import { userStore } from "../user/userStore";
import { positionStore } from "../position/positionStore";
import { tutorialStore } from "../tutorial/tutorialStore";
import { onboardingStore } from "../onboarding/onboardingStore";
import { catalogStore } from "../catalog/catalogStore";
import { favoritesStore } from "../favorites/favoritesStore";
import { feedStore } from "../feed/feedStore";
import { chatStore } from "../chat/chatStore";
import { matchesStore } from "../matches/matchesStore";
import { searchStore } from "../search/searchStore";
import { tagsStore } from "../tags/tagsStore";
import { uiStore } from "../ui/uiStore";
import { analyticsStore } from "../analytics/analyticsStore";
import { zyraStore } from "../zyra/zyraStore";
import { testsStore } from "../insights/insightsStore";
import { notificationsStore } from "../notifications/notificationsStore";
import { writeStorage } from "./storage";

const LANGUAGE_STORAGE_KEY = "syncro.user.language";
const POSITION_STORAGE_KEY = "syncro.user.position";
const TUTORIAL_STORAGE_KEY = "syncro.onboarding-intro.state";
const ANALYTICS_QUEUE_STORAGE_KEY = "syncro.analytics.queue";
const ANALYTICS_SESSION_STORAGE_KEY = "syncro.analytics.session_id";
const ANALYTICS_APP_OPENED_STORAGE_KEY = "syncro.analytics.app_opened";

export const resetAllStores = () => {
  userStore.reset();
  positionStore.reset();
  tutorialStore.reset();
  onboardingStore.reset();
  catalogStore.reset();
  favoritesStore.reset();
  feedStore.reset();
  chatStore.reset();
  matchesStore.reset();
  searchStore.reset();
  tagsStore.reset();
  uiStore.reset();
  notificationsStore.reset();
  analyticsStore.reset();
  zyraStore.reset();
  testsStore.reset();

  writeStorage(LANGUAGE_STORAGE_KEY, null);
  writeStorage(POSITION_STORAGE_KEY, null);
  writeStorage(TUTORIAL_STORAGE_KEY, null);
  writeStorage(ANALYTICS_QUEUE_STORAGE_KEY, null);

  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(ANALYTICS_SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(ANALYTICS_APP_OPENED_STORAGE_KEY);
  }
};
