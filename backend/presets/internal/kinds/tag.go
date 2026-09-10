package kinds

// Tag — словарь допустимых меток (packages/skin/src/tags — `checkTags`/`TagGroup`). Канонического
// TS-интерфейса для этого вида нет (в отличие от Palette/Form/Outfit/ContentState/ComponentAssembly
// — все объявлены в коде, `tag` существовал только как `kind:"tag"` в словаре, форма нигде не
// типизирована). Форма ниже — по живой записи на проде (`tag/status`: `{name, label, author}`),
// не по коду, которого нет. `label` здесь — человеческое имя тега (например "Статусы"), отдельное
// от верхнеуровневого `Meta.Label` записи (у живой записи они разные значения).
type Tag struct {
	Name   string  `json:"name"`
	Label  string  `json:"label,omitempty"`
	Author *string `json:"author,omitempty"`
}

func init() {
	Register(Kind{Label: "tag", New: func() any { return &Tag{} }})
}
