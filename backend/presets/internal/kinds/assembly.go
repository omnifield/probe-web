package kinds

import "encoding/json"

// ComponentAssembly — зеркало `ComponentAssembly` (packages/skin/src/engine/look/types.ts):
// сборка ОДНОГО компонента, отданная на хранение. НЕ то же самое, что будущие "сборки-композиции"
// (композиция НЕСКОЛЬКИХ компонентов, ссылающаяся на сами компоненты, из которых собрана) — той
// вещи ещё нет как кода (kinds-registry в ROADMAP.yaml). На проде сегодня 0 записей этого вида —
// вид написан и подключён (`apps/skin/.mcp/src/tools/presets.ts`), просто ещё не использован.
//
// `component` — связь на компонент кита (строка). `assembly` (`PassportAssembly`) — граф сборки,
// именованное JSON-поле по тому же принципу, что Form.recipe (recipe-assembly-json-scalar-
// boundary в ROADMAP.yaml): рекурсивная структура, ни один профиль потребления не выбирает узел
// графа отдельно.
type ComponentAssembly struct {
	Component string          `json:"component"`
	Assembly  json.RawMessage `json:"assembly"`
	Author    *string         `json:"author,omitempty"`
}

func init() {
	Register(Kind{Label: "assembly", New: func() any { return &ComponentAssembly{} }})
}
