// Schutz vor dem Verlassen mit ungespeicherten Änderungen (Link, Neuladen, Zurück-Knopf).
// Einer für die ganze Seite, auch wenn mehrere Formulare offen sind (z. B. Startseite und
// Akzentfarben): sonst gäbe es doppelte Rückfragen, und das Aufräumen des einen löste das andere aus.

export const VERWERFEN = "Ungespeicherte Änderungen verwerfen?";

let offeneFormulare = 0;
let verlassen = false;

// Nach bestätigtem Verwerfen nicht ein zweites Mal fragen (Zurück zu einer voll geladenen Seite).
function beforeUnload(event: Event) {
  if (!verlassen) event.preventDefault();
}

// Klicks auf Links und «Abmelden» abfangen: Next-Navigation löst kein beforeunload aus.
// Capture-Phase auf document läuft vor den React-Handlern.
function onClick(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (!(event.target as Element | null)?.closest?.('a[href]:not([target="_blank"]), [data-leave-guard]')) return;
  if (window.confirm(VERWERFEN)) verlassen = true;
  else {
    event.preventDefault();
    event.stopPropagation();
  }
}

// Zurück-Knopf: Ein Zwischeneintrag mit derselben URL fängt den ersten Schritt zurück ab. Next.js
// kopiert seinen Router-Zustand hinein, die Seite bleibt also stehen, und wir können nachfragen.
// Jedes Mal ein neues Objekt: Next.js schreibt in das übergebene Objekt hinein.
function zwischeneintrag() {
  window.history.pushState({ leaveGuard: true }, "", window.location.href);
}

function onPopState() {
  if (verlassen) return;
  if (window.confirm(VERWERFEN)) {
    verlassen = true;
    window.history.back();
  } else zwischeneintrag();
}

/** Ein Formular hat ungespeicherte Änderungen. Gibt die Abmeldung zurück (für useEffect). */
export function formularOffen() {
  if (offeneFormulare++ === 0) {
    verlassen = false;
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    zwischeneintrag();
  }
  return () => {
    if (--offeneFormulare > 0) return;
    window.removeEventListener("beforeunload", beforeUnload);
    document.removeEventListener("click", onClick, true);
    window.removeEventListener("popstate", onPopState);
    // Gespeichert, ohne die Seite zu verlassen: Zwischeneintrag wieder entfernen, sonst bräuchte
    // «Zurück» einen Klick mehr. Nach router.replace (z. B. Lager gelöscht) ist er schon weg.
    // ponytail: Wird innert Millisekunden nach dem Speichern wieder getippt, kann das asynchrone
    // back() mit dem neuen Zwischeneintrag kollidieren und einmal unnötig nachfragen.
    if (!verlassen && window.history.state?.leaveGuard) window.history.back();
  };
}
