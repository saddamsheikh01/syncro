import Link from "next/link";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Card } from "@/components/elements/Card";
import { AdminPageHeader } from "@/features/admin/sections/AdminPageHeader";

export default function AdminSyncIndexPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <AdminPageHeader
          title="Data Sync"
          subtitle="Choose a provider sync workflow for catalog ingestion."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="space-y-3 p-5">
            <h2 className="text-base font-semibold text-foreground">Google Maps</h2>
            <p className="text-sm text-muted">
              Sync places and Google place details into the catalog.
            </p>
            <Link
              href="/admin/sync/google-maps"
              className="inline-flex rounded-full border border-border-strong px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted"
            >
              Open Google Maps sync
            </Link>
          </Card>

          <Card className="space-y-3 p-5">
            <h2 className="text-base font-semibold text-foreground">Viator</h2>
            <p className="text-sm text-muted">
              Sync experiences from Viator Partner API with incremental cursor support.
            </p>
            <Link
              href="/admin/sync/viator"
              className="inline-flex rounded-full border border-border-strong px-4 py-2 text-xs font-semibold text-foreground hover:bg-surface-muted"
            >
              Open Viator sync
            </Link>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
