import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatDateRange,
  formatDateRangeLong,
  isValidHttpUrl,
  lagerStatus,
  pickAktuellesLager,
  youtubeId,
} from "./utils.ts";
import type { LagerRecord } from "./pb-types.ts";

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

test("lagerStatus: before/running/past", () => {
  const future = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
  const past = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  assert.equal(lagerStatus(future, "2030-01-01"), "before");
  assert.equal(lagerStatus(past, "2030-01-01"), "running");
  assert.equal(lagerStatus("2020-01-01", past), "past");
});

function lagerStub(jahr: number, datumBis: string): LagerRecord {
  return {
    id: `stub-${jahr}`,
    jahr,
    titel: `Lager ${jahr}`,
    datum_von: "2020-01-31 00:00:00.000Z",
    datum_bis: datumBis,
    beschreibung: "",
    youtube_url: "",
    teilnehmer: null,
    preise: [],
    aktivitaeten: [],
    created: "",
    updated: "",
  } as LagerRecord;
}

test("pickAktuellesLager: leere Liste", () => {
  assert.equal(pickAktuellesLager([]), null);
});

test("pickAktuellesLager: kürzlich beendetes Lager gewinnt", () => {
  const vorher = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const laenger = new Date(Date.now() - 100 * 86_400_000).toISOString();
  assert.equal(
    pickAktuellesLager([lagerStub(2025, laenger), lagerStub(2026, vorher)])?.jahr,
    2026
  );
});

test("pickAktuellesLager: alle älter als 60 Tage → höchstes Jahr", () => {
  const alt = new Date(Date.now() - 200 * 86_400_000).toISOString();
  assert.equal(
    pickAktuellesLager([lagerStub(2024, alt), lagerStub(2025, alt)])?.jahr,
    2025
  );
});

test("pickAktuellesLager: unsortierte Eingabe wird sortiert", () => {
  const vorher = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const alt = new Date(Date.now() - 200 * 86_400_000).toISOString();
  assert.equal(
    pickAktuellesLager([lagerStub(2026, vorher), lagerStub(2025, alt)])?.jahr,
    2026
  );
});