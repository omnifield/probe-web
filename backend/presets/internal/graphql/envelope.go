package graphql

import (
	"encoding/json"
	"fmt"
	"regexp"
	"strings"
	"unicode/utf8"

	"presets/internal/graphql/model"
	"presets/internal/limits"
	presetsmodel "presets/internal/model"
)

// label — та же строгая форма, что была у REST-конверта (internal/api до переезда на GraphQL,
// см. graphql-endpoint в ROADMAP.yaml): короткая метка из строчных латинских букв, цифр и
// дефисов — name едет в местах, где вольный текст не живёт (адрес запроса, атрибут на корне
// страницы, имя файла).
var label = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{0,31}$`)

const badNameMessage = "Имя — короткая метка из строчных латинских букв, цифр и дефисов (до 32 символов), например twitter-dark."

// normalizeInput — конверт записи/замены: та же проверка, что раньше делал REST (parseEnvelope,
// internal/api) — label обязателен и в пределах длины, name (если задан) — строгой формы,
// description — в пределах длины. `kind` эта функция НЕ проверяет: его проверяет validateState —
// требование там строже формата строки (kind обязан быть ЗАРЕГИСТРИРОВАННЫМ видом, иначе GraphQL
// не знает, в какой конкретный тип резолвить ответ).
func normalizeInput(input model.PresetInput, lim limits.Limits) (presetsmodel.Input, error) {
	trimmedLabel := strings.TrimSpace(input.Label)
	if trimmedLabel == "" {
		return presetsmodel.Input{}, fmt.Errorf("presets: у пресета должно быть непустое label")
	}
	if utf8.RuneCountInString(trimmedLabel) > lim.LabelChars {
		return presetsmodel.Input{}, fmt.Errorf("presets: label длиннее %d символов", lim.LabelChars)
	}

	name := derefString(input.Name)
	if name != "" && !label.MatchString(name) {
		return presetsmodel.Input{}, fmt.Errorf("presets: %s", badNameMessage)
	}

	description := strings.TrimSpace(derefString(input.Description))
	if utf8.RuneCountInString(description) > lim.DescriptionChars {
		return presetsmodel.Input{}, fmt.Errorf("presets: description длиннее %d символов", lim.DescriptionChars)
	}

	return presetsmodel.Input{
		Label:       trimmedLabel,
		Name:        name,
		Description: description,
		Kind:        input.Kind,
		State:       json.RawMessage(input.State),
	}, nil
}
