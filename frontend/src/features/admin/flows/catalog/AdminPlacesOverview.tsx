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

const SOURCE_OPTIONS = [
  { value: "", label: "Tutte le fonti" },
  { value: "MANUAL", label: "MANUAL" },
  { value: "API", label: "API" },
  { value: "GOOGLE", label: "GOOGLE" },
  { value: "GETYOURGUIDE", label: "GETYOURGUIDE" },
  { value: "VIATOR", label: "VIATOR" },
  { value: "MUSEMENT", label: "MUSEMENT" },
  { value: "CIVITATIS", label: "CIVITATIS" },
  { value: "TIQETS", label: "TIQETS" },
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

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "Tutte le categorie" },
      ...categories.map((category) => ({ value: category.id, label: category.name })),
    ],
    [categories]
  );

  const formCategoryOptions = useMemo(
    () => [
      { value: "", label: "Nessuna categoria" },
      ...categories.map((category) => ({ value: category.id, label: category.name })),
    ],
    [categories]
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
        source: place.source,
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
              Gestisci
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() =>
                void (async () => {
                  const confirmed = window.confirm("Confermi eliminazione luogo?");
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
              Elimina
            </Button>
          </div>
        ),
      })),
    [loadPlaces, resetForm, response, selectedPlaceId]
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

    const nextUrl = window.prompt("URL affiliazione", affiliation.url);
    if (!nextUrl || !nextUrl.trim()) {
      return;
    }

    const nextProvider = window.prompt(
      "Provider (opzionale)",
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

    const confirmed = window.confirm("Confermi eliminazione affiliazione?");
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
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Places</h1>
        <p className="mt-1 text-sm text-muted">
          CRUD luoghi catalogo con gestione affiliazioni.
        </p>
      </div>

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">Filtri lista</h2>
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
            placeholder="Cerca per nome o testo"
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
            options={SOURCE_OPTIONS}
            onValueChange={(value) => {
              setSourceFilter(value);
              setPage(0);
            }}
          />
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm">
              Applica
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
              Reset
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-base font-semibold text-foreground">
          {selectedPlaceId ? "Modifica luogo" : "Crea luogo"}
        </h2>
        <form className="grid gap-3 lg:grid-cols-2" onSubmit={handleSubmit}>
          <Input label="Nome" value={name} onChange={(event) => setName(event.target.value)} required />
          <Select
            label="Source"
            value={source}
            options={SOURCE_OPTIONS.filter((option) => option.value !== "")}
            onValueChange={setSource}
          />
          <Select
            label="Categoria"
            value={categoryId}
            options={formCategoryOptions}
            onValueChange={setCategoryId}
          />
          <Input label="Latitudine" value={lat} onChange={(event) => setLat(event.target.value)} />
          <Input label="Longitudine" value={lng} onChange={(event) => setLng(event.target.value)} />
          <div className="lg:col-span-2">
            <Textarea
              label="Descrizione"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" loading={saving} loadingText="Salvataggio">
              {selectedPlaceId ? "Salva modifiche" : "Crea luogo"}
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
                Annulla modifica
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      {selectedPlaceDetail ? (
        <Card className="space-y-4 border-accent/30 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">
              Luogo selezionato: {selectedPlaceDetail.name}
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setSelectedPlaceId(null)}>
              Chiudi dettaglio
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">ID:</span> {selectedPlaceDetail.id}
            </p>
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">Creato il:</span>{" "}
              {formatDateTime(selectedPlaceDetail.createdAt)}
            </p>
            <p className="text-sm text-muted md:col-span-2">
              <span className="font-semibold text-foreground">Indirizzo:</span>{" "}
              {selectedPlaceDetail.address ?? "-"}
            </p>
          </div>

          <Card className="space-y-3 p-4">
            <h3 className="text-sm font-semibold text-foreground">Affiliazioni</h3>
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
                placeholder="Opzionale"
              />
              <div className="flex items-end">
                <Button
                  type="submit"
                  size="sm"
                  loading={creatingAffiliation}
                  loadingText="Creazione"
                >
                  Aggiungi link
                </Button>
              </div>
            </form>

            <AdminTable
              columns={[
                { key: "url", label: "URL" },
                { key: "provider", label: "Provider" },
                { key: "createdAt", label: "Creato il" },
                { key: "actions", label: "Azioni", align: "right" },
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
                      Modifica
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => void handleDeleteAffiliation(affiliation)}
                    >
                      Elimina
                    </Button>
                  </div>
                ),
              }))}
              emptyLabel="Nessun link affiliazione"
            />
          </Card>
        </Card>
      ) : null}

      <Card className="p-5">
        <p className="text-sm text-subtle">
          Totale luoghi: {formatNumber(response?.totalElements ?? 0)}
        </p>
      </Card>

      {loading || detailLoading ? (
        <Card className="flex items-center gap-3 p-5">
          <Loader size="sm" />
          <p className="text-sm text-muted">
            {detailLoading ? "Caricamento dettaglio luogo..." : "Caricamento places..."}
          </p>
        </Card>
      ) : null}

      {error ? (
        <Card className="space-y-3 border-danger/30 p-5">
          <p className="text-sm font-semibold text-danger">Errore places</p>
          <p className="text-sm text-muted">{error.message}</p>
          <Button size="sm" variant="outline" onClick={() => void loadPlaces()}>
            Riprova
          </Button>
        </Card>
      ) : null}

      {!loading && !error ? (
        <>
          <AdminTable
            columns={[
              { key: "name", label: "Nome" },
              { key: "category", label: "Categoria" },
              { key: "source", label: "Source" },
              { key: "coordinates", label: "Coordinate" },
              { key: "actions", label: "Azioni", align: "right" },
            ]}
            rows={rows}
            emptyLabel="Nessun luogo"
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-subtle">
              Pagina {(response?.number ?? 0) + 1} di {Math.max(response?.totalPages ?? 1, 1)}
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={(response?.number ?? 0) <= 0}
              >
                Precedente
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((current) => current + 1)}
                disabled={Boolean(response?.last ?? true)}
              >
                Successiva
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
