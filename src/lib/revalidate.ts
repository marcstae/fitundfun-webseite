import { PB_URL } from "./pb";

/** Löst On-Demand-Revalidation einer Route aus. */
export async function revalidatePath(path: string): Promise<void> {
  try {
    const pb = await import("./pb").then((m) => m.pbBrowser());
    const token = pb.authStore.token;
    await fetch("/api/revalidate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify({ path }),
    });
  } catch {
    // silent — ISR holt ohnehin nach 5 Min nach
  }
}

export function routeFor(path: string): string {
  return path;
}

export { PB_URL };
