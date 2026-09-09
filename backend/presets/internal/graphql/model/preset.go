// Package model — рукописные GraphQL-модели: gqlgen генерирует под них резолверы и exec-код
// (см. gqlgen.yml, models:), но сами структуры не кодогенерятся — источник правды здесь, не в
// generated/.
package model

import "presets/internal/model"

// Preset — маркер интерфейса схемы. gqlgen резолвит конкретный тип записи по этому методу, не по
// отдельному полю kind внутри резолвера.
type Preset interface {
	IsPreset()
}

// Palette — зеркало internal/kinds.Palette + общие поля записи (model.Meta — та же форма, что
// отдаёт internal/store, никакого второго source of truth для id/label/savedAt).
type Palette struct {
	model.Meta
	Author     *string
	Scales     JSON
	Dimensions JSON
	Light      JSON
	Dark       JSON
}

func (Palette) IsPreset() {}

// Form — зеркало internal/kinds.Form + общие поля.
type Form struct {
	model.Meta
	Component   string
	Recipe      JSON
	Keyframes   JSON
	VariantTags JSON
	Author      *string
}

func (Form) IsPreset() {}

// Outfit — зеркало internal/kinds.Outfit + общие поля. PaletteName/FormNames/TagNames —
// НЕ поля схемы (нет полей `palette`/`forms`/`tags` схемы у этой структуры нарочно): связи
// резолвятся лениво, отдельными полевыми резолверами (schema.resolvers по типу Outfit) — клиент,
// не спросивший `forms`, не должен платить за их резолв (mcp-surgical-reads в ROADMAP.yaml).
type Outfit struct {
	model.Meta
	PaletteName string
	FormNames   []string
	TagNames    []string
	Overrides   JSON
	Author      *string
}

func (Outfit) IsPreset() {}

// Content — зеркало internal/kinds.Content + общие поля.
type Content struct {
	model.Meta
	Component string
	Data      JSON
	Author    *string
}

func (Content) IsPreset() {}

// Tag — зеркало internal/kinds.Tag + общие поля. TagLabel — человеческое имя тега
// (internal/kinds.Tag.Label), НЕ то же самое, что model.Meta.Label верхнего уровня.
type Tag struct {
	model.Meta
	TagLabel *string
	Author   *string
}

func (Tag) IsPreset() {}

// Assembly — зеркало internal/kinds.ComponentAssembly + общие поля.
type Assembly struct {
	model.Meta
	Component string
	Assembly  JSON
	Author    *string
}

func (Assembly) IsPreset() {}
