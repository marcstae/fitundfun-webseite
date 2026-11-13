// Browser-Test des Schutzes vor ungespeicherten Änderungen gegen das echte Next.js (CI).
// Der Zurück-Knopf-Schutz hängt am Verlaufs-Verhalten von Next.js; ein Update kann ihn still brechen.
// Aufruf: E2E=1 npm run build && npx next start -p 3100 & node scripts/e2e-schutz.mjs http://localhost:3100
// Ohne Abhängigkeiten: Chrome über das DevTools-Protokoll, WebSocket aus Node.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";

const BASIS = process.argv[2] || "http://localhost:3100";
const log = (...a) => writeSync(1, a.join(" ") + "\n"); // sofort, auch wenn der Test abbricht
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CHROME = [
  process.env.CHROME,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].find((p) => p && existsSync(p));
assert.ok(CHROME, "Chrome nicht gefunden (Pfad über CHROME setzen)");

// Frisches Profil und freier Port pro Lauf; Chrome schreibt den Port in DevToolsActivePort.
const profil = mkdtempSync(join(tmpdir(), "e2e-schutz-"));
const chrome = spawn(CHROME, [
  "--headless=new", "--no-first-run", "--no-default-browser-check", "--remote-debugging-port=0",
  `--user-data-dir=${profil}`, ...(process.env.CI ? ["--no-sandbox"] : []), "about:blank",
], { stdio: "ignore" });

let ws;
async function bis(fn, ms = 15000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try { if (await fn()) return true; } catch {}
    await sleep(150);
  }
  return false;
}

try {
  const portDatei = join(profil, "DevToolsActivePort");
  assert.ok(await bis(() => existsSync(portDatei) && readFileSync(portDatei, "utf8").includes("\n"), 20000), "Chrome startet nicht");
  const port = readFileSync(portDatei, "utf8").split("\n")[0];
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  ws = new WebSocket(tabs.find((t) => t.type === "page").webSocketDebuggerUrl);
  await new Promise((r, f) => { ws.onopen = r; ws.onerror = f; });

  let id = 0;
  const warten = new Map();
  const rueckfragen = [];
  let plan = [];
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; warten.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.method === "Page.javascriptDialogOpening") {
      const ja = plan.shift() ?? false;
      rueckfragen.push(`${m.params.type}:${ja ? "ja" : "nein"}`);
      send("Page.handleJavaScriptDialog", { accept: ja });
    }
    warten.get(m.id)?.(m);
  };
  const js = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.result.value;
  const pfad = () => js("location.pathname");
  const leiste = () => js("[...document.querySelectorAll('[role=status]')].map((e) => e.textContent).join('|')");
  const tippen = async (sel, text) => { await js(`document.querySelector('${sel}').focus()`); await send("Input.insertText", { text }); };
  const laden = async () => {
    await send("Page.navigate", { url: `${BASIS}/e2e/ziel` });
    assert.ok(await bis(async () => (await js("document.readyState")) === "complete" && (await pfad()) === "/e2e/ziel"), "Zielseite lädt");
    await send("Page.navigate", { url: `${BASIS}/e2e/schutz` });
    assert.ok(await bis(() => js("!!Object.keys(document.querySelector('#feld-A') || {}).find((k) => k.startsWith('__react'))"), 20000), "Testseite hydriert");
  };
  const ok = (name) => log("✔", name);
  await send("Page.enable");

  await laden();
  const l0 = await js("history.length");
  await tippen("#feld-A", "x");
  assert.ok(await bis(async () => /A nicht gespeichert/.test(await leiste())), "Leiste erscheint");
  assert.equal(await js("history.length"), l0 + 1, "genau ein Zwischeneintrag");
  ok("Tippen: Leiste, ein Zwischeneintrag");

  plan = [false];
  await js("history.back()");
  await sleep(800);
  assert.equal(await pfad(), "/e2e/schutz");
  assert.equal(await js("document.querySelector('#feld-A').value"), "x");
  ok("Zurück + bleiben: Seite und Eingabe bleiben");

  plan = [true];
  await js("history.back()");
  assert.ok(await bis(async () => (await pfad()) === "/e2e/ziel"), "Zurück + verwerfen führt weg");
  ok("Zurück + verwerfen: vorherige Seite, ohne zweite Browser-Rückfrage");

  await laden();
  const l1 = await js("history.length");
  await tippen("#feld-A", "a");
  await tippen("#feld-B", "b");
  assert.ok(await bis(async () => /B nicht gespeichert/.test(await leiste())));
  assert.equal(await js("history.length"), l1 + 1, "zwei Formulare, ein Zwischeneintrag");
  const vorher = rueckfragen.length;
  plan = [];
  await js("document.querySelector('#speichern-A').click()");
  await js("document.querySelector('#speichern-B').click()");
  assert.ok(await bis(async () => (await leiste()) === ""), "Leisten weg");
  await sleep(500);
  await js("history.back()");
  assert.ok(await bis(async () => (await pfad()) === "/e2e/ziel"), "nach dem Speichern genügt ein Zurück");
  assert.equal(rueckfragen.length, vorher, "Speichern fragt nie nach");
  ok("Zwei Formulare: eine Rückfrage-Stelle, Speichern räumt auf");

  await laden();
  await tippen("#feld-A", "x");
  assert.ok(await bis(async () => /A nicht/.test(await leiste())));
  plan = [false];
  await js("document.querySelector('#link').click()");
  await sleep(800);
  assert.equal(await pfad(), "/e2e/schutz");
  plan = [true];
  await js("document.querySelector('#link').click()");
  assert.ok(await bis(async () => (await pfad()) === "/e2e/ziel"));
  ok("Link: bleiben / verwerfen");

  await laden();
  const esc = async () => {
    for (const type of ["keyDown", "keyUp"]) await send("Input.dispatchKeyEvent", { type, key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
    await sleep(500);
  };
  const dialogOffen = () => js("!!document.querySelector('[role=dialog]')");
  const d0 = rueckfragen.length;
  await js("document.querySelector('#dialog-auf').click()");
  assert.ok(await bis(dialogOffen));
  await esc();
  assert.equal(await dialogOffen(), false);
  assert.equal(rueckfragen.length, d0, "ohne Eingabe keine Rückfrage");
  await js("document.querySelector('#dialog-auf').click()");
  assert.ok(await bis(dialogOffen));
  await tippen("#dialog-feld", "neu");
  plan = [false];
  await esc();
  assert.equal(await dialogOffen(), true);
  plan = [true];
  await esc();
  assert.equal(await dialogOffen(), false);
  ok("Dialog: still ohne Eingabe, Rückfrage mit Eingabe");

  assert.deepEqual(rueckfragen, ["confirm:nein", "confirm:ja", "confirm:nein", "confirm:ja", "confirm:nein", "confirm:ja"]);
  log("Alle Fälle bestanden. Rückfragen:", rueckfragen.join(", "));
} catch (e) {
  log("FEHLER:", e.message.split("\n")[0]);
  process.exitCode = 1;
} finally {
  ws?.close();
  chrome.kill();
  await sleep(300);
  rmSync(profil, { recursive: true, force: true });
}
