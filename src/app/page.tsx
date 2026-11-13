import type { Viewport } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Images } from "lucide-react";
import { getAktuellesLager, getEinstellungen } from "@/lib/data";
import { publicFileUrl } from "@/lib/pb";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/lib/utils";
import { HeroVideo } from "@/components/hero-video";

export const revalidate = 300;
// Für Browser, die nicht hinter die Statusleiste zeichnen: Leiste dunkel wie das Startbild.
export const viewport: Viewport = { themeColor: "#0f1e33" };

export default async function HomePage() {
  const [lager, einstellungen] = await Promise.all([
    getAktuellesLager(),
    getEinstellungen(),
  ]);

  const heroTitel = einstellungen?.hero_titel || "fit&fun Lager Brigels";
  const heroVideoUrl = einstellungen?.hero_video
    ? publicFileUrl("einstellungen", einstellungen.id, einstellungen.hero_video)
    : "/hero.mp4";
  const heroPosterUrl = einstellungen?.hero_poster
    ? publicFileUrl("einstellungen", einstellungen.id, einstellungen.hero_poster)
    : "/hero-poster.jpg";
  const lagerHref = lager ? `/lager/${lager.jahr}` : "/lager";

  return (
      <section
        className="camp-hero relative h-dvh min-h-[36rem] overflow-hidden bg-sand sm:p-3"
        aria-labelledby="hero-headline"
      >
        {/* Handy: randlos bis an den Bildschirmrand und hinter die Statusleiste. Ab sm: Rahmen. */}
        <div className="relative isolate h-full overflow-hidden bg-navy-900 sm:rounded-[2rem]">
          <HeroVideo
            videoUrl={heroVideoUrl}
            posterUrl={heroPosterUrl}
            className="camp-hero-media z-0"
          />
          <div aria-hidden className="camp-hero-wash pointer-events-none absolute inset-0 z-[1]" />
          <div aria-hidden className="camp-hero-grain pointer-events-none absolute inset-0 z-[4]" />

          {/* Abstand gleich wie Logo und Menü, siehe site-header: Handy 24 px vom Bildschirmrand
              (plus Statusleiste und Home-Balken), ab sm 24/32 px vom weissen Rahmen. */}
          <div className="relative z-10 mx-auto flex h-full w-full max-w-[96rem] flex-col px-6 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+0.75rem))] pt-[calc(6rem+env(safe-area-inset-top))] sm:px-10 sm:pb-10 sm:pt-32 lg:px-12 lg:pb-12 xl:pt-9">

            <div className="mt-auto w-full max-xl:contents xl:grid xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:items-end xl:gap-x-8">
              {/* Datum: auf dem Handy ausgeblendet (wenig Platz); ab md mittig über den Knöpfen, ab xl links über dem Titel. */}
              <div className="camp-hero-kicker order-2 mb-6 hidden justify-center max-xl:mt-auto md:flex xl:col-span-2 xl:row-start-1 xl:justify-start">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-sm font-bold text-white backdrop-blur-md">
                  <CalendarDays className="size-4 text-accent-light" />
                  {lager
                    ? `Lager ${lager.jahr} · ${formatDateRange(lager.datum_von, lager.datum_bis)}`
                    : "Eine Woche Winter"}
                </span>
              </div>

              <div className="order-1 xl:col-start-1 xl:mb-5 xl:row-start-2">
                <h1
                  id="hero-headline"
                  className="camp-hero-title max-w-[11ch] font-display text-[clamp(3.4rem,10vw,8.75rem)] leading-[0.8] tracking-[-0.075em] text-[#fffaf0]"
                >
                  {renderHeroTitel(heroTitel)}
                </h1>
              </div>

              <div className="camp-hero-bottom order-3 flex justify-center max-md:mt-auto xl:col-start-2 xl:min-w-0 xl:row-start-2 xl:justify-end">
                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                  <Button
                    asChild
                    size="lg"
                    className="w-full rounded-full bg-accent-light px-7 text-ink shadow-[0_12px_35px_color-mix(in_oklab,var(--color-accent-light)_35%,transparent)] hover:bg-white sm:w-auto"
                  >
                    <Link href={lagerHref}>
                      {lager ? `Lager ${lager.jahr}` : "Alle Lager"}
                      <ArrowRight />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="white"
                    className="w-full rounded-full border border-white/35 bg-white/90 px-7 hover:bg-white sm:w-auto"
                  >
                    {/* /fotos leitet serverseitig zum Album oder zur Passwortabfrage weiter. */}
                    <a href="/fotos" target="_blank" rel="noopener noreferrer">
                      <Images />
                      Fotos &amp; Videos
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-4 z-20 hidden rounded-[1.45rem] border border-white/40 sm:block"
          />
        </div>
      </section>

  );
}

function renderHeroTitel(titel: string) {
  const lagerIndex = titel.toLowerCase().indexOf(" lager");
  if (lagerIndex > 0) {
    return (
      <>
        <span className="block">{renderHeroLine(titel.slice(0, lagerIndex))}</span>
        <span className="mt-[calc(0.12em_+_2px)] block text-[0.61em] tracking-[-0.055em]">
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
