// Package kinds — реестр видов пресетов: карта `kind → Go-структура его state`. Заведён с
// первого дня под нескольких владельцев видов (сегодня — пять видов skin плюс assembly, завтра
// tables заведёт свой `filter`) — по файлу на вид, без правки этого файла и друг друга.
//
// Типизация встаёт РОВНО на границе API (валидация конверта на запись, типизированный резолв на
// чтение) — bbolt-хранилище (internal/store) как хранило непрозрачные байты, так и хранит: этот
// пакет ничего не меняет там, только описывает форму, в которую байты раскладываются снаружи.
package kinds

import "fmt"

// Kind — то, что владелец вида регистрирует: имя ярлыка и фабрика пустого значения для decode.
type Kind struct {
	// Label — то же значение, что летит в `?kind=`/`Meta.Kind` — сравнение строки, не толкование.
	Label string
	// New возвращает свежий указатель на структуру состояния этого вида — цель для json.Unmarshal.
	New func() any
}

var registry = map[string]Kind{}

// Register заводит вид. Зовётся из init() каждого файла вида — паника на дубликат ярлыка (двух
// владельцев на один `kind` быть не может, а padding init-порядка не должен решать тихо, кто из
// них главный).
func Register(k Kind) {
	if _, exists := registry[k.Label]; exists {
		panic(fmt.Sprintf("kinds: вид %q уже зарегистрирован", k.Label))
	}
	registry[k.Label] = k
}

// New — новое значение состояния зарегистрированного вида; ok=false — вид не зарегистрирован.
func New(label string) (any, bool) {
	k, ok := registry[label]
	if !ok {
		return nil, false
	}
	return k.New(), true
}

// Known — зарегистрирован ли вид вообще.
func Known(label string) bool {
	_, ok := registry[label]
	return ok
}

// Labels — все зарегистрированные ярлыки, отсортированный порядок не гарантируется.
func Labels() []string {
	labels := make([]string, 0, len(registry))
	for label := range registry {
		labels = append(labels, label)
	}
	return labels
}
