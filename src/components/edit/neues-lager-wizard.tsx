"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { useEditMode } from "./edit-button";
import { Button } from "@/components/ui/button";
import { SaveDialog, useSaveAction } from "./save-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** "Neues Lager anlegen" — 2-Schritt-Wizard (Jahr + Daten). */
export function NeuesLagerButton() {
  const { canEdit, editMode } = useEditMode();
  const [open, setOpen] = React.useState(false);
  const [jahr, setJahr] = React.useState<string>("");
  const [von, setVon] = React.useState("");
  const [bis, setBis] = React.useState("");
  const { saving, run } = useSaveAction();

  if (!canEdit || !editMode) return null;

  const submit = async () => {
    const j = Number(jahr);
    if (!j || j < 2007 || j > 2100) {
      toast.error("Bitte ein gültiges Jahr eingeben (z. B. 2027).");
      return;
    }
    if (!von || !bis) {
      toast.error("Bitte Datum von und bis auswählen.");
      return;
    }
    const ok = await run(
      async () => {
        const pb = pbBrowser();
        await pb.collection("lager").create({
          jahr: j,
          titel: `Lager ${j}`,
          datum_von: new Date(von).toISOString(),
          datum_bis: new Date(bis).toISOString(),
          beschreibung: "",
          youtube_url: "",
        });
        await revalidatePath("/");
        await revalidatePath("/lager");
      },
      "Anlegen fehlgeschlagen — existiert das Jahr bereits?"
    );
    if (ok) {
      setOpen(false);
      setJahr("");
      setVon("");
      setBis("");
    }
  };

  const nextJahr = new Date().getFullYear() + 1;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        <Plus /> Neues Lager anlegen
      </Button>
      <SaveDialog
        open={open}
        onOpenChange={setOpen}
        title="Neues Lager anlegen"
        description="Danach ist das neue Jahr sofort live auf der Startseite und im Archiv."
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
            <Label htmlFor="nl-von">Datum von</Label>
            <Input
              id="nl-von"
              type="date"
              value={von}
              onChange={(e) => setVon(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nl-bis">Datum bis</Label>
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
          später angepasst werden.
        </p>
      </SaveDialog>
    </>
  );
}