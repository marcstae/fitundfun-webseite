import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatDateRange,
  formatDateRangeLong,
  isValidHttpUrl,
  pickNeustesFotoalbum,
  youtubeId,
} from "./utils.ts";
import type { FotoalbumRecord, LagerRecord } from "./pb-types.ts";

test("formatDateRange: gleiches Jahr", () => {
  assert.equal(formatDateRange("2026-01-31", "2026-02-07"), "31. Jan – 7. Feb 2026");
});

test("formatDateRange: Jahreswechsel (bestehendes Format: Endjahr)", () => {
  assert.equal(
    formatDateRange("2025-12-28", "2026-01-03"),
    "28. Dez – 3. Jan 2026"
  );
});

test("formatDateRangeLong: de-CH Langform", () => {
  assert.equal(
    formatDateRangeLong("2026-01-31", "2026-02-07"),
    "31. Januar – 7. Februar 2026"
  );
});

test("youtubeId: https/embed/shorts/youtu.be", () => {
  assert.equal(youtubeId("https://www.youtube.com/watch?v=abc123XYZ12"), "abc123XYZ12");
  assert.equal(youtubeId("https://youtu.be/abc123XYZ12"), "abc123XYZ12");
  assert.equal(youtubeId("https://www.youtube.com/embed/abc123XYZ12"), "abc123XYZ12");
  assert.equal(youtubeId("https://www.youtube.com/shorts/abc123XYZ12"), "abc123XYZ12");
});

test("youtubeId: invalide URLs", () => {
  assert.equal(youtubeId("https://example.com/watch?v=abc123XYZ12"), null);
  assert.equal(youtubeId(""), null);
  assert.equal(youtubeId("keine url"), null);
});

test("isValidHttpUrl", () => {
  assert.equal(isValidHttpUrl("http://a.ch"), true);
  assert.equal(isValidHttpUrl("https://a.ch/x"), true);
  assert.equal(isValidHttpUrl("ftp://a.ch"), false);
  assert.equal(isValidHttpUrl("//a.ch"), false);
  assert.equal(isValidHttpUrl("javascript:alert(1)"), false);
  assert.equal(isValidHttpUrl(""), false);
});

test("pickNeustesFotoalbum: neuestes Lager mit vorhandenem Link", () => {
  const album2024 = { id: "album-2024", lager: "lager-2024", updated: "2026-01-01" } as FotoalbumRecord;
  const album2025 = { id: "album-2025", lager: "lager-2025", updated: "2025-01-01" } as FotoalbumRecord;
  const lager = [
    { id: "lager-2026", jahr: 2026 },
    { id: "lager-2025", jahr: 2025 },
    { id: "lager-2024", jahr: 2024 },
  ] as LagerRecord[];

  assert.deepEqual(
    pickNeustesFotoalbum([album2024, album2025], lager),
    { fotoalbum: album2025, jahr: 2025 }
  );
});
