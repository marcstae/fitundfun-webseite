# PocketBase — Minimal-Image mit Migrations
FROM alpine:3.20

ARG PB_VERSION=0.21.0

RUN apk add --no-cache unzip ca-certificates tzdata curl && \
    addgroup -S pb && adduser -S -G pb pb

WORKDIR /pb

# PocketBase-Binary (amd64; für arm64 den entsprechenden Release wählen)
RUN <<EOF
set -e
ARCH=amd64
case "$(uname -m)" in
  aarch64|arm64) ARCH=arm64 ;;
  x86_64) ARCH=amd64 ;;
esac
wget -q -O /tmp/pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${ARCH}.zip"
unzip /tmp/pb.zip -d /pb
rm /tmp/pb.zip
chmod +x /pb/pocketbase
EOF

COPY pb_migrations /pb/pb_migrations

RUN mkdir -p /pb/pb_data && chown -R pb:pb /pb
USER pb

EXPOSE 8090

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8090/api/health || exit 1

CMD ["/bin/sh", "-c", "exec /pb/pocketbase serve --http=0.0.0.0:8090 --origins=\"${PB_ORIGINS}\""]
