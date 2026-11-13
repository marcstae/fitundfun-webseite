"use client";
// Nur für den Browser-Test in CI (E2E=1, siehe next.config.mjs und scripts/e2e-schutz.mjs).
// Im normalen Build gibt es diese Seite nicht.
import * as React from "react";
import Link from "next/link";
import { DirtySaveBar, SaveDialog, useFormular } from "@/components/edit/save-dialog";

function Formular({ name }: { name: string }) {
  const { wert, setWert, dirty, alsGespeichert } = useFormular({ text: "" });
  return (
    <section>
      <input id={`feld-${name}`} value={wert.text} onChange={(e) => setWert({ text: e.target.value })} />
      <button id={`speichern-${name}`} onClick={() => alsGespeichert(wert)}>speichern {name}</button>
      <DirtySaveBar dirty={dirty} saving={false} onSave={() => alsGespeichert(wert)} label={`${name} nicht gespeichert`} />
    </section>
  );
}

export default function SchutzTest() {
  const [offen, setOffen] = React.useState(false);
  return (
    <main>
      <Link id="link" href="/e2e/ziel">weg</Link>
      <button id="dialog-auf" onClick={() => setOffen(true)}>Dialog</button>
      <Formular name="A" />
      <Formular name="B" />
      <SaveDialog open={offen} onOpenChange={setOffen} title="Test" saving={false} onSave={() => setOffen(false)}>
        <input id="dialog-feld" />
      </SaveDialog>
    </main>
  );
}
