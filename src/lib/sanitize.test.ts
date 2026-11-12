import assert from "node:assert/strict";
import { test } from "node:test";
import { richTextToPlainText, sanitizeRichText } from "./sanitize.ts";

test("Editor-Markup (div/b/i) bleibt als Absatz, Fett und Kursiv erhalten", () => {
  assert.equal(
    sanitizeRichText("Liebe Familien<div><b>Anmeldung</b> bis <i>Dezember</i></div>"),
    "Liebe Familien<p><strong>Anmeldung</strong> bis <em>Dezember</em></p>"
  );
});

test("Rich-Text wird zu lesbarem, sicherem Klartext", () => {
  assert.equal(
    richTextToPlainText("<p>fit&fun</p><script>alert(1)</script><p>Brigels &lt;3</p>"),
    "fit&fun Brigels <3"
  );
});
