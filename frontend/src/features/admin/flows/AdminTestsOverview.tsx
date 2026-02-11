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
import {
  createAdminAnswerOption,
  createAdminQuestion,
  createAdminTest,
  deleteAdminAnswerOption,
  deleteAdminQuestion,
  deleteAdminTest,
  getAdminTest,
  getAdminTests,
  updateAdminAnswerOption,
  updateAdminQuestion,
  updateAdminTest,
} from "@/services/admin";
import type { ApiError } from "@/types/api";
import type {
  AdminTestDefinitionResponse,
  AdminTestDetailResponse,
  TestScoringStrategy,
  TestType,
} from "@/types/insights";

const TEST_TYPE_OPTIONS = [
  { value: "", label: "All types" },
  { value: "INTERESTS", label: "INTERESTS" },
  { value: "LIFESTYLE", label: "LIFESTYLE" },
  { value: "VALUES", label: "VALUES" },
  { value: "OBJECTIVES", label: "OBJECTIVES" },
  { value: "PSY", label: "PSY" },
  { value: "ASTRO", label: "ASTRO" },
  { value: "OTHER", label: "OTHER" },
];

const SCORING_OPTIONS = [
  { value: "SINGLE_SCORE", label: "SINGLE_SCORE" },
  { value: "CLUSTER_SCORE", label: "CLUSTER_SCORE" },
  { value: "AXES_SCORE", label: "AXES_SCORE" },
];

const STATUS_OPTIONS = [
  { value: "", label: "Status: all" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const QUESTION_TYPE_OPTIONS = [
  { value: "SINGLE", label: "SINGLE" },
  { value: "MULTI", label: "MULTI" },
];

export const AdminTestsOverview = () => {
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

  useEffect(() => {
    void loadTests();
  }, [loadTests]);

  useEffect(() => {
    if (!selectedTestId) {
      setSelectedTestDetail(null);
      return;
    }
    void loadTestDetail(selectedTestId);
  }, [loadTestDetail, selectedTestId]);

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
        type: test.testType,
        strategy: test.scoringStrategy,
        status: (
          <Badge tone={test.active ? "success" : "warning"}>
            {test.active ? "ACTIVE" : "INACTIVE"}
          </Badge>
        ),
        updatedAt: formatDateTime(test.updatedAt),
        actions: (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedTestId(test.id)}
          >
            Manage
          </Button>
        ),
      })),
    [filteredTests]
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

    const confirmed = window.confirm("Confirm test deletion?");
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

    const nextQuestion = window.prompt("Question text", currentQuestion);
    if (!nextQuestion || !nextQuestion.trim()) {
      return;
    }

    const nextPositionRaw = window.prompt("Position", String(currentPosition));
    const nextPosition = Math.max(1, Number(nextPositionRaw || currentPosition) || currentPosition);

    const nextRequired = window.confirm("Required question? OK = yes, Cancel = no");

    const nextTypeRaw = window.prompt("Question type (SINGLE/MULTI)", currentType);
    const nextType = nextTypeRaw === "MULTI" ? "MULTI" : "SINGLE";

    let nextMaxSelections = 1;
    if (nextType === "MULTI") {
      const raw = window.prompt(
        "Max selections",
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

    const confirmed = window.confirm("Confirm question deletion?");
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

    const nextLabel = window.prompt("Option label", currentLabel);
    if (!nextLabel || !nextLabel.trim()) {
      return;
    }

    const nextWeightRaw = window.prompt("Option weight", String(currentWeight));
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

    const confirmed = window.confirm("Confirm option deletion?");
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

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Insights tests"
        subtitle="Full management of tests, questions, and options."
      />

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">Create new test</h2>
        <form className="grid gap-3 lg:grid-cols-2" onSubmit={handleCreateTest}>
          <Input
            label="Title"
            value={createTitle}
            onChange={(event) => setCreateTitle(event.target.value)}
            required
          />
          <Select
            label="Test type"
            value={createType}
            options={TEST_TYPE_OPTIONS.filter((item) => item.value)}
            onValueChange={(value) => setCreateType(value as TestType)}
          />
          <Select
            label="Scoring"
            value={createScoring}
            options={SCORING_OPTIONS}
            onValueChange={(value) => setCreateScoring(value as TestScoringStrategy)}
          />
          <Select
            label="Status"
            value={createActive}
            options={[
              { value: "true", label: "ACTIVE" },
              { value: "false", label: "INACTIVE" },
            ]}
            onValueChange={setCreateActive}
          />
          <div className="lg:col-span-2">
            <Textarea
              label="Description"
              value={createDescription}
              onChange={(event) => setCreateDescription(event.target.value)}
            />
          </div>
          <div>
            <Button type="submit" size="sm" loading={creatingTest} loadingText="Creating">
              Create test
            </Button>
          </div>
        </form>
      </Card>

      <Card className="grid gap-3 p-5 lg:grid-cols-[1fr,240px,200px]">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by title or description"
        />
        <Select
          value={typeFilter}
          options={TEST_TYPE_OPTIONS}
          onValueChange={setTypeFilter}
        />
        <Select
          value={statusFilter}
          options={STATUS_OPTIONS}
          onValueChange={setStatusFilter}
        />
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <AdminStatCard
          label="Total tests"
          value={formatNumber(filteredTests.length)}
          trend="neutral"
          trendLabel="Current filters"
        />
        <AdminStatCard
          label="Active tests"
          value={formatNumber(activeCount)}
          trend="neutral"
          trendLabel="Current filters"
        />
        <AdminStatCard
          label="Inactive tests"
          value={formatNumber(Math.max(filteredTests.length - activeCount, 0))}
          trend="neutral"
          trendLabel="Current filters"
        />
      </div>

      {loading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Loading tests...</p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-3 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">Unable to load tests</p>
          <p className="text-sm text-muted">{error.message}</p>
          <Button size="sm" variant="outline" onClick={() => void loadTests()}>
            Try again
          </Button>
        </Card>
      ) : null}

      {!loading && !error ? (
        <AdminTable
          columns={[
            { key: "title", label: "Title" },
            { key: "type", label: "Type" },
            { key: "strategy", label: "Scoring" },
            { key: "status", label: "Status" },
            { key: "updatedAt", label: "Updated at" },
            { key: "actions", label: "Actions", align: "right" },
          ]}
          rows={rows}
          emptyLabel="No tests found"
        />
      ) : null}

      {detailLoading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Loading test details...</p>
        </Card>
      ) : null}

      {selectedTestDetail ? (
        <Card className="space-y-5 border-accent/30 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              Test management: {selectedTestDetail.title}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setSelectedTestId(null)}>
              Close
            </Button>
          </div>

          <form className="grid gap-3 lg:grid-cols-2" onSubmit={handleUpdateTest}>
            <Input
              label="Title"
              value={editTitle}
              onChange={(event) => setEditTitle(event.target.value)}
              required
            />
            <Select
              label="Test type"
              value={editType}
              options={TEST_TYPE_OPTIONS.filter((item) => item.value)}
              onValueChange={(value) => setEditType(value as TestType)}
            />
            <Select
              label="Scoring"
              value={editScoring}
              options={SCORING_OPTIONS}
              onValueChange={(value) => setEditScoring(value as TestScoringStrategy)}
            />
            <Select
              label="Status"
              value={editActive}
              options={[
                { value: "true", label: "ACTIVE" },
                { value: "false", label: "INACTIVE" },
              ]}
              onValueChange={setEditActive}
            />
            <div className="lg:col-span-2">
              <Textarea
                label="Description"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" size="sm" loading={updatingTest} loadingText="Saving">
                Save test
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={handleDeleteTest}
                loading={deletingTest}
                loadingText="Deleting"
              >
                Delete test
              </Button>
            </div>
          </form>

          <Card className="space-y-3 p-4">
            <h3 className="text-base font-semibold text-foreground">Create question</h3>
            <form className="grid gap-3 lg:grid-cols-5" onSubmit={handleCreateQuestion}>
              <Input
                label="Question"
                value={questionText}
                onChange={(event) => setQuestionText(event.target.value)}
                required
              />
              <Input
                label="Position"
                type="number"
                min={1}
                value={questionPosition}
                onChange={(event) => setQuestionPosition(event.target.value)}
                required
              />
              <Select
                label="Type"
                value={questionType}
                options={QUESTION_TYPE_OPTIONS}
                onValueChange={setQuestionType}
              />
              <Select
                label="Required"
                value={questionRequired}
                options={[
                  { value: "true", label: "true" },
                  { value: "false", label: "false" },
                ]}
                onValueChange={setQuestionRequired}
              />
              <Input
                label="Max selections"
                type="number"
                min={1}
                value={questionMaxSelections}
                onChange={(event) => setQuestionMaxSelections(event.target.value)}
                disabled={questionType !== "MULTI"}
              />
              <div className="lg:col-span-5">
                <Button type="submit" size="sm" loading={creatingQuestion} loadingText="Creating">
                  Create question
                </Button>
              </div>
            </form>
          </Card>

          <div className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">Questions and options</h3>
            {selectedTestDetail.questions.length === 0 ? (
              <Card className="p-4 text-sm text-muted">No questions available.</Card>
            ) : (
              selectedTestDetail.questions.map((question) => (
                <Card key={question.id} className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        #{question.position} - {question.question}
                      </p>
                      <p className="text-xs text-subtle">
                        Type: {question.questionType} | Required: {String(question.required)} | Max selections: {question.maxSelections ?? "-"}
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
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => void handleDeleteQuestion(question.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  <AdminTable
                    columns={[
                      { key: "label", label: "Option" },
                      { key: "weight", label: "Weight" },
                      { key: "actions", label: "Actions", align: "right" },
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
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => void handleDeleteOption(question.id, option.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      ),
                    }))}
                    emptyLabel="No options"
                  />

                  <div className="grid gap-2 lg:grid-cols-[1fr,160px,auto]">
                    <Input
                      label="New option"
                      value={optionLabel}
                      onChange={(event) => setOptionLabel(event.target.value)}
                    />
                    <Input
                      label="Weight"
                      type="number"
                      value={optionWeight}
                      onChange={(event) => setOptionWeight(event.target.value)}
                    />
                    <div className="flex items-end">
                      <Button
                        size="sm"
                        onClick={() => void handleCreateOption(question.id)}
                        loading={creatingOptionForQuestionId === question.id}
                        loadingText="Creating"
                        disabled={!optionLabel.trim()}
                      >
                        Add option
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
