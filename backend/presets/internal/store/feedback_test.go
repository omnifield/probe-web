package store

import (
	"encoding/json"
	"testing"

	"presets/internal/limits"
)

func TestFeedbackCreateAndGet(t *testing.T) {
	s := open(t, limits.Default)

	entry, err := s.CreateFeedback(json.RawMessage(`{"tool":"save_preset","action":"позвал","actual":"упало","sign":"issue","status":"open"}`))
	if err != nil {
		t.Fatalf("CreateFeedback: %v", err)
	}
	if entry.ID == "" || entry.SavedAt == "" {
		t.Fatalf("id/savedAt не выданы: %+v", entry)
	}

	got, err := s.GetFeedback(entry.ID)
	if err != nil {
		t.Fatalf("GetFeedback: %v", err)
	}
	if string(got.State) != string(entry.State) {
		t.Fatalf("state разошёлся: %s", got.State)
	}
}

func TestFeedbackGetNotFound(t *testing.T) {
	s := open(t, limits.Default)
	if _, err := s.GetFeedback("нет-такого"); err != ErrNotFound {
		t.Fatalf("ожидался ErrNotFound, получено %v", err)
	}
}

func TestFeedbackListNewestFirst(t *testing.T) {
	s := open(t, limits.Default)

	first, err := s.CreateFeedback(json.RawMessage(`{"n":1}`))
	if err != nil {
		t.Fatalf("Create 1: %v", err)
	}
	second, err := s.CreateFeedback(json.RawMessage(`{"n":2}`))
	if err != nil {
		t.Fatalf("Create 2: %v", err)
	}

	items, err := s.ListFeedback()
	if err != nil {
		t.Fatalf("ListFeedback: %v", err)
	}
	if len(items) != 2 {
		t.Fatalf("ожидалось 2 заявки, получено %d", len(items))
	}
	if items[0].ID != second.ID || items[1].ID != first.ID {
		t.Fatalf("порядок не «новые сверху»: %+v", items)
	}
}

func TestFeedbackReplaceStateKeepsIDUpdatesSavedAt(t *testing.T) {
	s := open(t, limits.Default)

	entry, err := s.CreateFeedback(json.RawMessage(`{"status":"open"}`))
	if err != nil {
		t.Fatalf("CreateFeedback: %v", err)
	}

	updated, err := s.ReplaceFeedbackState(entry.ID, json.RawMessage(`{"status":"resolved"}`))
	if err != nil {
		t.Fatalf("ReplaceFeedbackState: %v", err)
	}
	if updated.ID != entry.ID {
		t.Fatalf("id изменился: было %s, стало %s", entry.ID, updated.ID)
	}
	if updated.SavedAt == entry.SavedAt {
		t.Fatalf("savedAt не обновился при замене")
	}

	got, err := s.GetFeedback(entry.ID)
	if err != nil {
		t.Fatalf("GetFeedback: %v", err)
	}
	if string(got.State) != `{"status":"resolved"}` {
		t.Fatalf("state не заменился: %s", got.State)
	}
}

func TestFeedbackReplaceNotFound(t *testing.T) {
	s := open(t, limits.Default)
	if _, err := s.ReplaceFeedbackState("нет-такого", json.RawMessage(`{}`)); err != ErrNotFound {
		t.Fatalf("ожидался ErrNotFound, получено %v", err)
	}
}

// TestFeedbackCountsTowardSharedTotalBytes — диск общий ресурс (та же причина, что у Preset,
// FAQ.md "Пределы"): фидбэк не получает отдельный безлимитный бюджет мимо общего счётчика.
func TestFeedbackCountsTowardSharedTotalBytes(t *testing.T) {
	lim := limits.Default
	lim.TotalBytes = 40 // меньше, чем весит даже одна маленькая заявка + meta-конверт

	s := open(t, lim)
	if _, err := s.CreateFeedback(json.RawMessage(`{"tool":"x","action":"y","actual":"z","sign":"issue","status":"open","at":"2026-09-09T00:00:00Z"}`)); err == nil {
		t.Fatal("ожидался отказ по общему пределу байт")
	} else if _, ok := err.(*StorageFullError); !ok {
		t.Fatalf("ожидался StorageFullError, получено %T: %v", err, err)
	}
}
