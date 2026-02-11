"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Loader } from "@/components/elements/Loader";
import { AdminTable } from "@/features/admin/sections/AdminTable";
import { formatDateTime, formatNumber } from "@/features/admin/lib/formatters";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from "@/services/admin";
import type { ApiError } from "@/types/api";
import type { CategoryResponse } from "@/types/catalog";
import type { PageResponse } from "@/types/shared";

export const AdminCategoriesOverview = () => {
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [response, setResponse] = useState<PageResponse<CategoryResponse> | null>(null);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminCategories({ page, size: 20 });
      setResponse(data);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setError(null);

    try {
      await createAdminCategory({ name: name.trim() });
      setName("");
      await loadCategories();
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (categoryId: string, currentName: string) => {
    const nextName = window.prompt("New category name", currentName);
    if (!nextName || !nextName.trim()) {
      return;
    }

    setError(null);
    try {
      await updateAdminCategory(categoryId, { name: nextName.trim() });
      await loadCategories();
    } catch (requestError) {
      setError(requestError as ApiError);
    }
  };

  const handleDelete = async (categoryId: string) => {
    const confirmed = window.confirm("Confirm category deletion?");
    if (!confirmed) {
      return;
    }

    setError(null);
    try {
      await deleteAdminCategory(categoryId);
      await loadCategories();
    } catch (requestError) {
      setError(requestError as ApiError);
    }
  };

  const rows = useMemo(
    () =>
      (response?.content ?? []).map((category) => ({
        id: category.id,
        name: category.name,
        createdAt: formatDateTime(category.createdAt),
        actions: (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => void handleUpdate(category.id, category.name)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => void handleDelete(category.id)}
            >
              Delete
            </Button>
          </div>
        ),
      })),
    [response]
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Categories"
        subtitle="Manage catalog categories."
      />

      <Card className="space-y-4 p-5">
        <form className="grid gap-3 lg:grid-cols-[1fr,auto]" onSubmit={handleCreate}>
          <Input
            label="Category name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <div className="flex items-end">
            <Button type="submit" size="sm" loading={creating} loadingText="Creating">
              Create category
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <p className="text-sm text-subtle">
          Total categories: {formatNumber(response?.totalElements ?? 0)}
        </p>
      </Card>

      {loading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">Loading categories...</p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-3 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">Unable to load categories</p>
          <p className="text-sm text-muted">{error.message}</p>
        </Card>
      ) : null}

      {!loading && !error ? (
        <>
          <AdminTable
            columns={[
              { key: "name", label: "Name" },
              { key: "createdAt", label: "Created at" },
              { key: "actions", label: "Actions", align: "right" },
            ]}
            rows={rows}
            emptyLabel="No categories"
          />

          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={(response?.number ?? 0) <= 0}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage((current) => current + 1)}
              disabled={Boolean(response?.last ?? true)}
            >
              Next
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
};
