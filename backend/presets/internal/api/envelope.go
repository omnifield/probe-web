package api

import (
	"encoding/json"
	"fmt"
	"strings"
	"unicode/utf8"

	"presets/internal/limits"
	"presets/internal/model"
)

// parseEnvelope разбирает конверт сохранения/замены. Внутрь `state` НЕ смотрим — оно остаётся
// json.RawMessage, теми же байтами, какими приехало: число, строка, массив и заведомая чушь
// одинаково законны (PROBEWEB-8). Возвращает код и текст отказа вместо ошибки — вызывающему не
// придётся разбирать error.As на каждый случай.
func parseEnvelope(body []byte, lim limits.Limits) (input *model.Input, code, message string) {
	if !json.Valid(body) {
		return nil, "bad_json", "Тело запроса — не JSON."
	}

	var probe any
	_ = json.Unmarshal(body, &probe)
	if _, isObject := probe.(map[string]any); !isObject {
		return nil, "bad_request", "Ожидался объект с полями label и state."
	}

	var raw map[string]json.RawMessage
	if err := json.Unmarshal(body, &raw); err != nil {
		return nil, "bad_request", "Ожидался объект с полями label и state."
	}

	// Имя обязательно: список без названий бесполезен, выбирают из него по имени.
	labelValue, ok := asString(raw["label"])
	if !ok || strings.TrimSpace(labelValue) == "" {
		return nil, "label_required", "У пресета должно быть имя."
	}
	labelValue = strings.TrimSpace(labelValue)
	if utf8.RuneCountInString(labelValue) > lim.LabelChars {
		return nil, "label_too_long", fmt.Sprintf("Имя длиннее %d символов.", lim.LabelChars)
	}

	// Машинное имя НЕОБЯЗАТЕЛЬНО. Уникальность здесь не проверяется — её держит хранилище,
	// потому что только оно видит все записи разом.
	name := ""
	if r, present := raw["name"]; present && !isNull(r) {
		value, ok := asString(r)
		if !ok || !label.MatchString(value) {
			return nil, "bad_name", badNameMessage
		}
		name = value
	}

	// Пояснения может не быть вовсе, и это нормальная запись, а не ущербная.
	description := ""
	if r, present := raw["description"]; present && !isNull(r) {
		value, ok := asString(r)
		if !ok {
			return nil, "bad_description", "Пояснение должно быть строкой."
		}
		if utf8.RuneCountInString(value) > lim.DescriptionChars {
			return nil, "description_too_long", fmt.Sprintf("Пояснение длиннее %d символов.", lim.DescriptionChars)
		}
		if strings.TrimSpace(value) != "" {
			description = strings.TrimSpace(value)
		}
	}

	// Ярлык вида НЕОБЯЗАТЕЛЕН — совместимость с записями, которые лежат и работают без него.
	// Проверяется только форма: что лежит ПОД ярлыком, служба не смотрит.
	kind := ""
	if r, present := raw["kind"]; present && !isNull(r) {
		value, ok := asString(r)
		if !ok || !label.MatchString(value) {
			return nil, "bad_kind", badKindMessage
		}
		kind = value
	}

	rawState, present := raw["state"]
	if !present {
		return nil, "state_required", "Не передано состояние пресета."
	}

	return &model.Input{
		Label:       labelValue,
		Name:        name,
		Description: description,
		Kind:        kind,
		State:       append(json.RawMessage(nil), rawState...),
	}, "", ""
}

// isNull проверяет, что сырое значение JSON — буквально null, а не отсутствует вовсе.
func isNull(r json.RawMessage) bool {
	return string(r) == "null"
}

// asString разбирает сырое значение как строку; null и любой другой тип — не строка.
func asString(r json.RawMessage) (string, bool) {
	if len(r) == 0 || isNull(r) {
		return "", false
	}
	var s string
	if err := json.Unmarshal(r, &s); err != nil {
		return "", false
	}
	return s, true
}
