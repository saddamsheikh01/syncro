import type { ApiError } from "../../types/api";
import type {
  TestCountResponse,
  TestDetailResponse,
  TestListResponse,
  TestSubmissionRequest,
  TestSubmissionResponse,
  TestSummaryResponse,
} from "../../types/tests";
import {
  getMyTestsCount,
  getTest,
  getTests,
  getUserTestsCount,
  resetTestSubmission,
  resetMySubmissions,
  submitTest,
} from "../../services/tests";
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

export const testsActions = {
  fetchTests: async (): Promise<TestListResponse> => {
    testsStore.setState({ loading: true, error: null });

    try {
      const response = await getTests();
      testsStore.setState({ tests: response.tests, loading: false });
      return response;
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
      testsStore.setState({ loading: false });
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
    testsStore.setState({ countLoading: true, countError: null });

    try {
      const response = await getMyTestsCount();
      testsStore.setState({
        completedCount: response.count,
        countLoading: false,
      });
      return response;
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
