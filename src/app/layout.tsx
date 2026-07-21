import type { Metadata } from "next";
import { Archivo, Archivo_Black } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EditBar } from "@/components/edit/edit-bar";

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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de-CH" className={`${archivo.variable} ${archivoBlack.variable}`}>
      <body className="min-h-dvh flex flex-col">
        <Providers>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <EditBar />
        </Providers>
      </body>
    </html>
  );
}
