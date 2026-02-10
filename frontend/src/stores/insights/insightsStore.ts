import type { ApiError } from "../../types/api";
import type {
  TestCountResponse,
  TestDetailResponse,
  TestListResponse,
  TestSubmissionRequest,
  TestSubmissionResponse,
  TestSummaryResponse,
  TestType,
} from "../../types/insights";
import {
  getMyTestsCount,
  getTest,
  getTests,
  getUserTestsCount,
  resetTestSubmission,
  resetMySubmissions,
  submitTest,
} from "../../services/insights";
import type { Uuid } from "../../types/shared";
import { createStore } from "../utils/createStore";

export type TestsState = {
  tests: TestSummaryResponse[];
  activeTest: TestDetailResponse | null;
  loading: boolean;
  error: ApiError | null;
  completedCount: number | null;
  userCompletedCounts: Record<Uuid, number>;
  countLoading: boolean;
  countError: ApiError | null;
};

const initialState: TestsState = {
  tests: [],
  activeTest: null,
  loading: false,
  error: null,
  completedCount: null,
  userCompletedCounts: {},
  countLoading: false,
  countError: null,
};

export const testsStore = createStore<TestsState>(initialState);

const DISABLED_TEST_TYPES: ReadonlySet<TestType> = new Set(["ASTRO"]);

const isTestTypeEnabled = (testType: TestType): boolean =>
  !DISABLED_TEST_TYPES.has(testType);

const filterEnabledTests = (
  tests: TestSummaryResponse[]
): TestSummaryResponse[] =>
  tests.filter((test) => isTestTypeEnabled(test.testType));

export const testsActions = {
  fetchTests: async (): Promise<TestListResponse> => {
    testsStore.setState({ loading: true, error: null });

    try {
      const response = await getTests();
      const enabledTests = filterEnabledTests(response.tests);
      testsStore.setState({
        tests: enabledTests,
        completedCount: enabledTests.filter((test) => test.completed).length,
        loading: false,
      });
      return { ...response, tests: enabledTests };
    } catch (error) {
      testsStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  fetchTest: async (testId: Uuid): Promise<TestDetailResponse> => {
    testsStore.setState({ loading: true, error: null });

    try {
      const response = await getTest(testId);
      testsStore.setState({ activeTest: response, loading: false });
      return response;
    } catch (error) {
      testsStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  submitTest: async (
    testId: Uuid,
    payload: TestSubmissionRequest
  ): Promise<TestSubmissionResponse> => {
    testsStore.setState({ loading: true, error: null });

    try {
      const response = await submitTest(testId, payload);
      testsStore.setState((state) => ({
        loading: false,
        // Incrementa il count solo se era già stato caricato
        completedCount:
          state.completedCount != null ? state.completedCount + 1 : null,
        // Aggiorna lo stato completed del test nella lista
        tests: state.tests.map((test) =>
          test.id === testId ? { ...test, completed: true } : test
        ),
        // Aggiorna anche activeTest se è quello appena completato
        activeTest:
          state.activeTest && state.activeTest.id === testId
            ? { ...state.activeTest, completed: true }
            : state.activeTest,
      }));
      return response;
    } catch (error) {
      testsStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  clearActiveTest: () => {
    testsStore.setState({ activeTest: null });
  },

  fetchCompletedCount: async (): Promise<TestCountResponse> => {
    const current = testsStore.getState();
    if (current.countLoading) {
      return { count: current.completedCount ?? 0 };
    }
    if (current.completedCount != null) {
      return { count: current.completedCount };
    }
    if (current.tests.length > 0) {
      const count = current.tests.filter((test) => test.completed).length;
      testsStore.setState({ completedCount: count, countLoading: false });
      return { count };
    }
    testsStore.setState({ countLoading: true, countError: null });

    try {
      const response = await getMyTestsCount();
      const latestState = testsStore.getState();
      const hasLoadedTests = latestState.tests.length > 0;
      const resolvedCount = hasLoadedTests
        ? latestState.tests.filter((test) => test.completed).length
        : response.count;
      testsStore.setState({
        completedCount: resolvedCount,
        countLoading: false,
      });
      return { count: resolvedCount };
    } catch (error) {
      testsStore.setState({ countLoading: false, countError: error as ApiError });
      throw error;
    }
  },

  fetchUserCompletedCount: async (
    userId: Uuid
  ): Promise<TestCountResponse> => {
    const current = testsStore.getState();
    if (current.countLoading) {
      return { count: current.userCompletedCounts[userId] ?? 0 };
    }
    if (current.userCompletedCounts[userId] != null) {
      return { count: current.userCompletedCounts[userId] };
    }
    testsStore.setState({ countLoading: true, countError: null });

    try {
      const response = await getUserTestsCount(userId);
      testsStore.setState((state) => ({
        userCompletedCounts: {
          ...state.userCompletedCounts,
          [userId]: response.count,
        },
        countLoading: false,
      }));
      return response;
    } catch (error) {
      testsStore.setState({ countLoading: false, countError: error as ApiError });
      throw error;
    }
  },

  resetSubmissions: async (): Promise<void> => {
    testsStore.setState({ loading: true, error: null });

    try {
      await resetMySubmissions();
      testsStore.setState({
        loading: false,
        completedCount: null,
        userCompletedCounts: {},
        tests: testsStore.getState().tests.map((test) => ({
          ...test,
          completed: false,
        })),
      });
    } catch (error) {
      testsStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  resetSubmission: async (testId: Uuid): Promise<void> => {
    testsStore.setState({ loading: true, error: null });

    try {
      await resetTestSubmission(testId);
      testsStore.setState((state) => ({
        loading: false,
        completedCount: null,
        userCompletedCounts: {},
        tests: state.tests.map((test) =>
          test.id === testId ? { ...test, completed: false } : test
        ),
        activeTest:
          state.activeTest && state.activeTest.id === testId
            ? { ...state.activeTest, completed: false }
            : state.activeTest,
      }));
    } catch (error) {
      testsStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },
};
