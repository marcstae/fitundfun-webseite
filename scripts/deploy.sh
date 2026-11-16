#!/usr/bin/env bash
# Deploy auf dem Server, im Projektordner: scripts/deploy.sh (erst wenn CI grün ist).
# Baut, solange alles läuft; stoppt pb kurz und kopiert pb_data nach DEPLOY_BACKUP_DIR; startet und
# wartet, bis beide Container gesund sind; baut den Cache der Website neu auf.
# Bricht bei jedem Fehler ab. Scheitert die Kopie, startet es das bisherige pb wieder: Neue
# Migrationen laufen nie ohne Backup.
set -euo pipefail

# Alles in einer Funktion: «git pull» kann dieses Skript ändern, Bash liest es dann nicht mitten im Lauf neu.
main() {
  cd "$(dirname "$0")/.."
  set -a; . ./.env; set +a
  : "${DEPLOY_BACKUP_DIR:?in .env setzen: Ordner für die Kopie von pb_data vor jedem Deploy}"
  local daten="${PB_DATA_DIR:-./pb_data}" alt neu ziel

  alt=$(git rev-parse --short HEAD)
  git pull --ff-only
  neu=$(git rev-parse --short HEAD)
  echo "Deploy $alt -> $neu"

  docker compose build --pull

  # Im Namen auch der bisherige Commit: Zum Zurückgehen braucht es Daten und Code von vorher.
  ziel="$DEPLOY_BACKUP_DIR/pre-$neu-von-$alt-$(date -u +%Y%m%dT%H%M%SZ)"
  # Ausdrückliche Prüfungen statt eines ERR-Traps: Der feuert unter set -e nicht in jeder Bash-Version.
  docker compose stop pb
  trap 'echo "Abgebrochen: das bisherige pb läuft wieder." >&2; docker compose start pb; exit 130' INT TERM
  if ! (umask 077 && mkdir -p "$DEPLOY_BACKUP_DIR" && cp -a "$daten" "$ziel" && chmod 700 "$ziel"); then
    echo "Kopie fehlgeschlagen: das bisherige pb läuft wieder, nichts migriert." >&2
    docker compose start pb
    exit 1
  fi
  trap - INT TERM
  echo "Backup: $ziel"

  if ! docker compose up -d --wait --wait-timeout 300; then
    echo "Start fehlgeschlagen. Zurück: docker compose stop pb; pb_data durch $ziel ersetzen;" \
      "git checkout $alt; docker compose up -d --build" >&2
    exit 1
  fi

  # Secret über stdin, nicht in der Prozessliste.
  printf '{"secret":"%s","path":"/"}' "$REVALIDATE_SECRET" |
    curl -fsS -o /dev/null -X POST http://127.0.0.1:3843/api/revalidate -H 'content-type: application/json' --data @-
  echo "Fertig: $neu läuft, Cache neu aufgebaut."
}

main "$@"
