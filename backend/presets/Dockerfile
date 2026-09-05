# Служба пресетов. Двухступенчатая сборка: первый слой собирает статический бинарник Go,
# второй его просто запускает — итоговый образ не носит в себе ни компилятора, ни исходников.

FROM golang:1.27-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY cmd ./cmd
COPY internal ./internal
RUN CGO_ENABLED=0 go build -o /out/presets ./cmd/presets

FROM alpine:3.22
RUN apk add --no-cache ca-certificates

ENV PRESETS_DB=/data/presets.db \
    PRESETS_PORT=8787 \
    PRESETS_HOST=0.0.0.0

RUN addgroup -S presets && adduser -S presets -G presets

WORKDIR /app
COPY --from=build /out/presets ./presets

# Данные ПЕРЕЖИВАЮТ перезапуск: том, а не слой образа. Без этого первый же `docker rm` унёс бы
# всё сохранённое — а сохранённое там чужое.
RUN mkdir -p /data && chown presets:presets /data
VOLUME ["/data"]

USER presets
EXPOSE 8787

# Проверка живости — той же службой, без лишних тулз в образе: сам бинарник умеет /healthz,
# отдельный curl/wget сюда тащить незачем.
HEALTHCHECK --interval=30s --timeout=3s --start-period=3s --retries=3 \
  CMD ["/app/presets", "-healthcheck"]

CMD ["/app/presets"]
