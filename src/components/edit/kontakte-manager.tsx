"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Lock, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SaveDialog, useSaveAction } from "./save-dialog";
import type { KontaktgruppeRecord, KontaktRecord } from "@/lib/pb-types";

export function KontakteManager({ existing, gruppen }: { existing: KontaktRecord[]; gruppen: KontaktgruppeRecord[] }) {
  const [items, setItems] = React.useState(existing);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<KontaktRecord | null>(null);

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const previous = items;
    const swapped = [...items];
    [swapped[index], swapped[target]] = [swapped[target], swapped[index]];
    const next = swapped.map((item, sort) => ({ ...item, sort: sort + 1 }));
    setItems(next);
    try {
      await Promise.all(next.map((item) => pbBrowser().collection("kontakte").update(item.id, { sort: item.sort })));
      await revalidatePath("/kontakt");
      toast.success("Reihenfolge gespeichert");
    } catch {
      setItems(previous);
      toast.error("Reihenfolge konnte nicht gespeichert werden.");
    }
  };
  const del = async (it: KontaktRecord) => {
    if (!window.confirm(`«${it.name}» löschen?`)) return;
    try {
      await pbBrowser().collection("kontakte").delete(it.id);
      await revalidatePath("/kontakt");
      toast.success("Gelöscht");
      setItems((s) => s.filter((x) => x.id !== it.id));
    } catch (e) {
      toast.error("Löschen fehlgeschlagen");
      console.error(e);
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-accent/30 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">
          Kontakte verwalten
        </span>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus /> Hinzufügen
        </Button>
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((it, index) => (
          <li key={it.id} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-lg bg-ink/[0.03] px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 basis-40">
              <span className="block truncate font-semibold">{it.name}</span>
              <span className="block text-xs font-semibold text-muted">{gruppen.find((g) => g.id === it.gruppe)?.name ?? "Ohne Gruppe"}</span>
              {[
                [it.email, it.email_geschuetzt],
                [it.telefon, it.telefon_geschuetzt],
              ].map(([wert, geschuetzt], i) =>
                wert ? (
                  <span key={i} className="flex items-center gap-1 text-xs text-muted">
                    <span className="truncate">{wert}</span>
                    {geschuetzt ? <Lock className="size-3 shrink-0" aria-label="nur mit Lagerpasswort" /> : null}
                  </span>
                ) : null
              )}
            </span>
            <span className="flex shrink-0 gap-1">
              <button onClick={() => move(index, -1)} disabled={index === 0} className="inline-flex size-10 items-center justify-center rounded-md sm:size-8 text-ink/60 hover:bg-ink/10 disabled:opacity-25" aria-label={`${it.name} nach oben verschieben`}><ArrowUp className="size-4" /></button>
              <button onClick={() => move(index, 1)} disabled={index === items.length - 1} className="inline-flex size-10 items-center justify-center rounded-md sm:size-8 text-ink/60 hover:bg-ink/10 disabled:opacity-25" aria-label={`${it.name} nach unten verschieben`}><ArrowDown className="size-4" /></button>
              <button onClick={() => { setEditing(it); setOpen(true); }} className="inline-flex size-10 items-center justify-center rounded-md sm:size-8 text-ink/60 hover:bg-ink/10 hover:text-ink" aria-label="Bearbeiten">
                <Pencil className="size-4" />
              </button>
              <button onClick={() => del(it)} className="inline-flex size-10 items-center justify-center rounded-md sm:size-8 text-red-600/70 hover:bg-red-50 hover:text-red-600" aria-label="Löschen">
                <Trash2 className="size-4" />
              </button>
            </span>
          </li>
        ))}
      </ul>
      {open && (
        <KontaktForm
          item={editing}
          gruppen={gruppen}
          nextSort={Math.max(0, ...items.map((item) => item.sort || 0)) + 1}
          onSaved={() => { setOpen(false); window.location.reload(); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function KontaktForm({
  item,
  gruppen,
  nextSort,
  onSaved,
  onClose,
}: {
  item: KontaktRecord | null;
  gruppen: KontaktgruppeRecord[];
  nextSort: number;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(item?.name || "");
  const [email, setEmail] = React.useState(item?.email || "");
  const [telefon, setTelefon] = React.useState(item?.telefon || "");
  // Neue Kontakte: Angaben zuerst nur mit Lagerpasswort (Datenschutz durch Voreinstellung).
  const [emailGeschuetzt, setEmailGeschuetzt] = React.useState(item ? !!item.email_geschuetzt : true);
  const [telefonGeschuetzt, setTelefonGeschuetzt] = React.useState(item ? !!item.telefon_geschuetzt : true);
  const [gruppe, setGruppe] = React.useState(item?.gruppe || gruppen[0]?.id || "");
  const { saving, run } = useSaveAction();

  const save = async () => {
    if (!gruppen.some((g) => g.id === gruppe)) {
      toast.error("Bitte eine Gruppe wählen (oder zuerst unten eine Gruppe anlegen).");
      return;
    }
    if (!name.trim()) {
      toast.error("Bitte einen Namen eingeben.");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Bitte eine gültige E-Mail-Adresse eingeben oder das Feld leer lassen.");
      return;
    }
    if (telefon.trim() && !/^\+?[\d\s()/.-]{6,40}$/.test(telefon.trim())) {
      toast.error("Bitte eine gültige Telefonnummer eingeben (Ziffern, Leerzeichen, +) oder das Feld leer lassen.");
      return;
    }
    const ok = await run(async () => {
      const pb = pbBrowser();
      const data = {
        name: name.trim(),
        email: email.trim(),
        telefon: telefon.trim(),
        email_geschuetzt: emailGeschuetzt,
        telefon_geschuetzt: telefonGeschuetzt,
        gruppe,
      };
      if (item) {
        await pb.collection("kontakte").update(item.id, data);
      } else {
        await pb.collection("kontakte").create({ ...data, sort: nextSort });
      }
      await revalidatePath("/kontakt");
    });
    if (ok) onSaved();
  };

  return (
    <SaveDialog
      open
      onOpenChange={(o) => { if (!o) onClose(); }}
      title={item ? "Kontakt bearbeiten" : "Kontakt hinzufügen"}
      saving={saving}
      onSave={save}
    >
      <div className="space-y-2">
        <Label htmlFor="k-gruppe">Gruppe</Label>
        <select
          id="k-gruppe"
          value={gruppe}
          onChange={(e) => setGruppe(e.target.value)}
          className="flex h-12 w-full rounded-xl border border-ink/15 bg-white px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30"
        >
          {gruppe ? null : <option value="">Gruppe wählen</option>}
          {gruppen.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="k-name">Name</Label>
        <Input id="k-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="k-email">E-Mail</Label>
        <Input
          id="k-email"
          type="email"
          inputMode="email"
          autoComplete="off"
          value={email}
          placeholder="optional"
          onChange={(e) => setEmail(e.target.value)}
        />
        <NurMitPasswort id="k-email-geschuetzt" checked={emailGeschuetzt} onChange={setEmailGeschuetzt} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="k-telefon">Telefon</Label>
        <Input
          id="k-telefon"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          value={telefon}
          placeholder="optional, z. B. 079 123 45 67"
          onChange={(e) => setTelefon(e.target.value)}
        />
        <NurMitPasswort id="k-telefon-geschuetzt" checked={telefonGeschuetzt} onChange={setTelefonGeschuetzt} />
      </div>
    </SaveDialog>
  );
}

function NurMitPasswort({ id, checked, onChange }: { id: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 accent-[var(--color-accent)]"
      />
      Nur mit Lagerpasswort sichtbar
    </label>
  );
}

/** Gruppen der Kontaktseite: anlegen, umbenennen, sortieren, löschen (nur leere Gruppen). */
export function GruppenManager({ existing, kontakte }: { existing: KontaktgruppeRecord[]; kontakte: KontaktRecord[] }) {
  const [items, setItems] = React.useState(existing);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<KontaktgruppeRecord | null>(null);
  const anzahl = (id: string) => kontakte.filter((k) => k.gruppe === id).length;

  const move = async (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const previous = items;
    const swapped = [...items];
    [swapped[index], swapped[target]] = [swapped[target], swapped[index]];
    const next = swapped.map((item, sort) => ({ ...item, sort: sort + 1 }));
    setItems(next);
    try {
      await Promise.all(next.map((item) => pbBrowser().collection("kontaktgruppen").update(item.id, { sort: item.sort })));
      await revalidatePath("/kontakt");
      toast.success("Reihenfolge gespeichert");
    } catch {
      setItems(previous);
      toast.error("Reihenfolge konnte nicht gespeichert werden.");
    }
  };
  const del = async (it: KontaktgruppeRecord) => {
    const pb = pbBrowser();
    try {
      // Frisch nachzählen: Kontakte könnten inzwischen verschoben worden sein.
      const { totalItems } = await pb.collection("kontakte").getList(1, 1, { filter: pb.filter("gruppe = {:id}", { id: it.id }) });
      if (totalItems > 0) {
        toast.error(`«${it.name}» enthält noch ${totalItems === 1 ? "einen Kontakt" : `${totalItems} Kontakte`}. Zuerst in eine andere Gruppe verschieben oder löschen.`);
        return;
      }
      if (!window.confirm(`Gruppe «${it.name}» löschen?`)) return;
      await pb.collection("kontaktgruppen").delete(it.id);
      await revalidatePath("/kontakt");
      toast.success("Gelöscht");
      setItems((s) => s.filter((x) => x.id !== it.id));
    } catch (e) {
      toast.error("Löschen fehlgeschlagen");
      console.error(e);
    }
  };

  return (
    <div className="rounded-2xl border border-dashed border-accent/30 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-muted">Gruppen verwalten</span>
        <Button size="sm" onClick={() => { setEditing(null); setOpen(true); }}>
          <Plus /> Hinzufügen
        </Button>
      </div>
      {items.length === 0 ? <p className="mt-3 text-sm text-muted">Noch keine Gruppen.</p> : null}
      <ul className="mt-3 space-y-1.5">
        {items.map((it, index) => (
          <li key={it.id} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-lg bg-ink/[0.03] px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 basis-40">
              <span className="block truncate font-semibold">{it.name}</span>
              <span className="block text-xs text-muted">
                {anzahl(it.id) === 0 ? "Keine Kontakte – erscheint nicht auf der Seite" : anzahl(it.id) === 1 ? "1 Kontakt" : `${anzahl(it.id)} Kontakte`}
              </span>
            </span>
            <span className="flex shrink-0 gap-1">
              <button onClick={() => move(index, -1)} disabled={index === 0} className="inline-flex size-10 items-center justify-center rounded-md sm:size-8 text-ink/60 hover:bg-ink/10 disabled:opacity-25" aria-label={`Gruppe ${it.name} nach oben verschieben`}><ArrowUp className="size-4" /></button>
              <button onClick={() => move(index, 1)} disabled={index === items.length - 1} className="inline-flex size-10 items-center justify-center rounded-md sm:size-8 text-ink/60 hover:bg-ink/10 disabled:opacity-25" aria-label={`Gruppe ${it.name} nach unten verschieben`}><ArrowDown className="size-4" /></button>
              <button onClick={() => { setEditing(it); setOpen(true); }} className="inline-flex size-10 items-center justify-center rounded-md sm:size-8 text-ink/60 hover:bg-ink/10 hover:text-ink" aria-label={`Gruppe ${it.name} umbenennen`}>
                <Pencil className="size-4" />
              </button>
              <button onClick={() => del(it)} className="inline-flex size-10 items-center justify-center rounded-md sm:size-8 text-red-600/70 hover:bg-red-50 hover:text-red-600" aria-label={`Gruppe ${it.name} löschen`}>
                <Trash2 className="size-4" />
              </button>
            </span>
          </li>
        ))}
      </ul>
      {open && (
        <GruppeForm
          item={editing}
          nextSort={Math.max(0, ...items.map((item) => item.sort || 0)) + 1}
          onSaved={() => { setOpen(false); window.location.reload(); }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function GruppeForm({
  item,
  nextSort,
  onSaved,
  onClose,
}: {
  item: KontaktgruppeRecord | null;
  nextSort: number;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(item?.name || "");
  const { saving, run } = useSaveAction();

  const save = async () => {
    if (!name.trim()) {
      toast.error("Bitte einen Namen für die Gruppe eingeben.");
      return;
    }
    const ok = await run(async () => {
      const pb = pbBrowser();
      if (item) await pb.collection("kontaktgruppen").update(item.id, { name: name.trim() });
      else await pb.collection("kontaktgruppen").create({ name: name.trim(), sort: nextSort });
      await revalidatePath("/kontakt");
    });
    if (ok) onSaved();
  };

  return (
    <SaveDialog
      open
      onOpenChange={(o) => { if (!o) onClose(); }}
      title={item ? "Gruppe umbenennen" : "Gruppe hinzufügen"}
      description="Der Name erscheint als Überschrift über den Kontakten dieser Gruppe."
      saving={saving}
      onSave={save}
    >
      <div className="space-y-2">
        <Label htmlFor="g-name">Name der Gruppe</Label>
        <Input id="g-name" value={name} maxLength={60} placeholder="z. B. Snowboardlehrer" onChange={(e) => setName(e.target.value)} />
      </div>
    </SaveDialog>
  );
}
