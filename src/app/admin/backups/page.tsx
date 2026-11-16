import { BackupVerwaltung } from "@/components/admin/backup-verwaltung";

export default function AdminBackupsPage() {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Daten</p>
      <h1 className="camp-display mt-2 text-4xl text-ink sm:text-5xl">Backups</h1>
      <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-muted">
        Alles sichern, herunterladen und bei Bedarf wiederherstellen.
      </p>
      <div className="mt-8"><BackupVerwaltung /></div>
    </div>
  );
}
