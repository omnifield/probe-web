package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"presets/internal/limits"
	"presets/internal/store"
)

// TestHealthzHandler — тот же ответ, что раньше отдавал REST-обработчик /healthz (internal/api
// до переезда на GraphQL): {ok, presets, bytes, limits}.
func TestHealthzHandler(t *testing.T) {
	s, err := store.Open(filepath.Join(t.TempDir(), "presets.db"), limits.Default)
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	t.Cleanup(func() { _ = s.Close() })

	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	healthzHandler(s, limits.Default)(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("ожидался 200, получено %d", rec.Code)
	}

	var body map[string]any
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("тело не JSON: %v", err)
	}
	if body["ok"] != true {
		t.Fatalf("ok не true: %+v", body)
	}
	if _, hasLimits := body["limits"]; !hasLimits {
		t.Fatalf("limits отсутствуют в ответе: %+v", body)
	}
}

// TestCORSPreflight — тот же контракт, что раньше нёс каждый REST-ответ сам (internal/api до
// переезда на GraphQL): преflight отвечает 204, не доходя до реального обработчика.
func TestCORSPreflight(t *testing.T) {
	reached := false
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { reached = true })

	req := httptest.NewRequest(http.MethodOptions, "/graphql", nil)
	rec := httptest.NewRecorder()
	withCORS(inner).ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("ожидался 204, получено %d", rec.Code)
	}
	if reached {
		t.Fatal("preflight не должен доходить до реального обработчика")
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Fatalf("Access-Control-Allow-Origin: %q", got)
	}
}

func TestCORSPassesThroughNonPreflightRequests(t *testing.T) {
	reached := false
	inner := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		reached = true
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodPost, "/graphql", nil)
	rec := httptest.NewRecorder()
	withCORS(inner).ServeHTTP(rec, req)

	if !reached {
		t.Fatal("не-preflight запрос должен доходить до реального обработчика")
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "*" {
		t.Fatalf("Access-Control-Allow-Origin: %q", got)
	}
}
