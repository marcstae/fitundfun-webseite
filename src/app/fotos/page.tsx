import Link from "next/link";
import { ArrowUpRight, Images, MountainSnow } from "lucide-react";
import { getAktuellesLager } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fotos" };

export default async function FotosPage() {
  const lager = await getAktuellesLager();
  const album = lager?.immich_url || "";

  return (
    <main className="bg-[#f5efe2]">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#e85f35]">
          Erinnerungen
        </p>
        <h1 className="camp-display mt-4 max-w-[10ch] text-4xl leading-none text-ink sm:text-6xl">
          Fotos erzählen den Rest.
        </h1>
        <p className="mt-5 max-w-2xl text-base font-semibold leading-relaxed text-muted">
          Bilder von der Piste, aus dem Lagerhaus und von den Momenten dazwischen.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <div className="flex min-h-72 flex-col justify-between rounded-[1.75rem] bg-ink p-7 text-white">
            <Images className="size-8 text-[#ff8a61]" />
            <div>
              <h2 className="camp-display text-3xl">Aktuelles Album</h2>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-white/65">
                {album
                  ? `Die Fotos des Lagers ${lager?.jahr} öffnen sich in einem neuen Tab.`
                  : "Für das aktuelle Lager ist noch kein Foto-Album verknüpft."}
              </p>
              {album ? (
                <a
                  href={album}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-ink"
                >
                  Album öffnen <ArrowUpRight className="size-4" />
                </a>
              ) : null}
            </div>
          </div>

          <Link
            href="/lager"
            className="group flex min-h-72 flex-col justify-between rounded-[1.75rem] border border-ink/10 bg-white p-7"
          >
            <MountainSnow className="size-8 text-[#e85f35]" />
            <div>
              <h2 className="camp-display text-3xl text-ink">Frühere Lager</h2>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-muted">
                Im Archiv findest du alle Lagerjahre, Dokumente und vorhandene
                Foto- oder Video-Links.
              </p>
              <span className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#e85f35]">
                Zum Archiv
                <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
