# PocketBase — Minimal-Image mit Migrations
FROM alpine:3.24

ARG PB_VERSION=0.42.3
# SHA-256 aus checksums.txt des Releases (https://ganigeorgiev.com/pocketbase/pocketbase/releases);
# beim Anheben von PB_VERSION mit anpassen. Nur genau diese Dateien kommen ins Image.
ARG PB_SHA256_AMD64=89b1ded352404c648dd92c2d884fc8ff7858138697cb1ccb52722ccaa0bbd2a9
ARG PB_SHA256_ARM64=f2af25259c5565e856aac5907a8fd9a7ce01d18375ac70b18121c9d41fd56dbe

RUN apk add --no-cache unzip ca-certificates tzdata curl su-exec && \
    addgroup -S pb && adduser -S -G pb pb

WORKDIR /pb

# PocketBase-Binary für amd64 oder arm64, mit Prüfsumme
RUN <<EOF
set -e
case "$(uname -m)" in
  aarch64|arm64) ARCH=arm64; SHA="$PB_SHA256_ARM64" ;;
  x86_64) ARCH=amd64; SHA="$PB_SHA256_AMD64" ;;
  *) echo "Nicht unterstützte Architektur: $(uname -m)" >&2; exit 1 ;;
esac
# Seit 0.41 nicht mehr auf GitHub; die Adresse leitet auf die eigentliche Datei weiter.
curl -fsSL -o /tmp/pb.zip "https://ganigeorgiev.com/meta/pocketbase/pocketbase/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${ARCH}.zip"
echo "${SHA}  /tmp/pb.zip" | sha256sum -c -
unzip /tmp/pb.zip -d /pb
rm /tmp/pb.zip
chmod +x /pb/pocketbase
EOF

COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks

RUN mkdir -p /pb/pb_data && chown -R pb:pb /pb

EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8090/api/health || exit 1

# Startet als root, damit frisch angelegte Bind-Mounts (root:root) dem pb-User gehören; PocketBase
# selbst läuft danach ohne Root-Rechte. -xdev: Liegt der Backup-Ordner auf einem anderen Datenträger
# (z. B. NAS), nur dessen Wurzel übernehmen und nicht abbrechen, wenn das Ziel chown verweigert.
CMD ["/bin/sh", "-c", "find /pb/pb_data -xdev -exec chown pb:pb {} + ; chown pb:pb /pb/pb_data/backups 2>/dev/null; exec su-exec pb /pb/pocketbase serve --http=0.0.0.0:8090 --origins=\"${PB_ORIGINS}\""]
