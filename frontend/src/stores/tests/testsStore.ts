import type { ApiError } from "../../types/api";
import type {
  TestDetailResponse,
  TestListResponse,
  TestSubmissionRequest,
  TestSummaryResponse,
} from "../../types/tests";
import { getTest, getTests, submitTest } from "../../services/tests";
import type { Uuid } from "../../types/shared";
import { createStore } from "../utils/createStore";

export type TestsState = {
  tests: TestSummaryResponse[];
  activeTest: TestDetailResponse | null;
  loading: boolean;
  error: ApiError | null;
};

const initialState: TestsState = {
  tests: [],
  activeTest: null,
  loading: false,
  error: null,
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
  ): Promise<void> => {
    testsStore.setState({ loading: true, error: null });

    try {
      await submitTest(testId, payload);
      testsStore.setState({ loading: false });
    } catch (error) {
      testsStore.setState({ loading: false, error: error as ApiError });
      throw error;
    }
  },

  clearActiveTest: () => {
    testsStore.setState({ activeTest: null });
  },
};
