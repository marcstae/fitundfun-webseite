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
import { AKZENT_STANDARD, akzentfarbe, kontrastZuWeiss } from "@/lib/utils";
import type { EinstellungenRecord } from "@/lib/pb-types";

const HEX = /^#[0-9a-f]{6}$/i;

export function AkzentfarbeSettings({ initial }: { initial: EinstellungenRecord | null }) {
  const router = useRouter();
  const [hex, setHex] = React.useState(akzentfarbe(initial?.akzentfarbe) || AKZENT_STANDARD);
  const { saving, run } = useSaveAction();
  const format = HEX.test(hex);
  const kontrast = format ? kontrastZuWeiss(hex) : 0;
  const lesbar = kontrast >= 4.5;
  const vorschau = format ? hex : AKZENT_STANDARD;

  const speichern = async (wert: string) => {
    if (!akzentfarbe(wert)) {
      toast.error("Diese Farbe ist zu hell: Weisse Schrift darauf wäre schlecht lesbar.");
      return;
    }
    await run(async () => {
      const pb = pbBrowser();
      // Standardfarbe als leeres Feld speichern, damit künftige Anpassungen der Vorgabe greifen.
      const data = { akzentfarbe: wert.toLowerCase() === AKZENT_STANDARD ? "" : wert.toLowerCase() };
      const record = initial ?? (await pb.collection("einstellungen").getList<EinstellungenRecord>(1, 1)).items[0];
      if (record) await pb.collection("einstellungen").update(record.id, data);
      else await pb.collection("einstellungen").create(data);
      setHex(wert.toLowerCase());
      await revalidatePath("/");
      router.refresh();
    });
  };

  return (
    <section className="rounded-[1.75rem] border border-ink/10 bg-white p-6 sm:p-8">
      <h2 className="font-display text-2xl text-ink">Akzentfarbe</h2>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">
        Farbe für Knöpfe, Links und Symbole auf hellem Grund, auf der ganzen Website. Das Orange auf
        dunklen Flächen bleibt.
      </p>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label htmlFor="akzent-farbe">Farbe wählen</Label>
          <input
            id="akzent-farbe"
            type="color"
            value={vorschau}
            onChange={(e) => setHex(e.target.value)}
            className="block h-12 w-20 cursor-pointer rounded-xl border border-ink/15 bg-white p-1"
          />
        </div>
        <div className="w-40 space-y-2">
          <Label htmlFor="akzent-hex">Farbcode</Label>
          <Input id="akzent-hex" value={hex} maxLength={7} onChange={(e) => setHex(e.target.value.trim())} aria-describedby="akzent-status" />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-sand p-4">
        <span
          className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-bold text-white"
          style={{ backgroundColor: vorschau }}
        >
          Vorschau Knopf <ArrowRight className="size-4" />
        </span>
        <span className="text-sm font-bold underline" style={{ color: vorschau }}>
          Vorschau Link
        </span>
      </div>
      <p id="akzent-status" role="status" className={`mt-3 text-sm font-semibold ${format && lesbar ? "text-emerald-700" : "text-red-700"}`}>
        {!format
          ? "Farbcode im Format #1a2b3c eingeben."
          : lesbar
            ? `Gut lesbar: Kontrast zu weisser Schrift ${kontrast.toFixed(1)} : 1.`
            : `Zu hell: Kontrast zu weisser Schrift nur ${kontrast.toFixed(1)} : 1 (mindestens 4.5 : 1 nötig).`}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={() => speichern(hex)} disabled={saving || !format || !lesbar}>
          {saving ? "Speichert…" : "Akzentfarbe speichern"}
        </Button>
        <Button variant="outline" onClick={() => speichern(AKZENT_STANDARD)} disabled={saving}>
          <RotateCcw className="size-4" /> Standard (Eisblau)
        </Button>
      </div>
    </section>
  );
}
