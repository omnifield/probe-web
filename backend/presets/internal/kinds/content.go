package kinds

import "encoding/json"

// Content — зеркало `ContentState` (packages/skin/src/presets/index.ts): готовые данные показа
// компонента. `component` — связь на компонент кита (строка, не на другую запись службы).
// `data: unknown` в TS — произвольная форма по компоненту, именованное JSON-поле: содержимое
// решает владелец показа, не эта служба (тот же PROBEWEB-8-принцип, применённый к одному полю
// вместо всей записи).
type Content struct {
	Component string          `json:"component"`
	Data      json.RawMessage `json:"data"`
	Author    *string         `json:"author,omitempty"`
}

func init() {
	Register(Kind{Label: "content", New: func() any { return &Content{} }})
}
