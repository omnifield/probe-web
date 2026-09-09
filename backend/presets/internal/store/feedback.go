package store

import (
	"encoding/binary"
	"encoding/json"
	"sort"
	"time"

	"go.etcd.io/bbolt"

	"presets/internal/model"
)

// Package-level note: фидбэк — своя сущность (feedback-bucket-and-type, ROADMAP.yaml), НЕ вид
// Preset. Свой бакет (bucketFeedback), свои методы — ничего общего с bucketMeta/bucketState/
// bucketNames и их kind/name-адресацией: у заявки нет ни kind, ни машинного имени. Опаковость
// содержимого (state — json.RawMessage без разбора) та же, что у Preset (PROBEWEB-8), но предел
// байт общий с остальным хранилищем — диск физически один ресурс (тот же довод, что у TotalBytes
// в FAQ.md).

// ListFeedback — все заявки, целиком (не Meta-без-содержимого, как у Preset: заявок читают мало
// и разбирают вручную, а не листают глазами по имени — экономить на state в списке незачем).
// Новые сверху: savedAt по убыванию, при равенстве — id по возрастанию (детерминированный порядок).
func (s *Store) ListFeedback() ([]*model.FeedbackEntry, error) {
	var items []*model.FeedbackEntry

	err := s.db.View(func(tx *bbolt.Tx) error {
		b := tx.Bucket(bucketFeedback)
		return b.ForEach(func(k, v []byte) error {
			var entry model.FeedbackEntry
			if err := json.Unmarshal(v, &entry); err != nil {
				return nil // испорченная запись пропускается, а не роняет перечень
			}
			items = append(items, &entry)
			return nil
		})
	})
	if err != nil {
		return nil, err
	}

	sort.Slice(items, func(i, j int) bool {
		if items[i].SavedAt != items[j].SavedAt {
			ti, _ := time.Parse(time.RFC3339Nano, items[i].SavedAt)
			tj, _ := time.Parse(time.RFC3339Nano, items[j].SavedAt)
			return ti.After(tj)
		}
		return items[i].ID < items[j].ID
	})

	return items, nil
}

// GetFeedback — одна заявка по id. Нет такой — ErrNotFound, как у Preset.
func (s *Store) GetFeedback(id string) (*model.FeedbackEntry, error) {
	var entry model.FeedbackEntry

	err := s.db.View(func(tx *bbolt.Tx) error {
		raw := tx.Bucket(bucketFeedback).Get([]byte(id))
		if raw == nil {
			return ErrNotFound
		}
		return json.Unmarshal(raw, &entry)
	})
	if err != nil {
		return nil, err
	}
	return &entry, nil
}

// CreateFeedback кладёт новую заявку — id и время выдаёт хранилище, как у Preset. Содержимое
// (state) не разбирается — ЧТО в нём лежит, решает вызывающий (internal/graphql, не эта функция).
func (s *Store) CreateFeedback(state json.RawMessage) (*model.FeedbackEntry, error) {
	entry := &model.FeedbackEntry{State: state}

	err := s.db.Update(func(tx *bbolt.Tx) error {
		entry.ID = newID()
		entry.SavedAt = nowStamp()
		return s.putFeedback(tx, entry)
	})
	if err != nil {
		return nil, err
	}
	return entry, nil
}

// ReplaceFeedbackState кладёт state ВМЕСТО прежнего у ТОЙ ЖЕ заявки — id неизменен, savedAt
// обновляется. Обобщённая замена целиком (как replacePreset у Preset, не PATCH): merge полей
// status/resolvedAt/note поверх текущего state — дело вызывающего (резолвера), не этой функции.
func (s *Store) ReplaceFeedbackState(id string, state json.RawMessage) (*model.FeedbackEntry, error) {
	entry := &model.FeedbackEntry{ID: id, State: state}

	err := s.db.Update(func(tx *bbolt.Tx) error {
		if tx.Bucket(bucketFeedback).Get([]byte(id)) == nil {
			return ErrNotFound
		}
		entry.SavedAt = nowStamp()
		return s.putFeedback(tx, entry)
	})
	if err != nil {
		return nil, err
	}
	return entry, nil
}

// putFeedback — общее тело Create/Replace внутри уже открытой транзакции: предел размера записи +
// общий предел объёма хранилища (тот же счётчик totalBytes, что и у Preset — диск один на всех).
func (s *Store) putFeedback(tx *bbolt.Tx, entry *model.FeedbackEntry) error {
	feedbackBucket := tx.Bucket(bucketFeedback)
	statsBucket := tx.Bucket(bucketStats)

	entryJSON, err := json.Marshal(entry)
	if err != nil {
		return err
	}
	size := int64(len(entryJSON))

	if size > s.limits.RecordBytes {
		return &TooLargeError{Limit: s.limits.RecordBytes}
	}

	previousSize := int64(0)
	if raw := statsBucket.Get(recordSizeKey(entry.ID)); raw != nil {
		previousSize = int64(binary.BigEndian.Uint64(raw))
	}

	total := readTotal(statsBucket)
	candidateTotal := total - previousSize + size
	if candidateTotal > s.limits.TotalBytes {
		return &StorageFullError{Reason: "bytes", Limit: s.limits.TotalBytes}
	}

	if err := feedbackBucket.Put([]byte(entry.ID), entryJSON); err != nil {
		return err
	}

	writeTotal(statsBucket, candidateTotal)
	writeRecordSize(statsBucket, entry.ID, size)

	return nil
}
