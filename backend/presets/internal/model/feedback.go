package model

import "encoding/json"

// FeedbackEntry — заявка целиком. Отдельная сущность от Record/Meta (Preset): не несёт
// label/name/kind — фидбэку не нужно машинное имя (никто не адресует заявку по имени, только по
// id) и не нужен kind (это не вид пресета, id зоны — не эта заявка).
type FeedbackEntry struct {
	ID      string          `json:"id"`
	SavedAt string          `json:"savedAt"`
	State   json.RawMessage `json:"state"`
}
