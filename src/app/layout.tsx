import type { Metadata, Viewport } from "next";
import { Archivo, Fredoka } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteChrome } from "@/components/site-chrome";
import { getAktuellesLager, getEinstellungen } from "@/lib/data";
import { siteUrl } from "@/lib/site";
import { akzentfarbe, DUNKLER_GRUND, formatDateRange } from "@/lib/utils";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-archivo",
  display: "swap",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-camp",
  display: "swap",
});
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "fit&fun Lager Brigels",
    template: "%s · fit&fun Lager Brigels",
  },
  description:
    "Informationen und Dokumente zum fit&fun Familienlager in Brigels, Graubünden.",
  openGraph: {
    title: "fit&fun Lager Brigels",
    description:
      "Informationen und Dokumente zum fit&fun Familienlager in Brigels.",
    locale: "de_CH",
    type: "website",
  },
  robots: { index: true, follow: true },
};

// Seite reicht bis hinter Statusleiste und Notch (Startbild randlos auf dem Handy). Alles, was
// oben oder seitlich klebt, hält mit env(safe-area-inset-*) Abstand; seitlich macht das der body.
export const viewport: Viewport = { viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Ohne PB nur den Menüeintrag des aktuellen Lagers weglassen, nicht jede Seite brechen.
  const [aktuellesLager, einstellungen] = await Promise.all([
    getAktuellesLager().catch(() => null),
    getEinstellungen().catch(() => null),
  ]);
  // Akzentfarben aus dem Cockpit überschreiben die Variablen aus globals.css (nur geprüfte Werte).
  const akzent = akzentfarbe(einstellungen?.akzentfarbe);
  const akzentDunkel = akzentfarbe(einstellungen?.akzentfarbe_dunkel, DUNKLER_GRUND);
  const farben = {
    ...(akzent ? { "--color-accent": akzent } : {}),
    ...(akzentDunkel ? { "--color-accent-light": akzentDunkel } : {}),
  } as React.CSSProperties;
  return (
    <html
      lang="de-CH"
      className={`${archivo.variable} ${fredoka.variable}`}
      style={akzent || akzentDunkel ? farben : undefined}
    >
      <body className="min-h-dvh flex flex-col pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <Providers>
          <SiteChrome
            aktuellesJahr={aktuellesLager?.jahr ?? null}
            lagerZeitraum={
              aktuellesLager?.datum_von && aktuellesLager.datum_bis
                ? formatDateRange(aktuellesLager.datum_von, aktuellesLager.datum_bis)
                : null
            }
          >
            {children}
          </SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
