package graphql

import (
	"encoding/json"
	"fmt"

	"presets/internal/graphql/model"
	"presets/internal/kinds"
	presetsmodel "presets/internal/model"
)

// toPreset строит типизированную GraphQL-модель ОДНОЙ записи через internal/kinds — тот же
// реестр, что валидирует запись на вход (bbolt-byte-invariant, ROADMAP.yaml). Связи
// (Outfit.palette/forms/tags) сюда намеренно не входят: они резолвятся отдельно, лениво, только
// когда клиент их спросил (см. outfit.resolvers.go).
func toPreset(record *presetsmodel.Record) (model.Preset, error) {
	decoded, ok := kinds.New(record.Kind)
	if !ok {
		return nil, fmt.Errorf("presets: запись %q несёт незарегистрированный вид %q", record.ID, record.Kind)
	}
	if err := json.Unmarshal(record.State, decoded); err != nil {
		return nil, fmt.Errorf("presets: запись %q (%s) не разобралась по своему виду: %w", record.ID, record.Kind, err)
	}

	switch state := decoded.(type) {
	case *kinds.Palette:
		return &model.Palette{
			Meta:       record.Meta,
			Author:     state.Author,
			Scales:     model.JSON(state.Scales),
			Dimensions: model.JSON(state.Dimensions),
			Light:      model.JSON(state.Light),
			Dark:       model.JSON(state.Dark),
		}, nil

	case *kinds.Form:
		return &model.Form{
			Meta:        record.Meta,
			Component:   state.Component,
			Recipe:      model.JSON(state.Recipe),
			Keyframes:   model.JSON(state.Keyframes),
			VariantTags: model.JSON(state.VariantTags),
			Author:      state.Author,
		}, nil

	case *kinds.Outfit:
		return &model.Outfit{
			Meta:        record.Meta,
			PaletteName: state.Palette,
			FormNames:   state.Forms,
			TagNames:    state.Tags,
			Overrides:   model.JSON(state.Overrides),
			Author:      state.Author,
		}, nil

	case *kinds.Content:
		return &model.Content{
			Meta:      record.Meta,
			Component: state.Component,
			Data:      model.JSON(state.Data),
			Author:    state.Author,
		}, nil

	case *kinds.Tag:
		var tagLabel *string
		if state.Label != "" {
			tagLabel = &state.Label
		}
		return &model.Tag{
			Meta:     record.Meta,
			TagLabel: tagLabel,
			Author:   state.Author,
		}, nil

	case *kinds.ComponentAssembly:
		return &model.Assembly{
			Meta:      record.Meta,
			Component: state.Component,
			Assembly:  model.JSON(state.Assembly),
			Author:    state.Author,
		}, nil

	default:
		// Вид зарегистрирован в internal/kinds, но toPreset про него не знает — реестр и эта
		// функция разъехались (новый вид завели, а GraphQL-модель для него не подключили).
		return nil, fmt.Errorf("presets: вид %q зарегистрирован в kinds, но не подключён к GraphQL-модели", record.Kind)
	}
}
