import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Images,
  MapPin,
  MountainSnow,
  Snowflake,
  UsersRound,
} from "lucide-react";
import {
  getAktuellesLager,
  getArchiv,
  getEinstellungen,
  getSponsoren,
} from "@/lib/data";
import { publicFileUrl } from "@/lib/pb";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/lib/utils";
import type { ArchivRecord, LagerRecord } from "@/lib/pb-types";
import { EditableHero } from "@/components/edit/editable-hero";
import { NeuesLagerButton } from "@/components/edit/neues-lager-wizard";
import { Reveal } from "@/components/reveal";
import { HeroVideo } from "@/components/hero-video";

export const revalidate = 300;

export default async function HomePage() {
  const [lager, archiv, einstellungen, sponsoren] = await Promise.all([
    getAktuellesLager(),
    getArchiv(),
    getEinstellungen(),
    getSponsoren(),
  ]);

  const heroTitel = einstellungen?.hero_titel || "fit&fun Lager Brigels";
  const heroWillkommen =
    einstellungen?.hero_willkommen ||
    "Eine Woche Schnee, Sonne und Gemeinschaft — mit Familie und Freunden.";
  const heroVideoUrl = einstellungen?.hero_video
    ? publicFileUrl("einstellungen", einstellungen.id, einstellungen.hero_video)
    : "/hero.mp4";
  const heroPosterUrl = einstellungen?.hero_poster
    ? publicFileUrl("einstellungen", einstellungen.id, einstellungen.hero_poster)
    : "/hero-poster.jpg";
  const lagerHref = lager ? `/lager/${lager.jahr}` : "/lager";
  const fotosHref = lager?.immich_url || "/fotos";
  const fotosExtern = /^https?:\/\//.test(fotosHref);
  const maxTeilnehmer =
    Math.max(0, ...archiv.map((eintrag) => eintrag.teilnehmer ?? 0), lager?.teilnehmer ?? 0) || null;

  return (
    <>
      <section
        className="camp-hero relative h-[calc(100svh-4rem)] min-h-[680px] overflow-hidden bg-[#f5efe2] px-2 pb-2 sm:px-3 sm:pb-3"
        aria-labelledby="hero-headline"
      >
        <div className="relative isolate h-full overflow-hidden rounded-[1.5rem] bg-navy-900 sm:rounded-[2rem]">
          <HeroVideo
            videoUrl={heroVideoUrl}
            posterUrl={heroPosterUrl}
            className="camp-hero-media z-0"
          />
          <div aria-hidden className="camp-hero-wash pointer-events-none absolute inset-0 z-[1]" />
          <div aria-hidden className="camp-hero-grain pointer-events-none absolute inset-0 z-[4]" />

          <div className="relative z-10 mx-auto flex h-full w-full max-w-[96rem] flex-col px-5 pb-6 pt-5 sm:px-8 sm:pb-8 sm:pt-7 lg:px-12 lg:pb-11 lg:pt-9">
            <div className="camp-hero-meta flex items-start justify-between gap-4 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white sm:text-xs">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-navy-950/15 px-3 py-2 backdrop-blur-md">
                <MountainSnow className="size-4 text-[#ffad7a]" />
                Familie · Freunde · Schnee
              </span>
              <div className="flex items-center gap-4">
                <span className="hidden text-white/75 md:inline">Ski · Snowboard · Schlitteln</span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5 text-[#ffad7a]" />
                  Brigels · Graubünden
                </span>
              </div>
            </div>

            <div className="mt-auto max-w-[74rem]">
              <div className="camp-hero-kicker mb-5 flex flex-wrap gap-2 sm:mb-7">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md sm:text-sm">
                  <CalendarDays className="size-4 text-[#ffad7a]" />
                  {lager
                    ? `Lager ${lager.jahr} · ${formatDateRange(lager.datum_von, lager.datum_bis)}`
                    : "Eine Woche Winter"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md sm:text-sm">
                  <UsersRound className="size-4 text-[#ffad7a]" />
                  {maxTeilnehmer ? `Bis zu ${maxTeilnehmer} Personen` : "Familie & Freunde"}
                </span>
              </div>

              <h1
                id="hero-headline"
                className="camp-hero-title max-w-[11ch] font-display text-[clamp(3.4rem,10vw,8.75rem)] leading-[0.8] tracking-[-0.075em] text-[#fffaf0]"
              >
                <EditableHero field="hero_titel" label="Hero-Titel" value={heroTitel}>
                  {renderHeroTitel(heroTitel)}
                </EditableHero>
              </h1>

              <div className="camp-hero-bottom mt-6 flex flex-col items-start justify-between gap-6 sm:mt-8 lg:flex-row lg:items-end">
                <p className="camp-hero-copy max-w-xl text-balance text-base font-semibold leading-relaxed text-white/90 sm:text-lg">
                  <EditableHero
                    field="hero_willkommen"
                    label="Willkommenstext"
                    value={heroWillkommen}
                    multiline
                  >
                    {heroWillkommen}
                  </EditableHero>
                </p>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="w-full rounded-full bg-[#ff7042] px-7 text-ink shadow-[0_12px_35px_rgba(255,112,66,0.25)] hover:bg-[#ff835d] sm:w-auto"
                  >
                    <Link href={lagerHref}>
                      {lager ? `Lager ${lager.jahr} entdecken` : "Lager entdecken"}
                      <ArrowUpRight />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="white"
                    className="w-full rounded-full border border-white/35 bg-white/90 px-7 hover:bg-white sm:w-auto"
                  >
                    <a
                      href={fotosHref}
                      target={fotosExtern ? "_blank" : undefined}
                      rel={fotosExtern ? "noopener noreferrer" : undefined}
                    >
                      <Images />
                      Fotos ansehen
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-3 z-20 rounded-[1.05rem] border border-white/40 sm:inset-4 sm:rounded-[1.45rem]"
          />
        </div>
      </section>

      <HomeIntro lager={lager} archiv={archiv} />
      <CampRhythm lager={lager} />
      <HomeClosing
        lager={lager}
        fotosHref={fotosHref}
        fotosExtern={fotosExtern}
      />

      {sponsoren.length > 0 && (
        <section className="border-t border-ink/8 bg-white">
          <div className="mx-auto max-w-[96rem] px-5 py-12 sm:px-8 lg:px-12">
            <p className="mb-6 text-xs font-bold uppercase tracking-[0.18em] text-muted">
              Herzlichen Dank an unsere Sponsoren
            </p>
            <div className="flex flex-wrap items-center gap-8">
              {sponsoren.map((s) => {
                const logo = s.logo
                  ? publicFileUrl("sponsoren", s.id, s.logo)
                  : null;
                const inner = logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logo}
                    alt={s.name}
                    className="max-h-10 w-auto opacity-75 grayscale transition hover:opacity-100 hover:grayscale-0"
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
          </div>
        </section>
      )}
    </>
  );
}

function renderHeroTitel(titel: string) {
  const lagerIndex = titel.toLowerCase().indexOf(" lager");
  if (lagerIndex > 0) {
    return (
      <>
        <span className="block">{renderHeroLine(titel.slice(0, lagerIndex))}</span>
        <span className="mt-[0.12em] block text-[0.61em] tracking-[-0.055em]">
          {renderHeroLine(titel.slice(lagerIndex + 1))}
        </span>
      </>
    );
  }

  return <span className="block">{renderHeroLine(titel)}</span>;
}

function renderHeroLine(line: string) {
  const ampersandIndex = line.indexOf("&");
  if (ampersandIndex < 0) return line;

  return (
    <>
      {line.slice(0, ampersandIndex)}
      <span className="camp-hero-amp">&amp;</span>
      {line.slice(ampersandIndex + 1)}
    </>
  );
}

function HomeIntro({
  lager,
  archiv,
}: {
  lager: LagerRecord | null;
  archiv: ArchivRecord[];
}) {
  const rawFirstYear = Math.min(
    ...(lager ? [lager.jahr] : []),
    ...archiv.map((eintrag) => eintrag.jahr)
  );
  const firstYear = Number.isFinite(rawFirstYear) ? rawFirstYear : 2007;
  const tage = lager
    ? Math.max(
        1,
        Math.round(
          (new Date(lager.datum_bis).getTime() - new Date(lager.datum_von).getTime()) / 86_400_000
        ) + 1
      )
    : 7;
  const maxTeilnehmer =
    Math.max(0, ...archiv.map((eintrag) => eintrag.teilnehmer ?? 0), lager?.teilnehmer ?? 0) || null;
  const facts = [
    { value: String(firstYear), label: "das erste Lager" },
    { value: String(tage), label: "Tage zusammen" },
    { value: "1'250", label: "Meter über Meer" },
    {
      value: maxTeilnehmer ? String(maxTeilnehmer) : "80",
      label: "Personen, wenn alle dabei sind",
    },
  ];

  return (
    <section className="bg-white" aria-labelledby="home-intro-title">
      <div className="mx-auto max-w-[96rem] px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-36">
        <div className="mb-8 empty:hidden">
          <NeuesLagerButton />
        </div>

        <Reveal>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-8">
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#e85f35]">
                01 · Darum geht es
              </p>
              <h2
                id="home-intro-title"
                className="camp-display max-w-[13ch] text-balance text-4xl leading-[0.95] text-ink sm:text-6xl lg:text-7xl"
              >
                Eine Woche, die sich wie Heimkommen anfühlt.
              </h2>
            </div>
            <div className="flex flex-col justify-end lg:col-span-4">
              <p className="max-w-lg text-base font-semibold leading-relaxed text-muted sm:text-lg">
                fit&amp;fun ist unsere gemeinsame Winterwoche: privat organisiert,
                generationenübergreifend und jedes Jahr ein bisschen anders. Auf dem
                Berg zählt das Tempo. Im Lagerhaus die Zeit miteinander.
              </p>
              <Link
                href={lager ? `/lager/${lager.jahr}` : "/lager"}
                className="mt-7 inline-flex w-fit items-center gap-2 text-sm font-bold text-ink transition-colors hover:text-[#e85f35]"
              >
                {lager ? `Lager ${lager.jahr} ansehen` : "Alle Lagerjahre ansehen"}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </Reveal>

        <div className="mt-16 grid grid-cols-2 border-y border-ink/10 sm:mt-24 lg:grid-cols-4">
          {facts.map((fact, index) => (
            <Reveal
              key={fact.label}
              delay={index * 80}
              className="py-7 pr-4 sm:py-9 lg:pr-8"
            >
              <span className="camp-display block text-4xl leading-none text-ink sm:text-5xl">
                {fact.value}
              </span>
              <span className="mt-3 block max-w-[15rem] text-xs font-bold uppercase leading-relaxed tracking-[0.14em] text-muted">
                {fact.label}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CampRhythm({ lager }: { lager: LagerRecord | null }) {
  const activities = [
    {
      number: "01",
      icon: MountainSnow,
      title: "Auf dem Berg",
      text: "Ski, Snowboard, frische Spuren und die letzte gemeinsame Talabfahrt.",
    },
    {
      number: "02",
      icon: Snowflake,
      title: "Neben der Piste",
      text: "Schlitteln, Winterspaziergänge und spontane Ideen ohne Tagesplan.",
    },
    {
      number: "03",
      icon: UsersRound,
      title: "Im Lagerhaus",
      text: "Gemeinsam essen, spielen, erzählen — und meistens etwas zu wenig schlafen.",
    },
  ];
  const week = buildWeekDays(lager);

  return (
    <section
      className="bg-[#f5efe2] py-20 sm:py-28 lg:py-36"
      aria-labelledby="camp-rhythm-title"
    >
      <div className="mx-auto max-w-[96rem] px-5 sm:px-8 lg:px-12">
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#e85f35]">
                02 · Der Rhythmus
              </p>
              <h2
                id="camp-rhythm-title"
                className="camp-display max-w-[13ch] text-4xl leading-[0.95] text-ink sm:text-6xl"
              >
                Jeder Tag hat seine eigene gute Seite.
              </h2>
            </div>
            <p className="max-w-md text-sm font-semibold leading-relaxed text-muted sm:text-base lg:col-span-4">
              Ein minimalistischer Überblick über das, was die Woche ausmacht —
              ohne daraus ein starres Programm zu machen.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 divide-y divide-ink/12 border-y border-ink/12 sm:mt-20">
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <Reveal key={activity.title} delay={index * 80}>
                <div className="grid gap-5 py-7 sm:grid-cols-[3rem_3rem_1fr] sm:items-center sm:py-9 lg:grid-cols-[4rem_4rem_0.8fr_1.2fr]">
                  <span className="text-xs font-bold tracking-[0.18em] text-muted">
                    {activity.number}
                  </span>
                  <span className="inline-flex size-11 items-center justify-center rounded-full bg-white text-[#e85f35]">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="camp-display text-2xl text-ink sm:text-3xl">
                    {activity.title}
                  </h3>
                  <p className="max-w-xl text-sm font-semibold leading-relaxed text-muted sm:text-base">
                    {activity.text}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-14 sm:mt-20">
          <div className="overflow-hidden rounded-[2rem] bg-ink p-6 text-white sm:p-10 lg:p-12">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#ff9b76]">
                  {lager ? `Wochenrhythmus Lager ${lager.jahr}` : "Beispielhafter Wochenrhythmus"}
                </p>
                <h3 className="camp-display mt-4 max-w-[11ch] text-3xl leading-none sm:text-5xl">
                  Grob geplant. Offen für alles.
                </h3>
              </div>
              <p className="max-w-md text-sm font-semibold leading-relaxed text-white/65 sm:text-base lg:col-span-7 lg:justify-self-end">
                Der Berg gibt den Takt vor. Dazwischen bleibt genügend Platz für
                Wetterwechsel, neue Ideen und lange Abende.
              </p>
            </div>
            <div className="mt-10 grid grid-cols-2 overflow-hidden rounded-2xl border border-white/12 sm:grid-cols-4 lg:grid-cols-8">
              {week.map((entry, index) => (
                <div
                  key={`${entry.day}-${index}`}
                  className="border-b border-r border-white/10 p-4 last:border-r-0 sm:p-5"
                >
                  <span className="text-[0.65rem] font-bold tracking-[0.2em] text-white/45">
                    {entry.day}
                  </span>
                  <span className="mt-8 block text-sm font-bold text-white">
                    {entry.label}
                  </span>
                </div>
              ))}
            </div>
            {lager?.aktivitaeten?.length ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {lager.aktivitaeten.slice(0, 8).map((aktivitaet) => (
                  <span
                    key={aktivitaet}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80"
                  >
                    {aktivitaet}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const WEEKDAYS = ["SO", "MO", "DI", "MI", "DO", "FR", "SA"];

function buildWeekDays(lager: LagerRecord | null) {
  if (!lager) {
    return [
      { day: "SA", label: "Ankommen" },
      { day: "SO", label: "Berg" },
      { day: "MO", label: "Berg" },
      { day: "DI", label: "Berg" },
      { day: "MI", label: "Berg" },
      { day: "DO", label: "Berg" },
      { day: "FR", label: "Berg" },
      { day: "SA", label: "Heimweg" },
    ];
  }

  const start = new Date(lager.datum_von).getTime();
  const end = new Date(lager.datum_bis).getTime();
  const days: { day: string; label: string }[] = [];
  for (let time = start; time <= end; time += 86_400_000) {
    days.push({
      day: WEEKDAYS[new Date(time).getDay()],
      label: time === start ? "Ankommen" : time === end ? "Heimweg" : "Berg",
    });
  }
  return days;
}

function HomeClosing({
  lager,
  fotosHref,
  fotosExtern,
}: {
  lager: LagerRecord | null;
  fotosHref: string;
  fotosExtern: boolean;
}) {
  const erwachsenenPreis = lager?.preise?.find((eintrag) =>
    /erwachsen/i.test(eintrag.label)
  );

  return (
    <section className="bg-white py-20 sm:py-28 lg:py-36">
      <div className="mx-auto grid max-w-[96rem] gap-4 px-3 sm:px-5 lg:grid-cols-[1.35fr_0.65fr]">
        <Reveal className="h-full">
          <div className="relative isolate flex min-h-[32rem] h-full overflow-hidden rounded-[2rem] bg-navy-900 p-7 text-white sm:p-10 lg:min-h-[38rem] lg:p-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-poster.jpg"
              alt=""
              className="absolute inset-0 -z-20 size-full object-cover opacity-60"
              aria-hidden="true"
            />
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-t from-navy-950 via-navy-950/30 to-transparent"
            />
            <div className="flex w-full flex-col justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                03 · Erinnerungen
              </p>
              <div>
                <h2 className="camp-display max-w-[10ch] text-4xl leading-[0.95] sm:text-6xl">
                  Fotos erzählen den Rest.
                </h2>
                <p className="mt-5 max-w-lg text-sm font-semibold leading-relaxed text-white/75 sm:text-base">
                  Platz für Bergmomente, Gruppenbilder und all die kleinen Szenen,
                  über die später noch gesprochen wird.
                </p>
                <Button
                  asChild
                  size="lg"
                  variant="white"
                  className="mt-8 rounded-full px-7"
                >
                  <a
                    href={fotosHref}
                    target={fotosExtern ? "_blank" : undefined}
                    rel={fotosExtern ? "noopener noreferrer" : undefined}
                  >
                    <Images />
                    Zur Galerie
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal className="h-full" delay={100}>
          <div className="flex min-h-[26rem] h-full flex-col justify-between rounded-[2rem] bg-[#ff7042] p-7 text-ink sm:p-10 lg:p-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-ink/60">
                Nächstes Kapitel
              </p>
              <h2 className="camp-display mt-5 text-4xl leading-[0.95] sm:text-5xl">
                {lager ? `Lager ${lager.jahr}` : "Bereit für Brigels?"}
              </h2>
              <p className="mt-5 max-w-sm text-sm font-semibold leading-relaxed text-ink/70 sm:text-base">
                {lager
                  ? `${formatDateRange(lager.datum_von, lager.datum_bis)} · Eine Woche Schnee, Menschen und gemeinsame Geschichten.`
                  : "Hier findet das nächste Lager seinen festen Platz: Termin, Infos und alles, was mit muss."}
              </p>
              {erwachsenenPreis && (
                <p className="mt-4 text-xs font-bold uppercase leading-relaxed tracking-[0.14em] text-ink/60">
                  Wochenpauschale {erwachsenenPreis.preis} · Unterkunft &amp; Verpflegung
                  inklusive
                </p>
              )}
            </div>
            <div className="mt-10 flex flex-col items-start gap-5">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-ink px-7 text-white hover:bg-navy-800"
              >
                <Link href={lager ? `/lager/${lager.jahr}` : "/lager"}>
                  {lager ? "Lagerdetails" : "Lagerübersicht"}
                  <ArrowUpRight />
                </Link>
              </Button>
              <Link
                href="/kontakt"
                className="inline-flex items-center gap-2 text-sm font-bold text-ink transition-opacity hover:opacity-65"
              >
                Fragen? Schreib uns
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
