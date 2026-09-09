package model

import (
	"encoding/json"
	"fmt"
	"io"
)

// JSON — именованный GraphQL-скаляр (recipe-assembly-json-scalar-boundary, ROADMAP.yaml): байты
// проходят насквозь без разбора, тем же принципом, что и store (PROBEWEB-8) — только на границе
// GraphQL, а не всей записи целиком. Нулевое значение маршалится в `null`, не в `""`.
type JSON json.RawMessage

// MarshalGQL пишет сырые байты как есть — валидный JSON внутри уже гарантирован источником
// (store хранит то, что когда-то прошло валидацию на запись).
func (j JSON) MarshalGQL(w io.Writer) {
	if len(j) == 0 {
		_, _ = io.WriteString(w, "null")
		return
	}
	_, _ = w.Write(j)
}

// UnmarshalGQL принимает уже разобранное значение (gqlgen декодирует запрос сам) и пересобирает
// его в байты — тот же принцип, что и на входе REST-конверта: форма не проверяется здесь, только
// сериализуется.
func (j *JSON) UnmarshalGQL(v any) error {
	b, err := json.Marshal(v)
	if err != nil {
		return fmt.Errorf("presets: плохое значение JSON-скаляра: %w", err)
	}
	*j = JSON(b)
	return nil
}
