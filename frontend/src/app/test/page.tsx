import type { Metadata } from "next";
import { TestGallery } from "./TestGallery";

export const metadata: Metadata = {
  title: "Test UI | Syncro",
  description: "Pagina di test per i componenti UI Syncro.",
};

export default function TestPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <header className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-subtle">
            UI playground
          </span>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold text-foreground">
              Componenti Syncro
            </h1>
            <p className="text-sm text-muted">
              Anteprima dei componenti riutilizzabili basati sui token globali.
            </p>
          </div>
        </header>
        <TestGallery />
      </main>
    </div>
  );
}
