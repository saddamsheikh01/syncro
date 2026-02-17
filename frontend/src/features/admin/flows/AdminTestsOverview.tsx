"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Badge } from "@/components/elements/Badge";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Loader } from "@/components/elements/Loader";
import { Select } from "@/components/elements/Select";
import { Textarea } from "@/components/elements/Textarea";
import { AdminStatCard } from "@/features/admin/cards/AdminStatCard";
import { AdminTable } from "@/features/admin/sections/AdminTable";
import { formatDateTime, formatNumber } from "@/features/admin/lib/formatters";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { useT } from "@/hooks";
import {
  autoTranslateAllAdminTest,
  createAdminAnswerOption,
  createAdminQuestion,
  createAdminTest,
  deleteAdminAnswerOption,
  deleteAdminQuestion,
  deleteAdminTest,
  getAdminTest,
  getAdminTests,
  getAdminTestTranslations,
  upsertAdminTestTranslations,
  updateAdminAnswerOption,
  updateAdminQuestion,
  updateAdminTest,
} from "@/services/admin";
import type { ApiError } from "@/types/api";
import type {
  AdminTestDefinitionResponse,
  AdminTestDetailResponse,
  TestTranslationLocale,
  TestScoringStrategy,
  TestType,
} from "@/types/insights";

type TranslationQuestionForm = {
  questionText: string;
  options: Record<string, string>;
};

type TranslationFormState = {
  title: string;
  description: string;
  questions: Record<string, TranslationQuestionForm>;
};

const SUPPORTED_TRANSLATION_LOCALES: readonly TestTranslationLocale[] = [
  "en",
  "it",
  "es",
  "fr",
] as const;

const toTranslationLocale = (value: string): TestTranslationLocale =>
  SUPPORTED_TRANSLATION_LOCALES.includes(value as TestTranslationLocale)
    ? (value as TestTranslationLocale)
    : "en";

export const AdminTestsOverview = () => {
  const { t, locale } = useT();

  const [tests, setTests] = useState<AdminTestDefinitionResponse[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const [selectedTestId, setSelectedTestId] = useState<string | null>(null);
  const [selectedTestDetail, setSelectedTestDetail] = useState<AdminTestDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [creatingTest, setCreatingTest] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createType, setCreateType] = useState<TestType>("OTHER");
  const [createScoring, setCreateScoring] = useState<TestScoringStrategy>("SINGLE_SCORE");
  const [createActive, setCreateActive] = useState("true");

  const [updatingTest, setUpdatingTest] = useState(false);
  const [deletingTest, setDeletingTest] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState<TestType>("OTHER");
  const [editScoring, setEditScoring] = useState<TestScoringStrategy>("SINGLE_SCORE");
  const [editActive, setEditActive] = useState("true");

  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionPosition, setQuestionPosition] = useState("1");
  const [questionType, setQuestionType] = useState("SINGLE");
  const [questionRequired, setQuestionRequired] = useState("true");
  const [questionMaxSelections, setQuestionMaxSelections] = useState("1");

  const [creatingOptionForQuestionId, setCreatingOptionForQuestionId] = useState<string | null>(null);
  const [optionLabel, setOptionLabel] = useState("");
  const [optionWeight, setOptionWeight] = useState("1");
  const [translationLocale, setTranslationLocale] = useState<TestTranslationLocale>(
    toTranslationLocale(locale)
  );
  const [translationLoading, setTranslationLoading] = useState(false);
  const [savingTranslations, setSavingTranslations] = useState(false);
  const [autoTranslating, setAutoTranslating] = useState(false);
  const [translationForm, setTranslationForm] = useState<TranslationFormState | null>(null);

  const testTypeOptions = useMemo(
    () => [
      { value: "", label: t("All types") },
      { value: "INTERESTS", label: t("Interests") },
      { value: "LIFESTYLE", label: t("Lifestyle") },
      { value: "VALUES", label: t("Values") },
      { value: "OBJECTIVES", label: t("Objectives") },
      { value: "PSY", label: t("Psychology") },
      { value: "ASTRO", label: t("Astrology") },
      { value: "OTHER", label: t("Other") },
    ],
    [t]
  );

  const scoringOptions = useMemo(
    () => [
      { value: "SINGLE_SCORE", label: t("Single score") },
      { value: "CLUSTER_SCORE", label: t("Cluster score") },
      { value: "AXES_SCORE", label: t("Axes score") },
    ],
    [t]
  );

  const statusOptions = useMemo(
    () => [
      { value: "", label: t("Status: all") },
      { value: "active", label: t("Active") },
      { value: "inactive", label: t("Inactive") },
    ],
    [t]
  );

  const questionTypeOptions = useMemo(
    () => [
      { value: "SINGLE", label: t("Single choice") },
      { value: "MULTI", label: t("Multiple choice") },
    ],
    [t]
  );

  const translationLocaleOptions = useMemo(
    () => [
      { value: "it", label: t("Italian") },
      { value: "es", label: t("Spanish") },
      { value: "fr", label: t("French") },
      { value: "en", label: t("English") },
    ],
    [t]
  );

  const resolveQuestionTypeLabel = useCallback(
    (value: "SINGLE" | "MULTI") =>
      value === "MULTI" ? t("Multiple choice") : t("Single choice"),
    [t]
  );

  const resolveTestTypeLabel = useCallback(
    (value: TestType) => {
      switch (value) {
        case "INTERESTS":
          return t("Interests");
        case "LIFESTYLE":
          return t("Lifestyle");
        case "VALUES":
          return t("Values");
        case "OBJECTIVES":
          return t("Objectives");
        case "PSY":
          return t("Psychology");
        case "ASTRO":
          return t("Astrology");
        case "OTHER":
        default:
          return t("Other");
      }
    },
    [t]
  );

  const resolveScoringLabel = useCallback(
    (value: TestScoringStrategy) => {
      switch (value) {
        case "CLUSTER_SCORE":
          return t("Cluster score");
        case "AXES_SCORE":
          return t("Axes score");
        case "SINGLE_SCORE":
        default:
          return t("Single score");
      }
    },
    [t]
  );

  const loadTests = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAdminTests();
      setTests(response);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTestDetail = useCallback(async (testId: string) => {
    setDetailLoading(true);
    setError(null);

    try {
      const detail = await getAdminTest(testId);
      setSelectedTestDetail(detail);
      setEditTitle(detail.title);
      setEditDescription(detail.description ?? "");
      setEditType(detail.testType);
      setEditScoring(detail.scoringStrategy);
      setEditActive(detail.active ? "true" : "false");
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const buildTranslationForm = useCallback(
    (
      detail: AdminTestDetailResponse,
      payload: Awaited<ReturnType<typeof getAdminTestTranslations>>
    ): TranslationFormState => {
      const questions = detail.questions.reduce<Record<string, TranslationQuestionForm>>(
        (acc, question) => {
          const translatedQuestion = payload.questions.find(
            (item) => item.questionId === question.id
          );
          const options = question.options.reduce<Record<string, string>>((optAcc, option) => {
            const translatedOption = translatedQuestion?.options.find(
              (item) => item.optionId === option.id
            );
            optAcc[option.id] = translatedOption?.label ?? option.label;
            return optAcc;
          }, {});
          acc[question.id] = {
            questionText: translatedQuestion?.questionText ?? question.question,
            options,
          };
          return acc;
        },
        {}
      );
      return {
        title: payload.title ?? detail.title,
        description: payload.description ?? detail.description ?? "",
        questions,
      };
    },
    []
  );

  const loadTranslations = useCallback(
    async (detail: AdminTestDetailResponse, locale: TestTranslationLocale) => {
      setTranslationLoading(true);
      setError(null);
      try {
        const payload = await getAdminTestTranslations(detail.id, locale);
        setTranslationForm(buildTranslationForm(detail, payload));
      } catch (requestError) {
        setError(requestError as ApiError);
        setTranslationForm(null);
      } finally {
        setTranslationLoading(false);
      }
    },
    [buildTranslationForm]
  );

  useEffect(() => {
    void loadTests();
  }, [loadTests]);

  useEffect(() => {
    if (!selectedTestId) {
      setSelectedTestDetail(null);
      setTranslationForm(null);
      return;
    }
    void loadTestDetail(selectedTestId);
  }, [loadTestDetail, selectedTestId]);

  useEffect(() => {
    if (!selectedTestDetail) {
      setTranslationForm(null);
      return;
    }
    void loadTranslations(selectedTestDetail, translationLocale);
  }, [loadTranslations, selectedTestDetail, translationLocale]);

  useEffect(() => {
    const nextLocale = toTranslationLocale(locale);
    setTranslationLocale((prev) => (prev === nextLocale ? prev : nextLocale));
  }, [locale]);

  const filteredTests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tests.filter((test) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        test.title.toLowerCase().includes(normalizedQuery) ||
        (test.description ?? "").toLowerCase().includes(normalizedQuery);

      const matchesType = !typeFilter || test.testType === (typeFilter as TestType);

      const matchesStatus =
        !statusFilter ||
        (statusFilter === "active" ? test.active : !test.active);

      return matchesQuery && matchesType && matchesStatus;
    });
  }, [query, statusFilter, tests, typeFilter]);

  const rows = useMemo(
    () =>
      filteredTests.map((test) => ({
        id: test.id,
        title: test.title,
        type: resolveTestTypeLabel(test.testType),
        strategy: resolveScoringLabel(test.scoringStrategy),
        status: (
          <Badge tone={test.active ? "success" : "warning"}>
            {test.active ? t("ACTIVE") : t("INACTIVE")}
          </Badge>
        ),
        updatedAt: formatDateTime(test.updatedAt),
        actions: (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedTestId(test.id)}
          >
            {t("Manage")}
          </Button>
        ),
      })),
    [filteredTests, resolveScoringLabel, resolveTestTypeLabel, t]
  );

  const activeCount = useMemo(
    () => filteredTests.filter((test) => test.active).length,
    [filteredTests]
  );

  const handleCreateTest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreatingTest(true);
    setError(null);

    try {
      const created = await createAdminTest({
        title: createTitle.trim(),
        description: createDescription.trim() || null,
        testType: createType,
        scoringStrategy: createScoring,
        active: createActive === "true",
      });
      setCreateTitle("");
      setCreateDescription("");
      await loadTests();
      setSelectedTestId(created.id);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setCreatingTest(false);
    }
  };

  const handleUpdateTest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTestDetail) {
      return;
    }

    setUpdatingTest(true);
    setError(null);

    try {
      await updateAdminTest(selectedTestDetail.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        testType: editType,
        scoringStrategy: editScoring,
        active: editActive === "true",
      });
      await loadTests();
      await loadTestDetail(selectedTestDetail.id);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setUpdatingTest(false);
    }
  };

  const handleDeleteTest = async () => {
    if (!selectedTestDetail) {
      return;
    }

    const confirmed = window.confirm(t("Confirm test deletion?"));
    if (!confirmed) {
      return;
    }

    setDeletingTest(true);
    setError(null);

    try {
      await deleteAdminTest(selectedTestDetail.id);
      setSelectedTestId(null);
      await loadTests();
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setDeletingTest(false);
    }
  };

  const handleCreateQuestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTestDetail) {
      return;
    }

    setCreatingQuestion(true);
    setError(null);

    try {
      await createAdminQuestion(selectedTestDetail.id, {
        question: questionText.trim(),
        position: Math.max(1, Number(questionPosition) || 1),
        questionType: questionType as "SINGLE" | "MULTI",
        required: questionRequired === "true",
        maxSelections:
          questionType === "MULTI"
            ? Math.max(1, Number(questionMaxSelections) || 1)
            : 1,
      });
      setQuestionText("");
      setQuestionPosition(String((selectedTestDetail.questions?.length ?? 0) + 1));
      setQuestionType("SINGLE");
      setQuestionRequired("true");
      setQuestionMaxSelections("1");
      await loadTestDetail(selectedTestDetail.id);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setCreatingQuestion(false);
    }
  };

  const handleEditQuestion = async (
    questionId: string,
    currentQuestion: string,
    currentPosition: number,
    currentRequired: boolean,
    currentType: "SINGLE" | "MULTI",
    currentMaxSelections: number | null | undefined
  ) => {
    if (!selectedTestDetail) {
      return;
    }

    const nextQuestion = window.prompt(t("Question text"), currentQuestion);
    if (!nextQuestion || !nextQuestion.trim()) {
      return;
    }

    const nextPositionRaw = window.prompt(t("Position"), String(currentPosition));
    const nextPosition = Math.max(1, Number(nextPositionRaw || currentPosition) || currentPosition);

    const nextRequired = window.confirm(t("Required question? OK = yes, Cancel = no"));

    const nextTypeRaw = window.prompt(t("Question type (SINGLE/MULTI)"), currentType);
    const nextType = nextTypeRaw === "MULTI" ? "MULTI" : "SINGLE";

    let nextMaxSelections = 1;
    if (nextType === "MULTI") {
      const raw = window.prompt(
        t("Max selections"),
        String(currentMaxSelections ?? 1)
      );
      nextMaxSelections = Math.max(1, Number(raw || currentMaxSelections || 1) || 1);
    }

    setError(null);
    try {
      await updateAdminQuestion(selectedTestDetail.id, questionId, {
        question: nextQuestion.trim(),
        position: nextPosition,
        required: nextRequired,
        questionType: nextType,
        maxSelections: nextType === "MULTI" ? nextMaxSelections : 1,
      });
      await loadTestDetail(selectedTestDetail.id);
    } catch (requestError) {
      setError(requestError as ApiError);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!selectedTestDetail) {
      return;
    }

    const confirmed = window.confirm(t("Confirm question deletion?"));
    if (!confirmed) {
      return;
    }

    setError(null);
    try {
      await deleteAdminQuestion(selectedTestDetail.id, questionId);
      await loadTestDetail(selectedTestDetail.id);
    } catch (requestError) {
      setError(requestError as ApiError);
    }
  };

  const handleCreateOption = async (questionId: string) => {
    if (!selectedTestDetail) {
      return;
    }

    setCreatingOptionForQuestionId(questionId);
    setError(null);

    try {
      await createAdminAnswerOption(selectedTestDetail.id, questionId, {
        label: optionLabel.trim(),
        weight: Number(optionWeight) || 1,
      });
      setOptionLabel("");
      setOptionWeight("1");
      await loadTestDetail(selectedTestDetail.id);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setCreatingOptionForQuestionId(null);
    }
  };

  const handleEditOption = async (
    questionId: string,
    optionId: string,
    currentLabel: string,
    currentWeight: number
  ) => {
    if (!selectedTestDetail) {
      return;
    }

    const nextLabel = window.prompt(t("Option label"), currentLabel);
    if (!nextLabel || !nextLabel.trim()) {
      return;
    }

    const nextWeightRaw = window.prompt(t("Option weight"), String(currentWeight));
    const nextWeight = Number(nextWeightRaw || currentWeight) || currentWeight;

    setError(null);
    try {
      await updateAdminAnswerOption(selectedTestDetail.id, questionId, optionId, {
        label: nextLabel.trim(),
        weight: nextWeight,
      });
      await loadTestDetail(selectedTestDetail.id);
    } catch (requestError) {
      setError(requestError as ApiError);
    }
  };

  const handleDeleteOption = async (questionId: string, optionId: string) => {
    if (!selectedTestDetail) {
      return;
    }

    const confirmed = window.confirm(t("Confirm option deletion?"));
    if (!confirmed) {
      return;
    }

    setError(null);
    try {
      await deleteAdminAnswerOption(selectedTestDetail.id, questionId, optionId);
      await loadTestDetail(selectedTestDetail.id);
    } catch (requestError) {
      setError(requestError as ApiError);
    }
  };

  const handleTranslationTitleChange = (value: string) => {
    setTranslationForm((prev) => (prev ? { ...prev, title: value } : prev));
  };

  const handleTranslationDescriptionChange = (value: string) => {
    setTranslationForm((prev) => (prev ? { ...prev, description: value } : prev));
  };

  const handleTranslationQuestionChange = (questionId: string, value: string) => {
    setTranslationForm((prev) => {
      if (!prev) return prev;
      const existingQuestion = prev.questions[questionId];
      if (!existingQuestion) return prev;
      return {
        ...prev,
        questions: {
          ...prev.questions,
          [questionId]: {
            ...existingQuestion,
            questionText: value,
          },
        },
      };
    });
  };

  const handleTranslationOptionChange = (
    questionId: string,
    optionId: string,
    value: string
  ) => {
    setTranslationForm((prev) => {
      if (!prev) return prev;
      const existingQuestion = prev.questions[questionId];
      if (!existingQuestion) return prev;
      return {
        ...prev,
        questions: {
          ...prev.questions,
          [questionId]: {
            ...existingQuestion,
            options: {
              ...existingQuestion.options,
              [optionId]: value,
            },
          },
        },
      };
    });
  };

  const handleSaveTranslations = async () => {
    if (!selectedTestDetail || !translationForm) {
      return;
    }

    const title = translationForm.title.trim();
    if (!title) {
      setError({
        code: "UNKNOWN",
        status: 400,
        message: t("Translation title is required."),
      });
      return;
    }

    const questionsPayload = selectedTestDetail.questions.map((question) => {
      const translationQuestion = translationForm.questions[question.id];
      const questionText = (translationQuestion?.questionText ?? "").trim();
      return {
        questionId: question.id,
        questionText,
        options: question.options.map((option) => ({
          optionId: option.id,
          label: (translationQuestion?.options[option.id] ?? "").trim(),
        })),
      };
    });

    if (questionsPayload.some((question) => !question.questionText)) {
      setError({
        code: "UNKNOWN",
        status: 400,
        message: t("Each translated question must have text."),
      });
      return;
    }

    if (
      questionsPayload.some((question) =>
        question.options.some((option) => !option.label)
      )
    ) {
      setError({
        code: "UNKNOWN",
        status: 400,
        message: t("Each translated option must have a label."),
      });
      return;
    }

    setSavingTranslations(true);
    setError(null);
    try {
      const saved = await upsertAdminTestTranslations(
        selectedTestDetail.id,
        translationLocale,
        {
          title,
          description: translationForm.description.trim() || null,
          questions: questionsPayload,
        }
      );
      setTranslationForm(buildTranslationForm(selectedTestDetail, saved));
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setSavingTranslations(false);
    }
  };

  const handleAutoTranslate = async () => {
    if (!selectedTestDetail) {
      return;
    }
    setAutoTranslating(true);
    setError(null);
    try {
      const savedByLocale = await autoTranslateAllAdminTest(selectedTestDetail.id);
      const currentLocaleSaved = savedByLocale.find(
        (item) => item.locale === translationLocale
      );
      if (currentLocaleSaved) {
        setTranslationForm(buildTranslationForm(selectedTestDetail, currentLocaleSaved));
      } else {
        await loadTranslations(selectedTestDetail, translationLocale);
      }
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setAutoTranslating(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("Insights tests")}
        subtitle={t("Full management of tests, questions, and options.")}
      />

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">
          {t("Create new test")}
        </h2>
        <form className="grid gap-3 lg:grid-cols-2" onSubmit={handleCreateTest}>
          <Input
            label={t("Title")}
            value={createTitle}
            onChange={(event) => setCreateTitle(event.target.value)}
            required
          />
          <Select
            label={t("Test type")}
            value={createType}
            options={testTypeOptions.filter((item) => item.value)}
            onValueChange={(value) => setCreateType(value as TestType)}
          />
          <Select
            label={t("Scoring")}
            value={createScoring}
            options={scoringOptions}
            onValueChange={(value) => setCreateScoring(value as TestScoringStrategy)}
          />
          <Select
            label={t("Status")}
            value={createActive}
            options={[
              { value: "true", label: t("ACTIVE") },
              { value: "false", label: t("INACTIVE") },
            ]}
            onValueChange={setCreateActive}
          />
          <div className="lg:col-span-2">
            <Textarea
              label={t("Description")}
              value={createDescription}
              onChange={(event) => setCreateDescription(event.target.value)}
            />
          </div>
          <div>
            <Button
              type="submit"
              size="sm"
              loading={creatingTest}
              loadingText={t("Creating")}
            >
              {t("Create test")}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="grid gap-3 p-5 lg:grid-cols-[1fr,240px,200px]">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("Search by title or description")}
        />
        <Select
          value={typeFilter}
          options={testTypeOptions}
          onValueChange={setTypeFilter}
        />
        <Select
          value={statusFilter}
          options={statusOptions}
          onValueChange={setStatusFilter}
        />
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard
          label={t("Total tests")}
          value={formatNumber(filteredTests.length)}
          trend="neutral"
          trendLabel={t("Current filters")}
        />
        <AdminStatCard
          label={t("Active tests")}
          value={formatNumber(activeCount)}
          trend="neutral"
          trendLabel={t("Current filters")}
        />
        <AdminStatCard
          label={t("Inactive tests")}
          value={formatNumber(Math.max(filteredTests.length - activeCount, 0))}
          trend="neutral"
          trendLabel={t("Current filters")}
        />
      </div>

      {loading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">{t("Loading tests...")}</p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-3 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">
            {t("Unable to load tests")}
          </p>
          <p className="text-sm text-muted">{t(error.message)}</p>
          <Button size="sm" variant="outline" onClick={() => void loadTests()}>
            {t("Try again")}
          </Button>
        </Card>
      ) : null}

      {!loading && !error ? (
        <AdminTable
          columns={[
            { key: "title", label: t("Title") },
            { key: "type", label: t("Type") },
            { key: "strategy", label: t("Scoring") },
            { key: "status", label: t("Status") },
            { key: "updatedAt", label: t("Updated at") },
            { key: "actions", label: t("Actions"), align: "right" },
          ]}
          rows={rows}
          emptyLabel={t("No tests found")}
        />
      ) : null}

      {detailLoading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">{t("Loading test details...")}</p>
        </Card>
      ) : null}

      {selectedTestDetail ? (
        <Card className="space-y-5 border-accent/30 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              {t("Test management: {title}", { title: selectedTestDetail.title })}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setSelectedTestId(null)}>
              {t("Close")}
            </Button>
          </div>

          <form className="grid gap-3 lg:grid-cols-2" onSubmit={handleUpdateTest}>
            <Input
              label={t("Title")}
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              required
            />
            <Select
              label={t("Test type")}
              value={editType}
              options={testTypeOptions.filter((item) => item.value)}
              onValueChange={(value) => setEditType(value as TestType)}
            />
            <Select
              label={t("Scoring")}
              value={editScoring}
              options={scoringOptions}
              onValueChange={(value) => setEditScoring(value as TestScoringStrategy)}
            />
            <Select
              label={t("Status")}
              value={editActive}
              options={[
                { value: "true", label: t("ACTIVE") },
                { value: "false", label: t("INACTIVE") },
              ]}
              onValueChange={setEditActive}
            />
            <div className="lg:col-span-2">
              <Textarea
                label={t("Description")}
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="sm"
                loading={updatingTest}
                loadingText={t("Saving")}
              >
                {t("Save test")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={handleDeleteTest}
                loading={deletingTest}
                loadingText={t("Deleting")}
              >
                {t("Delete test")}
              </Button>
            </div>
          </form>

          <Card className="space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-foreground">
                {t("Translations")}
              </h3>
              <div className="w-full max-w-[220px]">
                <Select
                  value={translationLocale}
                  options={translationLocaleOptions}
                  onValueChange={(value) =>
                    setTranslationLocale(value as TestTranslationLocale)
                  }
                />
              </div>
            </div>

            {translationLoading ? (
              <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-border/60 p-3">
                <Loader size="sm" />
                <p className="text-sm text-muted">
                  {t("Loading translations...")}
                </p>
              </div>
            ) : translationForm ? (
              <div className="space-y-4">
                <div className="grid gap-3 lg:grid-cols-2">
                  <Input
                    label={t("Translated title")}
                    value={translationForm.title}
                    onChange={(event) =>
                      handleTranslationTitleChange(event.target.value)
                    }
                    required
                  />
                  <Textarea
                    label={t("Translated description")}
                    value={translationForm.description}
                    onChange={(event) =>
                      handleTranslationDescriptionChange(event.target.value)
                    }
                  />
                </div>

                <div className="space-y-3">
                  {selectedTestDetail.questions.map((question) => (
                    <Card key={`translation-${question.id}`} className="space-y-3 p-3">
                      <p className="text-xs text-subtle">
                        #{question.position} - {question.question}
                      </p>
                      <Textarea
                        label={t("Translated question")}
                        value={
                          translationForm.questions[question.id]?.questionText ?? ""
                        }
                        onChange={(event) =>
                          handleTranslationQuestionChange(
                            question.id,
                            event.target.value
                          )
                        }
                      />
                      <div className="grid gap-2 lg:grid-cols-2">
                        {question.options.map((option) => (
                          <Input
                            key={`translation-${question.id}-${option.id}`}
                            label={t("Option: {label}", { label: option.label })}
                            value={
                              translationForm.questions[question.id]?.options[
                                option.id
                              ] ?? ""
                            }
                            onChange={(event) =>
                              handleTranslationOptionChange(
                                question.id,
                                option.id,
                                event.target.value
                              )
                            }
                          />
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleAutoTranslate()}
                      loading={autoTranslating}
                      loadingText={t("Translating all")}
                      disabled={savingTranslations}
                    >
                      {t("Auto translate all languages")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void handleSaveTranslations()}
                      loading={savingTranslations}
                      loadingText={t("Saving")}
                      disabled={autoTranslating}
                    >
                      {t("Save translations")}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">{t("No translation data available.")}</p>
            )}
          </Card>

          <Card className="space-y-3 p-4">
            <h3 className="text-base font-semibold text-foreground">
              {t("Create question")}
            </h3>
            <form className="grid gap-3 lg:grid-cols-5" onSubmit={handleCreateQuestion}>
              <Input
                label={t("Question")}
                value={questionText}
                onChange={(event) => setQuestionText(event.target.value)}
                required
              />
              <Input
                label={t("Position")}
                type="number"
                min={1}
                value={questionPosition}
                onChange={(event) => setQuestionPosition(event.target.value)}
                required
              />
              <Select
                label={t("Type")}
                value={questionType}
                options={questionTypeOptions}
                onValueChange={setQuestionType}
              />
              <Select
                label={t("Required")}
                value={questionRequired}
                options={[
                  { value: "true", label: t("Yes") },
                  { value: "false", label: t("No") },
                ]}
                onValueChange={setQuestionRequired}
              />
              <Input
                label={t("Max selections")}
                type="number"
                min={1}
                value={questionMaxSelections}
                onChange={(event) => setQuestionMaxSelections(event.target.value)}
                disabled={questionType !== "MULTI"}
              />
              <div className="lg:col-span-5">
                <Button
                  type="submit"
                  size="sm"
                  loading={creatingQuestion}
                  loadingText={t("Creating")}
                >
                  {t("Create question")}
                </Button>
              </div>
            </form>
          </Card>

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              {t("Questions and options")}
            </h3>
            {selectedTestDetail.questions.length === 0 ? (
              <Card className="p-4 text-sm text-muted">
                {t("No questions available.")}
              </Card>
            ) : (
              selectedTestDetail.questions.map((question) => (
                <Card key={question.id} className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        #{question.position} - {question.question}
                      </p>
                      <p className="text-xs text-subtle">
                        {t(
                          "Type: {type} | Required: {required} | Max selections: {max}",
                          {
                            type: resolveQuestionTypeLabel(question.questionType),
                            required: question.required ? t("Yes") : t("No"),
                            max: String(question.maxSelections ?? "-"),
                          }
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          void handleEditQuestion(
                            question.id,
                            question.question,
                            question.position,
                            question.required,
                            question.questionType,
                            question.maxSelections
                          )
                        }
                      >
                        {t("Edit")}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void handleDeleteQuestion(question.id)}
                      >
                        {t("Delete")}
                      </Button>
                    </div>
                  </div>

                  <AdminTable
                    columns={[
                      { key: "label", label: t("Option") },
                      { key: "weight", label: t("Weight") },
                      { key: "actions", label: t("Actions"), align: "right" },
                    ]}
                    rows={question.options.map((option) => ({
                      id: option.id,
                      label: option.label,
                      weight: String(option.weight),
                      actions: (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              void handleEditOption(
                                question.id,
                                option.id,
                                option.label,
                                option.weight
                              )
                            }
                          >
                            {t("Edit")}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => void handleDeleteOption(question.id, option.id)}
                          >
                            {t("Delete")}
                          </Button>
                        </div>
                      ),
                    }))}
                    emptyLabel={t("No options")}
                  />

                  <div className="grid gap-2 lg:grid-cols-[1fr,160px,auto]">
                    <Input
                      label={t("New option")}
                      value={optionLabel}
                      onChange={(event) => setOptionLabel(event.target.value)}
                    />
                    <Input
                      label={t("Weight")}
                      type="number"
                      value={optionWeight}
                      onChange={(event) => setOptionWeight(event.target.value)}
                    />
                    <div className="flex items-end">
                      <Button
                        size="sm"
                        onClick={() => void handleCreateOption(question.id)}
                        loading={creatingOptionForQuestionId === question.id}
                        loadingText={t("Creating")}
                        disabled={!optionLabel.trim()}
                      >
                        {t("Add option")}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      ) : null}
    </div>
  );
};
