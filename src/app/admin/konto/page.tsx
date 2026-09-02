import { AccountSettings } from "@/components/admin/account-settings";

export default function AdminKontoPage() {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">Sicherheit</p>
      <h1 className="camp-display mt-2 text-4xl text-ink sm:text-5xl">Konto und Zugänge</h1>
      <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-muted">
        Zugangsdaten für die Lagerleitung und den geschützten Familienbereich verwalten.
      </p>
      <div className="mt-8"><AccountSettings /></div>
    </div>
  );
}
