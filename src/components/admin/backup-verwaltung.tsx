"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArchiveRestore, CalendarClock, DatabaseBackup, Download, HardDrive, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers";
import { useLeaveGuard } from "@/components/edit/save-dialog";
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
import {
  backupArt,
  cronAusZeitplan,
  groesseText,
  WOCHENTAGE,
  zeitplanAusCron,
  type BackupDatei,
  type BackupStand,
  type Rhythmus,
} from "@/lib/backup";
import { pbBrowser } from "@/lib/pb";
import { revalidatePath } from "@/lib/revalidate";

const SELECT =
  "flex h-12 w-full rounded-xl border border-ink/15 bg-white px-4 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30";

const datumText = (iso: string) =>
  new Date(iso).toLocaleString("de-CH", { timeZone: "Europe/Zurich", dateStyle: "medium", timeStyle: "short" });

function fehlerText(error: unknown, ersatz: string): string {
  const fehler = error as { status?: number; response?: { message?: string } };
  if (fehler?.status === 401 || fehler?.status === 403) return "Sitzung abgelaufen. Bitte neu anmelden.";
  if (fehler?.status === 413) {
    return "Die Datei ist zu gross für den Upload übers Internet (Cloudflare lässt höchstens 100 MB durch). Lege sie direkt in den Backup-Ordner auf dem Server, dann erscheint sie hier.";
  }
  return fehler?.response?.message || ersatz;
}

const api = <T,>(pfad: string, optionen: { method?: string; body?: unknown } = {}) =>
  pbBrowser().send<T>(`/api/backup${pfad}`, optionen);

/** Nach dem Auslösen: warten, bis PocketBase mit den wiederhergestellten Daten neu gestartet ist. */
async function warteAufNeustart(vorher: string): Promise<"ok" | "abgemeldet" | "fehler"> {
  const ende = Date.now() + 10 * 60 * 1000;
  while (Date.now() < ende) {
    await new Promise((weiter) => setTimeout(weiter, 1500));
    try {
      const jetzt = await api<BackupStand>("");
      if (jetzt.gestartet !== vorher) return "ok";
      if (!jetzt.laeuft) return "fehler"; // ohne Neustart beendet: abgebrochen, Daten unverändert
    } catch (error) {
      // Im Backup gibt es dieses Konto nicht oder mit anderem Passwort.
      if ([401, 403].includes((error as { status?: number }).status ?? 0)) return "abgemeldet";
      // sonst: PocketBase startet gerade neu
    }
  }
  return "fehler";
}

export function BackupVerwaltung() {
  const router = useRouter();
  const { logout } = useAuth();
  const [stand, setStand] = React.useState<BackupStand | null>(null);
  const [ladeFehler, setLadeFehler] = React.useState(false);
  const [beschaeftigt, setBeschaeftigt] = React.useState<"" | "sichern" | "hochladen" | "zeitplan" | "wiederherstellen">("");
  const [ziel, setZiel] = React.useState<BackupDatei | null>(null);
  const [rhythmus, setRhythmus] = React.useState<Rhythmus>("taeglich");
  const [uhrzeit, setUhrzeit] = React.useState("03:00");
  const [wochentag, setWochentag] = React.useState(0);
  const [behalten, setBehalten] = React.useState(7);
  const [gespeichert, setGespeichert] = React.useState("");
  const dateiFeld = React.useRef<HTMLInputElement>(null);

  const formular = JSON.stringify({ rhythmus, uhrzeit, wochentag, behalten });
  const zeitplanGeaendert = !!gespeichert && formular !== gespeichert;
  useLeaveGuard(zeitplanGeaendert);

  const laden = React.useCallback(async (zeitplanUebernehmen = false) => {
    try {
      const neu = await api<BackupStand>("");
      neu.backups.sort((a, b) => b.datum.localeCompare(a.datum));
      setStand(neu);
      setLadeFehler(false);
      if (zeitplanUebernehmen) {
        const plan = zeitplanAusCron(neu.cron) ?? { rhythmus: "taeglich" as const, uhrzeit: "03:00", wochentag: 0 };
        const anzahl = neu.behalten || 7;
        setRhythmus(plan.rhythmus);
        setUhrzeit(plan.uhrzeit);
        setWochentag(plan.wochentag);
        setBehalten(anzahl);
        setGespeichert(JSON.stringify({ ...plan, behalten: anzahl }));
      }
    } catch {
      setLadeFehler(true);
    }
  }, []);

  React.useEffect(() => {
    void laden(true);
  }, [laden]);

  const gesperrt = !!beschaeftigt || !!stand?.laeuft;
  const eigenerZeitplan = !!stand && zeitplanAusCron(stand.cron) === null;
  const letztes = stand?.backups[0];

  const jetztSichern = async () => {
    setBeschaeftigt("sichern");
    try {
      await api("", { method: "POST" });
      toast.success("Backup erstellt.");
      await laden();
    } catch (error) {
      toast.error(fehlerText(error, "Backup fehlgeschlagen."));
    } finally {
      setBeschaeftigt("");
    }
  };

  const hochladen = async (datei: File | undefined) => {
    if (!datei) return;
    setBeschaeftigt("hochladen");
    try {
      const daten = new FormData();
      daten.append("datei", datei);
      await api("/hochladen", { method: "POST", body: daten });
      toast.success("Backup hochgeladen. Es steht jetzt in der Liste.");
      await laden();
    } catch (error) {
      toast.error(fehlerText(error, "Hochladen fehlgeschlagen."));
    } finally {
      setBeschaeftigt("");
      if (dateiFeld.current) dateiFeld.current.value = "";
    }
  };

  const zeitplanSpeichern = async (event: React.FormEvent) => {
    event.preventDefault();
    setBeschaeftigt("zeitplan");
    try {
      await api("/zeitplan", {
        method: "PUT",
        body: { cron: cronAusZeitplan({ rhythmus, uhrzeit, wochentag }), behalten },
      });
      setGespeichert(formular);
      toast.success(rhythmus === "aus" ? "Automatische Backups ausgeschaltet." : "Zeitplan gespeichert.");
      await laden();
    } catch (error) {
      toast.error(fehlerText(error, "Zeitplan konnte nicht gespeichert werden."));
    } finally {
      setBeschaeftigt("");
    }
  };

  const herunterladen = async (datei: BackupDatei) => {
    try {
      // Fehlt die Datei (z. B. in einem anderen Tab gelöscht), zeigte der Browser sonst eine Fehlerseite.
      const aktuell = await api<BackupStand>("");
      if (!aktuell.backups.some((b) => b.name === datei.name)) {
        toast.error("Dieses Backup gibt es nicht mehr.");
        await laden();
        return;
      }
      const pb = pbBrowser();
      const token = await pb.files.getToken();
      // Fremder Host (PocketBase): Der Browser lädt die Datei, die Seite bleibt offen.
      window.open(`${pb.buildURL(`/api/backup/${encodeURIComponent(datei.name)}`)}?token=${encodeURIComponent(token)}`, "_self");
    } catch {
      toast.error("Download fehlgeschlagen. Bitte neu anmelden und nochmals versuchen.");
    }
  };

  const loeschen = async (datei: BackupDatei) => {
    if (!window.confirm(`Backup vom ${datumText(datei.datum)} löschen? Das lässt sich nicht rückgängig machen.`)) return;
    try {
      await api(`/${encodeURIComponent(datei.name)}`, { method: "DELETE" });
      toast.success("Backup gelöscht.");
      await laden();
    } catch (error) {
      toast.error(fehlerText(error, "Löschen fehlgeschlagen."));
    }
  };

  const wiederherstellen = async () => {
    if (!ziel || !stand) return;
    setBeschaeftigt("wiederherstellen");
    try {
      await api(`/${encodeURIComponent(ziel.name)}/wiederherstellen`, { method: "POST" });
    } catch (error) {
      toast.error(fehlerText(error, "Wiederherstellen fehlgeschlagen. Die Daten sind unverändert."));
      setBeschaeftigt("");
      return;
    }
    setZiel(null);
    let ergebnis = await warteAufNeustart(stand.gestartet);
    if (ergebnis === "ok") {
      // Gilt das Konto im wiederhergestellten Stand noch? Sonst neu anmelden.
      ergebnis = await pbBrowser().collection("users").authRefresh().then(() => "ok" as const, () => "abgemeldet" as const);
    }
    if (ergebnis === "fehler") {
      toast.error("Wiederherstellen fehlgeschlagen. Die Daten sind unverändert. Ist die Datei ein Backup dieser Website?");
      setBeschaeftigt("");
      await laden();
      return;
    }
    if (ergebnis === "abgemeldet") {
      // Ohne gültige Sitzung kein sofortiges Neuladen der Seiten; sie aktualisieren sich nach spätestens 5 Minuten.
      toast.success("Wiederhergestellt. Bitte mit dem Passwort anmelden, das zum Zeitpunkt des Backups galt.", { duration: 10000 });
      logout();
      router.replace("/login?redirect=/admin/backups");
      router.refresh();
      return;
    }
    await revalidatePath("/");
    toast.success("Wiederhergestellt. Die Website zeigt jetzt diesen Stand.");
    setBeschaeftigt("");
    await laden(true);
    router.refresh();
  };

  if (!stand) {
    return (
      <p role="status" className="rounded-xl bg-white p-5 text-sm font-semibold text-muted">
        {ladeFehler ? "Backups konnten nicht geladen werden. Läuft PocketBase?" : "Lädt…"}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {beschaeftigt === "wiederherstellen" || stand.laeuft ? (
        <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">
          {beschaeftigt === "wiederherstellen"
            ? "Wird wiederhergestellt… Bitte diese Seite offen lassen. Die Website ist einige Sekunden nicht erreichbar."
            : "Gerade läuft ein Backup. Bitte kurz warten."}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[1.5rem] border border-ink/10 bg-white p-5 sm:p-8">
          <HardDrive className="size-7 text-accent" />
          <h2 className="mt-4 font-display text-2xl text-ink">Jetzt sichern</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">
            Ein Backup enthält alles: Texte, Lager, Kontakte, Einstellungen wie Akzentfarben, Konten, das Lagerpasswort und
            alle Dateien wie Dokumente, Bilder und das Video. Die Website bleibt dabei online.
          </p>
          <dl className="mt-5 space-y-2 text-sm">
            <div>
              <dt className="font-bold text-ink">Speicherort auf dem Server</dt>
              <dd className="break-all font-mono text-xs text-muted">{stand.ort || "pb_data/backups"}</dd>
            </div>
            <div>
              <dt className="font-bold text-ink">Letztes Backup</dt>
              <dd className="text-muted">{letztes ? `${datumText(letztes.datum)} · ${backupArt(letztes.name)}` : "noch keines"}</dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={jetztSichern} disabled={gesperrt}>
              <DatabaseBackup /> {beschaeftigt === "sichern" ? "Sichert…" : "Jetzt sichern"}
            </Button>
            <Button variant="outline" onClick={() => dateiFeld.current?.click()} disabled={gesperrt}>
              <Upload /> {beschaeftigt === "hochladen" ? "Lädt hoch…" : "Backup hochladen"}
            </Button>
            <input
              ref={dateiFeld}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              aria-label="Backup-Datei (.zip) hochladen"
              onChange={(event) => void hochladen(event.target.files?.[0])}
            />
          </div>
        </section>

        <section className="rounded-[1.5rem] border border-ink/10 bg-white p-5 sm:p-8">
          <CalendarClock className="size-7 text-accent" />
          <h2 className="mt-4 font-display text-2xl text-ink">Zeitplan</h2>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-muted">
            Automatische Backups nach Schweizer Zeit. Ältere automatische Backups werden gelöscht, manuelle bleiben, bis du sie
            löschst.
          </p>
          {eigenerZeitplan ? (
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-900">
              Eigener Zeitplan aus PocketBase: <code>{stand.cron}</code>. Speichern ersetzt ihn.
            </p>
          ) : null}
          <form onSubmit={zeitplanSpeichern} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="backup-rhythmus">Automatisch sichern</Label>
              <select id="backup-rhythmus" value={rhythmus} onChange={(event) => setRhythmus(event.target.value as Rhythmus)} className={SELECT}>
                <option value="taeglich">Täglich</option>
                <option value="woechentlich">Wöchentlich</option>
                <option value="aus">Aus</option>
              </select>
            </div>
            {rhythmus === "woechentlich" ? (
              <div className="space-y-2">
                <Label htmlFor="backup-wochentag">Wochentag</Label>
                <select id="backup-wochentag" value={wochentag} onChange={(event) => setWochentag(Number(event.target.value))} className={SELECT}>
                  {WOCHENTAGE.map((tag, index) => (
                    <option key={tag} value={index}>{tag}</option>
                  ))}
                </select>
              </div>
            ) : null}
            {rhythmus !== "aus" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="backup-uhrzeit">Uhrzeit</Label>
                  <Input id="backup-uhrzeit" type="time" required value={uhrzeit} onChange={(event) => setUhrzeit(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-behalten">Automatische Backups behalten</Label>
                  <Input
                    id="backup-behalten"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={60}
                    required
                    value={behalten}
                    onChange={(event) => setBehalten(Math.round(Number(event.target.value)))}
                  />
                </div>
              </>
            ) : null}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={gesperrt || (!zeitplanGeaendert && !eigenerZeitplan)}>
                {beschaeftigt === "zeitplan" ? "Speichert…" : "Zeitplan speichern"}
              </Button>
            </div>
          </form>
        </section>
      </div>

      <section className="rounded-[1.5rem] border border-ink/10 bg-white p-5 sm:p-8">
        <ArchiveRestore className="size-7 text-accent" />
        <h2 className="mt-4 font-display text-2xl text-ink">Vorhandene Backups</h2>
        {stand.backups.length === 0 ? (
          <p className="mt-2 text-sm font-semibold text-muted">Noch keine Backups.</p>
        ) : (
          <ul className="mt-4 divide-y divide-ink/10">
            {stand.backups.map((datei) => (
              <li key={datei.name} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="font-bold text-ink">{datumText(datei.datum)}</p>
                  <p className="text-sm text-muted">
                    {backupArt(datei.name)} · {groesseText(datei.groesse)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => herunterladen(datei)} disabled={gesperrt}>
                    <Download /> Herunterladen
                  </Button>
                  <Button size="sm" variant="subtle" onClick={() => setZiel(datei)} disabled={gesperrt}>
                    <ArchiveRestore /> Wiederherstellen
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => loeschen(datei)} disabled={gesperrt} aria-label={`Backup vom ${datumText(datei.datum)} löschen`}>
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={!!ziel} onOpenChange={(offen) => !offen && beschaeftigt !== "wiederherstellen" && setZiel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backup wiederherstellen?</DialogTitle>
            {ziel ? (
              <DialogDescription className="mt-1">
                Stand vom {datumText(ziel.datum)} ({backupArt(ziel.name)}, {groesseText(ziel.groesse)}).
              </DialogDescription>
            ) : null}
          </DialogHeader>
          <ul className="list-disc space-y-2 pl-5 text-sm font-semibold leading-relaxed text-ink">
            <li>Die ganze Website geht auf diesen Stand zurück: Inhalte, Dokumente, Einstellungen, Konten und Lagerpasswort. Spätere Änderungen gehen verloren.</li>
            <li>Vorher entsteht automatisch ein Backup des aktuellen Stands («Vor Wiederherstellung»). So lässt sich der Schritt rückgängig machen.</li>
            <li>Die Website ist einige Sekunden nicht erreichbar. Danach gilt das Admin-Passwort aus dem Backup.</li>
          </ul>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setZiel(null)} disabled={beschaeftigt === "wiederherstellen"}>
              Abbrechen
            </Button>
            <Button variant="danger" onClick={wiederherstellen} disabled={beschaeftigt === "wiederherstellen"}>
              {beschaeftigt === "wiederherstellen" ? "Sichert aktuellen Stand…" : "Wiederherstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
