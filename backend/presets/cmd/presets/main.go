// Точка входа: открыть базу, поднять сервер, вежливо лечь по сигналу.
//
// Настройка — окружением: то, что развёртывается томом или портом, настраивает тот, кто
// РАЗВОРАЧИВАЕТ, а не тот, кто пишет код.
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"syscall"
	"time"

	"presets/internal/api"
	"presets/internal/limits"
	"presets/internal/store"
)

func main() {
	port := env("PRESETS_PORT", "8787")
	host := env("PRESETS_HOST", "0.0.0.0")

	// Свой флаг проверки живости вместо curl/wget в образе: бинарник и так умеет говорить по
	// HTTP, тащить в alpine отдельную тулзу ради HEALTHCHECK незачем.
	if len(os.Args) > 1 && os.Args[1] == "-healthcheck" {
		healthcheckAddr := host
		if healthcheckAddr == "0.0.0.0" {
			healthcheckAddr = "127.0.0.1"
		}
		resp, err := http.Get(fmt.Sprintf("http://%s:%s/healthz", healthcheckAddr, port))
		if err != nil || resp.StatusCode != http.StatusOK {
			os.Exit(1)
		}
		os.Exit(0)
	}

	dbPath := env("PRESETS_DB", "./db/presets.db")

	lim := limits.Default
	lim.RecordBytes = envInt64("PRESETS_MAX_RECORD_BYTES", lim.RecordBytes)
	lim.RecordsPerKind = int(envInt64("PRESETS_MAX_RECORDS_PER_KIND", int64(lim.RecordsPerKind)))
	lim.TotalBytes = envInt64("PRESETS_MAX_TOTAL_BYTES", lim.TotalBytes)
	lim.LabelChars = int(envInt64("PRESETS_MAX_LABEL_CHARS", int64(lim.LabelChars)))
	lim.DescriptionChars = int(envInt64("PRESETS_MAX_DESCRIPTION_CHARS", int64(lim.DescriptionChars)))

	if err := os.MkdirAll(filepath.Dir(dbPath), 0o755); err != nil {
		log.Fatalf("[presets] не создать каталог базы: %v", err)
	}

	db, err := store.Open(dbPath, lim)
	if err != nil {
		log.Fatalf("[presets] %v", err)
	}
	defer db.Close()

	handler := api.New(db, lim)
	server := &http.Server{
		Addr:    host + ":" + port,
		Handler: handler,
	}

	go func() {
		records, bytesUsed, _ := db.Stats()
		log.Printf("[presets] слушаю %s, база %s, записей %d, занято %d Б", server.Addr, dbPath, records, bytesUsed)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("[presets] сервер упал: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGTERM, syscall.SIGINT)
	sig := <-stop
	log.Printf("[presets] %v — останавливаюсь", sig)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := server.Shutdown(ctx); err != nil {
		log.Printf("[presets] остановка не завершилась чисто: %v", err)
	}
}

// env читает переменную окружения; пустая или отсутствующая — берётся запасное значение.
func env(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok && value != "" {
		return value
	}
	return fallback
}

// envInt64 — то же самое для чисел; нечисловое значение — предупреждение в лог и запасное число.
func envInt64(key string, fallback int64) int64 {
	value, ok := os.LookupEnv(key)
	if !ok || value == "" {
		return fallback
	}
	parsed, err := strconv.ParseInt(value, 10, 64)
	if err != nil {
		fmt.Printf("[presets] %s=%q не число, беру значение по умолчанию\n", key, value)
		return fallback
	}
	return parsed
}
