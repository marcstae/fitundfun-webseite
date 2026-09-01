import { test } from "node:test";
import assert from "node:assert/strict";

// Muss vor dem Modul-Import gesetzt sein: family-access liest die Env beim Laden.
process.env.FAMILY_ACCESS_PASSWORD = "TestPasswort123";

const familyAccess = await import("./family-access.ts");
test("isFamilyPassword: richtig/falsch", () => {
  assert.equal(familyAccess.isFamilyPassword("TestPasswort123"), true);
  assert.equal(familyAccess.isFamilyPassword("falsch"), false);
  assert.equal(familyAccess.isFamilyPassword(""), false);
});

test("familyAccessCookieValue: deterministisch und nicht leer", () => {
  assert.equal(familyAccess.familyAccessCookieValue(), familyAccess.familyAccessCookieValue());
  assert.ok(familyAccess.familyAccessCookieValue().length > 20);
});

test("hasFamilyAccess: gültiger Cookie-Wert", () => {
  assert.equal(familyAccess.hasFamilyAccess(familyAccess.familyAccessCookieValue()), true);
  assert.equal(familyAccess.hasFamilyAccess("manipuliert"), false);
  assert.equal(familyAccess.hasFamilyAccess(undefined), false);
  assert.equal(familyAccess.hasFamilyAccess(""), false);
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