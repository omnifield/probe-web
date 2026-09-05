package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"presets/internal/limits"
	"presets/internal/store"
)

func newHandler(t *testing.T, lim limits.Limits) *Handler {
	t.Helper()
	path := filepath.Join(t.TempDir(), "presets.db")
	s, err := store.Open(path, lim)
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	t.Cleanup(func() { _ = s.Close() })
	return New(s, lim)
}

func do(h *Handler, method, target string, body any) *httptest.ResponseRecorder {
	var reader *bytes.Reader
	if body != nil {
		raw, ok := body.([]byte)
		if !ok {
			raw, _ = json.Marshal(body)
		}
		reader = bytes.NewReader(raw)
	} else {
		reader = bytes.NewReader(nil)
	}
	req := httptest.NewRequest(method, target, reader)
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func decode[T any](t *testing.T, rec *httptest.ResponseRecorder) T {
	t.Helper()
	var value T
	if err := json.Unmarshal(rec.Body.Bytes(), &value); err != nil {
		t.Fatalf("тело не разобралось (%v): %s", err, rec.Body.String())
	}
	return value
}

type errBody struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

type metaBody struct {
	ID          string `json:"id"`
	Label       string `json:"label"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Kind        string `json:"kind"`
	SavedAt     string `json:"savedAt"`
}

func TestHealthz(t *testing.T) {
	h := newHandler(t, limits.Default)
	rec := do(h, http.MethodGet, "/healthz", nil)
	if rec.Code != http.StatusOK {
		t.Fatalf("код %d, тело %s", rec.Code, rec.Body)
	}
}

func TestOptionsPreflight(t *testing.T) {
	h := newHandler(t, limits.Default)
	rec := do(h, http.MethodOptions, "/api/presets", nil)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("код %d", rec.Code)
	}
	if rec.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Fatalf("CORS не проставлен: %v", rec.Header())
	}
}

func TestCreateThenGetRoundtrip(t *testing.T) {
	h := newHandler(t, limits.Default)

	rec := do(h, http.MethodPost, "/api/presets", map[string]any{
		"label": "Твиттер тёмный",
		"name":  "twitter-dark",
		"kind":  "skin",
		"state": map[string]any{"mode": "dark"},
	})
	if rec.Code != http.StatusCreated {
		t.Fatalf("код %d, тело %s", rec.Code, rec.Body)
	}
	if rec.Header().Get("Access-Control-Allow-Origin") != "*" {
		t.Fatalf("CORS отсутствует на успешном ответе")
	}
	location := rec.Header().Get("Location")
	if location == "" || !strings.HasPrefix(location, "/api/presets/") {
		t.Fatalf("Location не проставлен: %q", location)
	}
	meta := decode[metaBody](t, rec)
	if meta.Name != "twitter-dark" || meta.Kind != "skin" {
		t.Fatalf("мета неверна: %+v", meta)
	}
	if bytes.Contains(rec.Body.Bytes(), []byte("mode")) {
		t.Fatalf("ответ на создание не должен нести state: %s", rec.Body)
	}

	get := do(h, http.MethodGet, location, nil)
	if get.Code != http.StatusOK {
		t.Fatalf("GET по Location: код %d, тело %s", get.Code, get.Body)
	}
	var full struct {
		State map[string]any `json:"state"`
	}
	if err := json.Unmarshal(get.Body.Bytes(), &full); err != nil {
		t.Fatal(err)
	}
	if full.State["mode"] != "dark" {
		t.Fatalf("state не вернулся: %s", get.Body)
	}
}

func TestGetNotFound(t *testing.T) {
	h := newHandler(t, limits.Default)
	rec := do(h, http.MethodGet, "/api/presets/нет-такого", nil)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("код %d", rec.Code)
	}
	body := decode[errBody](t, rec)
	if body.Error != "not_found" {
		t.Fatalf("код отказа: %+v", body)
	}
}

func TestListWithoutAndWithKind(t *testing.T) {
	h := newHandler(t, limits.Default)
	do(h, http.MethodPost, "/api/presets", map[string]any{"label": "a", "kind": "skin", "state": 1})
	do(h, http.MethodPost, "/api/presets", map[string]any{"label": "b", "kind": "filter", "state": 1})

	all := do(h, http.MethodGet, "/api/presets", nil)
	var allBody struct {
		Items []metaBody `json:"items"`
	}
	if err := json.Unmarshal(all.Body.Bytes(), &allBody); err != nil {
		t.Fatal(err)
	}
	if len(allBody.Items) != 2 {
		t.Fatalf("без фильтра ожидалось 2, получено %d", len(allBody.Items))
	}

	filtered := do(h, http.MethodGet, "/api/presets?kind=skin", nil)
	var filteredBody struct {
		Items []metaBody `json:"items"`
	}
	if err := json.Unmarshal(filtered.Body.Bytes(), &filteredBody); err != nil {
		t.Fatal(err)
	}
	if len(filteredBody.Items) != 1 || filteredBody.Items[0].Kind != "skin" {
		t.Fatalf("по kind=skin ожидалась 1 запись вида skin, получено %+v", filteredBody.Items)
	}
}

func TestListBadKindIsRejectedNotEmptyList(t *testing.T) {
	h := newHandler(t, limits.Default)
	rec := do(h, http.MethodGet, "/api/presets?kind=Bad_Kind!", nil)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("код %d, тело %s", rec.Code, rec.Body)
	}
	body := decode[errBody](t, rec)
	if body.Error != "bad_kind" {
		t.Fatalf("код отказа: %+v", body)
	}
}

func TestCreateValidationErrors(t *testing.T) {
	h := newHandler(t, limits.Default)

	cases := []struct {
		name    string
		payload any
		code    string
	}{
		{"нет label", map[string]any{"state": 1}, "label_required"},
		{"пустой label", map[string]any{"label": "   ", "state": 1}, "label_required"},
		{"label не строка", map[string]any{"label": 5, "state": 1}, "label_required"},
		{"label слишком длинный", map[string]any{"label": strings.Repeat("а", 121), "state": 1}, "label_too_long"},
		{"плохой name", map[string]any{"label": "x", "name": "Bad Name", "state": 1}, "bad_name"},
		{"description не строка", map[string]any{"label": "x", "description": 5, "state": 1}, "bad_description"},
		{"description длинный", map[string]any{"label": "x", "description": strings.Repeat("а", 1001), "state": 1}, "description_too_long"},
		{"плохой kind", map[string]any{"label": "x", "kind": "Bad!", "state": 1}, "bad_kind"},
		{"нет state", map[string]any{"label": "x"}, "state_required"},
		{"не объект", []int{1, 2, 3}, "bad_request"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rec := do(h, http.MethodPost, "/api/presets", tc.payload)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("код %d, тело %s", rec.Code, rec.Body)
			}
			body := decode[errBody](t, rec)
			if body.Error != tc.code {
				t.Fatalf("ожидался код %q, получено %+v", tc.code, body)
			}
		})
	}
}

func TestCreateBadJSON(t *testing.T) {
	h := newHandler(t, limits.Default)
	rec := do(h, http.MethodPost, "/api/presets", []byte("{не json"))
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("код %d", rec.Code)
	}
	if body := decode[errBody](t, rec); body.Error != "bad_json" {
		t.Fatalf("код отказа: %+v", body)
	}
}

func TestCreateNullOptionalFieldsBehaveAsAbsent(t *testing.T) {
	h := newHandler(t, limits.Default)
	rec := do(h, http.MethodPost, "/api/presets", []byte(`{"label":"x","name":null,"kind":null,"description":null,"state":0}`))
	if rec.Code != http.StatusCreated {
		t.Fatalf("код %d, тело %s", rec.Code, rec.Body)
	}
}

func TestCreateTooLarge(t *testing.T) {
	lim := limits.Default
	lim.RecordBytes = 32
	h := newHandler(t, lim)

	rec := do(h, http.MethodPost, "/api/presets", map[string]any{
		"label": "x",
		"state": strings.Repeat("0123456789", 10),
	})
	if rec.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("код %d, тело %s", rec.Code, rec.Body)
	}
	body := decode[errBody](t, rec)
	if body.Error != "too_large" {
		t.Fatalf("код отказа: %+v", body)
	}
	if rec.Header().Get("Connection") != "close" {
		t.Fatalf("соединение обязано закрыться после недочитанного тела")
	}
}

func TestCreateNameTaken(t *testing.T) {
	h := newHandler(t, limits.Default)
	do(h, http.MethodPost, "/api/presets", map[string]any{"label": "x", "kind": "skin", "name": "brand", "state": 1})

	rec := do(h, http.MethodPost, "/api/presets", map[string]any{"label": "y", "kind": "skin", "name": "brand", "state": 2})
	if rec.Code != http.StatusConflict {
		t.Fatalf("код %d, тело %s", rec.Code, rec.Body)
	}
	if body := decode[errBody](t, rec); body.Error != "name_taken" {
		t.Fatalf("код отказа: %+v", body)
	}
}

func TestCreateStorageFullRecords(t *testing.T) {
	lim := limits.Default
	lim.RecordsPerKind = 1
	h := newHandler(t, lim)

	do(h, http.MethodPost, "/api/presets", map[string]any{"label": "x", "kind": "skin", "state": 1})
	rec := do(h, http.MethodPost, "/api/presets", map[string]any{"label": "y", "kind": "skin", "state": 2})
	if rec.Code != http.StatusConflict {
		t.Fatalf("код %d, тело %s", rec.Code, rec.Body)
	}
	if body := decode[errBody](t, rec); body.Error != "storage_full" {
		t.Fatalf("код отказа: %+v", body)
	}
}

func TestReplaceRoundtrip(t *testing.T) {
	h := newHandler(t, limits.Default)
	created := decode[metaBody](t, do(h, http.MethodPost, "/api/presets", map[string]any{
		"label": "x", "kind": "skin", "name": "brand", "state": 1,
	}))

	rec := do(h, http.MethodPut, "/api/presets/"+created.ID, map[string]any{
		"label": "x2", "kind": "skin", "name": "brand", "state": 2,
	})
	if rec.Code != http.StatusOK {
		t.Fatalf("код %d, тело %s", rec.Code, rec.Body)
	}
	replaced := decode[metaBody](t, rec)
	if replaced.ID != created.ID {
		t.Fatalf("id обязан сохраниться: было %s, стало %s", created.ID, replaced.ID)
	}

	get := do(h, http.MethodGet, "/api/presets/"+created.ID, nil)
	if !bytes.Contains(get.Body.Bytes(), []byte(`"state":2`)) {
		t.Fatalf("state не заменился: %s", get.Body)
	}
}

func TestReplaceNotFound(t *testing.T) {
	h := newHandler(t, limits.Default)
	rec := do(h, http.MethodPut, "/api/presets/нет-такого", map[string]any{"label": "x", "state": 1})
	if rec.Code != http.StatusNotFound {
		t.Fatalf("код %d, тело %s", rec.Code, rec.Body)
	}
}

func TestDeleteThenNotFound(t *testing.T) {
	h := newHandler(t, limits.Default)
	created := decode[metaBody](t, do(h, http.MethodPost, "/api/presets", map[string]any{"label": "x", "state": 1}))

	del := do(h, http.MethodDelete, "/api/presets/"+created.ID, nil)
	if del.Code != http.StatusNoContent {
		t.Fatalf("код %d", del.Code)
	}

	again := do(h, http.MethodDelete, "/api/presets/"+created.ID, nil)
	if again.Code != http.StatusNotFound {
		t.Fatalf("повторное удаление: код %d", again.Code)
	}
}

func TestMethodNotAllowed(t *testing.T) {
	h := newHandler(t, limits.Default)
	rec := do(h, http.MethodDelete, "/api/presets", nil)
	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("код %d", rec.Code)
	}
	if rec.Header().Get("Allow") == "" {
		t.Fatalf("заголовок Allow не проставлен")
	}
}

func TestNotFoundOnUnknownPath(t *testing.T) {
	h := newHandler(t, limits.Default)
	rec := do(h, http.MethodGet, "/api/unknown", nil)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("код %d", rec.Code)
	}
}

func TestIDWithSlashIsNotFoundNotPathTraversal(t *testing.T) {
	h := newHandler(t, limits.Default)
	rec := do(h, http.MethodGet, fmt.Sprintf("/api/presets/%s", "a/b"), nil)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("код %d", rec.Code)
	}
}
