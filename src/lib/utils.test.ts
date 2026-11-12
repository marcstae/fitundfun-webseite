import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contentDisposition,
  documentHref,
  formatDateRange,
  formatDateRangeLong,
  formatDateRangeWithDays,
  isoToDateInput,
  isValidHttpUrl,
  pickNeustesFotoalbum,
  fokusLager,
  tageBis,
  youtubeId,
} from "./utils.ts";
import type { FotoalbumRecord, LagerRecord } from "./pb-types.ts";

test("isoToDateInput: gespeicherte UTC-Mitternacht bleibt derselbe Kalendertag", () => {
  assert.equal(isoToDateInput("2027-02-06 00:00:00.000Z"), "2027-02-06");
  assert.equal(isoToDateInput(new Date("2027-02-13").toISOString()), "2027-02-13");
});

test("documentHref: lesbarer, dauerhafter Link unabhängig vom PB-Dateinamen", () => {
  assert.equal(
    documentHref({ collection: "dokumente_intern", id: "abc123", name: "Zimmerplan 2027 (R2) – Änderung", datei: "zimmer_x1y2.pdf" }),
    "/api/download/dokumente_intern/abc123/Zimmerplan-2027-R2-Anderung.pdf"
  );
  assert.equal(
    documentHref({ collection: "dokumente", id: "def456", name: "„“", datei: "anmeldung.DOCX" }),
    "/api/download/dokumente/def456/dokument.docx"
  );
});

test("contentDisposition: Gedankenstrich, Umlaute und Anführungszeichen sind gültige Header", () => {
  const header = contentDisposition("Teilnehmerliste – Ä „2027“.pdf");
  assert.doesNotThrow(() => new Headers({ "Content-Disposition": header }));
  assert.equal(
    header,
    "inline; filename=\"Teilnehmerliste _ A _2027_.pdf\"; filename*=UTF-8''Teilnehmerliste%20%E2%80%93%20%C3%84%20%E2%80%9E2027%E2%80%9C.pdf"
  );
});

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

test("fokusLager: aktives Lager und nächster anstehender Entwurf", () => {
  const lager = (jahr: number, status: LagerRecord["status"]) => ({ id: `${status}-${jahr}`, jahr, status }) as LagerRecord;
  const fokus = fokusLager(
    [lager(2028, "entwurf"), lager(2026, "veroeffentlicht"), lager(2024, "archiviert"), lager(2027, "entwurf"), lager(2023, "entwurf")],
    2026
  );
  assert.equal(fokus.aktiv?.jahr, 2026);
  assert.equal(fokus.entwurf?.jahr, 2027);
  assert.deepEqual(fokus.weitereEntwuerfe.map((l) => l.jahr), [2028, 2023]);
  // Nur alte Entwürfe: der neueste; ohne Lager: nichts im Fokus.
  assert.equal(fokusLager([lager(2023, "entwurf"), lager(2024, "entwurf")], 2026).entwurf?.jahr, 2024);
  assert.deepEqual(fokusLager([], 2026), { aktiv: null, entwurf: null, weitereEntwuerfe: [] });
});

test("formatDateRangeWithDays: Wochentage für Samstag-Lager", () => {
  assert.equal(
    formatDateRangeWithDays("2027-02-06 00:00:00.000Z", "2027-02-13 00:00:00.000Z"),
    "Sa 6. Februar – Sa 13. Februar 2027"
  );
});

test("tageBis: Zürcher Kalendertag, auch kurz vor Mitternacht", () => {
  const datum = "2027-02-06 00:00:00.000Z";
  // 5. Feb 2027, 23:30 in Zürich (22:30 UTC) ist noch «1 Tag vorher».
  assert.equal(tageBis(datum, new Date("2027-02-05T22:30:00Z")), 1);
  assert.equal(tageBis(datum, new Date("2027-02-06T08:00:00Z")), 0);
  assert.equal(tageBis(datum, new Date("2026-11-12T12:00:00Z")), 86);
  assert.equal(tageBis(datum, new Date("2027-02-14T12:00:00Z")), -8);
});
