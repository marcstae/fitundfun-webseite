"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dropzone } from "@/components/edit/dropzone";
import { useSaveAction } from "@/components/edit/save-dialog";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";
import type { EinstellungenRecord } from "@/lib/pb-types";

export function HeroSettings({ initial }: { initial: EinstellungenRecord | null }) {
  const [record, setRecord] = React.useState(initial);
  const [title, setTitle] = React.useState(initial?.hero_titel || "fit&fun Lager Brigels");
  const [video, setVideo] = React.useState<File | null>(null);
  const [poster, setPoster] = React.useState<File | null>(null);
  const [removeVideo, setRemoveVideo] = React.useState(false);
  const [removePoster, setRemovePoster] = React.useState(false);
  const { saving, run } = useSaveAction();

  const save = async () => {
    if (!title.trim()) {
      toast.error("Bitte einen Titel eingeben.");
      return;
    }
    await run(async () => {
      const form = new FormData();
      form.set("hero_titel", title.trim());
      if (video) form.set("hero_video", video);
      if (poster) form.set("hero_poster", poster);
      if (removeVideo && record?.hero_video) form.append("hero_video-", record.hero_video);
      if (removePoster && record?.hero_poster) form.append("hero_poster-", record.hero_poster);

      const saved = record
        ? await pbBrowser().collection("einstellungen").update<EinstellungenRecord>(record.id, form)
        : await pbBrowser().collection("einstellungen").create<EinstellungenRecord>(form);
      setRecord(saved);
      setVideo(null);
      setPoster(null);
      setRemoveVideo(false);
      setRemovePoster(false);
      await revalidatePath("/");
    });
  };

  return (
    <section className="rounded-[1.75rem] border border-ink/10 bg-white p-6 sm:p-8">
      <h2 className="font-display text-2xl text-ink">Startseite</h2>
      <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">
        Titel, Hintergrundvideo und Vorschaubild des grossen Startbereichs.
      </p>
      <div className="mt-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="hero-title">Titel auf der Startseite</Label>
          <Input id="hero-title" value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <MediaField
            label="Hintergrundvideo"
            current={removeVideo ? "" : video?.name || record?.hero_video}
            removeLabel="Eigenes Video entfernen"
            onRemove={() => { setVideo(null); setRemoveVideo(true); }}
          >
            <Dropzone
              accept="video/mp4,video/webm"
              maxSizeMB={60}
              currentName={removeVideo ? null : video?.name || record?.hero_video}
              label="Video wählen"
              hint="MP4 oder WebM bis 60 MB hierher ziehen oder"
              onFile={(file) => { setVideo(file); setRemoveVideo(false); }}
            />
          </MediaField>
          <MediaField
            label="Vorschaubild"
            current={removePoster ? "" : poster?.name || record?.hero_poster}
            removeLabel="Eigenes Bild entfernen"
            onRemove={() => { setPoster(null); setRemovePoster(true); }}
          >
            <Dropzone
              accept="image/*"
              maxSizeMB={5}
              currentName={removePoster ? null : poster?.name || record?.hero_poster}
              label="Bild wählen"
              hint="JPG, PNG oder WebP hierher ziehen oder"
              onFile={(file) => { setPoster(file); setRemovePoster(false); }}
            />
          </MediaField>
        </div>
        <p className="text-xs font-semibold text-muted">
          Ohne eigenes Video oder Bild werden die mitgelieferten Standardmedien verwendet.
        </p>
        <Button onClick={save} disabled={saving}>
          {saving ? "Speichert…" : "Startseite speichern"}
        </Button>
      </div>
    </section>
  );
}

function MediaField({
  label,
  current,
  removeLabel,
  onRemove,
  children,
}: {
  label: string;
  current?: string | null;
  removeLabel: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex min-h-8 items-center justify-between gap-3">
        <Label>{label}</Label>
        {current ? (
          <button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:underline">
            <Trash2 className="size-3.5" /> {removeLabel}
          </button>
        ) : null}
      </div>
      {children}
    </div>
  );
}
