import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const migration = readFileSync("pb/pb_migrations/1700000023_lagerhaus_lagerinfos.js", "utf8");
const bisher = "<p>Das Ferienheim Albin liegt im alten Dorfkern von Brigels, ruhig auf einer Sonnenterrasse mit Blick auf die Bündner Berge. Hier schlafen, kochen, essen und verbringen wir die Abende gemeinsam. Skifahren, Schlitteln und Winterwandern beginnen direkt vor der Haustür: Die Talstation der Bergbahnen ist in 5 Minuten erreichbar.</p>";

for (const inhalt of [bisher, "<p>Eigener Text der Lagerleitung</p>", null]) {
  test(`Lagerhaus-Migration: ${inhalt === bisher ? "Standard kürzen" : inhalt ? "eigenen Text erhalten" : "fehlende Seite"}`, () => {
    let gespeichert = false;
    let text = inhalt;
    const record = {
      getString: () => text,
      set: (feld: string, wert: string) => {
        assert.equal(feld, "inhalt");
        text = wert;
      },
    };
    runInNewContext(migration, {
      migrate: (up: (app: unknown) => void) => up({
        findFirstRecordByFilter: () => {
          if (inhalt === null) throw new Error("Nicht gefunden");
          return record;
        },
        save: (seite: unknown) => {
          assert.equal(seite, record);
          gespeichert = true;
        },
      }),
    });
    assert.equal(gespeichert, inhalt === bisher);
    if (inhalt === bisher) {
      assert.ok(text && text.length < bisher.length);
      assert.match(text, /Ferienheim Albin in Brigels/);
    } else {
      assert.equal(text, inhalt);
    }
  });
}
