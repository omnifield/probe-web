package kinds

import "encoding/json"

// Palette — зеркало `Palette` (packages/skin/src/engine/look/types.ts): `name`/`author` типовые
// скаляры, `scales`/`dimensions`/`light`/`dark` (SkinVariables) — именованные JSON-поля: у GraphQL
// нет типа "словарь с произвольными ключами", а разложить их по ключу и незачем — ни один профиль
// потребления не выбирает отдельную переменную, все берут палитру целиком (recipe-assembly-json-
// scalar-boundary в ROADMAP.yaml — тот же принцип, что у Form.recipe/ComponentAssembly.assembly,
// применённый к открытым словарям, а не только к рекурсивным деревьям).
type Palette struct {
	Name       string          `json:"name"`
	Author     *string         `json:"author,omitempty"`
	Scales     json.RawMessage `json:"scales,omitempty"`
	Dimensions json.RawMessage `json:"dimensions,omitempty"`
	Light      json.RawMessage `json:"light,omitempty"`
	Dark       json.RawMessage `json:"dark,omitempty"`
}

func init() {
	Register(Kind{Label: "palette", New: func() any { return &Palette{} }})
}
