// Package model несёт форму записи службы. Что лежит под Meta.State, пакет не знает и не
// проверяет (PROBEWEB-8) — потому State хранится как json.RawMessage: байты проходят от клиента
// до диска и обратно без разбора и без пересборки, значит без риска переставить ключи или
// потерять точность числа при повторной сериализации.
package model

import "encoding/json"

// Meta — запись без содержимого, то, из чего собирается список.
type Meta struct {
	ID          string `json:"id"`
	Label       string `json:"label"`
	Name        string `json:"name,omitempty"`
	Description string `json:"description,omitempty"`
	Kind        string `json:"kind,omitempty"`
	SavedAt     string `json:"savedAt"`
}

// Record — запись целиком.
type Record struct {
	Meta
	State json.RawMessage `json:"state"`
}

// Input — конверт сохранения/замены: то, что реально прислал клиент, до выдачи id и времени.
type Input struct {
	Label       string
	Name        string // "" — не задано
	Description string // "" — не задано
	Kind        string // "" — не задано
	State       json.RawMessage
}
