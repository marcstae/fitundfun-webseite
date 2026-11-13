import { test } from "node:test";
import assert from "node:assert/strict";

// Muss vor dem Modul-Import gesetzt sein: family-access liest die Env beim Laden.
process.env.FAMILY_ACCESS_SECRET = "test-geheimnis-nur-fuer-den-server";

const familyAccess = await import("./family-access.ts");
test("Passwort-Hash: richtig/falsch", async () => {
  const hash = await familyAccess.hashLagerpasswort("TestPasswort123");
  assert.equal(await familyAccess.pruefeLagerpasswortHash("TestPasswort123", hash), true);
  assert.equal(await familyAccess.pruefeLagerpasswortHash("falsch", hash), false);
  assert.equal(await familyAccess.pruefeLagerpasswortHash("", hash), false);
});

test("Passwort-Hash: manipulierte Werte werden abgelehnt", async () => {
  assert.equal(await familyAccess.pruefeLagerpasswortHash("x", "kaputt"), false);
});

test("clientIp: X-Real-IP hat Vorrang vor X-Forwarded-For", () => {
  const h = new Headers({ "x-real-ip": "10.0.0.5", "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
  assert.equal(familyAccess.clientIp(h), "10.0.0.5");
});

test("clientIp: Fallback auf ersten X-Forwarded-For-Eintrag", () => {
  const h = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
  assert.equal(familyAccess.clientIp(h), "1.2.3.4");
});

test("clientIp: ohne Header 'unknown'", () => {
  assert.equal(familyAccess.clientIp(new Headers()), "unknown");
});

test("Rate-Limit: 10 erlaubt, 11. blockiert", () => {
  for (let i = 0; i < 10; i++) familyAccess.recordUnlockFailure("test-ip");
  assert.equal(familyAccess.unlockAttemptAllowed("test-ip"), false);
});

test("Rate-Limit: andere IP bleibt unberührt", () => {
  for (let i = 0; i < 10; i++) familyAccess.recordUnlockFailure("andere-ip");
  assert.equal(familyAccess.unlockAttemptAllowed("ganz-andere-ip"), true);
});

test("Rate-Limit: wechselnde (gefälschte) IPs stossen an das globale Limit", () => {
  // Bisher 20 Fehlversuche; 30 weitere mit je neuer IP erreichen das globale Maximum von 50.
  for (let i = 0; i < 30; i++) familyAccess.recordUnlockFailure(`10.0.0.${i}`);
  assert.equal(familyAccess.unlockAttemptAllowed("nie-gesehene-ip"), false);
});
