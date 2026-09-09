package kinds

import "encoding/json"

// Form — зеркало `Form` (packages/skin/src/engine/look/types.ts). `name`/`component`/`author` —
// типовые скаляры (`component` — связь на компонент кита, не на другую запись службы, поэтому
// строка, не резолвится через dataloader). `recipe`/`keyframes`/`variantTags` — именованные
// JSON-поля: `SlotRecipe`/`PartStyles<Part>` рекурсивны с открытыми ключами (произвольный
// CSS-in-JS по партии/состоянию), `variantTags` — открытый словарь по тем же причинам, что у
// Palette (recipe-assembly-json-scalar-boundary в ROADMAP.yaml).
type Form struct {
	Name        string          `json:"name"`
	Component   string          `json:"component"`
	Recipe      json.RawMessage `json:"recipe"`
	Keyframes   json.RawMessage `json:"keyframes,omitempty"`
	VariantTags json.RawMessage `json:"variantTags,omitempty"`
	Author      *string         `json:"author,omitempty"`
}

func init() {
	Register(Kind{Label: "form", New: func() any { return &Form{} }})
}
