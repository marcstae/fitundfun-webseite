import type { Metadata } from "next";
import { Archivo, Archivo_Black, Fredoka } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteChrome } from "@/components/site-chrome";
import { getAktuellesLager } from "@/lib/data";
import { siteUrl } from "@/lib/site";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-archivo",
  display: "swap",
});

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-archivo-black",
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
    "Eine Woche Schnee, Sonne und Familie — seit 2007. Familien-Skilager in Brigels, Graubünden.",
  openGraph: {
    title: "fit&fun Lager Brigels",
    description:
      "Eine Woche Schnee, Sonne und Familie — seit 2007. Skilager in Brigels.",
    locale: "de_CH",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const aktuellesLager = await getAktuellesLager();
  return (
    <html
      lang="de-CH"
      className={`${archivo.variable} ${archivoBlack.variable} ${fredoka.variable}`}
    >
      <body className="min-h-dvh flex flex-col">
        <Providers>
          <SiteChrome aktuellesJahr={aktuellesLager?.jahr ?? null}>
            {children}
          </SiteChrome>
        </Providers>
      </body>
    </html>
  );
}
