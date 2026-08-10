// Конструктор фильтра — БЕЗГОЛОВЫЙ, как и кит, на котором стоит (`kb:PROBEWEB-4`).
//
// Ни одного класса по умолчанию: наружу едут структура, поведение и зацепки `data-slot`,
// вид — за потребителем. Состояния отдаются атрибутами (`data-active`, `data-invalid`,
// `data-selected`), чтобы CSS цеплялся за них, а не за внутренности.
//
// Форма — плоский нумерованный список условий плюс отдельная строка логики (решение с user
// 2026-08-10). Вложенных групп здесь нет намеренно: они перестают читаться со второго уровня.

import { Button, Field, Input } from "@omnifield/probe-web-ui";
import { createMemo, createSignal, For, Show } from "solid-js";

import { countMatching } from "../evaluate.js";
import { defaultFormula, parseFormula } from "../formula.js";
import { describeCondition } from "../describe.js";
import {
  type Condition,
  type FilterState,
  nextConditionId,
  PRESENCE_MODE_LABELS,
  type PresenceMode,
  QUANTIFIER_LABELS,
  type Quantifier,
  type Row,
  VALUE_OPERATOR_LABELS,
  type ValueOperator,
} from "../model.js";
import { applyPreset, applyTemplate, type Preset, type Template } from "../presets.js";

/** Поле, доступное для выбора в условиях. */
export interface FieldOption {
  name: string;
  label: string;
}

export interface FilterBuilderProps {
  fields: readonly FieldOption[];
  /** Исходные строки — нужны для счётчиков «сколько оставляет условие». */
  rows: readonly Row[];
  state: FilterState;
  onChange: (next: FilterState) => void;
  presets?: readonly Preset[];
  templates?: readonly Template[];
}

function labelOf(fields: readonly FieldOption[], name: string): string {
  return fields.find((field) => field.name === name)?.label ?? name;
}

export function FilterBuilder(props: FilterBuilderProps) {
  const [openTemplate, setOpenTemplate] = createSignal<Template | null>(null);
  const [templateValues, setTemplateValues] = createSignal<Record<string, string | string[]>>({});

  const formulaText = createMemo(() =>
    props.state.logic.mode === "formula"
      ? props.state.logic.text
      : defaultFormula(props.state.conditions.length),
  );

  const formulaError = createMemo(() => {
    if (props.state.logic.mode !== "formula") return null;
    if (props.state.conditions.length === 0) return null;
    const parsed = parseFormula(props.state.logic.text, props.state.conditions.length);
    return parsed.ok ? null : parsed.error;
  });

  const patch = (next: Partial<FilterState>) => {
    props.onChange({ ...props.state, ...next });
  };

  const replaceCondition = (id: string, next: Condition) => {
    patch({ conditions: props.state.conditions.map((item) => (item.id === id ? next : item)) });
  };

  const addCondition = (condition: Condition) => {
    // Формулу при добавлении НЕ дописываем сами: пользователь написал её, и молча менять
    // чужой текст нельзя. Новое условие просто появляется номером, и формула краснеет,
    // если он в ней не упомянут, — это видно, а не сюрприз в результате.
    patch({ conditions: [...props.state.conditions, condition] });
  };

  const removeCondition = (id: string) => {
    patch({ conditions: props.state.conditions.filter((item) => item.id !== id) });
  };

  const firstField = () => props.fields[0]?.name ?? "";

  return (
    <div data-slot="filter-builder">
      <Show when={(props.presets?.length ?? 0) > 0 || (props.templates?.length ?? 0) > 0}>
        <div data-slot="filter-toolbar">
          <For each={props.presets ?? []}>
            {(preset) => (
              <Button
                data-slot="filter-preset"
                title={preset.hint}
                onClick={() => props.onChange(applyPreset(preset))}
              >
                {preset.label}
              </Button>
            )}
          </For>
          <For each={props.templates ?? []}>
            {(template) => (
              <Button
                data-slot="filter-template"
                title={template.hint}
                onClick={() => {
                  setTemplateValues({});
                  setOpenTemplate(template);
                }}
              >
                {template.label}…
              </Button>
            )}
          </For>
        </div>
      </Show>

      <Show when={openTemplate()}>
        {(template) => (
          <div data-slot="filter-template-form">
            <p data-slot="filter-template-title">{template().label}</p>
            <For each={template().params}>
              {(param) => (
                <div data-slot="filter-template-param">
                  <span data-slot="filter-template-param-label">{param.label}</span>
                  <Show
                    when={param.kind === "fields"}
                    fallback={
                      <Field
                        value={String(templateValues()[param.key] ?? "")}
                        onChange={(value) =>
                          setTemplateValues((current) => ({ ...current, [param.key]: value }))
                        }
                      >
                        <Input />
                      </Field>
                    }
                  >
                    <FieldChips
                      fields={props.fields}
                      selected={(templateValues()[param.key] as string[]) ?? []}
                      onToggle={(name) =>
                        setTemplateValues((current) => {
                          const chosen = (current[param.key] as string[]) ?? [];
                          return {
                            ...current,
                            [param.key]: chosen.includes(name)
                              ? chosen.filter((item) => item !== name)
                              : [...chosen, name],
                          };
                        })
                      }
                    />
                  </Show>
                </div>
              )}
            </For>
            <div data-slot="filter-template-actions">
              <Button
                onClick={() => {
                  props.onChange(applyTemplate(template(), templateValues()));
                  setOpenTemplate(null);
                }}
              >
                Применить
              </Button>
              <Button data-slot="filter-secondary" onClick={() => setOpenTemplate(null)}>
                Отмена
              </Button>
            </div>
          </div>
        )}
      </Show>

      <ol data-slot="filter-conditions">
        <For each={props.state.conditions}>
          {(condition, index) => (
            <li data-slot="filter-condition">
              <span data-slot="condition-number">{index() + 1}</span>

              <div data-slot="condition-body">
                <Show
                  when={condition.kind === "value" ? condition : null}
                  fallback={
                    <PresenceEditor
                      condition={condition as Extract<Condition, { kind: "presence" }>}
                      fields={props.fields}
                      onChange={(next) => replaceCondition(condition.id, next)}
                    />
                  }
                >
                  {(value) => (
                    <ValueEditor
                      condition={value()}
                      fields={props.fields}
                      onChange={(next) => replaceCondition(condition.id, next)}
                    />
                  )}
                </Show>
              </div>

              <span data-slot="condition-count">
                оставляет {countMatching(props.rows, condition)} из {props.rows.length}
              </span>

              <Button
                data-slot="condition-remove"
                aria-label={`Убрать условие ${index() + 1}`}
                onClick={() => removeCondition(condition.id)}
              >
                ×
              </Button>
            </li>
          )}
        </For>
      </ol>

      <div data-slot="filter-add">
        <Button
          onClick={() =>
            addCondition({
              id: nextConditionId(),
              kind: "value",
              field: firstField(),
              operator: "contains",
              value: "",
            })
          }
        >
          + условие по значению
        </Button>
        <Button
          onClick={() =>
            addCondition({
              id: nextConditionId(),
              kind: "presence",
              quantifier: "any",
              mode: "exists",
              fields: [],
            })
          }
        >
          + условие по наличию полей
        </Button>
      </div>

      <div data-slot="filter-logic" data-active={props.state.logic.mode === "formula" ? "" : undefined}>
        <label data-slot="logic-toggle">
          <input
            type="checkbox"
            checked={props.state.logic.mode === "formula"}
            onChange={(event) =>
              patch({
                logic: event.currentTarget.checked
                  ? { mode: "formula", text: defaultFormula(props.state.conditions.length) }
                  : { mode: "all" },
              })
            }
          />
          Своя логика
        </label>

        <Show
          when={props.state.logic.mode === "formula"}
          fallback={<span data-slot="logic-hint">все условия через И</span>}
        >
          <Field
            data-slot="logic-field"
            value={formulaText()}
            validationState={formulaError() ? "invalid" : "valid"}
            onChange={(value) => patch({ logic: { mode: "formula", text: value } })}
          >
            <Input data-slot="logic-input" placeholder="например: (1 И 2) ИЛИ 3" />
          </Field>
        </Show>

        <Show when={formulaError()}>
          {(error) => <p data-slot="logic-error">{error()}</p>}
        </Show>
      </div>
    </div>
  );
}

interface ValueEditorProps {
  condition: Extract<Condition, { kind: "value" }>;
  fields: readonly FieldOption[];
  onChange: (next: Condition) => void;
}

function ValueEditor(props: ValueEditorProps) {
  return (
    <div data-slot="condition-value">
      <select
        data-slot="condition-field"
        value={props.condition.field}
        onChange={(event) => props.onChange({ ...props.condition, field: event.currentTarget.value })}
      >
        <For each={props.fields}>{(field) => <option value={field.name}>{field.label}</option>}</For>
      </select>

      <select
        data-slot="condition-operator"
        value={props.condition.operator}
        onChange={(event) =>
          props.onChange({
            ...props.condition,
            operator: event.currentTarget.value as ValueOperator,
          })
        }
      >
        <For each={Object.entries(VALUE_OPERATOR_LABELS)}>
          {([value, label]) => <option value={value}>{label}</option>}
        </For>
      </select>

      <Field
        data-slot="condition-input"
        value={props.condition.value}
        onChange={(value) => props.onChange({ ...props.condition, value })}
      >
        <Input placeholder="значение" />
      </Field>
    </div>
  );
}

interface PresenceEditorProps {
  condition: Extract<Condition, { kind: "presence" }>;
  fields: readonly FieldOption[];
  onChange: (next: Condition) => void;
}

function PresenceEditor(props: PresenceEditorProps) {
  return (
    <div data-slot="condition-presence">
      <div data-slot="condition-presence-head">
        <select
          data-slot="condition-mode"
          value={props.condition.mode}
          onChange={(event) =>
            props.onChange({ ...props.condition, mode: event.currentTarget.value as PresenceMode })
          }
        >
          <For each={Object.entries(PRESENCE_MODE_LABELS)}>
            {([value, label]) => <option value={value}>{label}</option>}
          </For>
        </select>

        <select
          data-slot="condition-quantifier"
          value={props.condition.quantifier}
          onChange={(event) =>
            props.onChange({
              ...props.condition,
              quantifier: event.currentTarget.value as Quantifier,
            })
          }
        >
          <For each={Object.entries(QUANTIFIER_LABELS)}>
            {([value, label]) => <option value={value}>{label}</option>}
          </For>
        </select>
      </div>

      <FieldChips
        fields={props.fields}
        selected={props.condition.fields}
        onToggle={(name) =>
          props.onChange({
            ...props.condition,
            fields: props.condition.fields.includes(name)
              ? props.condition.fields.filter((item) => item !== name)
              : [...props.condition.fields, name],
          })
        }
      />
    </div>
  );
}

interface FieldChipsProps {
  fields: readonly FieldOption[];
  selected: readonly string[];
  onToggle: (name: string) => void;
}

function FieldChips(props: FieldChipsProps) {
  return (
    <div data-slot="field-chips">
      <For each={props.fields}>
        {(field) => (
          <Button
            data-slot="field-chip"
            data-selected={props.selected.includes(field.name) ? "" : undefined}
            aria-pressed={props.selected.includes(field.name)}
            onClick={() => props.onToggle(field.name)}
          >
            {field.label}
          </Button>
        )}
      </For>
    </div>
  );
}

export { describeCondition, labelOf };
