"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaField } from "@/components/admin/hero-settings";
import { Dropzone, useDateiUrl } from "@/components/edit/dropzone";
import { MinimalEditor } from "@/components/edit/minimal-editor";
import { DirtySaveBar, useFormular, useSaveAction } from "@/components/edit/save-dialog";
import { INHALT_ICONS } from "@/components/inhalt-icons";
import {
  type Eintrag,
  ICONS,
  type IconKey,
  KONTAKT_TITEL,
  LAGERHAUS_EINLEITUNG,
  LAGERHAUS_TITEL,
  type LagerhausInhalt,
  lagerhausInhalt,
} from "@/lib/inhaltsseiten";
import { pbBrowser, publicFileUrl } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import { isValidHttpUrl } from "@/lib/utils";
import type { SeiteRecord } from "@/lib/pb-types";

const ICON_BUTTON =
  "inline-flex size-10 items-center justify-center rounded-md text-ink/60 hover:bg-ink/10 hover:text-ink disabled:opacity-25 sm:size-8";
const FELD =
  "w-full rounded-xl border border-ink/15 bg-white px-4 text-base text-ink placeholder:text-muted/70 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";

/** Seite speichern (beim ersten Mal anlegen) und die Website neu aufbauen. */
async function seiteSpeichern(
  id: string | undefined,
  slug: string,
  // bilder: [Datei] ersetzt die Bilder der Seite, [] entfernt sie (SDK schickt Dateien als FormData).
  data: Pick<SeiteRecord, "titel"> & Partial<Pick<SeiteRecord, "inhalt">> & { daten?: unknown; bilder?: File[] }
) {
  const pb = pbBrowser();
  const saved = id
    ? await pb.collection("seiten").update<SeiteRecord>(id, data)
    : await pb.collection("seiten").create<SeiteRecord>({ slug, ...data });
  await revalidatePath(`/${slug}`);
  return saved;
}

const ohneLeere = (eintraege: Eintrag[]) =>
  eintraege.map((e) => ({ ...e, titel: e.titel.trim(), text: e.text.trim() })).filter((e) => e.titel || e.text);

export function LagerhausEditor({ seite }: { seite: SeiteRecord | null }) {
  const [id, setId] = React.useState(seite?.id);
  // Kopfbild = erstes Bild der Seite (seiten.bilder); ohne eigenes Bild das Vorschaubild der Startseite.
  const [bildName, setBildName] = React.useState(seite?.bilder?.[0] || "");
  const [bild, setBild] = React.useState<File | null>(null);
  const [bildEntfernen, setBildEntfernen] = React.useState(false);
  const { wert, setWert, dirty, alsGespeichert } = useFormular(
    {
      titel: seite?.titel || LAGERHAUS_TITEL,
      einleitung: seite?.inhalt || LAGERHAUS_EINLEITUNG,
      haus: lagerhausInhalt(seite?.daten),
    },
    !!bild || bildEntfernen
  );
  const neuesBildUrl = useDateiUrl(bild);
  const bildUrl = neuesBildUrl || (!bildEntfernen && bildName && id ? publicFileUrl("seiten", id, bildName) : "");
  const { saving, run } = useSaveAction();
  const haus = wert.haus;
  const setHaus = <K extends keyof LagerhausInhalt>(key: K, value: LagerhausInhalt[K]) =>
    setWert((w) => ({ ...w, haus: { ...w.haus, [key]: value } }));

  const save = async () => {
    if (!haus.name.trim() || !haus.adresse.trim()) {
      toast.error("Name und Adresse des Hauses dürfen nicht leer sein.");
      return;
    }
    if (haus.website.trim() && !isValidHttpUrl(haus.website.trim())) {
      toast.error("Der Link zur Website ist ungültig. Er muss mit https:// beginnen.");
      return;
    }
    const neu = {
      titel: wert.titel.trim() || LAGERHAUS_TITEL,
      einleitung: wert.einleitung,
      haus: {
        ...haus,
        name: haus.name.trim(),
        adresse: haus.adresse.trim(),
        website: haus.website.trim(),
        infosTitel: haus.infosTitel.trim(),
        hinweis: haus.hinweis.trim(),
        fakten: ohneLeere(haus.fakten),
        infos: ohneLeere(haus.infos),
      },
    };
    await run(async () => {
      const saved = await seiteSpeichern(id, "lagerhaus", {
        titel: neu.titel,
        inhalt: neu.einleitung,
        daten: neu.haus,
        ...(bild ? { bilder: [bild] } : bildEntfernen ? { bilder: [] } : {}),
      });
      setId(saved.id);
      setBildName(saved.bilder?.[0] || "");
      setBild(null);
      setBildEntfernen(false);
      setWert(neu);
      alsGespeichert(neu);
    });
  };

  return (
    <div className="space-y-5">
      <Block titel="Kopfbereich" text="Bild und Texte oben auf der Seite.">
        {bildUrl ? null : (
          <p className="rounded-xl bg-sand p-4 text-sm font-semibold text-muted">
            Zurzeit erscheint das Vorschaubild der Startseite. Lade ein eigenes Bild hoch, um es zu ersetzen.
          </p>
        )}
        <MediaField
          label="Eigenes Kopfbild"
          current={bildEntfernen ? "" : bild?.name || bildName}
          removeLabel="Eigenes Bild entfernen"
          onRemove={() => {
            setBild(null);
            setBildEntfernen(true);
          }}
        >
          <Dropzone
            accept="image/*"
            formats="ein Bild (JPG, PNG oder WebP)"
            maxSizeMB={5}
            currentName={bildEntfernen ? null : bild?.name || bildName}
            preview={bildUrl}
            label="Bild wählen"
            hint="JPG, PNG oder WebP bis 5 MB hierher ziehen oder"
            onFile={(file) => {
              setBild(file);
              setBildEntfernen(false);
            }}
          />
        </MediaField>
        <Feld id="lh-titel" label="Kleine Überschrift" value={wert.titel} onChange={(titel) => setWert((w) => ({ ...w, titel }))} />
        <Feld id="lh-name" label="Name des Hauses" value={haus.name} onChange={(v) => setHaus("name", v)} />
        <Feld
          id="lh-adresse"
          label="Adresse"
          hinweis="Wird auch für den Google-Maps-Link auf der Lagerhaus- und den Lagerseiten verwendet."
          value={haus.adresse}
          onChange={(v) => setHaus("adresse", v)}
        />
        <Feld
          id="lh-website"
          label="Website des Hauses"
          hinweis="Leer lassen, wenn kein Website-Knopf erscheinen soll."
          type="url"
          value={haus.website}
          onChange={(v) => setHaus("website", v)}
        />
      </Block>

      <Block titel="Einleitung" text="Der Text unter den beiden Knöpfen.">
        <MinimalEditor label="Einleitung" value={wert.einleitung} onChange={(einleitung) => setWert((w) => ({ ...w, einleitung }))} />
      </Block>

      <Block titel="Kurzfakten" text="Dunkle Kacheln, je zwei nebeneinander. Am besten kurz halten.">
        <EintragListe name="Kurzfakt" eintraege={haus.fakten} onChange={(v) => setHaus("fakten", v)} />
      </Block>

      <Block titel="Abschnitt mit Infos" text="Liste mit Symbolen unter den Kurzfakten. Ohne Einträge verschwindet der Abschnitt.">
        <Feld id="lh-infos-titel" label="Überschrift" value={haus.infosTitel} onChange={(v) => setHaus("infosTitel", v)} />
        <EintragListe name="Info" eintraege={haus.infos} onChange={(v) => setHaus("infos", v)} />
      </Block>

      <Block titel="Fussnote" text="Kleiner Hinweis ganz unten, z. B. woher die Angaben stammen. Leer lassen für keine.">
        <Feld id="lh-hinweis" label="Fussnote" value={haus.hinweis} onChange={(v) => setHaus("hinweis", v)} />
      </Block>

      <DirtySaveBar dirty={dirty} saving={saving} onSave={save} />
    </div>
  );
}

export function KontaktEditor({ seite }: { seite: SeiteRecord | null }) {
  const [id, setId] = React.useState(seite?.id);
  const { wert, setWert, dirty, alsGespeichert } = useFormular({ titel: seite?.titel || KONTAKT_TITEL });
  const { saving, run } = useSaveAction();

  const save = async () => {
    const neu = { titel: wert.titel.trim() || KONTAKT_TITEL };
    await run(async () => {
      const saved = await seiteSpeichern(id, "kontakt", neu);
      setId(saved.id);
      setWert(neu);
      alsGespeichert(neu);
    });
  };

  return (
    <div className="space-y-5">
      <Block titel="Seitentext" text="Überschrift oben auf der Kontaktseite.">
        <Feld id="ko-titel" label="Überschrift" value={wert.titel} onChange={(titel) => setWert({ titel })} />
      </Block>
      <DirtySaveBar dirty={dirty} saving={saving} onSave={save} />
    </div>
  );
}

function Block({ titel, text, children }: { titel: string; text: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-ink/10 bg-white p-5 sm:p-6">
      <h2 className="font-display text-xl text-ink">{titel}</h2>
      <p className="mt-1 text-sm font-semibold leading-relaxed text-muted">{text}</p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Feld({
  id,
  label,
  hinweis,
  type = "text",
  value,
  onChange,
}: {
  id: string;
  label: string;
  hinweis?: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={hinweis ? `${id}-hinweis` : undefined} />
      {hinweis ? <p id={`${id}-hinweis`} className="text-xs text-muted">{hinweis}</p> : null}
    </div>
  );
}

function EintragListe({
  name,
  eintraege,
  onChange,
}: {
  name: string;
  eintraege: Eintrag[];
  onChange: (eintraege: Eintrag[]) => void;
}) {
  const aendern = (index: number, teil: Partial<Eintrag>) =>
    onChange(eintraege.map((e, i) => (i === index ? { ...e, ...teil } : e)));
  const verschieben = (index: number, delta: -1 | 1) => {
    const neu = [...eintraege];
    [neu[index], neu[index + delta]] = [neu[index + delta], neu[index]];
    onChange(neu);
  };

  return (
    <div className="space-y-3">
      {eintraege.length === 0 ? <p className="text-sm text-muted">Keine Einträge.</p> : null}
      <ol className="space-y-3">
        {eintraege.map((eintrag, index) => {
          const Icon = INHALT_ICONS[eintrag.icon];
          const nr = `${name} ${index + 1}`;
          return (
            <li key={index} className="rounded-xl border border-ink/10 bg-sand/60 p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <span className="mt-1 grid size-10 shrink-0 place-items-center rounded-lg bg-white text-accent">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[11rem_1fr]">
                  <select
                    aria-label={`${nr}: Symbol`}
                    value={eintrag.icon}
                    onChange={(e) => aendern(index, { icon: e.target.value as IconKey })}
                    className={`${FELD} h-12`}
                  >
                    {Object.entries(ICONS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                  <Input aria-label={`${nr}: Titel`} placeholder="Titel" value={eintrag.titel} onChange={(e) => aendern(index, { titel: e.target.value })} />
                  <textarea
                    aria-label={`${nr}: Text`}
                    placeholder="Text (optional)"
                    rows={3}
                    value={eintrag.text}
                    onChange={(e) => aendern(index, { text: e.target.value })}
                    // Wächst mit dem Text (Chrome); andere Browser zeigen drei Zeilen.
                    className={`${FELD} field-sizing-content min-h-24 py-3 sm:col-span-2`}
                  />
                </div>
              </div>
              <div className="mt-1 flex justify-end gap-1">
                <button type="button" onClick={() => verschieben(index, -1)} disabled={index === 0} className={ICON_BUTTON} aria-label={`${nr} nach oben`}>
                  <ArrowUp className="size-4" />
                </button>
                <button type="button" onClick={() => verschieben(index, 1)} disabled={index === eintraege.length - 1} className={ICON_BUTTON} aria-label={`${nr} nach unten`}>
                  <ArrowDown className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(eintraege.filter((_, i) => i !== index))}
                  className="inline-flex size-10 items-center justify-center rounded-md text-red-600/80 hover:bg-red-50 hover:text-red-600 sm:size-8"
                  aria-label={`${nr} entfernen`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <Button type="button" variant="outline" onClick={() => onChange([...eintraege, { icon: "info", titel: "", text: "" }])}>
        <Plus /> {name} hinzufügen
      </Button>
    </div>
  );
}
