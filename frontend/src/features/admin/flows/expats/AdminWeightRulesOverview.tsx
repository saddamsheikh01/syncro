"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Loader } from "@/components/elements/Loader";
import { Modal } from "@/components/ui/Modal";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { AdminTable } from "@/features/admin/sections/AdminTable";
import { useT } from "@/hooks";
import {
  adminCreateWeightRule,
  adminGetWeightRules,
  adminUpdateWeightRule,
} from "@/services/admin";
import type { ApiError } from "@/types/api";
import type { AdminWeightRuleResponse } from "@/types/adminExpats";

const MACRO_KEYS = [
  "costo_vita",
  "mercato_immobiliare",
  "potere_economico",
  "qualita_vita",
  "opportunita_lavorative",
  "integrazione_sociale",
] as const;

const emptyWeights = (): Record<string, number> =>
  Object.fromEntries(MACRO_KEYS.map((k) => [k, 0])) as Record<string, number>;

export const AdminWeightRulesOverview = () => {
  const { t } = useT();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [rules, setRules] = useState<AdminWeightRuleResponse[]>([]);
  const [creating, setCreating] = useState(false);
  const [questionKey, setQuestionKey] = useState("");
  const [answerValue, setAnswerValue] = useState("");
  const [weights, setWeights] = useState<Record<string, number>>(emptyWeights());
  const [editingRule, setEditingRule] = useState<AdminWeightRuleResponse | null>(null);
  const [editWeights, setEditWeights] = useState<Record<string, number>>(emptyWeights());
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetWeightRules();
      setRules(data);
    } catch (e) {
      setError(e as ApiError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionKey.trim() || !answerValue.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await adminCreateWeightRule({
        questionKey: questionKey.trim(),
        answerValue: answerValue.trim(),
        weightAdjustments: { ...weights },
      });
      setQuestionKey("");
      setAnswerValue("");
      setWeights(emptyWeights());
      await load();
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setCreating(false);
    }
  };

  const toggleRule = useCallback(
    async (r: AdminWeightRuleResponse) => {
      setError(null);
      try {
        await adminUpdateWeightRule(r.id, { active: !r.active });
        await load();
      } catch (err) {
        setError(err as ApiError);
      }
    },
    [load]
  );

  const openEditRule = useCallback((r: AdminWeightRuleResponse) => {
    setEditingRule(r);
    const w = emptyWeights();
    for (const k of MACRO_KEYS) {
      w[k] = r.weightAdjustments?.[k] ?? 0;
    }
    setEditWeights(w);
  }, []);

  const handleSaveEdit = async () => {
    if (!editingRule) return;
    setSavingEdit(true);
    setError(null);
    try {
      await adminUpdateWeightRule(editingRule.id, { weightAdjustments: { ...editWeights } });
      setEditingRule(null);
      await load();
    } catch (err) {
      setError(err as ApiError);
    } finally {
      setSavingEdit(false);
    }
  };

  const rows = useMemo(
    () =>
      rules.map((r) => ({
        id: r.id,
        qk: r.questionKey,
        av: r.answerValue,
        active: r.active ? t("Yes") : t("No"),
        w: MACRO_KEYS.map((k) => `${k}:${r.weightAdjustments?.[k] ?? 0}`).join(" "),
        actions: (
          <div className="flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => openEditRule(r)}>
              {t("Edit")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => void toggleRule(r)}>
              {r.active ? t("Deactivate") : t("Activate")}
            </Button>
          </div>
        ),
      })),
    [rules, t, toggleRule, openEditRule]
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Weight rules"
        subtitle="Funnel answer → macro weight adjustments (backend scoring)."
      />
      {error ? (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error.message}
        </Card>
      ) : null}

      <Card className="space-y-4 p-5">
        <h2 className="text-sm font-semibold">{t("Create rule")}</h2>
        <form className="space-y-4" onSubmit={handleCreate}>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label={t("Question key")}
              value={questionKey}
              onChange={(e) => setQuestionKey(e.target.value)}
              placeholder="motivation"
              required
            />
            <Input
              label={t("Answer value")}
              value={answerValue}
              onChange={(e) => setAnswerValue(e.target.value)}
              placeholder="career"
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {MACRO_KEYS.map((k) => (
              <Input
                key={k}
                label={k}
                type="number"
                value={String(weights[k] ?? 0)}
                onChange={(e) =>
                  setWeights((w) => ({ ...w, [k]: Number(e.target.value) || 0 }))
                }
              />
            ))}
          </div>
          <Button type="submit" size="sm" loading={creating}>
            {t("Create rule")}
          </Button>
        </form>
      </Card>

      <Modal
        open={editingRule != null}
        onClose={() => setEditingRule(null)}
        title={t("Edit weight rule")}
        description={
          editingRule
            ? `${editingRule.questionKey} / ${editingRule.answerValue}`
            : undefined
        }
        primaryAction={{
          label: t("Save changes"),
          onClick: () => void handleSaveEdit(),
          loading: savingEdit,
        }}
        secondaryAction={{
          label: t("Cancel"),
          onClick: () => setEditingRule(null),
          variant: "outline",
        }}
      >
        {editingRule ? (
          <div className="max-h-[50dvh] space-y-3 overflow-y-auto px-1 py-2">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {MACRO_KEYS.map((k) => (
                <Input
                  key={k}
                  label={k}
                  type="number"
                  value={String(editWeights[k] ?? 0)}
                  onChange={(e) =>
                    setEditWeights((w) => ({ ...w, [k]: Number(e.target.value) || 0 }))
                  }
                />
              ))}
            </div>
          </div>
        ) : null}
      </Modal>

      <Card className="p-5">
        {loading ? (
          <Loader />
        ) : (
          <AdminTable
            columns={[
              { key: "qk", label: t("Question key") },
              { key: "av", label: t("Answer value") },
              { key: "active", label: t("Active") },
              { key: "w", label: "Weights" },
              { key: "actions", label: t("Actions"), align: "right" },
            ]}
            rows={rows}
            emptyLabel={t("No weight rules")}
          />
        )}
      </Card>
    </div>
  );
};
