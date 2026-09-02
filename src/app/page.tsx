import Link from "next/link";
import { ArrowUpRight, CalendarDays, Images, MapPin } from "lucide-react";
import { getAktuellesLager, getEinstellungen } from "@/lib/data";
import { publicFileUrl } from "@/lib/pb";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/lib/utils";
import { HeroVideo } from "@/components/hero-video";

export const revalidate = 300;

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
        className="camp-hero relative h-dvh overflow-hidden bg-sand p-2 sm:p-3"
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

          <div className="relative z-10 mx-auto flex h-full w-full max-w-[96rem] flex-col px-5 pb-6 pt-24 sm:px-8 sm:pb-8 lg:px-12 lg:pb-11 xl:pt-9">

            <div className="mt-auto w-full max-xl:contents xl:grid xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:items-end xl:gap-x-8">
              <div className="camp-hero-kicker order-2 mb-5 flex flex-wrap gap-2 max-xl:mt-auto sm:mb-7 xl:col-span-2 xl:row-start-1">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-3.5 py-2 text-xs font-bold text-white backdrop-blur-md sm:text-sm">
                  <CalendarDays className="size-4 text-[#ffad7a]" />
                  {lager
                    ? `Lager ${lager.jahr} · ${formatDateRange(lager.datum_von, lager.datum_bis)}`
                    : "Eine Woche Winter"}
                </span>
              </div>

              <div className="order-1 xl:col-start-1 xl:mb-5 xl:row-start-2">
                <div className="camp-hero-meta mb-3 flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white sm:text-xs">
                  <MapPin className="size-3.5 text-[#ffad7a]" />
                  Brigels · Graubünden
                </div>
                <h1
                  id="hero-headline"
                  className="camp-hero-title max-w-[11ch] font-display text-[clamp(3.4rem,10vw,8.75rem)] leading-[0.8] tracking-[-0.075em] text-[#fffaf0]"
                >
                  {renderHeroTitel(heroTitel)}
                </h1>
              </div>

              <div className="camp-hero-bottom order-3 mt-6 flex justify-end sm:mt-8 xl:col-start-2 xl:mt-0 xl:min-w-0 xl:row-start-2">
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
            className="pointer-events-none absolute inset-3 z-20 rounded-[1.05rem] border border-white/40 sm:inset-4 sm:rounded-[1.45rem]"
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
