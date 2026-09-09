package kinds

import "encoding/json"

// Outfit — зеркало `Outfit` (packages/skin/src/engine/look/types.ts). `palette` (имя одной
// записи `palette`), `forms` (имена записей `form`) и `tags` (имена записей `tag`) — связи на
// другие записи службы: резолвятся GraphQL-полями через dataloader (no-server-side-n-plus-one в
// ROADMAP.yaml), здесь остаются простыми строками/списком строк — резолвер вида решает, во что их
// разворачивать. `overrides` — открытый словарь (компонент → переменная → значение), именованное
// JSON-поле по тому же принципу, что и у Palette/Form.
type Outfit struct {
	Name      string          `json:"name"`
	Palette   string          `json:"palette"`
	Forms     []string        `json:"forms"`
	Overrides json.RawMessage `json:"overrides,omitempty"`
	Tags      []string        `json:"tags,omitempty"`
	Author    *string         `json:"author,omitempty"`
}

func init() {
	Register(Kind{Label: "outfit", New: func() any { return &Outfit{} }})
}
