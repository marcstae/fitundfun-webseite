"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="de-CH">
      <body
        style={{
          margin: 0,
          display: "flex",
          minHeight: "100dvh",
          alignItems: "center",
          justifyContent: "center",
          background: "#f2f5f8",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.75rem", color: "#0f1e33" }}>
            Etwas ist schiefgelaufen.
          </h1>
          <p style={{ color: "#55617a" }}>
            Bitte Seite neu laden oder die Lagerleitung kontaktieren.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "9999px",
              border: "none",
              background: "#c13f26",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Neu laden
          </button>
        </main>
      </body>
    </html>
  );
}
