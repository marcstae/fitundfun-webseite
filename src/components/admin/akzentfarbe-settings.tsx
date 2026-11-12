"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaveAction } from "@/components/edit/save-dialog";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { AKZENT_DUNKEL_STANDARD, AKZENT_STANDARD, akzentfarbe, DUNKLER_GRUND, kontrast } from "@/lib/utils";
import type { EinstellungenRecord } from "@/lib/pb-types";

const HEX = /^#[0-9a-f]{6}$/i;

const WAHLEN = [
  {
    feld: "akzentfarbe",
    titel: "Auf hellem Grund",
    text: "Knöpfe, Links und Symbole auf weissen und hellen Flächen. Die Schrift darauf ist weiss.",
    standard: AKZENT_STANDARD,
    standardName: "Eisblau",
    gegen: "#ffffff",
    gegenName: "weisser Schrift",
  },
  {
    feld: "akzentfarbe_dunkel",
    titel: "Auf dunklem Grund",
    text: "Hervorhebungen auf nachtblauen Flächen: «Aktuell» und «Dokumente» im Menü, der Lager-Knopf und das «&» auf der Startseite, die Kurzfakten beim Lagerhaus. Die Schrift darauf ist nachtblau.",
    standard: AKZENT_DUNKEL_STANDARD,
    standardName: "Signalorange",
    gegen: DUNKLER_GRUND,
    gegenName: "Nachtblau",
  },
] as const;
type Feld = (typeof WAHLEN)[number]["feld"];

export function AkzentfarbeSettings({ initial }: { initial: EinstellungenRecord | null }) {
  const router = useRouter();
  const [farben, setFarben] = React.useState<Record<Feld, string>>({
    akzentfarbe: akzentfarbe(initial?.akzentfarbe) || AKZENT_STANDARD,
    akzentfarbe_dunkel: akzentfarbe(initial?.akzentfarbe_dunkel, DUNKLER_GRUND) || AKZENT_DUNKEL_STANDARD,
  });
  const { saving, run } = useSaveAction();
  const alleLesbar = WAHLEN.every((w) => akzentfarbe(farben[w.feld], w.gegen));

  const speichern = async () => {
    if (!alleLesbar) {
      toast.error("Eine Farbe ist auf ihrem Grund schlecht lesbar. Bitte anpassen.");
      return;
    }
    await run(async () => {
      const pb = pbBrowser();
      // Standardfarben als leeres Feld speichern, damit künftige Anpassungen der Vorgabe greifen.
      const data = Object.fromEntries(
        WAHLEN.map((w) => [w.feld, farben[w.feld].toLowerCase() === w.standard ? "" : farben[w.feld].toLowerCase()])
      );
      const record = initial ?? (await pb.collection("einstellungen").getList<EinstellungenRecord>(1, 1)).items[0];
      if (record) await pb.collection("einstellungen").update(record.id, data);
      else await pb.collection("einstellungen").create(data);
      await revalidatePath("/");
      router.refresh();
    });
  };

  return (
    <section className="rounded-[1.75rem] border border-ink/10 bg-white p-6 sm:p-8">
      <h2 className="font-display text-2xl text-ink">Akzentfarben</h2>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">
        Zwei Farben für die ganze Website: eine für helle und eine für dunkle Flächen.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {WAHLEN.map((w) => (
          <FarbWahl
            key={w.feld}
            wahl={w}
            wert={farben[w.feld]}
            onChange={(wert) => setFarben((f) => ({ ...f, [w.feld]: wert }))}
          />
        ))}
      </div>

      <Button onClick={speichern} disabled={saving || !alleLesbar} className="mt-6">
        {saving ? "Speichert…" : "Akzentfarben speichern"}
      </Button>
    </section>
  );
}

function FarbWahl({
  wahl,
  wert,
  onChange,
}: {
  wahl: (typeof WAHLEN)[number];
  wert: string;
  onChange: (wert: string) => void;
}) {
  const format = HEX.test(wert);
  const vorschau = format ? wert : wahl.standard;
  const k = format ? kontrast(wert, wahl.gegen) : 0;
  const lesbar = k >= 4.5;
  const dunkel = wahl.feld === "akzentfarbe_dunkel";
  const id = `farbe-${wahl.feld}`;

  return (
    <div className="rounded-2xl border border-ink/10 p-4 sm:p-5">
      <h3 className="font-bold text-ink">{wahl.titel}</h3>
      <p className="mt-1 text-sm leading-relaxed text-muted">{wahl.text}</p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor={`${id}-wahl`}>Farbe</Label>
          <input
            id={`${id}-wahl`}
            type="color"
            value={vorschau}
            onChange={(e) => onChange(e.target.value)}
            className="block h-12 w-20 cursor-pointer rounded-xl border border-ink/15 bg-white p-1"
          />
        </div>
        <div className="w-36 space-y-2">
          <Label htmlFor={`${id}-hex`}>Farbcode</Label>
          <Input id={`${id}-hex`} value={wert} maxLength={7} onChange={(e) => onChange(e.target.value.trim())} aria-describedby={`${id}-status`} />
        </div>
        <Button type="button" variant="outline" onClick={() => onChange(wahl.standard)} disabled={wert.toLowerCase() === wahl.standard}>
          <RotateCcw className="size-4" /> {wahl.standardName}
        </Button>
      </div>

      <div className={`mt-4 flex flex-wrap items-center gap-3 rounded-xl p-4 ${dunkel ? "bg-ink" : "bg-sand"}`}>
        <span
          className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold ${dunkel ? "text-ink" : "text-white"}`}
          style={{ backgroundColor: vorschau }}
        >
          {dunkel ? "Lager 2027" : "Vorschau Knopf"} <ArrowRight className="size-4" />
        </span>
        <span className={`text-sm font-bold ${dunkel ? "uppercase tracking-[0.18em]" : "underline"}`} style={{ color: vorschau }}>
          {dunkel ? "Aktuell" : "Vorschau Link"}
        </span>
      </div>
      <p id={`${id}-status`} role="status" className={`mt-3 text-sm font-semibold ${format && lesbar ? "text-emerald-700" : "text-red-700"}`}>
        {!format
          ? "Farbcode im Format #1a2b3c eingeben."
          : lesbar
            ? `Gut lesbar: Kontrast zu ${wahl.gegenName} ${k.toFixed(1)} : 1.`
            : `Schlecht lesbar: Kontrast zu ${wahl.gegenName} nur ${k.toFixed(1)} : 1 (mindestens 4.5 : 1 nötig).`}
      </p>
    </div>
  );
}
