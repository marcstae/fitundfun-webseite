import { test } from "node:test";
import assert from "node:assert/strict";
import { cronAusZeitplan, zeitplanAusCron, type Zeitplan } from "./backup.ts";

test("Zeitplan: Cockpit-Einstellung und Cron ergeben hin und zurück dasselbe", () => {
  const faelle: [Zeitplan, string][] = [
    [{ rhythmus: "taeglich", uhrzeit: "03:00", wochentag: 0 }, "0 3 * * *"],
    [{ rhythmus: "taeglich", uhrzeit: "23:59", wochentag: 0 }, "59 23 * * *"],
    [{ rhythmus: "woechentlich", uhrzeit: "04:30", wochentag: 1 }, "30 4 * * 1"],
    [{ rhythmus: "aus", uhrzeit: "03:00", wochentag: 0 }, ""],
  ];
  for (const [zeitplan, cron] of faelle) {
    assert.equal(cronAusZeitplan(zeitplan), cron);
    assert.deepEqual(zeitplanAusCron(cron), zeitplan);
  }
});

test("Zeitplan: fremde oder ungültige Cron-Ausdrücke werden nicht als Cockpit-Zeitplan gelesen", () => {
  for (const cron of ["*/30 * * * *", "0 3 1 * *", "0 24 * * *", "60 3 * * *", "0 3 * * 7"]) {
    assert.equal(zeitplanAusCron(cron), null, cron);
  }
});
