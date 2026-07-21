import Link from "next/link";
import { FileText, Images, ChevronDown } from "lucide-react";
import {
  getAktuellesLager,
  getEinstellungen,
  getSponsoren,
} from "@/lib/data";
import { HeroVideo } from "@/components/hero-video";
import { publicFileUrl } from "@/lib/pb";
import { Button } from "@/components/ui/button";
import { formatDateRange, countdownLabel } from "@/lib/utils";
import type { LagerRecord, SponsorRecord } from "@/lib/pb-types";
import { EditableHero } from "@/components/edit/editable-hero";
import { NeuesLagerButton } from "@/components/edit/neues-lager-wizard";
import { Reveal } from "@/components/reveal";

export const revalidate = 300;

export default async function HomePage() {
  const [lager, einstellungen, sponsoren] = await Promise.all([
    getAktuellesLager(),
    getEinstellungen(),
    getSponsoren(),
  ]);

  const heroTitel = einstellungen?.hero_titel || "fit&fun Lager Brigels";
  const heroWillkommen =
    einstellungen?.hero_willkommen || "Eine Woche Schnee, Sonne und Familie — seit 2007.";
  const heroVideo = einstellungen?.hero_video
    ? publicFileUrl("einstellungen", einstellungen.id, einstellungen.hero_video)
    : "/hero.mp4";
  const heroPoster = einstellungen?.hero_poster
    ? publicFileUrl("einstellungen", einstellungen.id, einstellungen.hero_poster)
    : null;

  const fotosHref = lager?.immich_url || "/fotos";

  return (
    <>
      {/* HERO */}
      <section className="relative flex min-h-[calc(100svh-4rem)] flex-col overflow-hidden hero-stripes">
        <HeroVideo videoUrl={heroVideo} posterUrl={heroPoster} />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-start px-4 pt-4 pb-12 sm:px-6 sm:pt-6 lg:px-8">
          <div className="flex max-w-2xl flex-col gap-4 text-white sm:gap-5 animate-fade-up">
            <h1 className="font-display text-4xl uppercase leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              {renderHeroTitel(heroTitel)}
            </h1>
            <p className="max-w-md text-base text-white/85 sm:text-lg">
              <EditableHero
                field="hero_willkommen"
                label="Willkommenssatz"
                value={heroWillkommen}
                multiline
              >
                {heroWillkommen}
              </EditableHero>
            </p>

            {lager && (
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-bold backdrop-blur sm:text-base">
                  {formatDateRange(lager.datum_von, lager.datum_bis)}
                </span>
                <span className="text-sm text-white/70">
                  {countdownLabel(lager.datum_von, lager.datum_bis)}
                </span>
              </div>
            )}

            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:gap-4">
              {lager ? (
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href={`/lager/${lager.jahr}`}>
                    <FileText /> Lager {lager.jahr}
                  </Link>
                </Button>
              ) : (
                <Button size="lg" className="w-full sm:w-auto" asChild>
                  <Link href="/lager">
                    <FileText /> Lager
                  </Link>
                </Button>
              )}
              <Button asChild size="lg" variant="white" className="w-full sm:w-auto">
                <a href={fotosHref} target="_blank" rel="noopener noreferrer">
                  <Images /> Fotos
                </a>
              </Button>
            </div>
          </div>
        </div>
        <div className="relative z-10 hidden justify-center pb-6 text-white/60 sm:flex" aria-hidden>
          <ChevronDown className="size-5 animate-bounce" />
        </div>
      </section>

      {/* FUN FACTS / AKTUELLES LAGER */}
      {lager && <FunFacts lager={lager} sponsoren={sponsoren} />}

      {/* NEUES LAGER (nur Edit-Mode) */}
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
        <NeuesLagerButton />
      </div>

      {/* SPONSOREN */}
      {sponsoren.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="mb-5 text-xs font-bold uppercase tracking-wider text-muted">
            Herzlichen Dank an unsere Sponsoren
          </p>
          <div className="flex flex-wrap items-center gap-6">
            {sponsoren.map((s) => {
              const logo = s.logo
                ? publicFileUrl("sponsoren", s.id, s.logo)
                : null;
              const inner = logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logo}
                  alt={s.name}
                  className="max-h-10 w-auto opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0"
                />
              ) : (
                <span className="text-sm font-bold text-muted">{s.name}</span>
              );
              return s.url ? (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  {inner}
                </a>
              ) : (
                <span key={s.id} className="inline-flex items-center">
                  {inner}
                </span>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}

function renderHeroTitel(titel: string) {
  const lower = titel.toLowerCase();
  if (lower.includes("&")) {
    const idx = lower.indexOf("&");
    return (
      <>
        {titel.slice(0, idx)}
        <span className="text-accent-light">&amp;</span>
        {titel.slice(idx + 1)}
      </>
    );
  }
  return titel;
}

function FunFacts({ lager, sponsoren }: { lager: LagerRecord; sponsoren: SponsorRecord[] }) {
  const tage = Math.max(
    1,
    Math.round(
      (new Date(lager.datum_bis).getTime() - new Date(lager.datum_von).getTime()) / 86_400_000
    ) + 1
  );
  const facts = [
    { value: `${lager.jahr - 2006}.`, label: "Lager in Folge" },
    { value: `${tage}`, label: "Tage Abenteuer" },
    { value: "1250", label: "m ü. M. — Brigels" },
    { value: `${sponsoren.length}`, label: "Sponsoren" },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <Reveal>
        <div className="mb-10 flex flex-wrap items-baseline justify-between gap-3 border-b border-ink/10 pb-5">
          <span className="text-xs font-bold uppercase tracking-widest text-muted sm:text-sm">
            Lager {lager.jahr} · {formatDateRange(lager.datum_von, lager.datum_bis)}
          </span>
          <Link
            href={`/lager/${lager.jahr}`}
            className="text-sm font-bold text-accent transition-colors hover:text-accent-light sm:text-base"
          >
            Alles zum Lager {lager.jahr} →
          </Link>
        </div>
      </Reveal>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
        {facts.map((f, i) => (
          <Reveal key={f.label} delay={i * 90}>
            <div className="border-t-2 border-ink/80 pt-4">
              <span className="font-display text-4xl leading-none tracking-tight text-ink sm:text-5xl">
                {f.value}
              </span>
              <span className="mt-2 block text-xs font-bold uppercase tracking-widest text-muted sm:text-sm">
                {f.label}
              </span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
