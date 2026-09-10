package graphql

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/vikstrous/dataloadgen"

	"presets/internal/graphql/loaders"
	"presets/internal/graphql/model"
	"presets/internal/kinds"
	presetsmodel "presets/internal/model"
)

// errLoadersNotAttached — программная ошибка обвязки: loaders.Middleware/Attach забыли
// подключить к запросу. Не пользовательский случай, но лучше явная ошибка, чем nil-панику в
// глубине резолвера.
var errLoadersNotAttached = errors.New("presets: дата-лоадеры не подключены к запросу (loaders.Middleware/Attach не вызван)")

// validateState — структурная проверка конверта на запись: state должен разобраться по форме
// зарегистрированного вида (internal/kinds). Ровно то же место, что у REST — отказ по СУЩЕСТВУ
// содержимого сюда не входит (bbolt-byte-invariant, ROADMAP.yaml): это работа читателя вида.
func validateState(kind string, state model.JSON) error {
	target, ok := kinds.New(kind)
	if !ok {
		return fmt.Errorf("presets: неизвестный вид %q — заведите его в internal/kinds перед сохранением", kind)
	}
	if err := json.Unmarshal(state, target); err != nil {
		return fmt.Errorf("presets: state не подходит под форму вида %q: %w", kind, err)
	}
	return nil
}

func derefString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func ptrString(s string) *string { return &s }

// firstFatal разбирает ошибку dataloadgen.LoadAll: dataloadgen.ErrNotFound по отдельным ключам —
// законный пропуск (dangling-ссылка на удалённую запись), не отказ всего списка; любая другая
// ошибка внутри батча — настоящий сбой хранилища, его глушить нельзя.
func firstFatal(err error) error {
	if err == nil {
		return nil
	}
	var errs dataloadgen.ErrorSlice
	if errors.As(err, &errs) {
		for _, e := range errs {
			if e != nil && !errors.Is(e, dataloadgen.ErrNotFound) {
				return e
			}
		}
		return nil
	}
	if errors.Is(err, dataloadgen.ErrNotFound) {
		return nil
	}
	return err
}

// resolveByName — одна связь по имени в пределах вида (Outfit.palette): индекс имён вида берётся
// через KindIndex-лоадер (кэш на весь запрос), сама запись — через Record-лоадер (батч на id).
// Дозвон в никуда (имя ссылается на убранную запись) — nil, не отказ.
func resolveByName(ctx context.Context, kind, name string) (*presetsmodel.Record, error) {
	ls := loaders.For(ctx)
	if ls == nil {
		return nil, errLoadersNotAttached
	}

	index, err := ls.KindIndex.Load(ctx, kind)
	if err != nil {
		return nil, err
	}
	id, ok := index[name]
	if !ok {
		return nil, nil
	}

	record, err := ls.Record.Load(ctx, id)
	if err != nil {
		if errors.Is(err, dataloadgen.ErrNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return record, nil
}

// resolveManyByName — то же самое, но списком (Outfit.forms/tags): имена → id одним проходом по
// уже закэшированному индексу, дальше ОДИН LoadAll — вне зависимости от того, сколько outfit'ов
// одновременно резолвят свои формы в рамках одного GraphQL-запроса.
func resolveManyByName(ctx context.Context, kind string, names []string) ([]model.Preset, error) {
	if len(names) == 0 {
		return nil, nil
	}

	ls := loaders.For(ctx)
	if ls == nil {
		return nil, errLoadersNotAttached
	}

	index, err := ls.KindIndex.Load(ctx, kind)
	if err != nil {
		return nil, err
	}

	ids := make([]string, 0, len(names))
	for _, name := range names {
		if id, ok := index[name]; ok {
			ids = append(ids, id)
		}
	}
	if len(ids) == 0 {
		return nil, nil
	}

	records, loadErr := ls.Record.LoadAll(ctx, ids)
	if err := firstFatal(loadErr); err != nil {
		return nil, err
	}

	presets := make([]model.Preset, 0, len(records))
	for _, record := range records {
		if record == nil {
			continue
		}
		preset, err := toPreset(record)
		if err != nil {
			return nil, err
		}
		presets = append(presets, preset)
	}
	return presets, nil
}
