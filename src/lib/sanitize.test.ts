import assert from "node:assert/strict";
import { test } from "node:test";
import { richTextToPlainText } from "./sanitize.ts";

test("Rich-Text wird zu lesbarem, sicherem Klartext", () => {
  assert.equal(
    richTextToPlainText("<p>fit&fun</p><script>alert(1)</script><p>Brigels &lt;3</p>"),
    "fit&fun Brigels <3"
  );
});
