import { expect, test, type Locator, type Page } from "@playwright/test";

const AUTH_TOKENS = {
  accessToken: "fake-jwt-token",
  refreshToken: "fake-refresh-token",
};

const AUTH_USER = {
  id: "user-expat-1",
  email: "expat@test.com",
  language: "en",
  onboardingCompleted: true,
  emailVerified: true,
};

const BUDGET_ACTIVE_SIMULATION_STORAGE_KEY = "syncro.expats.budget.activeSimulation";
const BUDGET_FORM_STATE_STORAGE_KEY = "syncro.expats.budget.formState";

const CITIES = [
  { id: "city-lisbon", cityName: "Lisbon", citySlug: "lisbon", country: "Portugal", countryCode: "PT", active: true },
  { id: "city-berlin", cityName: "Berlin", citySlug: "berlin", country: "Germany", countryCode: "DE", active: true },
  { id: "city-amsterdam", cityName: "Amsterdam", citySlug: "amsterdam", country: "Netherlands", countryCode: "NL", active: true },
] as const;

const CITY_BY_ID = Object.fromEntries(CITIES.map((city) => [city.id, city])) as Record<
  string,
  (typeof CITIES)[number]
>;

type HousingType = "1br_center" | "3br_center";
type LivingType = "single" | "family";

type SimulationSeed = {
  id: string;
  cityId: string;
  monthlyBudget: number;
  savings?: number | null;
  housingType: HousingType;
  livingType: LivingType;
  rent: number;
  livingCost: number;
  basicSetup: number;
  createdAt?: string;
};

type StarterKitResponse = {
  id: string;
  cityId: string;
  createdAt: string;
  payload: Record<string, unknown>;
};

type MicroTestBlock = {
  assignmentId: string;
  testId: string;
  testTitle: string;
  testDescription: string;
  status: string;
  availableFrom: string;
  expiresAt: string;
  blockNumber: number;
  totalBlocks: number;
  completionPercent: number;
  questions: Array<{
    questionId: string;
    questionText: string;
    questionType: string;
    position: number;
    options: Array<{
      optionId: string;
      answerText: string;
      position: number;
    }>;
  }>;
};

type MockScenario = {
  onboarding: Record<string, unknown>;
  activationState?: Record<string, unknown>;
  simulations?: ReturnType<typeof createSimulation>[];
  latestStarterKit?: StarterKitResponse | null;
  trackingEntries?: Record<string, unknown>[];
  riskSnapshot?: Record<string, unknown>;
  scoringResult?: Record<string, unknown>;
  capturedSimulationRequests?: Record<string, unknown>[];
  capturedStarterKitRequests?: Record<string, unknown>[];
  microTestBlocks?: MicroTestBlock[];
  capturedMicroTestSubmissions?: Array<{
    assignmentId: string;
    payload: Record<string, unknown>;
  }>;
};

const PRICE_BOOK: Record<
  string,
  Record<HousingType, Record<LivingType, { rent: number; livingCost: number; basicSetup: number }>>
> = {
  "city-lisbon": {
    "1br_center": {
      single: { rent: 900, livingCost: 500, basicSetup: 195 },
      family: { rent: 900, livingCost: 780, basicSetup: 195 },
    },
    "3br_center": {
      single: { rent: 1500, livingCost: 500, basicSetup: 746.55 },
      family: { rent: 1500, livingCost: 1350, basicSetup: 746.55 },
    },
  },
  "city-berlin": {
    "1br_center": {
      single: { rent: 1200, livingCost: 700, basicSetup: 240 },
      family: { rent: 1200, livingCost: 1080, basicSetup: 240 },
    },
    "3br_center": {
      single: { rent: 1500, livingCost: 780, basicSetup: 0 },
      family: { rent: 1500, livingCost: 1350, basicSetup: 0 },
    },
  },
  "city-amsterdam": {
    "1br_center": {
      single: { rent: 1700, livingCost: 850, basicSetup: 300 },
      family: { rent: 1700, livingCost: 1200, basicSetup: 300 },
    },
    "3br_center": {
      single: { rent: 2400, livingCost: 850, basicSetup: 300 },
      family: { rent: 2400, livingCost: 1450, basicSetup: 300 },
    },
  },
};

function createSimulation(seed: SimulationSeed) {
  const city = CITY_BY_ID[seed.cityId];
  const estimatedMonthlyCost = seed.rent + seed.livingCost;
  const deposit = seed.rent * 2;
  const totalEntryCost = seed.rent + deposit + seed.basicSetup;
  const monthlyBalance = seed.monthlyBudget - estimatedMonthlyCost;
  const savings = seed.savings ?? 0;
  const runwayMonths =
    monthlyBalance < 0 && savings > 0
      ? Number((savings / Math.abs(monthlyBalance)).toFixed(1))
      : savings > 0
        ? Number((savings / Math.max(estimatedMonthlyCost, 1)).toFixed(1))
        : 0;

  return {
    id: seed.id,
    cityId: city.id,
    cityName: city.cityName,
    scenario: "planning_move",
    planCode: "FREE",
    source: "authenticated",
    inputPayload: {
      planCode: "FREE",
      monthlyBudget: seed.monthlyBudget,
      savings: seed.savings ?? null,
      housingType: seed.housingType,
      livingType: seed.livingType,
      cityId: city.id,
    },
    outputPayload: {
      estimatedMonthlyCost,
      totalMonthlyCost: estimatedMonthlyCost,
      rent: seed.rent,
      livingCost: seed.livingCost,
      livingType: seed.livingType,
      housingType: seed.housingType,
      cityName: city.cityName,
      country: city.country,
      entryCost: {
        firstMonthRent: seed.rent,
        deposit,
        basicSetup: seed.basicSetup,
        totalEntryCost,
      },
      monthlyBalance,
      balanceStatus: monthlyBalance >= 0 ? "POSITIVE" : "NEGATIVE",
      financialRunway: {
        months: runwayMonths,
        level: monthlyBalance >= 0 ? "GOOD" : savings > 0 ? "MODERATE" : "CRITICAL",
      },
      recommendedBudget: estimatedMonthlyCost + 250,
    },
    algorithmVersion: "1.0",
    createdAt: seed.createdAt ?? "2026-04-09T10:00:00Z",
  };
}

function createStarterKitFromSimulation(
  simulation: ReturnType<typeof createSimulation>,
  overrides?: Partial<StarterKitResponse>
): StarterKitResponse {
  const rent = Number(simulation.outputPayload.rent ?? 0);
  const livingExpenses = Number(simulation.outputPayload.livingCost ?? 0);
  const minimumRealisticBudget = rent + livingExpenses;
  const userBudget = Number(simulation.inputPayload.monthlyBudget ?? 0);
  const margin = userBudget - minimumRealisticBudget;

  return {
    id: overrides?.id ?? `kit-${simulation.id}`,
    cityId: overrides?.cityId ?? simulation.cityId,
    createdAt: overrides?.createdAt ?? "2026-04-09T10:00:00Z",
    payload: {
      cityAlignmentSnapshot: {
        cityName: simulation.cityName,
        strengths: [{ indicator: "social_integration" }],
        attention: { indicator: "housing_market" },
      },
      budgetAnalysis: {
        rent,
        livingExpenses,
        minimumRealisticBudget,
        userBudget,
        margin,
        marginStatus: margin >= 0 ? "SUSTAINABLE" : "UNSUSTAINABLE",
      },
      scamSentinel: {
        city: simulation.cityName,
        country: simulation.outputPayload.country,
        warnings: [
          "Never pay deposits before viewing a property in person or via verified video call",
          "Verify landlord identity through official property registry if possible",
        ],
      },
      relocationRisk: {
        score: 2,
        level: "LOW",
        description: "The relocation appears manageable with standard planning.",
      },
      initialStressLevel: {
        score: 2,
        level: "LOW",
        description: "You appear to have enough buffer to plan the move with control.",
      },
      ...(overrides?.payload ?? {}),
    },
  };
}

function createMicroTestBlock(seed: {
  assignmentId: string;
  blockNumber: number;
  totalBlocks: number;
  completionPercent: number;
  title?: string;
  description?: string;
  questions: Array<{
    questionId: string;
    questionText: string;
    options: Array<{ optionId: string; answerText: string }>;
  }>;
}): MicroTestBlock {
  return {
    assignmentId: seed.assignmentId,
    testId: "test-relocation-pulse",
    testTitle: seed.title ?? "Relocation Pulse Check",
    testDescription: seed.description ?? "A quick block to calibrate your relocation profile.",
    status: "PENDING",
    availableFrom: "2026-04-09T09:00:00Z",
    expiresAt: "2026-04-12T09:00:00Z",
    blockNumber: seed.blockNumber,
    totalBlocks: seed.totalBlocks,
    completionPercent: seed.completionPercent,
    questions: seed.questions.map((question, questionIndex) => ({
      questionId: question.questionId,
      questionText: question.questionText,
      questionType: "single_choice",
      position: questionIndex + 1,
      options: question.options.map((option, optionIndex) => ({
        optionId: option.optionId,
        answerText: option.answerText,
        position: optionIndex + 1,
      })),
    })),
  };
}

function createScoringResult(onboarding: Record<string, unknown>) {
  const targetCityName = String(onboarding.targetCityName ?? "Berlin");
  const currentCityName = onboarding.currentCityName
    ? String(onboarding.currentCityName)
    : null;

  const scores = [
    {
      snapshotId: "snap-1",
      cityName: targetCityName,
      rankingPosition: 1,
      compatibilityLevel: "GOOD_FIT",
      breakdown: {
        costo_vita: 60,
        mercato_immobiliare: 55,
        potere_economico: 58,
        qualita_vita: 82,
        opportunita_lavorative: 70,
        integrazione_sociale: 78,
      },
      insights: {
        strengths: ["The city remains aligned with your priorities."],
        warnings: ["Housing requires attention and timing."],
      },
      computedAt: "2026-04-09T10:00:00Z",
      algorithmVersion: "1.0",
      analysisType: currentCityName ? "CITY_COMPARISON" : "CHOSEN_CITY_ANALYSIS",
    },
  ];

  if (currentCityName) {
    scores.push({
      snapshotId: "snap-1",
      cityName: currentCityName,
      rankingPosition: 2,
      compatibilityLevel: "GOOD_FIT",
      breakdown: {
        costo_vita: 25,
        mercato_immobiliare: 40,
        potere_economico: 65,
        qualita_vita: 70,
        opportunita_lavorative: 75,
        integrazione_sociale: 55,
      },
      insights: {
        strengths: ["You already know the city dynamics."],
        warnings: ["Cost growth can reduce margin."],
      },
      computedAt: "2026-04-09T10:00:00Z",
      algorithmVersion: "1.0",
      analysisType: "CITY_COMPARISON",
    });
  }

  return {
    snapshotId: "snap-1",
    analysisType: currentCityName ? "CITY_COMPARISON" : "CHOSEN_CITY_ANALYSIS",
    userType: onboarding.userType ?? "planning_move",
    scores,
    algorithmVersion: "1.0",
  };
}

async function seedAuthenticatedStorage(
  page: Page,
  options?: {
    activeSimulation?: ReturnType<typeof createSimulation> | null;
    formState?: Record<string, unknown> | null;
  }
) {
  await page.addInitScript(
    ({ tokens, user, activeSimulation, formState }) => {
      window.localStorage.setItem("syncro.auth.tokens", JSON.stringify(tokens));
      window.localStorage.setItem("syncro.auth.user", JSON.stringify(user));
      window.localStorage.setItem("syncro.expatsModeActive", "true");

      if (activeSimulation) {
        window.localStorage.setItem(
          BUDGET_ACTIVE_SIMULATION_STORAGE_KEY,
          JSON.stringify(activeSimulation)
        );
      }

      if (formState) {
        window.localStorage.setItem(
          BUDGET_FORM_STATE_STORAGE_KEY,
          JSON.stringify(formState)
        );
      }
    },
    {
      tokens: AUTH_TOKENS,
      user: AUTH_USER,
      activeSimulation: options?.activeSimulation ?? null,
      formState: options?.formState ?? null,
    }
  );
}

async function setRangeValue(locator: Locator, value: number) {
  await locator.evaluate((element, nextValue) => {
    const input = element as HTMLInputElement;
    const setValue = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set;

    setValue?.call(input, String(nextValue));
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
}

async function setupAuthenticatedSprint2Mocks(page: Page, scenario: MockScenario) {
  const simulations = [...(scenario.simulations ?? [])];
  let latestStarterKit = scenario.latestStarterKit ?? null;
  const microTestBlocks = [...(scenario.microTestBlocks ?? [])];
  let completedMicroTestBlocks = 0;

  await page.route("**/api/v1/analytics/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
  });

  await page.route("**/api/v1/notifications**", async (route) => {
    if (route.request().url().includes("/unread-count")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ count: 0 }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        last: true,
      }),
    });
  });

  await page.route("**/api/v1/profile/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
  });

  await page.route("**/api/v1/auth/refresh", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(AUTH_TOKENS) });
  });

  await page.route("**/api/v1/auth/me", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(AUTH_USER) });
  });

  await page.route("**/api/v1/relocation/cities", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(CITIES) });
  });

  await page.route("**/api/v1/relocation/onboarding/status", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "COMPLETED",
        completedSteps: 10,
        completionPercent: 100,
      }),
    });
  });

  await page.route("**/api/v1/relocation/onboarding", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(scenario.onboarding),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(scenario.onboarding),
    });
  });

  await page.route("**/api/v1/relocation/activation-state", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        scenario.activationState ?? {
          status: "IN_PROGRESS",
          userType: scenario.onboarding.userType ?? "planning_move",
          completedSteps: 10,
          totalSteps: 10,
          completionPercent: 100,
          nextActions: [],
        }
      ),
    });
  });

  await page.route("**/api/v1/relocation/city-scoring/history", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/v1/relocation/city-scoring/compute", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(scenario.scoringResult ?? createScoringResult(scenario.onboarding)),
    });
  });

  await page.route("**/api/v1/relocation/budget/tracking", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(scenario.trackingEntries ?? []),
    });
  });

  await page.route("**/api/v1/relocation/risk/indicators", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        scenario.riskSnapshot ?? {
          burnoutIndex: 24,
          riskIndicators: {
            financial: "LOW",
            housing: "MODERATE",
            social: "LOW",
          },
        }
      ),
    });
  });

  await page.route("**/api/v1/relocation/micro-tests/next", async (route) => {
    const currentBlock = microTestBlocks[completedMicroTestBlocks];
    if (currentBlock) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(currentBlock),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ message: "No micro-test available" }),
    });
  });

  await page.route("**/api/v1/relocation/micro-tests/*/submit", async (route) => {
    const url = route.request().url();
    const assignmentId = url.split("/micro-tests/")[1]?.split("/submit")[0] ?? "";
    const payload = JSON.parse(route.request().postData() || "{}") as Record<string, unknown>;

    scenario.capturedMicroTestSubmissions?.push({ assignmentId, payload });

    const currentBlock = microTestBlocks[completedMicroTestBlocks];
    if (currentBlock && currentBlock.assignmentId === assignmentId) {
      completedMicroTestBlocks += 1;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "COMPLETED" }),
    });
  });

  await page.route("**/api/v1/relocation/starter-kit/latest", async (route) => {
    if (!latestStarterKit) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ message: "No starter kit yet" }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(latestStarterKit),
    });
  });

  await page.route("**/api/v1/relocation/starter-kit/generate", async (route) => {
    const body = JSON.parse(route.request().postData() || "{}") as { cityId?: string };
    scenario.capturedStarterKitRequests?.push(body);

    const requestedCityId =
      body.cityId ??
      String(scenario.onboarding.targetCityId ?? scenario.onboarding.currentCityId ?? simulations[0]?.cityId);
    const matchingSimulation =
      simulations.find((simulation) => simulation.cityId === requestedCityId) ??
      simulations[0];

    latestStarterKit = createStarterKitFromSimulation(matchingSimulation);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(latestStarterKit),
    });
  });

  await page.route("**/api/v1/relocation/budget/simulations", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(simulations),
      });
      return;
    }

    const body = JSON.parse(route.request().postData() || "{}") as {
      cityId?: string | null;
      monthlyBudget?: number;
      savings?: number | null;
      housingType?: HousingType;
      livingType?: LivingType;
    };
    scenario.capturedSimulationRequests?.push(body);

    const cityId = body.cityId ?? "city-lisbon";
    const housingType = body.housingType ?? "1br_center";
    const livingType = body.livingType ?? "single";
    const pricing = PRICE_BOOK[cityId]?.[housingType]?.[livingType] ?? PRICE_BOOK["city-lisbon"]["1br_center"].single;

    const simulation = createSimulation({
      id: `sim-${simulations.length + 1}`,
      cityId,
      monthlyBudget: body.monthlyBudget ?? 2000,
      savings: body.savings ?? null,
      housingType,
      livingType,
      rent: pricing.rent,
      livingCost: pricing.livingCost,
      basicSetup: pricing.basicSetup,
      createdAt: "2026-04-09T10:00:00Z",
    });

    simulations.unshift(simulation);

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(simulation),
    });
  });
}

test.describe("Sprint 2 regressions — authenticated flow", () => {
  test("shows corrected deposit and keeps simulator state after leaving the page", async ({
    page,
  }) => {
    const simulationRequests: Record<string, unknown>[] = [];

    await seedAuthenticatedStorage(page);
    await setupAuthenticatedSprint2Mocks(page, {
      onboarding: {
        id: "onboarding-1",
        userType: "planning_move",
        targetCityId: "city-berlin",
        targetCityName: "Berlin",
        targetCountry: "Germany",
        household: "family",
        monthlyBudget: 2000,
        desiredLifestyle: "balanced",
        completedSteps: 10,
        completionPercent: 100,
      },
      simulations: [
        createSimulation({
          id: "historic-lisbon",
          cityId: "city-lisbon",
          monthlyBudget: 2000,
          housingType: "1br_center",
          livingType: "single",
          rent: 900,
          livingCost: 500,
          basicSetup: 195,
          createdAt: "2026-04-08T09:00:00Z",
        }),
      ],
      capturedSimulationRequests: simulationRequests,
    });

    await page.goto("/expats/budget");
    await expect(page.getByRole("heading", { name: "Budget Simulator" })).toBeVisible();

    await page.locator(".bp-select").selectOption("city-berlin");
    await setRangeValue(page.locator("input[type=range]").first(), 3650);
    await setRangeValue(page.locator("input[type=range]").nth(1), 11000);
    await page.getByRole("button", { name: "Apartment 3 Room" }).click();
    await page.getByRole("button", { name: "Family" }).click();

    await expect(page.getByTestId("budget-entry-first-month")).toContainText("€1.500,00");
    await expect(page.getByTestId("budget-entry-deposit")).toContainText("€3.000,00");
    await expect(page.getByTestId("budget-entry-total")).toContainText("€4.500,00");

    await page.goto("/expats/activation");
    await expect(page.getByTestId("activation-budget-card")).toBeVisible();
    await page.goBack();

    await expect(page).toHaveURL(/\/expats\/budget$/);
    await expect(page.locator(".bp-select")).toHaveValue("city-berlin");
    await expect(page.locator("input[type=range]").first()).toHaveValue("3650");
    await expect(page.locator("input[type=range]").nth(1)).toHaveValue("11000");
    await expect(page.getByRole("button", { name: "Apartment 3 Room" })).toHaveClass(/bp-toggle--active/);
    await expect(page.getByRole("button", { name: "Family" })).toHaveClass(/bp-toggle--active/);
    expect(simulationRequests.length).toBeGreaterThan(0);
  });

  test("keeps activation budget aligned with the active simulation instead of onboarding defaults", async ({
    page,
  }) => {
    const historicLisbonSimulation = createSimulation({
      id: "historic-lisbon",
      cityId: "city-lisbon",
      monthlyBudget: 2000,
      savings: 0,
      housingType: "1br_center",
      livingType: "single",
      rent: 900,
      livingCost: 500,
      basicSetup: 195,
      createdAt: "2026-04-09T12:00:00Z",
    });

    await seedAuthenticatedStorage(page);
    await setupAuthenticatedSprint2Mocks(page, {
      onboarding: {
        id: "onboarding-activation",
        userType: "planning_move",
        targetCityId: "city-berlin",
        targetCityName: "Berlin",
        targetCountry: "Germany",
        household: "family",
        monthlyBudget: 2000,
        desiredLifestyle: "balanced",
        completedSteps: 10,
        completionPercent: 100,
      },
      simulations: [historicLisbonSimulation],
    });

    await page.goto("/expats/budget");
    await expect(page.getByRole("heading", { name: "Budget Simulator" })).toBeVisible();
    await page.locator(".bp-select").selectOption("city-berlin");
    await setRangeValue(page.locator("input[type=range]").first(), 3650);
    await setRangeValue(page.locator("input[type=range]").nth(1), 11000);
    await page.getByRole("button", { name: "Apartment 3 Room" }).click();
    await page.getByRole("button", { name: "Family" }).click();
    await expect(page.getByTestId("budget-entry-total")).toContainText("€4.500,00");

    await page.goto("/expats/activation");
    await expect(page.getByTestId("activation-budget-card")).toBeVisible();

    await expect(page.getByTestId("activation-estimated-cost")).toContainText("€2,850");
    await expect(page.getByTestId("activation-declared-budget")).toContainText("€3,650");
    await expect(page.getByTestId("activation-remaining-margin")).toContainText("€800");
    await expect(page.getByTestId("activation-budget-status")).toContainText(
      /Financially Sustainable|Budget At Risk|Budget Tight/
    );
    await expect(page.getByTestId("activation-declared-budget")).not.toContainText("€2,000");
  });

  test("regenerates a stale starter kit on the current city context and keeps budget values coherent", async ({
    page,
  }) => {
    const berlinSimulation = createSimulation({
      id: "active-berlin",
      cityId: "city-berlin",
      monthlyBudget: 3650,
      savings: 11000,
      housingType: "3br_center",
      livingType: "family",
      rent: 1500,
      livingCost: 1350,
      basicSetup: 0,
      createdAt: "2026-04-09T10:00:00Z",
    });

    const staleAmsterdamKit = createStarterKitFromSimulation(
      createSimulation({
        id: "stale-amsterdam-sim",
        cityId: "city-amsterdam",
        monthlyBudget: 2000,
        savings: 0,
        housingType: "1br_center",
        livingType: "single",
        rent: 1700,
        livingCost: 850,
        basicSetup: 300,
        createdAt: "2026-04-08T10:00:00Z",
      }),
      { id: "kit-amsterdam", cityId: "city-amsterdam", createdAt: "2026-04-08T10:00:00Z" }
    );

    const starterKitRequests: Record<string, unknown>[] = [];

    await seedAuthenticatedStorage(page, {
      activeSimulation: berlinSimulation,
    });

    await setupAuthenticatedSprint2Mocks(page, {
      onboarding: {
        id: "onboarding-starter-kit",
        userType: "planning_move",
        targetCityId: "city-berlin",
        targetCityName: "Berlin",
        targetCountry: "Germany",
        household: "family",
        monthlyBudget: 2000,
        desiredLifestyle: "balanced",
        completedSteps: 10,
        completionPercent: 100,
      },
      simulations: [berlinSimulation],
      latestStarterKit: staleAmsterdamKit,
      capturedStarterKitRequests: starterKitRequests,
    });

    await page.goto("/expats/starter-kit");
    await expect(page.getByRole("heading", { name: "Expat Starter Kit" })).toBeVisible();

    await expect.poll(() => starterKitRequests.length).toBe(1);
    expect(starterKitRequests[0]).toEqual({ cityId: "city-berlin" });

    await expect(page.getByTestId("starter-kit-budget-user")).toContainText("€3,650");
    await expect(page.getByTestId("starter-kit-budget-margin")).toContainText("€800");
    await expect(page.getByTestId("starter-kit-scam-location")).toHaveText("Berlin");
    await expect(page.getByTestId("starter-kit-budget-card")).not.toContainText("Amsterdam");
  });

  test("opens the micro-test question flow and allows cancel without submitting", async ({
    page,
  }) => {
    const microTestSubmissions: Array<{ assignmentId: string; payload: Record<string, unknown> }> = [];

    await seedAuthenticatedStorage(page);
    await setupAuthenticatedSprint2Mocks(page, {
      onboarding: {
        id: "onboarding-microtest-cancel",
        userType: "planning_move",
        targetCityId: "city-berlin",
        targetCityName: "Berlin",
        targetCountry: "Germany",
        household: "single",
        monthlyBudget: 2400,
        desiredLifestyle: "balanced",
        completedSteps: 10,
        completionPercent: 100,
      },
      microTestBlocks: [
        createMicroTestBlock({
          assignmentId: "assignment-cancel",
          blockNumber: 1,
          totalBlocks: 2,
          completionPercent: 50,
          questions: [
            {
              questionId: "q1",
              questionText: "How confident do you feel about your move?",
              options: [
                { optionId: "q1-a1", answerText: "Very confident" },
                { optionId: "q1-a2", answerText: "Somewhat unsure" },
              ],
            },
            {
              questionId: "q2",
              questionText: "What is causing the most friction right now?",
              options: [
                { optionId: "q2-a1", answerText: "Budget clarity" },
                { optionId: "q2-a2", answerText: "Housing search" },
              ],
            },
          ],
        }),
      ],
      capturedMicroTestSubmissions: microTestSubmissions,
    });

    await page.goto("/expats/activation");
    await expect(page.getByTestId("micro-test-card")).toBeVisible();
    await expect(page.getByTestId("micro-test-title")).toHaveText("Relocation Pulse Check");
    await expect(page.getByTestId("micro-test-progress")).toContainText("Block 1/2");

    await page.getByTestId("micro-test-start").click();
    await expect(page.getByTestId("micro-test-questions")).toBeVisible();
    await expect(page.getByTestId("micro-test-submit")).toBeDisabled();

    await page.getByRole("button", { name: "Cancel" }).click();

    await expect(page.getByTestId("micro-test-card")).toBeVisible();
    expect(microTestSubmissions).toHaveLength(0);
  });

  test("submits micro-test blocks in sequence and hides the card when the test is completed", async ({
    page,
  }) => {
    const microTestSubmissions: Array<{ assignmentId: string; payload: Record<string, unknown> }> = [];

    await seedAuthenticatedStorage(page);
    await setupAuthenticatedSprint2Mocks(page, {
      onboarding: {
        id: "onboarding-microtest-submit",
        userType: "planning_move",
        targetCityId: "city-berlin",
        targetCityName: "Berlin",
        targetCountry: "Germany",
        household: "single",
        monthlyBudget: 2600,
        desiredLifestyle: "balanced",
        completedSteps: 10,
        completionPercent: 100,
      },
      microTestBlocks: [
        createMicroTestBlock({
          assignmentId: "assignment-sequence",
          blockNumber: 1,
          totalBlocks: 2,
          completionPercent: 50,
          questions: [
            {
              questionId: "q1",
              questionText: "How confident do you feel about your move?",
              options: [
                { optionId: "q1-a1", answerText: "Very confident" },
                { optionId: "q1-a2", answerText: "Somewhat unsure" },
              ],
            },
            {
              questionId: "q2",
              questionText: "What is causing the most friction right now?",
              options: [
                { optionId: "q2-a1", answerText: "Budget clarity" },
                { optionId: "q2-a2", answerText: "Housing search" },
              ],
            },
          ],
        }),
        createMicroTestBlock({
          assignmentId: "assignment-sequence",
          blockNumber: 2,
          totalBlocks: 2,
          completionPercent: 100,
          questions: [
            {
              questionId: "q3",
              questionText: "Which support would help you most this week?",
              options: [
                { optionId: "q3-a1", answerText: "A relocation checklist" },
                { optionId: "q3-a2", answerText: "A local housing contact" },
              ],
            },
          ],
        }),
      ],
      capturedMicroTestSubmissions: microTestSubmissions,
    });

    await page.goto("/expats/activation");
    await expect(page.getByTestId("micro-test-card")).toBeVisible();

    await page.getByTestId("micro-test-start").click();
    await expect(page.getByTestId("micro-test-submit")).toBeDisabled();

    await page.getByRole("button", { name: "Very confident" }).click();
    await page.getByRole("button", { name: "Budget clarity" }).click();
    await expect(page.getByTestId("micro-test-submit")).toBeEnabled();
    await page.getByTestId("micro-test-submit").click();

    await expect.poll(() => microTestSubmissions.length).toBe(1);
    expect(microTestSubmissions[0]).toEqual({
      assignmentId: "assignment-sequence",
      payload: {
        answers: [
          { questionId: "q1", answerOptionId: "q1-a1" },
          { questionId: "q2", answerOptionId: "q2-a1" },
        ],
      },
    });

    await expect(page.getByTestId("micro-test-card")).toBeVisible();
    await expect(page.getByTestId("micro-test-progress")).toContainText("Block 2/2");

    await page.getByTestId("micro-test-start").click();
    await page.getByRole("button", { name: "A relocation checklist" }).click();
    await page.getByTestId("micro-test-submit").click();

    await expect.poll(() => microTestSubmissions.length).toBe(2);
    expect(microTestSubmissions[1]).toEqual({
      assignmentId: "assignment-sequence",
      payload: {
        answers: [{ questionId: "q3", answerOptionId: "q3-a1" }],
      },
    });

    await expect.poll(async () => page.getByTestId("micro-test-card").count()).toBe(0);
  });
});
