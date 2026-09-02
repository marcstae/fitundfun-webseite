"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SaveDialog, useSaveAction } from "./save-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** "Neues Lager anlegen" — 2-Schritt-Wizard (Jahr + Daten). */
export function NeuesLagerButton({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter();
  const nextJahr = new Date().getFullYear() + 1;
  const [open, setOpen] = React.useState(defaultOpen);
  const [jahr, setJahr] = React.useState(String(nextJahr));
  const [von, setVon] = React.useState("");
  const [bis, setBis] = React.useState("");
  const { saving, run } = useSaveAction();

  const submit = async () => {
    const j = Number(jahr);
    if (!j || j < 2007 || j > 2100) {
      toast.error("Bitte ein gültiges Jahr eingeben (z. B. 2027).");
      return;
    }
    if (!!von !== !!bis) {
      toast.error("Bitte beide Daten ausfüllen oder den Zeitraum vorerst leer lassen.");
      return;
    }
    if (von && bis && new Date(bis) < new Date(von)) {
      toast.error("Das Enddatum muss nach dem Startdatum liegen.");
      return;
    }
    let createdId = "";
    const ok = await run(
      async () => {
        const pb = pbBrowser();
        const created = await pb.collection("lager").create({
          jahr: j,
          titel: `Lager ${j}`,
          datum_von: von ? new Date(von).toISOString() : "",
          datum_bis: bis ? new Date(bis).toISOString() : "",
          beschreibung: "",
          youtube_url: "",
          quelle_url: "",
          teilnehmer: null,
          preise: [],
          aktivitaeten: [],
          status: "entwurf",
        });
        createdId = created.id;
        await revalidatePath("/");
        await revalidatePath("/lager");
      },
      "Anlegen fehlgeschlagen — existiert das Jahr bereits?"
    );
    if (ok) {
      setOpen(false);
      setJahr(String(nextJahr));
      setVon("");
      setBis("");
      router.push(`/admin/lager/${createdId}`);
      router.refresh();
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        <Plus /> Neues Lager anlegen
      </Button>
      <SaveDialog
        open={open}
        onOpenChange={setOpen}
        title="Neues Lager anlegen"
        description="Das Lager wird als Entwurf angelegt und ist noch nicht öffentlich."
        saveLabel="Lager anlegen"
        saving={saving}
        onSave={submit}
      >
        <div className="space-y-2">
          <Label htmlFor="nl-jahr">Jahr</Label>
          <Input
            id="nl-jahr"
            type="number"
            inputMode="numeric"
            placeholder={String(nextJahr)}
            value={jahr}
            onChange={(e) => setJahr(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="nl-von">Datum von (optional)</Label>
            <Input
              id="nl-von"
              type="date"
              value={von}
              onChange={(e) => setVon(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nl-bis">Datum bis (optional)</Label>
            <Input
              id="nl-bis"
              type="date"
              value={bis}
              onChange={(e) => setBis(e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-muted">
          Titel wird automatisch auf «Lager {jahr || nextJahr}» gesetzt und kann
          später angepasst werden. Der Zeitraum kann ebenfalls später erfasst werden.
        </p>
      </SaveDialog>
    </>
  );
}
