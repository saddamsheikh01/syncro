import { Button } from "@/components/buttons/Button";
import { Input } from "@/components/elements/Input";
import { Textarea } from "@/components/elements/Textarea";
import { Select } from "@/components/elements/Select";
import { Checkbox } from "@/components/elements/Checkbox";
import { Switch } from "@/components/elements/Switch";
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
import { DropdownPreview } from "./DropdownPreview";
import { ModalPreview } from "./ModalPreview";
import { DrawerPreview } from "./DrawerPreview";
import { ToastPreview } from "./ToastPreview";

const BADGE_TONES = ["neutral", "accent", "success", "warning", "danger"] as const;
const TAG_TONES = ["neutral", "accent", "success", "warning", "danger"] as const;

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
            <Select label="Lingua" defaultValue="it">
              <option value="it">Italiano</option>
              <option value="en">English</option>
              <option value="es">Espanol</option>
            </Select>
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
