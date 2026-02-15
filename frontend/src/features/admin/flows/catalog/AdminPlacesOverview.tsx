"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/buttons/Button";
import { Card } from "@/components/elements/Card";
import { Input } from "@/components/elements/Input";
import { Loader } from "@/components/elements/Loader";
import { Select } from "@/components/elements/Select";
import { Textarea } from "@/components/elements/Textarea";
import { formatDateTime, formatNumber } from "@/features/admin/lib/formatters";
import { AdminTable } from "@/features/admin/sections/AdminTable";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";
import { useT } from "@/hooks";
import {
  createAdminPlace,
  createPlaceAffiliation,
  deleteAdminPlace,
  deletePlaceAffiliation,
  getAdminCategories,
  getAdminPlace,
  getAdminPlaces,
  getPlaceAffiliations,
  updateAdminPlace,
  updatePlaceAffiliation,
} from "@/services/admin";
import type { ApiError } from "@/types/api";
import type {
  AffiliationLinkResponse,
  CatalogSource,
  CategoryResponse,
  PlaceDetailResponse,
  PlaceSummaryResponse,
} from "@/types/catalog";
import type { PageResponse } from "@/types/shared";

const SOURCE_OPTIONS: Array<{ value: "" | CatalogSource; labelKey: string }> = [
  { value: "", labelKey: "All sources" },
  { value: "MANUAL", labelKey: "Manual" },
  { value: "API", labelKey: "API" },
  { value: "GOOGLE", labelKey: "Google" },
  { value: "GETYOURGUIDE", labelKey: "GetYourGuide" },
  { value: "VIATOR", labelKey: "Viator" },
  { value: "MUSEMENT", labelKey: "Musement" },
  { value: "CIVITATIS", labelKey: "Civitatis" },
  { value: "TIQETS", labelKey: "Tiqets" },
];

const parseOptionalNumber = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
};

const mapSourceToOption = (source: CatalogSource) =>
  SOURCE_OPTIONS.find((option) => option.value === source)?.value ?? "MANUAL";

export const AdminPlacesOverview = () => {
  const { t } = useT();

  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const [response, setResponse] = useState<PageResponse<PlaceSummaryResponse> | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);

  const [queryDraft, setQueryDraft] = useState("");
  const [queryFilter, setQueryFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedPlaceDetail, setSelectedPlaceDetail] = useState<PlaceDetailResponse | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [source, setSource] = useState("MANUAL");
  const [saving, setSaving] = useState(false);

  const [affiliations, setAffiliations] = useState<AffiliationLinkResponse[]>([]);
  const [affiliationUrl, setAffiliationUrl] = useState("");
  const [affiliationProvider, setAffiliationProvider] = useState("");
  const [creatingAffiliation, setCreatingAffiliation] = useState(false);

  const sourceOptions = useMemo(
    () =>
      SOURCE_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t]
  );

  const sourceFormOptions = useMemo(
    () =>
      SOURCE_OPTIONS.filter((option) => option.value !== "").map((option) => ({
        value: option.value,
        label: t(option.labelKey),
      })),
    [t]
  );

  const resolveSourceLabel = useCallback(
    (value: CatalogSource) =>
      t(SOURCE_OPTIONS.find((option) => option.value === value)?.labelKey ?? value),
    [t]
  );

  const categoryOptions = useMemo(
    () => [
      { value: "", label: t("All categories") },
      ...categories.map((category) => ({ value: category.id, label: category.name })),
    ],
    [categories, t]
  );

  const formCategoryOptions = useMemo(
    () => [
      { value: "", label: t("No category") },
      ...categories.map((category) => ({ value: category.id, label: category.name })),
    ],
    [categories, t]
  );

  const applyPlaceToForm = useCallback((place: PlaceDetailResponse) => {
    setName(place.name);
    setDescription(place.description ?? "");
    setLat(place.latitude != null ? String(place.latitude) : "");
    setLng(place.longitude != null ? String(place.longitude) : "");
    setCategoryId(place.category?.id ?? "");
    setSource(mapSourceToOption(place.source));
  }, []);

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setLat("");
    setLng("");
    setCategoryId("");
    setSource("MANUAL");
  }, []);

  const loadCategories = useCallback(async () => {
    const categoriesPage = await getAdminCategories({ page: 0, size: 200 });
    setCategories(categoriesPage.content);
  }, []);

  const loadPlaces = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const places = await getAdminPlaces({
        page,
        size: 20,
        q: queryFilter || undefined,
        categoryId: categoryFilter || undefined,
        source: (sourceFilter || undefined) as CatalogSource | undefined,
      });
      setResponse(places);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, page, queryFilter, sourceFilter]);

  const loadSelectedPlace = useCallback(async (placeId: string) => {
    setDetailLoading(true);
    setError(null);

    try {
      const [detail, links] = await Promise.all([
        getAdminPlace(placeId),
        getPlaceAffiliations(placeId),
      ]);
      setSelectedPlaceDetail(detail);
      setAffiliations(links);
      applyPlaceToForm(detail);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setDetailLoading(false);
    }
  }, [applyPlaceToForm]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadPlaces();
  }, [loadPlaces]);

  useEffect(() => {
    if (!selectedPlaceId) {
      setSelectedPlaceDetail(null);
      setAffiliations([]);
      return;
    }

    void loadSelectedPlace(selectedPlaceId);
  }, [loadSelectedPlace, selectedPlaceId]);

  const rows = useMemo(
    () =>
      (response?.content ?? []).map((place) => ({
        id: place.id,
        name: place.name,
        category: place.category?.name ?? "-",
        source: resolveSourceLabel(place.source),
        coordinates:
          place.latitude != null && place.longitude != null
            ? `${place.latitude}, ${place.longitude}`
            : "-",
        actions: (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedPlaceId(place.id)}
            >
              {t("Manage")}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() =>
                void (async () => {
                  const confirmed = window.confirm(t("Confirm place deletion?"));
                  if (!confirmed) {
                    return;
                  }

                  setError(null);
                  try {
                    await deleteAdminPlace(place.id);
                    if (selectedPlaceId === place.id) {
                      setSelectedPlaceId(null);
                      resetForm();
                    }
                    await loadPlaces();
                  } catch (requestError) {
                    setError(requestError as ApiError);
                  }
                })()
              }
            >
              {t("Delete")}
            </Button>
          </div>
        ),
      })),
    [loadPlaces, resetForm, resolveSourceLabel, response, selectedPlaceId, t]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      latitude: parseOptionalNumber(lat),
      longitude: parseOptionalNumber(lng),
      categoryId: categoryId || null,
      source: source as CatalogSource,
    };

    try {
      if (selectedPlaceId) {
        await updateAdminPlace(selectedPlaceId, payload);
        await loadSelectedPlace(selectedPlaceId);
      } else {
        await createAdminPlace(payload);
        resetForm();
      }
      await loadPlaces();
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAffiliation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPlaceId) {
      return;
    }

    setCreatingAffiliation(true);
    setError(null);

    try {
      await createPlaceAffiliation(selectedPlaceId, {
        url: affiliationUrl.trim(),
        provider: affiliationProvider.trim() || null,
      });
      const links = await getPlaceAffiliations(selectedPlaceId);
      setAffiliations(links);
      setAffiliationUrl("");
      setAffiliationProvider("");
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setCreatingAffiliation(false);
    }
  };

  const handleUpdateAffiliation = async (affiliation: AffiliationLinkResponse) => {
    if (!selectedPlaceId) {
      return;
    }

    const nextUrl = window.prompt(t("Affiliation URL"), affiliation.url);
    if (!nextUrl || !nextUrl.trim()) {
      return;
    }

    const nextProvider = window.prompt(
      t("Provider (optional)"),
      affiliation.provider ?? ""
    );

    setError(null);
    try {
      await updatePlaceAffiliation(selectedPlaceId, affiliation.id, {
        url: nextUrl.trim(),
        provider: nextProvider?.trim() || null,
      });
      const links = await getPlaceAffiliations(selectedPlaceId);
      setAffiliations(links);
    } catch (requestError) {
      setError(requestError as ApiError);
    }
  };

  const handleDeleteAffiliation = async (affiliation: AffiliationLinkResponse) => {
    if (!selectedPlaceId) {
      return;
    }

    const confirmed = window.confirm(t("Confirm affiliation deletion?"));
    if (!confirmed) {
      return;
    }

    setError(null);
    try {
      await deletePlaceAffiliation(selectedPlaceId, affiliation.id);
      const links = await getPlaceAffiliations(selectedPlaceId);
      setAffiliations(links);
    } catch (requestError) {
      setError(requestError as ApiError);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("Places")}
        subtitle={t("Manage catalog places with affiliation links.")}
      />

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">
          {t("List filters")}
        </h2>
        <form
          className="grid gap-3 lg:grid-cols-[1fr,260px,220px,auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(0);
            setQueryFilter(queryDraft.trim());
          }}
        >
          <Input
            value={queryDraft}
            onChange={(event) => setQueryDraft(event.target.value)}
            placeholder={t("Search by name or text")}
          />
          <Select
            value={categoryFilter}
            options={categoryOptions}
            onValueChange={(value) => {
              setCategoryFilter(value);
              setPage(0);
            }}
          />
          <Select
            value={sourceFilter}
            options={sourceOptions}
            onValueChange={(value) => {
              setSourceFilter(value);
              setPage(0);
            }}
          />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm">
              {t("Apply")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setQueryDraft("");
                setQueryFilter("");
                setCategoryFilter("");
                setSourceFilter("");
                setPage(0);
              }}
            >
              {t("Reset")}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">
          {selectedPlaceId ? t("Edit place") : t("Create place")}
        </h2>
        <form className="grid gap-3 lg:grid-cols-2" onSubmit={handleSubmit}>
          <Input
            label={t("Name")}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <Select
            label={t("Source")}
            value={source}
            options={sourceFormOptions}
            onValueChange={setSource}
          />
          <Select
            label={t("Category")}
            value={categoryId}
            options={formCategoryOptions}
            onValueChange={setCategoryId}
          />
          <Input
            label={t("Latitude")}
            value={lat}
            onChange={(event) => setLat(event.target.value)}
          />
          <Input
            label={t("Longitude")}
            value={lng}
            onChange={(event) => setLng(event.target.value)}
          />
          <div className="lg:col-span-2">
            <Textarea
              label={t("Description")}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              loading={saving}
              loadingText={t("Saving")}
            >
              {selectedPlaceId ? t("Save changes") : t("Create place")}
            </Button>
            {selectedPlaceId ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedPlaceId(null);
                  resetForm();
                }}
              >
                {t("Cancel edit")}
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      {selectedPlaceDetail ? (
        <Card className="space-y-4 border-accent/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              {t("Selected place: {name}", { name: selectedPlaceDetail.name })}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setSelectedPlaceId(null)}>
              {t("Close details")}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">{t("ID")}:</span>{" "}
              {selectedPlaceDetail.id}
            </p>
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">{t("Created at")}:</span>{" "}
              {formatDateTime(selectedPlaceDetail.createdAt)}
            </p>
            <p className="text-sm text-muted md:col-span-2">
              <span className="font-semibold text-foreground">{t("Address")}:</span>{" "}
              {selectedPlaceDetail.address ?? "-"}
            </p>
          </div>

          <Card className="space-y-3 p-4">
            <h3 className="text-sm font-semibold text-foreground">
              {t("Affiliations")}
            </h3>
            <form className="grid gap-3 lg:grid-cols-[1fr,240px,auto]" onSubmit={handleCreateAffiliation}>
              <Input
                label={t("URL")}
                value={affiliationUrl}
                onChange={(event) => setAffiliationUrl(event.target.value)}
                required
              />
              <Input
                label={t("Provider")}
                value={affiliationProvider}
                onChange={(event) => setAffiliationProvider(event.target.value)}
                placeholder={t("Optional")}
              />
              <div className="flex items-end">
                <Button
                  type="submit"
                  size="sm"
                  loading={creatingAffiliation}
                  loadingText={t("Creating")}
                >
                  {t("Add link")}
                </Button>
              </div>
            </form>

            <AdminTable
              columns={[
                { key: "url", label: t("URL") },
                { key: "provider", label: t("Provider") },
                { key: "createdAt", label: t("Created at") },
                { key: "actions", label: t("Actions"), align: "right" },
              ]}
              rows={affiliations.map((affiliation) => ({
                id: affiliation.id,
                url: affiliation.url,
                provider: affiliation.provider ?? "-",
                createdAt: formatDateTime(affiliation.createdAt),
                actions: (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void handleUpdateAffiliation(affiliation)}
                    >
                      {t("Edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => void handleDeleteAffiliation(affiliation)}
                    >
                      {t("Delete")}
                    </Button>
                  </div>
                ),
              }))}
              emptyLabel={t("No affiliation links")}
            />
          </Card>
        </Card>
      ) : null}

      <Card className="p-5">
        <p className="text-sm text-subtle">
          {t("Total places: {count}", {
            count: formatNumber(response?.totalElements ?? 0),
          })}
        </p>
      </Card>

      {loading || detailLoading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">
            {detailLoading ? t("Loading place details...") : t("Loading places...")}
          </p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-3 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">{t("Unable to load places")}</p>
          <p className="text-sm text-muted">{t(error.message)}</p>
          <Button size="sm" variant="outline" onClick={() => void loadPlaces()}>
            {t("Try again")}
          </Button>
        </Card>
      ) : null}

      {!loading && !error ? (
        <>
          <AdminTable
            columns={[
              { key: "name", label: t("Name") },
              { key: "category", label: t("Category") },
              { key: "source", label: t("Source") },
              { key: "coordinates", label: t("Coordinates") },
              { key: "actions", label: t("Actions"), align: "right" },
            ]}
            rows={rows}
            emptyLabel={t("No places")}
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-subtle">
              {t("Page {page} of {total}", {
                page: (response?.number ?? 0) + 1,
                total: Math.max(response?.totalPages ?? 1, 1),
              })}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={(response?.number ?? 0) <= 0}
              >
                {t("Previous")}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => current + 1)}
                disabled={Boolean(response?.last ?? true)}
              >
                {t("Next")}
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
