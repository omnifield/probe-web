package store

import (
	"errors"
	"fmt"
)

// ErrNotFound — обычный ответ хранилища, не поломка: такой записи нет.
var ErrNotFound = errors.New("presets: not found")

// NameTakenError — машинное имя уже занято другой записью В ЭТОМ ЖЕ ВИДЕ. Не проверка
// содержимого: хранилище сравнивает строку со строкой и не знает, что под этим именем лежит.
type NameTakenError struct {
	Kind string
	Name string
}

// Error называет занятое имя и вид, в котором оно занято.
func (e *NameTakenError) Error() string {
	return fmt.Sprintf("presets: имя %q уже занято в виде %q", e.Name, e.Kind)
}

// StorageFullError — хранилище заполнено. Reason называет, ЧТО кончилось: место в списке вида
// ("records") или место на диске ("bytes") — оба отвечают одним кодом наружу, различается
// только текст для человека.
type StorageFullError struct {
	Reason string // "records" | "bytes"
	Limit  int64
}

// Error подбирает текст по тому, ЧТО именно кончилось — записи или байты.
func (e *StorageFullError) Error() string {
	if e.Reason == "records" {
		return fmt.Sprintf("presets: заполнено — разрешено %d записей на вид", e.Limit)
	}
	return fmt.Sprintf("presets: заполнено — разрешено %d байт всего", e.Limit)
}

// TooLargeError — одна запись сама по себе больше предела записи.
type TooLargeError struct {
	Limit int64
}

// Error называет предел, в который запись не влезла.
func (e *TooLargeError) Error() string {
	return fmt.Sprintf("presets: запись больше предела %d байт", e.Limit)
}
