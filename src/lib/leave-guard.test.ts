import { test } from "node:test";
import assert from "node:assert/strict";

// Minimaler Browser-Ersatz: History mit asynchronem back() wie im echten Browser.
type Listener = (event: Event) => void;
const listeners = new Map<string, Set<Listener>>();
const on = (type: string, fn: Listener) => (listeners.get(type) ?? listeners.set(type, new Set()).get(type)!).add(fn);
const off = (type: string, fn: Listener) => listeners.get(type)?.delete(fn);
const fire = (type: string, event = new Event(type, { cancelable: true })) => {
  listeners.get(type)?.forEach((fn) => fn(event));
  return event;
};
const eintraege: { state: { leaveGuard?: boolean } | null }[] = [{ state: null }];
let index = 0;
const antworten: boolean[] = [];
const history = {
  get state() { return eintraege[index].state; },
  pushState(state: { leaveGuard?: boolean }) { eintraege.splice(index + 1); eintraege.push({ state }); index++; },
  replaceState(state: null) { eintraege[index] = { state }; },
  back() { setTimeout(() => { index--; fire("popstate"); }); },
};
Object.assign(globalThis, {
  window: { history, location: { href: "http://x/admin" }, addEventListener: on, removeEventListener: off, confirm: () => antworten.shift() ?? false },
  document: { addEventListener: on, removeEventListener: off },
});
const { formularOffen } = await import("./leave-guard.ts");
const tick = () => new Promise((r) => setTimeout(r, 5));
const aktiv = () => (listeners.get("popstate")?.size ?? 0) > 0;

test("Zwei Formulare: ein Zwischeneintrag, Speichern räumt ihn auf", async () => {
  const start = index;
  const zuA = formularOffen();
  const zuB = formularOffen();
  assert.equal(index, start + 1);
  assert.equal(history.state?.leaveGuard, true);
  zuA();
  await tick();
  assert.equal(index, start + 1, "B ist noch offen: Eintrag bleibt");
  zuB();
  await tick();
  assert.equal(index, start, "zuletzt gespeichert: Eintrag weg");
  assert.equal(aktiv(), false);
});

test("Zurück: «bleiben» setzt den Zwischeneintrag neu, «verwerfen» geht zurück ohne zweite Rückfrage", async () => {
  const start = index;
  const zu = formularOffen();
  antworten.push(false);
  history.back();
  await tick();
  assert.equal(index, start + 1, "bleiben: wieder auf dem Zwischeneintrag");
  antworten.push(true);
  history.back();
  await tick();
  await tick();
  assert.equal(index, start - 1, "verwerfen: einen Schritt hinter die Seite");
  assert.equal(fire("beforeunload").defaultPrevented, false, "Browser fragt nicht nochmals");
  zu();
  await tick();
  assert.equal(index, start - 1, "beim Verlassen kein zusätzliches back()");
});

test("Nach router.replace (z. B. Lager gelöscht) kein back()", async () => {
  const zu = formularOffen();
  history.replaceState(null);
  const vorher = index;
  zu();
  await tick();
  assert.equal(index, vorher);
});

test("Link-Klick: «bleiben» blockiert, ohne ungespeicherte Änderungen kein Schutz", () => {
  const zu = formularOffen();
  const klick = {
    button: 0,
    defaultPrevented: false,
    target: { closest: () => ({}) }, // Klick auf einen Link
    preventDefault() { this.defaultPrevented = true; },
    stopPropagation() {},
  };
  antworten.push(false);
  fire("click", klick as unknown as Event);
  assert.equal(klick.defaultPrevented, true);
  assert.equal(fire("beforeunload").defaultPrevented, true, "Neuladen fragt nach");
  zu();
  assert.equal(aktiv(), false);
  assert.equal(fire("beforeunload").defaultPrevented, false);
});
