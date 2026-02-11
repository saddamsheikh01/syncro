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
import {
  createAdminExperience,
  createExperienceAffiliation,
  deleteAdminExperience,
  deleteExperienceAffiliation,
  getAdminCategories,
  getAdminExperience,
  getAdminExperiences,
  getAdminPlaces,
  getExperienceAffiliations,
  updateAdminExperience,
  updateExperienceAffiliation,
} from "@/services/admin";
import type { ApiError } from "@/types/api";
import type {
  AffiliationLinkResponse,
  CatalogSource,
  CategoryResponse,
  ExperienceDetailResponse,
  ExperienceProvider,
  ExperienceSummaryResponse,
  PlaceSummaryResponse,
} from "@/types/catalog";
import type { PageResponse } from "@/types/shared";

const SOURCE_OPTIONS = [
  { value: "MANUAL", label: "MANUAL" },
  { value: "API", label: "API" },
  { value: "GOOGLE", label: "GOOGLE" },
  { value: "GETYOURGUIDE", label: "GETYOURGUIDE" },
  { value: "VIATOR", label: "VIATOR" },
  { value: "MUSEMENT", label: "MUSEMENT" },
  { value: "CIVITATIS", label: "CIVITATIS" },
  { value: "TIQETS", label: "TIQETS" },
];

const PROVIDER_OPTIONS = [
  { value: "", label: "No provider" },
  { value: "GETYOURGUIDE", label: "GETYOURGUIDE" },
  { value: "VIATOR", label: "VIATOR" },
  { value: "MUSEMENT", label: "MUSEMENT" },
  { value: "CIVITATIS", label: "CIVITATIS" },
  { value: "TIQETS", label: "TIQETS" },
  { value: "OTHER", label: "OTHER" },
];

const ACTIVE_OPTIONS = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
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

const parseOptionalInteger = (value: string): number | null => {
  const parsed = parseOptionalNumber(value);
  if (parsed == null) {
    return null;
  }
  return Math.round(parsed);
};

const mapSourceToOption = (source: CatalogSource) =>
  SOURCE_OPTIONS.find((option) => option.value === source)?.value ?? "MANUAL";

export const AdminExperiencesOverview = () => {
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const [response, setResponse] = useState<PageResponse<ExperienceSummaryResponse> | null>(null);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [places, setPlaces] = useState<PlaceSummaryResponse[]>([]);

  const [queryDraft, setQueryDraft] = useState("");
  const [queryFilter, setQueryFilter] = useState("");

  const [selectedExperienceId, setSelectedExperienceId] = useState<string | null>(null);
  const [selectedExperienceDetail, setSelectedExperienceDetail] =
    useState<ExperienceDetailResponse | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [source, setSource] = useState("MANUAL");
  const [provider, setProvider] = useState("");
  const [price, setPrice] = useState("");
  const [priceCurrency, setPriceCurrency] = useState("EUR");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [bookingUrl, setBookingUrl] = useState("");
  const [locationName, setLocationName] = useState("");
  const [isActive, setIsActive] = useState("true");
  const [saving, setSaving] = useState(false);

  const [affiliations, setAffiliations] = useState<AffiliationLinkResponse[]>([]);
  const [affiliationUrl, setAffiliationUrl] = useState("");
  const [affiliationProvider, setAffiliationProvider] = useState("");
  const [creatingAffiliation, setCreatingAffiliation] = useState(false);

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "No category" },
      ...categories.map((category) => ({ value: category.id, label: category.name })),
    ],
    [categories]
  );

  const placeOptions = useMemo(
    () => [
      { value: "", label: "No place" },
      ...places.map((place) => ({ value: place.id, label: place.name })),
    ],
    [places]
  );

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setCategoryId("");
    setPlaceId("");
    setSource("MANUAL");
    setProvider("");
    setPrice("");
    setPriceCurrency("EUR");
    setDurationMinutes("");
    setBookingUrl("");
    setLocationName("");
    setIsActive("true");
  }, []);

  const applyExperienceToForm = useCallback((experience: ExperienceDetailResponse) => {
    setName(experience.name);
    setDescription(experience.description ?? "");
    setCategoryId(experience.category?.id ?? "");
    setPlaceId(experience.place?.id ?? "");
    setSource(mapSourceToOption(experience.source));
    setProvider(experience.provider ?? "");
    setPrice(experience.price != null ? String(experience.price) : "");
    setPriceCurrency(experience.priceCurrency ?? "EUR");
    setDurationMinutes(
      experience.durationMinutes != null ? String(experience.durationMinutes) : ""
    );
    setBookingUrl(experience.bookingUrl ?? "");
    setLocationName(experience.locationName ?? "");
    setIsActive(experience.isActive ? "true" : "false");
  }, []);

  const loadReferenceData = useCallback(async () => {
    const [categoriesPage, placesPage] = await Promise.all([
      getAdminCategories({ page: 0, size: 200 }),
      getAdminPlaces({ page: 0, size: 200 }),
    ]);
    setCategories(categoriesPage.content);
    setPlaces(placesPage.content);
  }, []);

  const loadExperiences = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const experiences = await getAdminExperiences({
        page,
        size: 20,
        q: queryFilter || undefined,
      });
      setResponse(experiences);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setLoading(false);
    }
  }, [page, queryFilter]);

  const loadSelectedExperience = useCallback(async (experienceId: string) => {
    setDetailLoading(true);
    setError(null);

    try {
      const [detail, links] = await Promise.all([
        getAdminExperience(experienceId),
        getExperienceAffiliations(experienceId),
      ]);
      setSelectedExperienceDetail(detail);
      setAffiliations(links);
      applyExperienceToForm(detail);
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setDetailLoading(false);
    }
  }, [applyExperienceToForm]);

  useEffect(() => {
    void loadReferenceData();
  }, [loadReferenceData]);

  useEffect(() => {
    void loadExperiences();
  }, [loadExperiences]);

  useEffect(() => {
    if (!selectedExperienceId) {
      setSelectedExperienceDetail(null);
      setAffiliations([]);
      return;
    }

    void loadSelectedExperience(selectedExperienceId);
  }, [loadSelectedExperience, selectedExperienceId]);

  const rows = useMemo(
    () =>
      (response?.content ?? []).map((experience) => ({
        id: experience.id,
        name: experience.name,
        category: experience.category?.name ?? "-",
        place: experience.place?.name ?? "-",
        source: experience.source,
        provider: experience.provider ?? "-",
        active: experience.isActive ? "YES" : "NO",
        actions: (
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedExperienceId(experience.id)}
            >
              Gestisci
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() =>
                void (async () => {
                  const confirmed = window.confirm("Confirm experience deletion?");
                  if (!confirmed) {
                    return;
                  }

                  setError(null);
                  try {
                    await deleteAdminExperience(experience.id);
                    if (selectedExperienceId === experience.id) {
                      setSelectedExperienceId(null);
                      resetForm();
                    }
                    await loadExperiences();
                  } catch (requestError) {
                    setError(requestError as ApiError);
                  }
                })()
              }
            >
              Delete
            </Button>
          </div>
        ),
      })),
    [loadExperiences, resetForm, response, selectedExperienceId]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      categoryId: categoryId || null,
      placeId: placeId || null,
      source: source as CatalogSource,
      provider: (provider || null) as ExperienceProvider | null,
      price: parseOptionalNumber(price),
      priceCurrency: priceCurrency.trim() || null,
      durationMinutes: parseOptionalInteger(durationMinutes),
      bookingUrl: bookingUrl.trim() || null,
      locationName: locationName.trim() || null,
      isActive: isActive === "true",
    };

    try {
      if (selectedExperienceId) {
        await updateAdminExperience(selectedExperienceId, payload);
        await loadSelectedExperience(selectedExperienceId);
      } else {
        const created = await createAdminExperience(payload);
        setSelectedExperienceId(created.id);
      }
      await loadExperiences();
    } catch (requestError) {
      setError(requestError as ApiError);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAffiliation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedExperienceId) {
      return;
    }

    setCreatingAffiliation(true);
    setError(null);

    try {
      await createExperienceAffiliation(selectedExperienceId, {
        url: affiliationUrl.trim(),
        provider: affiliationProvider.trim() || null,
      });
      const links = await getExperienceAffiliations(selectedExperienceId);
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
    if (!selectedExperienceId) {
      return;
    }

    const nextUrl = window.prompt("Affiliation URL", affiliation.url);
    if (!nextUrl || !nextUrl.trim()) {
      return;
    }

    const nextProvider = window.prompt(
      "Provider (optional)",
      affiliation.provider ?? ""
    );

    setError(null);
    try {
      await updateExperienceAffiliation(selectedExperienceId, affiliation.id, {
        url: nextUrl.trim(),
        provider: nextProvider?.trim() || null,
      });
      const links = await getExperienceAffiliations(selectedExperienceId);
      setAffiliations(links);
    } catch (requestError) {
      setError(requestError as ApiError);
    }
  };

  const handleDeleteAffiliation = async (affiliation: AffiliationLinkResponse) => {
    if (!selectedExperienceId) {
      return;
    }

    const confirmed = window.confirm("Confirm affiliation deletion?");
    if (!confirmed) {
      return;
    }

    setError(null);
    try {
      await deleteExperienceAffiliation(selectedExperienceId, affiliation.id);
      const links = await getExperienceAffiliations(selectedExperienceId);
      setAffiliations(links);
    } catch (requestError) {
      setError(requestError as ApiError);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Experiences"
        subtitle="Manage catalog experiences with affiliation links."
      />

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">List filters</h2>
        <form
          className="grid gap-3 lg:grid-cols-[1fr,auto,auto]"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(0);
            setQueryFilter(queryDraft.trim());
          }}
        >
          <Input
            value={queryDraft}
            onChange={(event) => setQueryDraft(event.target.value)}
            placeholder="Search by title or description"
          />
          <Button type="submit" size="sm">
            Apply
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setQueryDraft("");
              setQueryFilter("");
              setPage(0);
            }}
          >
            Reset
          </Button>
        </form>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">
          {selectedExperienceId ? "Edit experience" : "Create experience"}
        </h2>

        <form className="grid gap-3 lg:grid-cols-2" onSubmit={handleSubmit}>
          <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} required />
          <Select label="Source" value={source} options={SOURCE_OPTIONS} onValueChange={setSource} />
          <Select
            label="Category"
            value={categoryId}
            options={categoryOptions}
            onValueChange={setCategoryId}
          />
          <Select label="Place" value={placeId} options={placeOptions} onValueChange={setPlaceId} />
          <Select
            label="Provider"
            value={provider}
            options={PROVIDER_OPTIONS}
            onValueChange={setProvider}
          />
          <Select
            label="Active"
            value={isActive}
            options={ACTIVE_OPTIONS}
            onValueChange={setIsActive}
          />
          <Input label="Price" value={price} onChange={(event) => setPrice(event.target.value)} />
          <Input
            label="Currency"
            value={priceCurrency}
            onChange={(event) => setPriceCurrency(event.target.value)}
          />
          <Input
            label="Duration (min)"
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
          />
          <Input
            label="Location name"
            value={locationName}
            onChange={(event) => setLocationName(event.target.value)}
          />
          <div className="lg:col-span-2">
            <Input
              label="Booking URL"
              value={bookingUrl}
              onChange={(event) => setBookingUrl(event.target.value)}
            />
          </div>
          <div className="lg:col-span-2">
            <Textarea
              label="Description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" loading={saving} loadingText="Saving">
              {selectedExperienceId ? "Save changes" : "Create experience"}
            </Button>
            {selectedExperienceId ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedExperienceId(null);
                  resetForm();
                }}
              >
                Cancel edit
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      {selectedExperienceDetail ? (
        <Card className="space-y-4 border-accent/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              Selected experience: {selectedExperienceDetail.name}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setSelectedExperienceId(null)}>
              Close details
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">ID:</span> {selectedExperienceDetail.id}
            </p>
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">Updated at:</span>{" "}
              {formatDateTime(selectedExperienceDetail.updatedAt)}
            </p>
          </div>

          <Card className="space-y-3 p-4">
            <h3 className="text-sm font-semibold text-foreground">Affiliations</h3>
            <form className="grid gap-3 lg:grid-cols-[1fr,240px,auto]" onSubmit={handleCreateAffiliation}>
              <Input
                label="URL"
                value={affiliationUrl}
                onChange={(event) => setAffiliationUrl(event.target.value)}
                required
              />
              <Input
                label="Provider"
                value={affiliationProvider}
                onChange={(event) => setAffiliationProvider(event.target.value)}
                placeholder="Optional"
              />
              <div className="flex items-end">
                <Button
                  type="submit"
                  size="sm"
                  loading={creatingAffiliation}
                  loadingText="Creating"
                >
                  Add link
                </Button>
              </div>
            </form>

            <AdminTable
              columns={[
                { key: "url", label: "URL" },
                { key: "provider", label: "Provider" },
                { key: "createdAt", label: "Created at" },
                { key: "actions", label: "Actions", align: "right" },
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
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => void handleDeleteAffiliation(affiliation)}
                    >
                      Delete
                    </Button>
                  </div>
                ),
              }))}
              emptyLabel="No affiliation links"
            />
          </Card>
        </Card>
      ) : null}

      <Card className="p-5">
        <p className="text-sm text-subtle">
          Total experiences: {formatNumber(response?.totalElements ?? 0)}
        </p>
      </Card>

      {loading || detailLoading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">
            {detailLoading
              ? "Loading experience details..."
              : "Loading experiences..."}
          </p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-3 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">Unable to load experiences</p>
          <p className="text-sm text-muted">{error.message}</p>
          <Button size="sm" variant="outline" onClick={() => void loadExperiences()}>
            Try again
          </Button>
        </Card>
      ) : null}

      {!loading && !error ? (
        <>
          <AdminTable
            columns={[
              { key: "name", label: "Name" },
              { key: "category", label: "Category" },
              { key: "place", label: "Place" },
              { key: "source", label: "Source" },
              { key: "provider", label: "Provider" },
              { key: "active", label: "Active" },
              { key: "actions", label: "Actions", align: "right" },
            ]}
            rows={rows}
            emptyLabel="No experiences"
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-subtle">
              Page {(response?.number ?? 0) + 1} of {Math.max(response?.totalPages ?? 1, 1)}
            </p>
            <div className="flex items-center gap-2">
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
          </div>
        </>
      ) : null}
    </div>
  );
};
