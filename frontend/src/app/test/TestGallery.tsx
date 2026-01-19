import { Button } from "@/components/buttons/Button";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { Select } from "@/components/elements/Select";
import { Checkbox } from "@/components/elements/Checkbox";
import { Switch } from "@/components/elements/Switch";
import { DatePicker } from "@/components/elements/DatePicker";
import { TimePicker } from "@/components/elements/TimePicker";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/elements/Card";
import { Badge } from "@/components/elements/Badge";
import { Tag } from "@/components/elements/Tag";
import { Avatar } from "@/components/elements/Avatar";
import { Divider } from "@/components/elements/Divider";
import { Skeleton } from "@/components/elements/Skeleton";
import { EmptyState } from "@/components/elements/EmptyState";
import { ErrorState } from "@/components/elements/ErrorState";
import { Loader } from "@/components/elements/Loader";
import { Tabs } from "@/components/ui/Tabs";
import { TagPillSelectable } from "@/features/tags/elements/TagPillSelectable";
import { TagCloud } from "@/features/tags/lists/TagCloud";
import type { TagItem } from "@/features/tags/lists/MapTag";
import type { TagPillSelectableItem } from "@/features/tags/lists/MapTagPillSelectable";
import { SelectedTagsRow } from "@/features/tags/lists/SelectedTagsRow";
import { MatchScoreBadge } from "@/features/matches/elements/MatchScoreBadge";
import { MapMatchTypeChip } from "@/features/matches/lists/MapMatchTypeChip";
import { DistanceBadge } from "@/features/catalog/elements/DistanceBadge";
import { PlaceMetaRow } from "@/features/catalog/elements/PlaceMetaRow";
import { SectionHeader } from "@/features/home/sections/SectionHeader";
import { QuickActionTile } from "@/features/home/cards/QuickActionTile";
import { ForYouSectionHeader } from "@/features/home/sections/ForYouSectionHeader";
import { RecommendationRow } from "@/features/home/sections/RecommendationRow";
import { ZyraPromptChip } from "@/features/zyra/elements/ZyraPromptChip";
import { ZyraMatchOfDayCard } from "@/features/zyra/cards/ZyraMatchOfDayCard";
import { AdminStatCard } from "@/features/admin/cards/AdminStatCard";
import { AdminFormSection } from "@/features/admin/sections/AdminFormSection";
import { AdminEmptyState } from "@/features/admin/sections/AdminEmptyState";
import { MapPlaceListItem } from "@/features/catalog/lists/MapPlaceListItem";
import { MapExperienceListItem } from "@/features/catalog/lists/MapExperienceListItem";
import { AffiliationLinkBox } from "@/features/catalog/sections/AffiliationLinkBox";
import { PostHeader } from "@/features/social/elements/PostHeader";
import { PostCard } from "@/features/social/cards/PostCard";
import { MapChatListItem } from "@/features/social/lists/MapChatListItem";
import { MapTestListItem } from "@/features/tests/lists/MapTestListItem";
import type { FavoriteItemCardProps } from "@/features/favorites/cards/FavoriteItemCard";
import { MapFavoriteItemCard } from "@/features/favorites/lists/MapFavoriteItemCard";
import { MapSearchResultItem } from "@/features/search/lists/MapSearchResultItem";
import { ProfileSummaryCard } from "@/features/profile/cards/ProfileSummaryCard";
import type { MatchInsightItemProps } from "@/features/matches/elements/MatchInsightItem";
import { MatchInsightList } from "@/features/matches/sections/MatchInsightList";
import { ProfileInfoForm } from "@/features/profile/forms/ProfileInfoForm";
import { LanguagePicker } from "@/features/profile/forms/LanguagePicker";
import { VisibilitySelector } from "@/features/profile/forms/VisibilitySelector";
import type { VisibilityOptionChipProps } from "@/features/profile/elements/VisibilityOptionChip";
import { LanguageSelector } from "@/features/onboarding/forms/LanguageSelector";
import { ResidenceField } from "@/features/onboarding/forms/ResidenceField";
import { InterestPickerGrid } from "@/features/onboarding/forms/InterestPickerGrid";
import type { InterestOptionItem } from "@/features/onboarding/lists/MapInterestOptionCard";
import { BirthDateTimeField } from "@/features/onboarding/forms/BirthDateTimeField";
import { OnboardingStepHeader } from "@/features/onboarding/sections/OnboardingStepHeader";
import { OnboardingHero } from "@/features/onboarding/sections/OnboardingHero";
import type { OnboardingHeroFeature } from "@/features/onboarding/sections/OnboardingHero";
import { LocationPermissionGate } from "@/features/onboarding/sections/LocationPermissionGate";
import { MatchFilterBar } from "@/features/matches/sections/MatchFilterBar";
import { MatchDetailPanel } from "@/features/matches/sections/MatchDetailPanel";
import type { MatchTypeItem } from "@/features/matches/lists/MapMatchTypeChip";
import { PlaceDetailSheet } from "@/features/catalog/sections/PlaceDetailSheet";
import { ExperienceDetailSheet } from "@/features/catalog/sections/ExperienceDetailSheet";
import { ZyraHeader } from "@/features/zyra/sections/ZyraHeader";
import { MapZyraMessageBubble } from "@/features/zyra/lists/MapZyraMessageBubble";
import type { ZyraMessageBubbleProps } from "@/features/zyra/elements/ZyraMessageBubble";
import { ChatHeader } from "@/features/social/sections/ChatHeader";
import { ConversationEmptyState } from "@/features/social/sections/ConversationEmptyState";
import { AdminTableToolbar } from "@/features/admin/sections/AdminTableToolbar";
import { AdminTable } from "@/features/admin/sections/AdminTable";
import type { AdminTableColumn, AdminTableRow } from "@/features/admin/sections/AdminTable";
import { KpiChartCard } from "@/features/admin/cards/KpiChartCard";
import { KpiRangeSelector } from "@/features/admin/elements/KpiRangeSelector";
import type { KpiRangeItem } from "@/features/admin/elements/KpiRangeSelector";
import { MapPermissionScreen } from "@/features/map/sections/MapPermissionScreen";
import { MapPlacePreview } from "@/features/map/sections/MapPlacePreview";
import { GlobalSearchBar } from "@/features/search/sections/GlobalSearchBar";
import { AutocompleteList } from "@/features/search/sections/AutocompleteList";
import type { AutocompleteItemProps } from "@/features/search/elements/AutocompleteItem";
import { MediaUploader } from "@/features/media/forms/MediaUploader";
import { UploadProgressChip } from "@/features/media/elements/UploadProgressChip";
import { QuestionCard } from "@/features/tests/cards/QuestionCard";
import { SubmissionProgress } from "@/features/tests/elements/SubmissionProgress";
import { MapAnswerOptionRow } from "@/features/tests/lists/MapAnswerOptionRow";
import type { AnswerOptionItem } from "@/features/tests/lists/MapAnswerOptionRow";
import { PostActionBar } from "@/features/social/sections/PostActionBar";
import type { PostActionItem } from "@/features/social/lists/MapPostActionButton";
import { PostMediaStrip } from "@/features/social/sections/PostMediaStrip";
import type { PostMediaItem } from "@/features/social/lists/MapPostMediaThumbnail";
import { PostMediaCarousel } from "@/features/social/sections/PostMediaCarousel";
import { TranslationToggle } from "@/features/social/elements/TranslationToggle";
import type { PostResponse } from "@/types/social";
import { PostComposerPreview } from "./PostComposerPreview";
import { MapFilterPanel } from "@/features/map/sections/MapFilterPanel";
import { MapLegend } from "@/features/map/sections/MapLegend";
import { MapClusterBadge } from "@/features/map/elements/MapClusterBadge";
import type { FilterChipItem } from "@/features/map/lists/MapFilterChip";
import type { LegendItemData } from "@/features/map/lists/MapLegendItem";
import { DropdownPreview } from "./DropdownPreview";
import { ModalPreview } from "./ModalPreview";
import { DrawerPreview } from "./DrawerPreview";
import { ToastPreview } from "./ToastPreview";

const BADGE_TONES = ["neutral", "accent", "success", "warning", "danger"] as const;
const TAG_TONES = ["neutral", "accent", "success", "warning", "danger"] as const;
const TAG_ITEMS: TagPillSelectableItem[] = [
  { id: "art", label: "Arte", selected: true },
  { id: "food", label: "Cibo" },
  { id: "music", label: "Musica", selected: true },
  { id: "travel", label: "Viaggi" },
];
const SELECTED_TAGS: TagItem[] = [
  { id: "city", label: "City break", tone: "accent" },
  { id: "wellness", label: "Benessere" },
];
const MATCH_TYPES: MatchTypeItem[] = [
  { id: "amore", label: "Amore", selected: true },
  { id: "amicizia", label: "Amicizia" },
  { id: "lavoro", label: "Lavoro" },
  { id: "hobby", label: "Hobby" },
];
const PLACE_ITEMS = [
  {
    title: "Botanica Cafe",
    subtitle: "Brunch e botanica",
    category: "Food",
    metaItems: ["Milano", "4.8", "Aperto"],
    distanceKm: 1.2,
  },
  {
    title: "Skyline Rooftop",
    subtitle: "Cocktail & lounge",
    category: "Night",
    metaItems: ["Roma", "4.6", "Prenota"],
    distanceKm: 3.4,
  },
];
const EXPERIENCE_ITEMS = [
  {
    title: "Yoga al tramonto",
    subtitle: "Parco Sempione",
    category: "Wellness",
    metaItems: ["45 min", "Gruppo"],
    priceLabel: "EUR 18",
  },
  {
    title: "Tour street art",
    subtitle: "Navigli",
    category: "Culture",
    metaItems: ["2 ore", "Outdoor"],
    priceLabel: "EUR 25",
  },
];
const CHAT_ITEMS = [
  {
    name: "Marta",
    messagePreview: "Hai visto il match di oggi?",
    timeLabel: "2m",
    unreadCount: 2,
  },
  {
    name: "Luca",
    messagePreview: "Ci vediamo alle 19?",
    timeLabel: "1h",
  },
];
const TEST_ITEMS = [
  {
    title: "Micro-test mood",
    description: "Scopri il tuo mood attuale.",
    questionCount: 5,
    estimatedMinutes: 2,
    statusLabel: "Nuovo",
  },
  {
    title: "Valori personali",
    description: "Allinea i tuoi valori con il profilo.",
    questionCount: 8,
    estimatedMinutes: 4,
  },
];
const FAVORITE_ITEMS: FavoriteItemCardProps[] = [
  {
    title: "Lago di Como",
    subtitle: "Esperienza romantica",
    typeLabel: "PLACE",
    distanceKm: 52.3,
  },
  {
    title: "Escape room",
    subtitle: "Sfida di gruppo",
    typeLabel: "EXPERIENCE",
    distanceKm: 4.7,
  },
];
const SEARCH_ITEMS = [
  {
    type: "USER" as const,
    title: "Giulia R.",
    subtitle: "Milano",
    meta: "Designer - 28 anni",
    matchScore: 82,
  },
  {
    type: "PLACE" as const,
    title: "Atelier 1901",
    subtitle: "Cafe e bakery",
    meta: "Brera",
    distanceKm: 1.5,
  },
  {
    type: "EXPERIENCE" as const,
    title: "Workshop ceramica",
    subtitle: "Isola",
    meta: "Sabato 10:00",
  },
];
const MATCH_INSIGHTS: MatchInsightItemProps[] = [
  {
    title: "Interessi",
    description: "3 tag in comune tra musica e design.",
    tone: "accent",
  },
  {
    title: "Valori",
    description: "Allineamento alto su crescita personale.",
    tone: "success",
  },
  {
    title: "Lifestyle",
    description: "Preferenze simili per attivita all'aperto.",
    tone: "neutral",
  },
];
const VISIBILITY_ITEMS: VisibilityOptionChipProps[] = [
  {
    label: "Pubblico",
    description: "Il profilo e visibile a tutti.",
    selected: true,
  },
  {
    label: "Parziale",
    description: "Mostra solo informazioni essenziali.",
  },
  {
    label: "Privato",
    description: "Solo tu puoi vedere i dettagli.",
  },
];
const AUTOCOMPLETE_ITEMS: AutocompleteItemProps[] = [
  { title: "Giulia R.", subtitle: "Utente · Milano", type: "USER" },
  { title: "Atelier 1901", subtitle: "Luogo · Brera", type: "PLACE" },
  { title: "Workshop ceramica", subtitle: "Esperienza · Isola", type: "EXPERIENCE" },
];
const LIKE_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d="M20.8 8.6c0 4.1-4.6 7.6-8.8 11.1C7.8 16.2 3.2 12.7 3.2 8.6c0-2.3 1.8-4.1 4.1-4.1 1.7 0 3.2 1 3.8 2.4 0.6-1.4 2.1-2.4 3.8-2.4 2.3 0 4.1 1.8 4.1 4.1z" />
  </svg>
);
const COMMENT_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d="M5 7h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H9l-4 3v-3H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
  </svg>
);
const SHARE_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden="true"
  >
    <path d="M12 5l7 7-7 7" />
    <path d="M19 12H5" />
  </svg>
);
const INTEREST_OPTIONS: InterestOptionItem[] = [
  {
    id: "food",
    label: "Cibo",
    description: "Food tour e brunch.",
    selected: true,
  },
  {
    id: "art",
    label: "Arte",
    description: "Mostre e musei.",
  },
  {
    id: "music",
    label: "Musica",
    description: "Live e dj set.",
    selected: true,
  },
  {
    id: "wellness",
    label: "Wellness",
    description: "Yoga e relax.",
  },
  {
    id: "travel",
    label: "Viaggi",
    description: "Weekend fuori porta.",
  },
  {
    id: "sport",
    label: "Sport",
    description: "Outdoor e training.",
  },
];
const ANSWER_OPTIONS: AnswerOptionItem[] = [
  {
    id: "answer-a",
    label: "Nuove scoperte",
    description: "Mi piace provare cose nuove.",
    indexLabel: "A",
    selected: true,
  },
  {
    id: "answer-b",
    label: "Equilibrio",
    description: "Mix tra routine e novita.",
    indexLabel: "B",
  },
  {
    id: "answer-c",
    label: "Rituali fissi",
    description: "Preferisco luoghi familiari.",
    indexLabel: "C",
  },
];
const POST_ACTIONS: PostActionItem[] = [
  { id: "like", label: "Like", count: 128, active: true, icon: LIKE_ICON },
  { id: "comment", label: "Commenti", count: 24, icon: COMMENT_ICON },
  { id: "share", label: "Condividi", icon: SHARE_ICON },
];
const POST_MEDIA_ITEMS: PostMediaItem[] = [
  { id: "media-1", label: "Cover", selected: true },
  { id: "media-2", label: "Scatto 1" },
  { id: "media-3", label: "Clip", isVideo: true, duration: "0:32" },
  { id: "media-4", label: "Scatto 2" },
];
const HERO_MEDIA_ITEMS: PostMediaItem[] = [
  {
    id: "hero-1",
    label: "Hero 1",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'><rect width='800' height='1000' fill='%23f2f4f8'/><circle cx='400' cy='420' r='180' fill='%23dfe7ff'/><text x='400' y='620' font-size='56' text-anchor='middle' fill='%238a8f98' font-family='Arial'>Syncro</text></svg>",
  },
  {
    id: "hero-2",
    label: "Hero 2",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'><rect width='800' height='1000' fill='%23f9f3ea'/><rect x='140' y='180' width='520' height='520' rx='80' fill='%23f6d7b6'/><text x='400' y='620' font-size='56' text-anchor='middle' fill='%238a8f98' font-family='Arial'>Moments</text></svg>",
  },
  {
    id: "hero-3",
    label: "Video",
    isVideo: true,
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'><rect width='800' height='1000' fill='%23eef5f2'/><polygon points='360,360 520,460 360,560' fill='%239ac7b1'/><text x='400' y='660' font-size='48' text-anchor='middle' fill='%238a8f98' font-family='Arial'>Video</text></svg>",
  },
];
const SAMPLE_POST: PostResponse = {
  id: "post-1",
  userId: "user-1",
  content:
    "Weekend al lago con un tramonto incredibile. Qualcuno ha voglia di unirsi?",
  language: "it",
  latitude: null,
  longitude: null,
  likeCount: 48,
  likedByMe: true,
  createdAt: new Date().toISOString(),
};
const MAP_FILTERS: FilterChipItem[] = [
  { id: "open", label: "Aperto ora", selected: true },
  { id: "verified", label: "Verificato" },
  { id: "access", label: "Accessibile" },
  { id: "events", label: "Eventi oggi" },
];
const MAP_CATEGORY_OPTIONS = [
  { value: "all", label: "Tutte" },
  { value: "food", label: "Food" },
  { value: "night", label: "Nightlife" },
  { value: "culture", label: "Cultura" },
];
const MAP_DISTANCE_OPTIONS = [
  { value: "1", label: "1 km" },
  { value: "3", label: "3 km" },
  { value: "5", label: "5 km" },
  { value: "10", label: "10 km" },
];
const MAP_LEGEND_ITEMS: LegendItemData[] = [
  {
    id: "match",
    label: "Match alto",
    description: "Profili compatibili.",
    tone: "accent",
    count: 24,
  },
  {
    id: "events",
    label: "Eventi",
    description: "Oggi e domani.",
    tone: "success",
    count: 12,
  },
  {
    id: "saved",
    label: "Preferiti",
    description: "Luoghi salvati.",
    tone: "warning",
    count: 8,
  },
];
const ONBOARDING_FEATURES: OnboardingHeroFeature[] = [
  { title: "Profilo rapido", description: "Compila i dati essenziali." },
  { title: "Interessi mirati", description: "Seleziona i temi preferiti." },
  { title: "Match migliori", description: "Suggerimenti piu precisi." },
  { title: "Mappa smart", description: "Luoghi vicini in tempo reale." },
];
const MATCH_FILTER_ITEMS: TagPillSelectableItem[] = [
  { id: "verificati", label: "Verificati", selected: true },
  { id: "online", label: "Online ora" },
  { id: "nuovi", label: "Nuovi" },
];
const MATCH_SORT_OPTIONS = [
  { value: "compat", label: "Compatibilita" },
  { value: "recent", label: "Recenti" },
  { value: "vicini", label: "Vicini" },
];
const ZYRA_MESSAGES: ZyraMessageBubbleProps[] = [
  {
    message: "Ciao! Posso suggerirti esperienze adatte a te.",
    sender: "zyra",
    timestamp: "09:41",
  },
  {
    message: "Cerco qualcosa di rilassante per il weekend.",
    sender: "user",
    timestamp: "09:42",
    statusLabel: "Letto",
  },
  {
    message: "Perfetto, ho selezionato tre idee con wellness e natura.",
    sender: "zyra",
    timestamp: "09:42",
  },
];
const ADMIN_TABLE_COLUMNS: AdminTableColumn[] = [
  { key: "name", label: "Nome" },
  { key: "type", label: "Tipo" },
  { key: "status", label: "Stato", align: "center", width: "120px" },
  { key: "updated", label: "Aggiornato", align: "right" },
];
const ADMIN_TABLE_ROWS: AdminTableRow[] = [
  {
    id: "cat-1",
    name: "Categoria Wellness",
    type: "Categoria",
    status: <Badge tone="success">Attiva</Badge>,
    updated: "2h fa",
  },
  {
    id: "place-1",
    name: "Botanica Cafe",
    type: "Luogo",
    status: <Badge tone="warning">Review</Badge>,
    updated: "Ieri",
  },
  {
    id: "exp-1",
    name: "Yoga al tramonto",
    type: "Esperienza",
    status: <Badge tone="accent">Live</Badge>,
    updated: "3 giorni fa",
  },
];
const KPI_RANGES: KpiRangeItem[] = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
];

export const TestGallery = () => {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <header className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">Buttons</h2>
          <p className="text-sm text-muted">Varianti base con stati e dimensioni.</p>
        </header>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primario</Button>
          <Button variant="secondary">Secondario</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button loading loadingText="Caricamento" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <Divider label="FEATURES" />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Tags</h3>
            <p className="text-sm text-muted">Pill selezionabili e cloud.</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <TagPillSelectable label="Arte" />
              <TagPillSelectable label="Musica" selected />
              <TagPillSelectable label="Viaggi" />
            </div>
            <TagCloud items={TAG_ITEMS} />
            <SelectedTagsRow title="Selezionati" items={SELECTED_TAGS} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Match</h3>
            <p className="text-sm text-muted">Score e filtri tipologia.</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <MatchScoreBadge score={86} />
              <MatchScoreBadge score={68} />
              <MatchScoreBadge score={42} />
            </div>
            <MapMatchTypeChip items={MATCH_TYPES} />
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Catalogo</h3>
            <p className="text-sm text-muted">Meta e distanza.</p>
          </CardHeader>
          <CardBody className="space-y-3">
            <DistanceBadge distanceKm={2.4} tone="accent" />
            <PlaceMetaRow items={["Milano", "Ristorante", "Aperto ora", "4.8"]} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Home</h3>
            <p className="text-sm text-muted">Header e quick actions.</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <SectionHeader
              title="Per te"
              subtitle="Selezione curata in base ai tuoi interessi."
              actionLabel="Vedi tutto"
              actionHref="/"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <QuickActionTile title="Match" subtitle="Affinita del giorno" />
              <QuickActionTile title="Mappa" subtitle="Luoghi vicini" />
            </div>
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Zyra</h3>
            <p className="text-sm text-muted">Prompt rapidi.</p>
          </CardHeader>
          <CardBody className="flex flex-wrap gap-2">
            <ZyraPromptChip label="Chi mi consigli oggi?" />
            <ZyraPromptChip label="Match del giorno" selected />
            <ZyraPromptChip label="Luoghi compatibili" />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Admin</h3>
            <p className="text-sm text-muted">Statistiche rapide.</p>
          </CardHeader>
          <CardBody className="grid gap-3">
            <AdminStatCard
              label="Registrazioni"
              value="1.240"
              trendLabel="+12%"
              trend="up"
            />
            <AdminStatCard
              label="Onboarding"
              value="68%"
              trendLabel="-4%"
              trend="down"
            />
          </CardBody>
        </Card>
      </section>

      <Divider label="PANELS" />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Home panels</h3>
            <p className="text-sm text-muted">Header e righe consigliate.</p>
          </CardHeader>
          <CardBody className="space-y-6">
            <ForYouSectionHeader
              title="Consigli per oggi"
              subtitle="Basati sulle tue preferenze recenti."
              actionLabel="Aggiorna"
              actionHref="/"
            />
            <RecommendationRow title="Top pick" subtitle="Selezione rapida">
              <QuickActionTile title="Match" subtitle="Affinita alta" />
              <QuickActionTile title="Eventi" subtitle="Live oggi" />
              <QuickActionTile title="Luoghi" subtitle="Nuovi spot" />
            </RecommendationRow>
          </CardBody>
        </Card>

        <MatchInsightList
          title="Insight compatibilita"
          subtitle="Punti di forza in comune."
          items={MATCH_INSIGHTS}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ZyraMatchOfDayCard
          title="Elena M."
          subtitle="Milano"
          description="Compatibilita alta su interessi creativi e viaggi."
          matchScore={88}
          actionLabel="Vedi profilo"
          actionHref="/"
        />
        <AffiliationLinkBox
          title="Prenota l'esperienza"
          description="Biglietti disponibili con sconto partner."
          provider="Partner"
          href="/"
          actionLabel="Vai al sito"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <AdminFormSection
          title="Nuova categoria"
          description="Compila i dettagli per creare una nuova categoria."
        >
          <Input label="Nome categoria" placeholder="Es. Wellness" />
          <Textarea label="Descrizione" placeholder="Breve descrizione" />
        </AdminFormSection>
        <AdminEmptyState
          title="Nessun contenuto"
          description="Non ci sono ancora dati per questa sezione."
          actionLabel="Aggiungi nuovo"
          actionHref="/"
        />
      </section>

      <Divider label="DOMAIN FORMS" />

      <section className="grid gap-6 lg:grid-cols-2">
        <ProfileInfoForm
          defaultValue={{
            fullName: "Martina Rossi",
            city: "Milano",
            country: "Italia",
            bio: "Appassionata di viaggi e cibo.",
          }}
        />
        <VisibilitySelector items={VISIBILITY_ITEMS} />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <LanguagePicker />
        <LanguageSelector />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <ResidenceField />
        <div className="space-y-4">
          <GlobalSearchBar />
          <AutocompleteList items={AUTOCOMPLETE_ITEMS} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <MediaUploader />
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Upload</h3>
            <p className="text-sm text-muted">Stato caricamento media.</p>
          </CardHeader>
          <CardBody className="space-y-3">
            <UploadProgressChip label="foto_profilo.jpg" progress={65} />
            <UploadProgressChip label="video_evento.mp4" progress={28} />
          </CardBody>
        </Card>
      </section>

      <Divider label="INTERACTIONS" />

      <section className="grid gap-6 lg:grid-cols-2">
        <InterestPickerGrid
          items={INTEREST_OPTIONS}
          maxSelections={5}
          hint="Scegli fino a 5 interessi."
        />
        <BirthDateTimeField
          defaultValue={{ date: "1992-06-12", time: "08:30" }}
          hint="L'orario e opzionale."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <QuestionCard
          title="Cosa ti descrive meglio oggi?"
          subtitle="Micro-test rapido"
          questionNumber={2}
          totalQuestions={5}
          options={ANSWER_OPTIONS}
        />
        <div className="space-y-4">
          <SubmissionProgress
            label="Avanzamento test"
            current={3}
            total={5}
            helper="2 risposte mancanti."
          />
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-foreground">Risposte</h3>
              <p className="text-sm text-muted">Stati selezione.</p>
            </CardHeader>
            <CardBody>
              <MapAnswerOptionRow items={ANSWER_OPTIONS} />
            </CardBody>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <PostMediaStrip items={POST_MEDIA_ITEMS} subtitle="Anteprime caricate." />
          <PostActionBar
            actions={POST_ACTIONS}
            rightSlot={
              <Button size="sm" variant="ghost">
                Salva
              </Button>
            }
          />
          <TranslationToggle active />
        </div>
        <div className="space-y-4">
          <MapFilterPanel
            categoryOptions={MAP_CATEGORY_OPTIONS}
            distanceOptions={MAP_DISTANCE_OPTIONS}
            defaultCategory="all"
            defaultDistance="5"
            filters={MAP_FILTERS}
          />
          <MapLegend items={MAP_LEGEND_ITEMS} subtitle="Indicatori principali." />
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-foreground">Cluster</h3>
              <p className="text-sm text-muted">Badge su mappa.</p>
            </CardHeader>
            <CardBody className="flex flex-wrap items-center gap-3">
              <MapClusterBadge count={6} size="sm" />
              <MapClusterBadge count={24} />
              <MapClusterBadge count={120} size="lg" />
            </CardBody>
          </Card>
        </div>
      </section>

      <Divider label="COMPOSITES" />

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <OnboardingStepHeader
            title="Profilo base"
            subtitle="Inizia con le informazioni essenziali."
            step={1}
            totalSteps={4}
          />
          <OnboardingHero
            title="Costruiamo il tuo profilo Syncro"
            subtitle="Ci vogliono pochi minuti per sbloccare i match migliori."
            features={ONBOARDING_FEATURES}
            secondaryActionLabel="Salta"
            footnote="Puoi aggiornare tutto in seguito."
          />
        </div>
        <LocationPermissionGate />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <MatchFilterBar
          typeItems={MATCH_TYPES}
          filterItems={MATCH_FILTER_ITEMS}
          sortOptions={MATCH_SORT_OPTIONS}
          defaultSort="compat"
        />
        <MatchDetailPanel
          name="Elena M."
          location="Milano"
          matchScore={88}
          bio="Creativa, amante di viaggi e design."
          tags={["Design", "Food", "Viaggi"]}
          insights={MATCH_INSIGHTS}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <PlaceDetailSheet
          title="Botanica Cafe"
          subtitle="Brunch e botanica"
          category="Food"
          distanceKm={1.2}
          ratingLabel="4.8"
          address="Via Solferino 12, Milano"
          description="Atmosfera luminosa con menu stagionale."
          metaItems={["Aperto ora", "Prenota", "Pet friendly"]}
          tags={["Brunch", "Garden", "Casual"]}
        />
        <ExperienceDetailSheet
          title="Yoga al tramonto"
          subtitle="Parco Sempione"
          category="Wellness"
          priceLabel="EUR 18"
          scheduleLabel="Sabato 18:30"
          description="Sessione guidata con musica soft e relax."
          metaItems={["45 min", "Gruppo", "Outdoor"]}
          tags={["Relax", "Sunset", "Community"]}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Zyra</h3>
            <p className="text-sm text-muted">Conversazione assistita.</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <ZyraHeader />
            <MapZyraMessageBubble items={ZYRA_MESSAGES} />
          </CardBody>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-foreground">Chat</h3>
              <p className="text-sm text-muted">Header e composer.</p>
            </CardHeader>
            <CardBody className="space-y-4">
              <ChatHeader
                name="Marta"
                subtitle="Milano"
                matchScore={82}
                lastSeen="Ora"
              />
            </CardBody>
          </Card>
          <ConversationEmptyState />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-foreground">KPI</h3>
              <p className="text-sm text-muted">Trend principali.</p>
            </CardHeader>
            <CardBody className="space-y-4">
              <KpiRangeSelector ranges={KPI_RANGES} selectedId="30d" />
            </CardBody>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <KpiChartCard
              title="Registrazioni"
              value="1.240"
              deltaLabel="+12%"
              subtitle="Ultimi 30 giorni"
            />
            <KpiChartCard
              title="Onboarding completato"
              value="68%"
              deltaLabel="-4%"
              deltaTone="warning"
              subtitle="Ultimi 30 giorni"
            />
          </div>
        </div>
        <div className="space-y-4">
          <AdminTableToolbar
            filterOptions={[
              { value: "all", label: "Tutti" },
              { value: "active", label: "Attivi" },
              { value: "draft", label: "Bozze" },
            ]}
            selectedFilter="all"
          />
          <AdminTable columns={ADMIN_TABLE_COLUMNS} rows={ADMIN_TABLE_ROWS} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <MapPermissionScreen />
        <MapPlacePreview
          title="Skyline Rooftop"
          subtitle="Cocktail & lounge"
          category="Night"
          distanceKm={3.4}
          ratingLabel="4.6"
          metaItems={["Prenota", "Cocktail", "Vista skyline"]}
          tags={["Rooftop", "Live", "Afterwork"]}
        />
      </section>

      <Divider label="LIST ITEMS" />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Luoghi</h3>
            <p className="text-sm text-muted">Lista card per catalogo.</p>
          </CardHeader>
          <CardBody>
            <MapPlaceListItem items={PLACE_ITEMS} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Esperienze</h3>
            <p className="text-sm text-muted">Lista compatta.</p>
          </CardHeader>
          <CardBody>
            <MapExperienceListItem items={EXPERIENCE_ITEMS} />
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Post header</h3>
            <p className="text-sm text-muted">Header per feed.</p>
          </CardHeader>
          <CardBody>
            <PostHeader
              name="Sofia"
              subtitle="Milano"
              timeLabel="10 min"
              matchScore={78}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Chat list</h3>
            <p className="text-sm text-muted">Lista conversazioni.</p>
          </CardHeader>
          <CardBody>
            <MapChatListItem items={CHAT_ITEMS} />
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Post card</h3>
          <p className="text-sm text-muted">
            Card completa per il feed.
          </p>
          <PostCard post={SAMPLE_POST} showMedia={false} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Post hero</h3>
            <p className="text-sm text-muted">Slider media stile feed.</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <PostMediaCarousel items={HERO_MEDIA_ITEMS} />
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">Post composer</h3>
          <p className="text-sm text-muted">
            Modal per la creazione dei post.
          </p>
          <PostComposerPreview />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Micro-test</h3>
            <p className="text-sm text-muted">Card per test.</p>
          </CardHeader>
          <CardBody>
            <MapTestListItem items={TEST_ITEMS} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Preferiti</h3>
            <p className="text-sm text-muted">Card salvate.</p>
          </CardHeader>
          <CardBody>
            <MapFavoriteItemCard items={FAVORITE_ITEMS} />
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Ricerca</h3>
            <p className="text-sm text-muted">Risultati misti.</p>
          </CardHeader>
          <CardBody>
            <MapSearchResultItem items={SEARCH_ITEMS} />
          </CardBody>
        </Card>

        <ProfileSummaryCard
          name="Alessandro R."
          location="Torino"
          matchScore={84}
          bio="Designer di prodotto, appassionato di viaggi e fotografia urbana."
          tags={["City", "Design", "Food"]}
        />
      </section>

      <Divider label="FORM" />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Input</h3>
            <p className="text-sm text-muted">Campi base con hint e error.</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Email"
              placeholder="nome@email.com"
              hint="Useremo questa email per contattarti."
            />
            <Input
              label="Codice invito"
              placeholder="SYNCRO2025"
              error="Codice non valido."
              rightSlot={<span>?</span>}
            />
            <Textarea
              label="Bio"
              placeholder="Racconta qualcosa su di te"
              hint="Massimo 160 caratteri."
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Select</h3>
            <p className="text-sm text-muted">Select, checkbox e switch.</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <Select
              label="Lingua"
              defaultValue="it"
              options={[
                { value: "it", label: "Italiano" },
                { value: "en", label: "English" },
                { value: "es", label: "Espanol" },
              ]}
            />
            <Checkbox
              label="Accetto i termini"
              defaultChecked
              description="Necessario per continuare."
            />
            <Switch
              label="Notifiche"
              description="Suggerimenti e aggiornamenti Zyra."
              defaultChecked
            />
          </CardBody>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Date & Time</h3>
            <p className="text-sm text-muted">Picker customizzati.</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <DatePicker label="Data" defaultValue="1992-06-12" />
            <TimePicker label="Ora" defaultValue="08:30" stepMinutes={15} />
          </CardBody>
        </Card>
      </section>

      <Divider label="SURFACES" />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name="Luca Romano" />
              <div>
                <p className="text-sm font-semibold text-foreground">Luca Romano</p>
                <p className="text-xs text-subtle">Milano, Italia</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <MapBadges />
            </div>
            <div className="flex flex-wrap gap-2">
              <MapTags />
            </div>
          </CardBody>
          <CardFooter className="flex items-center justify-between">
            <span className="text-xs text-subtle">Aggiornato 2h fa</span>
            <Button size="sm" variant="secondary">
              Segui
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Skeleton</h3>
            <p className="text-sm text-muted">Placeholder in caricamento.</p>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton width={48} height={48} className="rounded-full" />
              <div className="space-y-2">
                <Skeleton width={160} height={12} />
                <Skeleton width={220} height={10} />
              </div>
            </div>
            <Skeleton height={120} />
          </CardBody>
        </Card>
      </section>

      <Divider label="INTERACTIVE" />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Dropdown</h3>
            <p className="text-sm text-muted">Menu contestuale.</p>
          </CardHeader>
          <CardBody>
            <DropdownPreview />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Tabs</h3>
            <p className="text-sm text-muted">Navigazione interna.</p>
          </CardHeader>
          <CardBody>
            <Tabs
              items={[
                {
                  value: "overview",
                  label: "Overview",
                  content: (
                    <div className="space-y-2">
                      <p className="text-sm text-foreground">
                        Sommario rapido del profilo.
                      </p>
                      <span className="text-xs font-semibold text-subtle">
                        Match alto
                      </span>
                    </div>
                  ),
                },
                {
                  value: "stats",
                  label: "Stats",
                  content: (
                    <div className="space-y-2">
                      <p className="text-sm text-foreground">Dettagli metriche.</p>
                      <span className="text-xs font-semibold text-subtle">+18%</span>
                    </div>
                  ),
                },
              ]}
            />
          </CardBody>
        </Card>
      </section>

      <Divider label="OVERLAYS" />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Modal</h3>
            <p className="text-sm text-muted">Dialogo centrale.</p>
          </CardHeader>
          <CardBody>
            <ModalPreview />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Drawer</h3>
            <p className="text-sm text-muted">Pannello mobile.</p>
          </CardHeader>
          <CardBody>
            <DrawerPreview />
          </CardBody>
        </Card>
      </section>

      <Divider label="FEEDBACK" />

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Toast</h3>
            <p className="text-sm text-muted">Notifiche leggere.</p>
          </CardHeader>
          <CardBody>
            <ToastPreview />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-foreground">Loader</h3>
            <p className="text-sm text-muted">Indicatori di stato.</p>
          </CardHeader>
          <CardBody className="flex items-center gap-4">
            <Loader size="sm" />
            <Loader />
            <Loader size="lg" />
          </CardBody>
        </Card>
      </section>

      <Divider label="STATES" />

      <section className="grid gap-6 lg:grid-cols-2">
        <EmptyState
          title="Nessun contenuto"
          description="Inizia ad aggiungere preferiti per vedere i consigli qui."
        />
        <ErrorState
          title="Errore di connessione"
          description="Controlla la rete e riprova piu tardi."
        />
      </section>
    </div>
  );
};

const MapBadges = () => (
  <>
    {BADGE_TONES.map((tone) => (
      <Badge key={tone} tone={tone}>
        {tone}
      </Badge>
    ))}
  </>
);

const MapTags = () => (
  <>
    {TAG_TONES.map((tone) => (
      <Tag key={tone} tone={tone}>
        {tone}
      </Tag>
    ))}
  </>
);
