import PocketBase, { ClientResponseError } from "pocketbase";
import type { CollectionSchema } from "./pb-types";

export const PB_URL =
  process.env.NEXT_PUBLIC_PB_URL || "http://localhost:8090";

export const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || "";

let _server: PocketBase | null = null;

/** Server-side PocketBase client (one per Node process). */
export function pbServer(): PocketBase {
  if (!_server) {
    _server = new PocketBase(PB_URL);
    _server.autoCancellation(false);
  }
  return _server;
}

let _browser: PocketBase | null = null;

/** Browser-side PocketBase client (singleton, persists auth in localStorage). */
export function pbBrowser(): PocketBase {
  if (typeof window === "undefined") {
    throw new Error("pbBrowser() called on the server — use pbServer()");
  }
  if (!_browser) {
    _browser = new PocketBase(PB_URL);
    _browser.autoCancellation(false);
  }
  return _browser;
}

export function isAuthError(e: unknown): boolean {
  return e instanceof ClientResponseError && (e.status === 401 || e.status === 403);
}

/** Öffentliche Datei-URL (nur für nicht-protected Felder). */
export function publicFileUrl(collection: string, id: string, filename: string): string {
  return `${PB_URL}/api/files/${collection}/${id}/${filename}`;
}

/** Komfort: URL für ein nicht-leeres File-Feld, sonst null. */
export function fileUrlOr(
  collection: string,
  id: string,
  filename?: string | null,
  token?: string
): string | null {
  if (!filename) return null;
  if (token) {
    return `${PB_URL}/api/files/${collection}/${id}/${filename}?token=${encodeURIComponent(token)}`;
  }
  return publicFileUrl(collection, id, filename);
}

export type { CollectionSchema };
