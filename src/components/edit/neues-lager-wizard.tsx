"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { useEditMode } from "./edit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isoToDateInput } from "@/lib/utils";

/** "Neues Lager anlegen" — 2-Schritt-Wizard (Jahr + Daten). */
export function NeuesLagerButton() {
  const { canEdit, editMode } = useEditMode();
  const [open, setOpen] = React.useState(false);
  const [jahr, setJahr] = React.useState<string>("");
  const [von, setVon] = React.useState("");
  const [bis, setBis] = React.useState("");
  const [saving, setSaving] = React.useState(false);

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
    setSaving(true);
    try {
      const pb = pbBrowser();
      await pb.collection("lager").create({
        jahr: j,
        titel: `Lager ${j}`,
        datum_von: new Date(von).toISOString(),
        datum_bis: new Date(bis).toISOString(),
        beschreibung: "",
        youtube_url: "",
        immich_url: "",
      });
      await revalidatePath("/");
      await revalidatePath("/lager");
      toast.success("Lager angelegt ✓");
      setOpen(false);
      setJahr("");
      setVon("");
      setBis("");
    } catch (e) {
      toast.error("Anlegen fehlgeschlagen — existiert das Jahr bereits?");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const nextJahr = new Date().getFullYear() + 1;

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="w-full sm:w-auto">
        <Plus /> Neues Lager anlegen
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Lager anlegen</DialogTitle>
            <DialogDescription>
              Danach ist das neue Jahr sofort live auf der Startseite und im Archiv.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
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
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Abbrechen
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Speichert…" : "Lager anlegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { isoToDateInput };
