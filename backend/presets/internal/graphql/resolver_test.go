package graphql

import (
	"context"
	"encoding/json"
	"path/filepath"
	"strings"
	"testing"

	"presets/internal/graphql/loaders"
	"presets/internal/graphql/model"
	"presets/internal/limits"
	presetsmodel "presets/internal/model"
	"presets/internal/store"
)

func openTestStore(t *testing.T) *store.Store {
	t.Helper()
	s, err := store.Open(filepath.Join(t.TempDir(), "presets.db"), limits.Default)
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	t.Cleanup(func() { _ = s.Close() })
	return s
}

func create(t *testing.T, s *store.Store, kind, name, state string) *presetsmodel.Record {
	t.Helper()
	record, err := s.Create(presetsmodel.Input{
		Label: name,
		Name:  name,
		Kind:  kind,
		State: json.RawMessage(state),
	})
	if err != nil {
		t.Fatalf("Create %s/%s: %v", kind, name, err)
	}
	return record
}

// ctxWithLoaders — контекст резолвера в тесте: то же, что делает loaders.Middleware на реальном
// HTTP-запросе, но без сети — резолверы зовутся напрямую.
func ctxWithLoaders(s *store.Store) context.Context {
	return loaders.Attach(context.Background(), s)
}

func TestPresetsListReturnsTypedRecordsAcrossKinds(t *testing.T) {
	s := openTestStore(t)
	create(t, s, "palette", "brand", `{"name":"brand","light":{"bg":"#fff"}}`)
	create(t, s, "form", "button/primary", `{"name":"button/primary","component":"button","recipe":{"base":{}}}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	presets, err := resolver.Query().Presets(ctx, nil)
	if err != nil {
		t.Fatalf("Presets: %v", err)
	}
	if len(presets) != 2 {
		t.Fatalf("ожидалось 2 записи (палитра+форма), получено %d", len(presets))
	}

	var sawPalette, sawForm bool
	for _, p := range presets {
		switch v := p.(type) {
		case *model.Palette:
			sawPalette = true
			if v.Name != "brand" {
				t.Errorf("palette.name разошёлся: %+v", v)
			}
			if string(v.Light) == "" {
				t.Errorf("palette.light не разобрался как JSON-поле: %+v", v)
			}
		case *model.Form:
			sawForm = true
			if v.Component != "button" {
				t.Errorf("form.component разошёлся: %+v", v)
			}
		}
	}
	if !sawPalette || !sawForm {
		t.Fatalf("ожидались оба типа среди Preset, получено: %+v", presets)
	}
}

func TestPresetsListFilteredByUnknownKindErrors(t *testing.T) {
	s := openTestStore(t)
	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	unknown := "filter" // будущий вид tables — сегодня ещё не зарегистрирован
	if _, err := resolver.Query().Presets(ctx, &unknown); err == nil {
		t.Fatal("ожидалась ошибка на незарегистрированный вид")
	}
}

func TestOutfitRelationsResolveAndSkipDanglingReference(t *testing.T) {
	s := openTestStore(t)
	create(t, s, "palette", "brand", `{"name":"brand"}`)
	create(t, s, "form", "button/primary", `{"name":"button/primary","component":"button","recipe":{}}`)
	create(t, s, "tag", "default", `{"name":"default","label":"По умолчанию"}`)
	outfitRecord := create(t, s, "outfit", "twitter-dark", `{
		"name": "twitter-dark",
		"palette": "brand",
		"forms": ["button/primary", "нет-такой-формы"],
		"tags": ["default"]
	}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	preset, err := toPreset(outfitRecord)
	if err != nil {
		t.Fatalf("toPreset: %v", err)
	}
	outfit, ok := preset.(*model.Outfit)
	if !ok {
		t.Fatalf("ожидался *model.Outfit, получено %T", preset)
	}

	palette, err := resolver.Outfit().Palette(ctx, outfit)
	if err != nil {
		t.Fatalf("Palette: %v", err)
	}
	if palette == nil || palette.Name != "brand" {
		t.Fatalf("palette-связь не резолвнулась: %+v", palette)
	}

	forms, err := resolver.Outfit().Forms(ctx, outfit)
	if err != nil {
		t.Fatalf("Forms: %v", err)
	}
	if len(forms) != 1 || forms[0].Component != "button" {
		t.Fatalf("ожидалась ровно одна реальная форма (dangling-ссылка пропускается тихо), получено: %+v", forms)
	}

	tags, err := resolver.Outfit().Tags(ctx, outfit)
	if err != nil {
		t.Fatalf("Tags: %v", err)
	}
	if len(tags) != 1 || tags[0].TagLabel == nil || *tags[0].TagLabel != "По умолчанию" {
		t.Fatalf("tag-связь не резолвнулась: %+v", tags)
	}
}

func TestCreatePresetValidatesAgainstKindShape(t *testing.T) {
	s := openTestStore(t)
	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	// Вид не зарегистрирован — отказ до записи в store, а не тихий проход.
	_, err := resolver.Mutation().CreatePreset(ctx, model.PresetInput{
		Kind:  "filter",
		Label: "будущий вид tables",
		State: model.JSON(`{"name":"x"}`),
	})
	if err == nil {
		t.Fatal("ожидался отказ на незарегистрированный вид")
	}

	// State — не объект, а массив: не разбирается по форме Outfit (structural, не про смысл).
	_, err = resolver.Mutation().CreatePreset(ctx, model.PresetInput{
		Kind:  "outfit",
		Label: "кривой конверт",
		State: model.JSON(`[1,2,3]`),
	})
	if err == nil {
		t.Fatal("ожидался отказ на state не той формы")
	}
}

func TestCreatePresetRoundtrip(t *testing.T) {
	s := openTestStore(t)
	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	name := "brand"
	preset, err := resolver.Mutation().CreatePreset(ctx, model.PresetInput{
		Kind:  "palette",
		Label: "Бренд",
		Name:  &name,
		State: model.JSON(`{"name":"brand","author":"Egor Raybul"}`),
	})
	if err != nil {
		t.Fatalf("CreatePreset: %v", err)
	}
	palette, ok := preset.(*model.Palette)
	if !ok {
		t.Fatalf("ожидался *model.Palette, получено %T", preset)
	}
	if palette.ID == "" || palette.Author == nil || *palette.Author != "Egor Raybul" {
		t.Fatalf("запись не сохранилась как ожидалось: %+v", palette)
	}

	deleted, err := resolver.Mutation().DeletePreset(ctx, palette.ID)
	if err != nil || !deleted {
		t.Fatalf("DeletePreset: deleted=%v err=%v", deleted, err)
	}

	// Повторное удаление — не отказ, идемпотентно (то же, что TestDeleteThenNotFound у бывшего
	// REST-контракта, internal/api до переезда на GraphQL).
	deletedAgain, err := resolver.Mutation().DeletePreset(ctx, palette.ID)
	if err != nil || deletedAgain {
		t.Fatalf("повторный DeletePreset: deleted=%v err=%v, ожидалось false/nil", deletedAgain, err)
	}
}

// TestPresetEnvelopeValidation — та же проверка конверта, что раньше делал REST
// (TestCreateValidationErrors в internal/api до переезда на GraphQL): пустой label, длинный
// label, name не той формы — все три отсекаются normalizeInput ДО записи в store.
func TestPresetEnvelopeValidation(t *testing.T) {
	s := openTestStore(t)
	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	cases := []struct {
		name  string
		input model.PresetInput
	}{
		{
			name:  "пустой label",
			input: model.PresetInput{Kind: "palette", Label: "   ", State: model.JSON(`{"name":"x"}`)},
		},
		{
			name: "label длиннее предела",
			input: model.PresetInput{
				Kind:  "palette",
				Label: strings.Repeat("а", limits.Default.LabelChars+1),
				State: model.JSON(`{"name":"x"}`),
			},
		},
		{
			name: "name не той формы (пробел недопустим)",
			input: model.PresetInput{
				Kind:  "palette",
				Label: "Бренд",
				Name:  ptr("Bad Name"),
				State: model.JSON(`{"name":"x"}`),
			},
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if _, err := resolver.Mutation().CreatePreset(ctx, tc.input); err == nil {
				t.Fatalf("ожидался отказ на %s", tc.name)
			}
		})
	}
}

func ptr(s string) *string { return &s }

func TestQueryPresetByIDFoundAndNotFound(t *testing.T) {
	s := openTestStore(t)
	record := create(t, s, "palette", "brand", `{"name":"brand"}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	found, err := resolver.Query().Preset(ctx, record.ID)
	if err != nil {
		t.Fatalf("Preset: %v", err)
	}
	if palette, ok := found.(*model.Palette); !ok || palette.Name != "brand" {
		t.Fatalf("ожидалась запись brand, получено %+v", found)
	}

	// Нет такой записи — null, не отказ (nullable Preset в схеме); то же самое, что REST отдавал
	// 404 (TestGetNotFound у бывшего REST-контракта).
	missing, err := resolver.Query().Preset(ctx, "нет-такого-id")
	if err != nil {
		t.Fatalf("Preset(missing): неожиданная ошибка %v", err)
	}
	if missing != nil {
		t.Fatalf("ожидался nil на отсутствующий id, получено %+v", missing)
	}

	// id со слэшем — законное строковое значение GraphQL-переменной, не путь URL (REST боялся
	// path traversal здесь — TestIDWithSlashIsNotFoundNotPathTraversal; в GraphQL id не часть
	// пути вовсе, беспокоиться не о чем, но пусть остаётся тихим null, не паникой).
	weird, err := resolver.Query().Preset(ctx, "../etc/passwd")
	if err != nil {
		t.Fatalf("Preset(id со слэшем): неожиданная ошибка %v", err)
	}
	if weird != nil {
		t.Fatalf("ожидался nil на странный id, получено %+v", weird)
	}
}

func TestPresetsListFilteredByKindReturnsOnlyThatKind(t *testing.T) {
	s := openTestStore(t)
	create(t, s, "palette", "brand", `{"name":"brand"}`)
	create(t, s, "form", "primary", `{"name":"primary","component":"button","recipe":{}}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	form := "form"
	presets, err := resolver.Query().Presets(ctx, &form)
	if err != nil {
		t.Fatalf("Presets: %v", err)
	}
	if len(presets) != 1 {
		t.Fatalf("ожидалась ровно одна запись вида form, получено %d: %+v", len(presets), presets)
	}
	if _, ok := presets[0].(*model.Form); !ok {
		t.Fatalf("ожидался *model.Form, получено %T", presets[0])
	}
}

func TestReplacePresetRoundtripAndNotFound(t *testing.T) {
	s := openTestStore(t)
	record := create(t, s, "palette", "brand", `{"name":"brand"}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	name := "brand"
	updated, err := resolver.Mutation().ReplacePreset(ctx, record.ID, model.PresetInput{
		Kind:  "palette",
		Label: "Бренд v2",
		Name:  &name,
		State: model.JSON(`{"name":"brand","author":"Egor Raybul"}`),
	})
	if err != nil {
		t.Fatalf("ReplacePreset: %v", err)
	}
	palette, ok := updated.(*model.Palette)
	if !ok || palette.ID != record.ID || palette.Author == nil || *palette.Author != "Egor Raybul" {
		t.Fatalf("замена не сохранила id/не применила новое state: %+v", updated)
	}

	_, err = resolver.Mutation().ReplacePreset(ctx, "нет-такого-id", model.PresetInput{
		Kind:  "palette",
		Label: "Бренд",
		State: model.JSON(`{"name":"x"}`),
	})
	if err == nil {
		t.Fatal("ожидался отказ на замену несуществующей записи")
	}
}

// TestStoreErrorSurfacesThroughResolver — конкретный проход store-ошибки (NameTakenError) через
// резолвер до вызывающего: сами лимиты уже полно проверены на уровне store (internal/store/
// store_test.go), здесь важно, что резолвер их не глотает и не подменяет.
func TestStoreErrorSurfacesThroughResolver(t *testing.T) {
	s := openTestStore(t)
	create(t, s, "palette", "brand", `{"name":"brand"}`)

	resolver := New(s, limits.Default)
	ctx := ctxWithLoaders(s)

	name := "brand"
	_, err := resolver.Mutation().CreatePreset(ctx, model.PresetInput{
		Kind:  "palette",
		Label: "Другой бренд",
		Name:  &name,
		State: model.JSON(`{"name":"brand"}`),
	})
	if err == nil {
		t.Fatal("ожидался отказ на занятое имя (NameTakenError из store)")
	}
}
