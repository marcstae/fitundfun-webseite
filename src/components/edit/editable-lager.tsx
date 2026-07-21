"use client";

import * as React from "react";
import { toast } from "sonner";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MinimalEditor } from "./minimal-editor";
import { EditButton } from "./edit-button";
import { isoToDateInput, formatDateRange } from "@/lib/utils";
import type { LagerRecord } from "@/lib/pb-types";

export function EditableLagerDaten({ lager }: { lager: LagerRecord }) {
  const [open, setOpen] = React.useState(false);
  const [jahr, setJahr] = React.useState(String(lager.jahr));
  const [titel, setTitel] = React.useState(lager.titel || "");
  const [von, setVon] = React.useState(isoToDateInput(lager.datum_von));
  const [bis, setBis] = React.useState(isoToDateInput(lager.datum_bis));
  const [beschreibung, setBeschreibung] = React.useState(lager.beschreibung || "");
  const [saving, setSaving] = React.useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await pbBrowser()
        .collection("lager")
        .update(lager.id, {
          jahr: Number(jahr),
          titel: titel || `Lager ${jahr}`,
          datum_von: new Date(von).toISOString(),
          datum_bis: new Date(bis).toISOString(),
          beschreibung,
        });
      await revalidatePath(`/lager/${lager.jahr}`);
      await revalidatePath("/");
      await revalidatePath("/lager");
      toast.success("Gespeichert ✓");
      setOpen(false);
    } catch (e) {
      toast.error("Speichern fehlgeschlagen");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="inline-flex items-center gap-2 text-sm text-white/70">
        <span>{formatDateRange(lager.datum_von, lager.datum_bis)}</span>
        <EditButton label="Lagerdaten bearbeiten" onClick={() => setOpen(true)} />
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lagerdaten bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ld-jahr">Jahr</Label>
                <Input
                  id="ld-jahr"
                  type="number"
                  value={jahr}
                  onChange={(e) => setJahr(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ld-titel">Titel</Label>
                <Input
                  id="ld-titel"
                  value={titel}
                  placeholder={`Lager ${jahr}`}
                  onChange={(e) => setTitel(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="ld-von">Datum von</Label>
                <Input
                  id="ld-von"
                  type="date"
                  value={von}
                  onChange={(e) => setVon(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ld-bis">Datum bis</Label>
                <Input
                  id="ld-bis"
                  type="date"
                  value={bis}
                  onChange={(e) => setBis(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ld-beschreibung">Beschreibung</Label>
              <MinimalEditor
                value={beschreibung}
                onChange={setBeschreibung}
                placeholder="Programm-Highlights, Kurzbeschrieb…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={saving}>
              Abbrechen
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Speichert…" : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
