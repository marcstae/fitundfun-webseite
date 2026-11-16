/** Erneuert nach dem Speichern die öffentliche Website. Still bei Fehlern: Sie lädt ohnehin nach 5 Minuten neu. */
export async function revalidieren(): Promise<void> {
  try {
    const token = await import("./pb").then((m) => m.pbBrowser().authStore.token);
    await fetch("/api/revalidate", {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    // siehe oben
  }
}
