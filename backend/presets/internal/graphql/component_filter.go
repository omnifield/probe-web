package graphql

import "presets/internal/graphql/model"

// componentSet — nil, если фильтр не задан (presets-component-filter, ROADMAP.yaml): отличает
// "фильтра нет" от "список компонентов пуст" (пустой присланный список — пустая выдача, не всё).
func componentSet(component []string) map[string]bool {
	if component == nil {
		return nil
	}
	set := make(map[string]bool, len(component))
	for _, c := range component {
		set[c] = true
	}
	return set
}

// matchesComponent — совпадение по ЛЮБОМУ компоненту из фильтра (OR). Виды без поля component
// (Palette/Outfit/Tag) при заданном фильтре в выдачу не попадают — это не ошибка, а часть контракта.
func matchesComponent(preset model.Preset, wanted map[string]bool) bool {
	var component string
	switch p := preset.(type) {
	case *model.Form:
		component = p.Component
	case *model.Assembly:
		component = p.Component
	case *model.Content:
		component = p.Component
	default:
		return false
	}
	return wanted[component]
}
