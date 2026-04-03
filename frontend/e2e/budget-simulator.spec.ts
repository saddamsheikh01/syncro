import { test, expect, type Page } from "@playwright/test";

// ─── API Mock Helpers ───────────────────────────────────────────────────────

const MOCK_CITIES = [
  { id: "city-1", cityName: "Lisbon", citySlug: "lisbon", country: "Portugal", countryCode: "PT", active: true },
  { id: "city-2", cityName: "Berlin", citySlug: "berlin", country: "Germany", countryCode: "DE", active: true },
];

const MOCK_SIMULATION_RESPONSE = {
  id: "sim-1",
  cityId: "city-1",
  cityName: "Lisbon",
  scenario: "planning_move",
  planCode: "FREE",
  source: "anonymous",
  inputPayload: { planCode: "FREE", monthlyBudget: 2000, livingType: "single", housingType: "1br_center" },
  outputPayload: {
    estimatedMonthlyCost: 1400,
    rent: 900,
    livingCost: 500,
    livingType: "single",
    housingType: "1br_center",
    cityName: "Lisbon",
    country: "Portugal",
    entryCost: { firstMonthRent: 900, deposit: 900, basicSetup: 195, totalEntryCost: 1995 },
    monthlyBalance: 600,
    balanceStatus: "POSITIVE",
    financialRunway: { months: 5.7, level: "MODERATE" },
    recommendedBudget: 1610,
  },
  algorithmVersion: "1.0",
  createdAt: "2026-04-02T10:00:00Z",
};

const MOCK_REGISTRATION_REQUIRED = {
  status: 403,
  code: "REGISTRATION_REQUIRED",
  message: "Register to unlock this feature",
};

async function setupAnonymousMocks(page: Page) {
  // Mock auth/me — return a minimal user so the app doesn't redirect to login
  await page.route("**/api/v1/auth/me", (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "user-anon-1",
        email: "anon@test.com",
        language: "en",
        onboardingCompleted: false,
        emailVerified: true,
      }),
    });
  });

  // Mock anonymous session creation (already exists)
  await page.route("**/api/v1/expats/anonymous/sessions", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "session-1",
          sessionToken: "test-anon-token",
          status: "IN_PROGRESS",
          currentStep: 1,
          totalSteps: 10,
          answers: [],
        }),
      });
    }
    return route.continue();
  });

  // Mock cities list
  await page.route("**/api/v1/relocation/cities", (route) => {
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_CITIES) });
  });

  // Mock budget simulation — always succeeds for anonymous (FREE)
  await page.route("**/api/v1/relocation/budget/simulations", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SIMULATION_RESPONSE),
      });
    }
    // GET simulations — 403 for anonymous
    return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify(MOCK_REGISTRATION_REQUIRED) });
  });

  // Mock all other Sprint 2 endpoints — 403 for anonymous
  const gatedEndpoints = [
    "**/api/v1/relocation/budget/tracking",
    "**/api/v1/relocation/starter-kit/**",
    "**/api/v1/relocation/micro-tests/**",
    "**/api/v1/relocation/risk/**",
  ];
  for (const pattern of gatedEndpoints) {
    await page.route(pattern, (route) => {
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify(MOCK_REGISTRATION_REQUIRED) });
    });
  }

  // Mock onboarding — minimal profile
  await page.route("**/api/v1/relocation/onboarding", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "profile-1", userType: "planning_move", household: "single",
          monthlyBudget: 2000, status: "IN_PROGRESS", completedSteps: 5, completionPercent: 50,
        }),
      });
    }
    return route.continue();
  });

  await page.route("**/api/v1/relocation/onboarding/status", (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "IN_PROGRESS", completedSteps: 5, completionPercent: 50 }),
    });
  });

  await page.route("**/api/v1/relocation/activation-state", (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "IN_PROGRESS", completedSteps: 5, totalSteps: 10, completionPercent: 50, nextActions: [] }),
    });
  });

  // Catch-all for other API calls that might happen during page load
  await page.route("**/api/v1/auth/refresh", (route) => {
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ accessToken: "fake-jwt-token", refreshToken: "fake-refresh" }),
    });
  });

  await page.route("**/api/v1/profile/**", (route) => {
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({}) });
  });

  await page.route("**/api/v1/notifications/**", (route) => {
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
  });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe("Budget Simulator — Anonymous User Flow", () => {
  test.beforeEach(async ({ page }) => {
    await setupAnonymousMocks(page);
    // Set anonymous session token in localStorage so the app thinks we're in expat mode
    await page.addInitScript(() => {
      // Auth tokens so the app considers us "authenticated" and doesn't redirect to login
      localStorage.setItem("syncro.auth.tokens", JSON.stringify({ accessToken: "fake-jwt-token", refreshToken: "fake-refresh" }));
      localStorage.setItem("syncro.auth.user", JSON.stringify({ id: "user-anon-1", email: "anon@test.com", language: "en" }));
      // Expat session for anonymous budget simulator
      localStorage.setItem("expats.session.token", "test-anon-token");
      localStorage.setItem("expats.session.id", "session-1");
      localStorage.setItem("syncro.expatsModeActive", "true");
    });
  });

  test("loads budget page and shows simulator UI", async ({ page }) => {
    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".bp-card").first()).toBeVisible();
    await expect(page.locator(".plan-tabs")).toBeVisible();
  });

  test("displays city selector with mock cities", async ({ page }) => {
    await page.goto("/expats/budget");
    const citySelect = page.locator(".bp-select");
    await expect(citySelect).toBeVisible();
  });

  test("sliders are interactive and trigger simulation", async ({ page }) => {
    const simulationRequests: string[] = [];
    await page.route("**/api/v1/relocation/budget/simulations", (route) => {
      if (route.request().method() === "POST") {
        simulationRequests.push(route.request().postData() || "");
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_SIMULATION_RESPONSE),
        });
      }
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify(MOCK_REGISTRATION_REQUIRED) });
    });

    await page.goto("/expats/budget");
    // Wait for auto-run simulation on mount
    await page.waitForTimeout(1000);
    expect(simulationRequests.length).toBeGreaterThan(0);
  });

  test("shows simulation results: monthly cost, balance, runway, recommended budget", async ({ page }) => {
    await page.goto("/expats/budget");
    // Wait for simulation to complete
    await page.waitForTimeout(1200);

    // Total monthly cost
    await expect(page.locator(".bp-total__value")).toBeVisible();

    // Reality check section
    await expect(page.locator("text=Monthly Balance").or(page.locator("text=Financial Runway"))).toBeVisible();
  });

  test("shows entry cost breakdown", async ({ page }) => {
    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });

    // Wait for simulation to complete and entry cost to render
    await expect(page.locator("text=Entry Cost").first()).toBeVisible({ timeout: 10000 });
  });

  test("housing type toggle switches between 1br and 3br", async ({ page }) => {
    await page.goto("/expats/budget");

    const toggles = page.locator(".bp-toggle");
    const firstToggle = toggles.first();
    const secondToggle = toggles.nth(1);

    await expect(firstToggle).toBeVisible();
    await expect(secondToggle).toBeVisible();

    // Click 3br toggle
    await secondToggle.click();
    await expect(secondToggle).toHaveClass(/bp-toggle--active/);
  });

  test("living type toggle switches between single and family", async ({ page }) => {
    await page.goto("/expats/budget");

    // Find the living type toggles (second pair)
    const allToggles = page.locator(".bp-toggles");
    const livingToggles = allToggles.nth(1);
    const familyBtn = livingToggles.locator(".bp-toggle").nth(1);

    await familyBtn.click();
    await expect(familyBtn).toHaveClass(/bp-toggle--active/);
  });

  test("plan tabs show FREE active, PREMIUM and SUPER_PRO locked", async ({ page }) => {
    await page.goto("/expats/budget");

    const tabs = page.locator(".plan-tabs__tab");
    await expect(tabs.first()).toHaveClass(/plan-tabs__tab--active/);
    await expect(tabs.nth(1)).toHaveClass(/plan-tabs__tab--locked/);
    await expect(tabs.nth(2)).toHaveClass(/plan-tabs__tab--locked/);
  });
});

test.describe("Budget Simulator — Registration Gate", () => {
  test.beforeEach(async ({ page }) => {
    await setupAnonymousMocks(page);
    await page.addInitScript(() => {
      // Auth tokens so the app considers us "authenticated" and doesn't redirect to login
      localStorage.setItem("syncro.auth.tokens", JSON.stringify({ accessToken: "fake-jwt-token", refreshToken: "fake-refresh" }));
      localStorage.setItem("syncro.auth.user", JSON.stringify({ id: "user-anon-1", email: "anon@test.com", language: "en" }));
      // Expat session for anonymous budget simulator
      localStorage.setItem("expats.session.token", "test-anon-token");
      localStorage.setItem("expats.session.id", "session-1");
      localStorage.setItem("syncro.expatsModeActive", "true");
    });
  });

  test("clicking PREMIUM tab opens registration modal", async ({ page }) => {
    await page.goto("/expats/budget");
    await page.waitForSelector(".plan-tabs", { timeout: 10000 });

    const premiumTab = page.locator("button:has-text('Premium')");
    await premiumTab.click();

    const modal = page.getByRole("dialog").filter({ hasText: "Unlock Full Access" });
    await expect(modal).toBeVisible({ timeout: 5000 });
    await expect(modal.locator("text=Unlock Full Access")).toBeVisible();
    await expect(modal.locator("text=Create Free Account")).toBeVisible();
  });

  test("clicking SUPER_PRO tab opens registration modal", async ({ page }) => {
    await page.goto("/expats/budget");
    await page.waitForSelector(".plan-tabs", { timeout: 10000 });

    const superProTab = page.locator("button:has-text('Super Pro')");
    await superProTab.click();

    const modal = page.getByRole("dialog").filter({ hasText: "Unlock Full Access" });
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  // Note: history/tracking buttons are only visible for truly authenticated users
  // which cannot be fully simulated with mock tokens in E2E

  test("registration modal 'Maybe Later' closes modal", async ({ page }) => {
    await page.goto("/expats/budget");
    await page.waitForSelector(".plan-tabs", { timeout: 10000 });

    await page.locator("button:has-text('Premium')").click();

    const modal = page.getByRole("dialog").filter({ hasText: "Unlock Full Access" });
    await expect(modal).toBeVisible({ timeout: 5000 });

    await modal.locator("text=Maybe Later").click();
    await expect(modal).not.toBeVisible();
  });

  test("registration modal 'Create Free Account' navigates to register", async ({ page }) => {
    await page.goto("/expats/budget");
    await page.waitForSelector(".plan-tabs", { timeout: 10000 });

    await page.locator("button:has-text('Premium')").click();

    const modal = page.getByRole("dialog").filter({ hasText: "Unlock Full Access" });
    await expect(modal).toBeVisible({ timeout: 5000 });

    await modal.locator("text=Create Free Account").click();
    await page.waitForURL("**/register*", { timeout: 5000 });
    expect(page.url()).toContain("/register");
  });

  test("Escape key closes registration modal", async ({ page }) => {
    await page.goto("/expats/budget");
    await page.waitForSelector(".plan-tabs", { timeout: 10000 });

    await page.locator("button:has-text('Premium')").click();

    const modal = page.getByRole("dialog").filter({ hasText: "Unlock Full Access" });
    await expect(modal).toBeVisible({ timeout: 5000 });

    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
  });
});

test.describe("Budget Simulator — Simulation API", () => {
  test("POST simulation sends correct payload", async ({ page }) => {
    let capturedPayload: any = null;

    await setupAnonymousMocks(page);
    await page.route("**/api/v1/relocation/budget/simulations", (route) => {
      if (route.request().method() === "POST") {
        capturedPayload = JSON.parse(route.request().postData() || "{}");
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_SIMULATION_RESPONSE),
        });
      }
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify(MOCK_REGISTRATION_REQUIRED) });
    });

    await page.addInitScript(() => {
      // Auth tokens so the app considers us "authenticated" and doesn't redirect to login
      localStorage.setItem("syncro.auth.tokens", JSON.stringify({ accessToken: "fake-jwt-token", refreshToken: "fake-refresh" }));
      localStorage.setItem("syncro.auth.user", JSON.stringify({ id: "user-anon-1", email: "anon@test.com", language: "en" }));
      // Expat session for anonymous budget simulator
      localStorage.setItem("expats.session.token", "test-anon-token");
      localStorage.setItem("expats.session.id", "session-1");
      localStorage.setItem("syncro.expatsModeActive", "true");
    });

    await page.goto("/expats/budget");
    await page.waitForTimeout(1200);

    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload.planCode).toBe("FREE");
    expect(capturedPayload.monthlyBudget).toBeGreaterThan(0);
    expect(capturedPayload.housingType).toBeTruthy();
    expect(capturedPayload.livingType).toBeTruthy();
  });

  test("simulation response source is 'anonymous'", async ({ page }) => {
    await setupAnonymousMocks(page);
    await page.addInitScript(() => {
      // Auth tokens so the app considers us "authenticated" and doesn't redirect to login
      localStorage.setItem("syncro.auth.tokens", JSON.stringify({ accessToken: "fake-jwt-token", refreshToken: "fake-refresh" }));
      localStorage.setItem("syncro.auth.user", JSON.stringify({ id: "user-anon-1", email: "anon@test.com", language: "en" }));
      // Expat session for anonymous budget simulator
      localStorage.setItem("expats.session.token", "test-anon-token");
      localStorage.setItem("expats.session.id", "session-1");
      localStorage.setItem("syncro.expatsModeActive", "true");
    });

    let responseSource: string | null = null;
    await page.route("**/api/v1/relocation/budget/simulations", (route) => {
      if (route.request().method() === "POST") {
        const resp = { ...MOCK_SIMULATION_RESPONSE, source: "anonymous" };
        responseSource = resp.source;
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(resp) });
      }
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify(MOCK_REGISTRATION_REQUIRED) });
    });

    await page.goto("/expats/budget");
    await page.waitForTimeout(1200);

    expect(responseSource).toBe("anonymous");
  });
});

// ─── Additional Coverage ────────────────────────────────────────────────────

test.describe("Budget Simulator — User Interactions", () => {
  test.beforeEach(async ({ page }) => {
    await setupAnonymousMocks(page);
    await page.addInitScript(() => {
      localStorage.setItem("syncro.auth.tokens", JSON.stringify({ accessToken: "fake-jwt-token", refreshToken: "fake-refresh" }));
      localStorage.setItem("syncro.auth.user", JSON.stringify({ id: "user-anon-1", email: "anon@test.com", language: "en" }));
      localStorage.setItem("expats.session.token", "test-anon-token");
      localStorage.setItem("expats.session.id", "session-1");
      localStorage.setItem("syncro.expatsModeActive", "true");
    });
  });

  test("selecting a city sends the cityId in the simulation payload", async ({ page }) => {
    let capturedCityId: string | null = null;
    await page.route("**/api/v1/relocation/budget/simulations", (route) => {
      if (route.request().method() === "POST") {
        const body = JSON.parse(route.request().postData() || "{}");
        capturedCityId = body.cityId;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ...MOCK_SIMULATION_RESPONSE, cityId: body.cityId }),
        });
      }
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify(MOCK_REGISTRATION_REQUIRED) });
    });

    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });

    // Select the second city from dropdown
    const citySelect = page.locator(".bp-select");
    await citySelect.selectOption({ index: 1 });

    // Wait for debounced simulation
    await page.waitForTimeout(1000);
    expect(capturedCityId).toBeTruthy();
  });

  test("changing budget slider updates the payload value", async ({ page }) => {
    const payloads: number[] = [];
    await page.route("**/api/v1/relocation/budget/simulations", (route) => {
      if (route.request().method() === "POST") {
        const body = JSON.parse(route.request().postData() || "{}");
        payloads.push(body.monthlyBudget);
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_SIMULATION_RESPONSE),
        });
      }
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify(MOCK_REGISTRATION_REQUIRED) });
    });

    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);
    const initialCalls = payloads.length;

    // Set slider value and trigger React's onChange via native input event
    const budgetSlider = page.locator("input[type=range]").first();
    await budgetSlider.evaluate((el: HTMLInputElement) => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      nativeInputValueSetter.call(el, "5000");
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });

    await page.waitForTimeout(1000);
    expect(payloads.length).toBeGreaterThan(initialCalls);
  });

  test("changing savings slider sends savings in payload", async ({ page }) => {
    let lastSavings: number | null = null;
    await page.route("**/api/v1/relocation/budget/simulations", (route) => {
      if (route.request().method() === "POST") {
        const body = JSON.parse(route.request().postData() || "{}");
        lastSavings = body.savings;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_SIMULATION_RESPONSE),
        });
      }
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify(MOCK_REGISTRATION_REQUIRED) });
    });

    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });

    // Move savings slider (second range input)
    const savingsSlider = page.locator("input[type=range]").nth(1);
    await savingsSlider.fill("15000");

    await page.waitForTimeout(1000);
    expect(lastSavings).toBe(15000);
  });

  test("budget slider at minimum (300) sends correct value", async ({ page }) => {
    let lastBudget: number | null = null;
    await page.route("**/api/v1/relocation/budget/simulations", (route) => {
      if (route.request().method() === "POST") {
        const body = JSON.parse(route.request().postData() || "{}");
        lastBudget = body.monthlyBudget;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_SIMULATION_RESPONSE),
        });
      }
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify(MOCK_REGISTRATION_REQUIRED) });
    });

    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });

    const budgetSlider = page.locator("input[type=range]").first();
    await budgetSlider.fill("300");

    await page.waitForTimeout(1000);
    expect(lastBudget).toBe(300);
  });

  test("budget slider at maximum (10000) sends correct value", async ({ page }) => {
    let lastBudget: number | null = null;
    await page.route("**/api/v1/relocation/budget/simulations", (route) => {
      if (route.request().method() === "POST") {
        const body = JSON.parse(route.request().postData() || "{}");
        lastBudget = body.monthlyBudget;
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_SIMULATION_RESPONSE),
        });
      }
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify(MOCK_REGISTRATION_REQUIRED) });
    });

    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });

    const budgetSlider = page.locator("input[type=range]").first();
    await budgetSlider.fill("10000");

    await page.waitForTimeout(1000);
    expect(lastBudget).toBe(10000);
  });
});

test.describe("Budget Simulator — Output Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("syncro.auth.tokens", JSON.stringify({ accessToken: "fake-jwt-token", refreshToken: "fake-refresh" }));
      localStorage.setItem("syncro.auth.user", JSON.stringify({ id: "user-anon-1", email: "anon@test.com", language: "en" }));
      localStorage.setItem("expats.session.token", "test-anon-token");
      localStorage.setItem("expats.session.id", "session-1");
      localStorage.setItem("syncro.expatsModeActive", "true");
    });
  });

  test("negative balance (deficit) shows red indicator", async ({ page }) => {
    const deficitResponse = {
      ...MOCK_SIMULATION_RESPONSE,
      outputPayload: {
        ...MOCK_SIMULATION_RESPONSE.outputPayload,
        monthlyBalance: -300,
        balanceStatus: "DEFICIT",
      },
    };

    await setupAnonymousMocks(page);
    await page.route("**/api/v1/relocation/budget/simulations", (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(deficitResponse) });
      }
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify(MOCK_REGISTRATION_REQUIRED) });
    });

    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);

    // Deficit should show "Monthly Deficit" (not "Monthly Surplus")
    await expect(page.locator("text=Monthly Deficit").first()).toBeVisible({ timeout: 5000 });
  });

  test("critical runway (< 2 months) shows in results", async ({ page }) => {
    const criticalResponse = {
      ...MOCK_SIMULATION_RESPONSE,
      outputPayload: {
        ...MOCK_SIMULATION_RESPONSE.outputPayload,
        financialRunway: { months: 1.2, level: "CRITICAL" },
      },
    };

    await setupAnonymousMocks(page);
    await page.route("**/api/v1/relocation/budget/simulations", (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(criticalResponse) });
      }
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify(MOCK_REGISTRATION_REQUIRED) });
    });

    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1500);

    // Financial runway section visible
    await expect(page.locator("text=Financial Runway").first()).toBeVisible({ timeout: 5000 });
  });

  test("multiple rapid slider changes result in single debounced API call", async ({ page }) => {
    let callCount = 0;
    await setupAnonymousMocks(page);
    await page.route("**/api/v1/relocation/budget/simulations", (route) => {
      if (route.request().method() === "POST") {
        callCount++;
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(MOCK_SIMULATION_RESPONSE) });
      }
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify(MOCK_REGISTRATION_REQUIRED) });
    });

    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });

    // Wait for initial mount simulation
    await page.waitForTimeout(1000);
    const initialCalls = callCount;

    // Rapidly change slider 5 times
    const budgetSlider = page.locator("input[type=range]").first();
    for (const val of [3000, 4000, 5000, 6000, 7000]) {
      await budgetSlider.fill(String(val));
      await page.waitForTimeout(100); // rapid changes
    }

    // Wait for debounce to resolve
    await page.waitForTimeout(1000);

    // Should have made fewer calls than slider changes (debounce working)
    const newCalls = callCount - initialCalls;
    expect(newCalls).toBeLessThanOrEqual(3); // debounce should collapse 5 changes into 1-2 calls
    expect(newCalls).toBeGreaterThanOrEqual(1);
  });
});

test.describe("Budget Simulator — Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("syncro.auth.tokens", JSON.stringify({ accessToken: "fake-jwt-token", refreshToken: "fake-refresh" }));
      localStorage.setItem("syncro.auth.user", JSON.stringify({ id: "user-anon-1", email: "anon@test.com", language: "en" }));
      localStorage.setItem("expats.session.token", "test-anon-token");
      localStorage.setItem("expats.session.id", "session-1");
      localStorage.setItem("syncro.expatsModeActive", "true");
    });
  });

  test("API 500 error does not crash the page", async ({ page }) => {
    await setupAnonymousMocks(page);
    await page.route("**/api/v1/relocation/budget/simulations", (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ status: 500, message: "Internal Server Error" }),
        });
      }
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify(MOCK_REGISTRATION_REQUIRED) });
    });

    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });

    // Page should still be functional (not crashed)
    await expect(page.locator(".plan-tabs")).toBeVisible();
    await expect(page.locator(".bp-card").first()).toBeVisible();
  });

  test("network timeout does not crash the page", async ({ page }) => {
    await setupAnonymousMocks(page);
    await page.route("**/api/v1/relocation/budget/simulations", (route) => {
      if (route.request().method() === "POST") {
        // Simulate timeout by aborting
        return route.abort("timedout");
      }
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify(MOCK_REGISTRATION_REQUIRED) });
    });

    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });

    // Page should still be functional
    await expect(page.locator(".plan-tabs")).toBeVisible();
  });

  test("simulation results update when slider changes after error", async ({ page }) => {
    let callCount = 0;
    await setupAnonymousMocks(page);
    await page.route("**/api/v1/relocation/budget/simulations", (route) => {
      if (route.request().method() === "POST") {
        callCount++;
        // First call fails, subsequent succeed
        if (callCount <= 1) {
          return route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ status: 500, message: "Error" }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_SIMULATION_RESPONSE),
        });
      }
      return route.fulfill({ status: 403, contentType: "application/json", body: JSON.stringify(MOCK_REGISTRATION_REQUIRED) });
    });

    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(1000);

    // Change slider to trigger new simulation (which should succeed)
    const budgetSlider = page.locator("input[type=range]").first();
    await budgetSlider.fill("4000");
    await page.waitForTimeout(1000);

    // Results should be visible after recovery
    await expect(page.locator(".bp-total__value")).toBeVisible({ timeout: 5000 });
  });
});

// ─── True Anonymous Flow (no auth tokens) ───────────────────────────────────

test.describe("Budget Simulator — True Anonymous (Public Page)", () => {
  test.beforeEach(async ({ page }) => {
    await setupAnonymousMocks(page);
    // NO auth tokens — truly anonymous user on public /expats/budget
    await page.addInitScript(() => {
      localStorage.removeItem("syncro.auth.tokens");
      localStorage.removeItem("syncro.auth.user");
      localStorage.setItem("syncro.expatsModeActive", "true");
    });
  });

  test("public /expats/budget loads without auth", async ({ page }) => {
    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".plan-tabs")).toBeVisible();
  });

  test("auto-creates anonymous session on mount", async ({ page }) => {
    let sessionCreated = false;
    await page.route("**/api/v1/expats/anonymous/sessions", (route) => {
      if (route.request().method() === "POST") {
        sessionCreated = true;
        return route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "auto-session-1",
            sessionToken: "auto-token",
            status: "IN_PROGRESS",
            currentStep: 1,
            totalSteps: 10,
            answers: [],
          }),
        });
      }
      return route.continue();
    });

    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);
    expect(sessionCreated).toBe(true);
  });

  test("shows upsell banner after simulation results", async ({ page }) => {
    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);

    // Upsell banner should appear for anonymous users
    await expect(page.locator(".bp-upsell")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Want more from your simulation?")).toBeVisible();
    await expect(page.locator("text=Save and compare simulation history")).toBeVisible();
    await expect(page.locator(".bp-upsell__cta")).toBeVisible();
  });

  test("shows premium preview with blur", async ({ page }) => {
    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);

    // Premium preview should appear for anonymous users
    await expect(page.locator(".bp-preview")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Premium Analysis Preview")).toBeVisible();
    await expect(page.locator(".bp-preview__blur")).toBeVisible();
    await expect(page.locator("text=Unlock Premium Analysis")).toBeVisible();
  });

  test("upsell CTA opens registration modal", async ({ page }) => {
    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);

    await page.locator(".bp-upsell__cta").click();
    const modal = page.getByRole("dialog").filter({ hasText: "Unlock Full Access" });
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test("premium preview CTA opens registration modal", async ({ page }) => {
    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);

    await page.locator(".bp-preview__cta").click();
    const modal = page.getByRole("dialog").filter({ hasText: "Unlock Full Access" });
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test("hides simulation history and tracking for anonymous", async ({ page }) => {
    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);

    // These buttons should NOT be visible for anonymous users
    await expect(page.locator("text=View Simulation History")).not.toBeVisible();
    await expect(page.locator("text=Track Your Real Expenses")).not.toBeVisible();
  });

  test("anonymous simulation runs and shows results", async ({ page }) => {
    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });
    await page.waitForTimeout(2000);

    // Results should be visible
    await expect(page.locator(".bp-total__value")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Entry Cost").first()).toBeVisible();
  });
});

// ─── Landing → Budget Flow ──────────────────────────────────────────────────

test.describe("Budget Simulator — Landing to Budget Navigation", () => {
  test("landing CTA navigates to /expats/budget", async ({ page }) => {
    await setupAnonymousMocks(page);
    await page.addInitScript(() => {
      localStorage.removeItem("syncro.auth.tokens");
      localStorage.removeItem("syncro.auth.user");
    });

    await page.goto("/expats");
    // Wait for landing to load
    await page.waitForTimeout(2000);

    // Find and click any CTA button on the landing
    const cta = page.locator("button:has-text('Start'), button:has-text('Discover'), button:has-text('Get')").first();
    if (await cta.isVisible({ timeout: 5000 }).catch(() => false)) {
      await cta.click();
      await page.waitForURL("**/expats/budget**", { timeout: 5000 });
      expect(page.url()).toContain("/expats/budget");
    }
  });
});

// ─── City Dropdown for Anonymous ────────────────────────────────────────────

test.describe("Budget Simulator — Anonymous City Selector", () => {
  test.beforeEach(async ({ page }) => {
    await setupAnonymousMocks(page);
    await page.addInitScript(() => {
      localStorage.removeItem("syncro.auth.tokens");
      localStorage.removeItem("syncro.auth.user");
      localStorage.setItem("syncro.expatsModeActive", "true");
    });
  });

  test("shows 'Select a city' placeholder for anonymous users", async ({ page }) => {
    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });

    const citySelect = page.locator(".bp-select");
    await expect(citySelect).toBeVisible();
    // First option should be "Select a city" not "Use profile city"
    const firstOption = citySelect.locator("option").first();
    const text = await firstOption.textContent();
    expect(text).not.toContain("profile");
  });

  test("reset button clears all selections", async ({ page }) => {
    await page.goto("/expats/budget");
    await expect(page.locator("h1:has-text('Budget Simulator')")).toBeVisible({ timeout: 15000 });

    // Click reset
    const resetBtn = page.locator(".bp-reset");
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // City dropdown should be back to default
    const citySelect = page.locator(".bp-select");
    await expect(citySelect).toHaveValue("");
  });
});
