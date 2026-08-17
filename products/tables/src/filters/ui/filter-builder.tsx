// Конструктор фильтра — БЕЗГОЛОВЫЙ, как и кит, на котором стоит (`kb:PROBEWEB-4`).
//
// Ни одного класса по умолчанию: наружу едут структура, поведение и зацепки `data-slot`,
// вид — за потребителем. Состояния отдаются атрибутами (`data-active`, `data-invalid`,
// `data-selected`), чтобы CSS цеплялся за них, а не за внутренности.
//
// Форма — плоский нумерованный список условий плюс отдельная строка логики (решение с user
// 2026-08-10). Вложенных групп здесь нет намеренно: они перестают читаться со второго уровня.
// Сверка 2026-08-11: форму конструктора рынок не нормирует вообще, так что заимствовать
// вместо неё нечего; нормирована только ПОМОЩЬ при вводе — WCAG 2.2, критерии 3.3.1–3.3.3,
// и они здесь исполняются (ошибка названа текстом, поля подписаны, поправка предложена).
//
// НОМЕР УСЛОВИЯ — ТОЛЬКО ПОКАЗ. Формула хранится деревом по `id`; текст с номерами живёт в
// поле ввода и переводится в дерево при разборе. Поэтому удаление условия больше не сдвигает
// смысл сохранённой формулы молча (`tasker:TABLES-4`, раздел B).

import { Button, Field, Input } from "@omnifield/probe-web-ui";
import { createEffect, createMemo, createSignal, For, on, Show } from "solid-js";

import { countMatching } from "../evaluate.js";
import { danglingIds, defaultExpr, defaultFormula, formatFormula, parseFormula, referencedIds } from "../formula.js";
import { describeCondition } from "../describe.js";
import {
  COMPARISON_OPERATOR_LABELS,
  type ComparisonCondition,
  type ComparisonOperator,
  type Condition,
  type FieldDictionary,
  type FieldRef,
  type FieldSpec,
  type FieldType,
  type FilterState,
  type MemberCondition,
  nextConditionId,
  operatorsFor,
  PRESENCE_MODE_LABELS,
  type PresenceCondition,
  type PresenceMode,
  QUANTIFIER_LABELS,
  type Quantifier,
  type RangeCondition,
  type Row,
  supportsRange,
} from "../model.js";
import { applyPreset, applyTemplate, type Preset, type Template } from "../presets.js";

export interface FilterBuilderProps {
  /** Словарь полей: чем адресуется, как называется, какого типа. */
  fields: FieldDictionary;
  /** Исходные строки — нужны для счётчиков «сколько оставляет условие». */
  rows: readonly Row[];
  state: FilterState;
  onChange: (next: FilterState) => void;
  presets?: readonly Preset[];
  templates?: readonly Template[];
}

function specOf(fields: FieldDictionary, name: FieldRef): FieldSpec | undefined {
  return fields.find((field) => field.name === name);
}

function labelOf(fields: FieldDictionary, name: FieldRef): string {
  return specOf(fields, name)?.label ?? name;
}

function typeOf(fields: FieldDictionary, name: FieldRef): FieldType {
  return specOf(fields, name)?.type ?? "text";
}

export function FilterBuilder(props: FilterBuilderProps) {
  const [openTemplate, setOpenTemplate] = createSignal<Template | null>(null);
  const [templateValues, setTemplateValues] = createSignal<Record<string, string | string[]>>({});

  // Текст формулы, пока его правят. Состояние хранит РАЗОБРАННОЕ дерево, поэтому недописанная
  // формула не может там лежать — она живёт здесь, а в состояние уезжает, когда разобралась.
  const [draft, setDraft] = createSignal<string | null>(null);

  const ids = createMemo(() => props.state.conditions.map((condition) => condition.id));

  const storedText = createMemo(() =>
    props.state.logic.mode === "formula"
      ? formatFormula(props.state.logic.expr, ids())
      : defaultFormula(props.state.conditions.length),
  );

  const formulaText = createMemo(() => draft() ?? storedText());

  // Список условий изменился — черновик протух: номера в нём означают уже не то, что означали.
  createEffect(on(() => ids().join("\u0000"), () => setDraft(null), { defer: true }));

  const formulaError = createMemo(() => {
    if (props.state.logic.mode !== "formula") return null;

    const text = draft();
    if (text !== null) {
      const parsed = parseFormula(text, ids());
      return parsed.ok ? null : parsed.error;
    }

    const dangling = danglingIds(props.state.logic.expr, ids());
    if (dangling.length === 0) return null;
    return dangling.length === 1
      ? "условие, на которое ссылается формула, удалено — поправьте формулу"
      : `условий, на которые ссылается формула, больше нет: ${dangling.length} — поправьте формулу`;
  });

  /** Условия, которые в формуле не упомянуты: они не участвуют в отборе, и это надо видеть. */
  const unusedNumbers = createMemo(() => {
    if (props.state.logic.mode !== "formula") return [];
    const used = referencedIds(props.state.logic.expr);
    return ids()
      .map((id, index) => (used.has(id) ? null : index + 1))
      .filter((number): number is number => number !== null);
  });

  const patch = (next: Partial<FilterState>) => {
    props.onChange({ ...props.state, ...next });
  };

  const replaceCondition = (id: string, next: Condition) => {
    patch({ conditions: props.state.conditions.map((item) => (item.id === id ? next : item)) });
  };

  const addCondition = (condition: Condition) => {
    // Формулу при добавлении НЕ дописываем сами: пользователь написал её, и молча менять
    // чужой текст нельзя. Новое условие просто появляется номером, а рядом с формулой видно,
    // что оно в ней не участвует.
    patch({ conditions: [...props.state.conditions, condition] });
  };

  const removeCondition = (id: string) => {
    patch({ conditions: props.state.conditions.filter((item) => item.id !== id) });
  };

  const editFormula = (text: string) => {
    setDraft(text);
    const parsed = parseFormula(text, ids());
    if (parsed.ok) patch({ logic: { mode: "formula", expr: parsed.expr } });
  };

  /** Поправка, которую мы ЗНАЕМ, — WCAG 3.3.3: её надо предложить, а не оставить гадать. */
  const suggestion = createMemo(() => (formulaError() ? defaultFormula(ids().length) : null));

  const firstField = () => props.fields[0]?.name ?? "";

  const newComparison = (): ComparisonCondition => {
    const field = firstField();
    const operators = operatorsFor(typeOf(props.fields, field));
    return {
      id: nextConditionId(),
      kind: "compare",
      field,
      operator: operators.includes("contains") ? "contains" : "eq",
      value: "",
    };
  };

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
          {(condition, index) => {
            const count = createMemo(() =>
              countMatching(props.rows, condition, { fields: props.fields }),
            );

            return (
              <li data-slot="filter-condition">
                <span data-slot="filter-condition-number">{index() + 1}</span>

                <div data-slot="filter-condition-body">
                  <ConditionEditor
                    condition={condition}
                    fields={props.fields}
                    onChange={(next) => replaceCondition(condition.id, next)}
                  />
                </div>

                <span data-slot="filter-condition-count">
                  оставляет {count().matched} из {props.rows.length}
                  <Show when={count().unknown > 0}>
                    {/* Трёхзначность выходит на экран ровно здесь: «неизвестно» — это не
                        «не подошло», а «сравнивать не с чем», и лечится оно другим. */}
                    <span data-slot="filter-condition-unknown">, неизвестно {count().unknown}</span>
                  </Show>
                </span>

                <Button
                  data-slot="filter-condition-remove"
                  aria-label={`Убрать условие ${index() + 1}`}
                  onClick={() => removeCondition(condition.id)}
                >
                  ×
                </Button>
              </li>
            );
          }}
        </For>
      </ol>

      <div data-slot="filter-add">
        <Button onClick={() => addCondition(newComparison())}>+ сравнение</Button>
        <Button
          onClick={() =>
            addCondition({ id: nextConditionId(), kind: "in", field: firstField(), values: [""] })
          }
        >
          + одно из списка
        </Button>
        <Button
          onClick={() =>
            addCondition({
              id: nextConditionId(),
              kind: "between",
              field:
                props.fields.find((field) => supportsRange(field.type))?.name ?? firstField(),
              from: "",
              to: "",
            })
          }
        >
          + диапазон
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
          + наличие полей
        </Button>
      </div>

      <div data-slot="filter-logic" data-active={props.state.logic.mode === "formula" ? "" : undefined}>
        <label data-slot="filter-logic-toggle">
          <input
            type="checkbox"
            checked={props.state.logic.mode === "formula"}
            disabled={props.state.conditions.length === 0}
            onChange={(event) => {
              setDraft(null);
              const expr = defaultExpr(ids());
              patch({
                logic: event.currentTarget.checked && expr !== null ? { mode: "formula", expr } : { mode: "all" },
              });
            }}
          />
          Своя логика
        </label>

        <Show
          when={props.state.logic.mode === "formula"}
          fallback={<span data-slot="filter-logic-hint">все условия через И</span>}
        >
          <Field
            data-slot="filter-logic-field"
            value={formulaText()}
            validationState={formulaError() ? "invalid" : "valid"}
            onChange={editFormula}
          >
            <Input data-slot="filter-logic-input" placeholder="например: (1 И 2) ИЛИ 3" />
          </Field>
        </Show>

        <Show when={formulaError()}>
          {(error) => (
            <p data-slot="filter-logic-error">
              {error()}
              <Show when={suggestion()}>
                {(fix) => (
                  <Button
                    data-slot="filter-logic-fix"
                    onClick={() => {
                      setDraft(null);
                      const expr = defaultExpr(ids());
                      if (expr !== null) patch({ logic: { mode: "formula", expr } });
                    }}
                  >
                    подставить «{fix()}»
                  </Button>
                )}
              </Show>
            </p>
          )}
        </Show>

        <Show when={unusedNumbers().length > 0 && !formulaError()}>
          <p data-slot="filter-logic-unused">
            в формуле не участвуют условия: {unusedNumbers().join(", ")}
          </p>
        </Show>
      </div>
    </div>
  );
}

interface EditorProps<T extends Condition> {
  condition: T;
  fields: FieldDictionary;
  onChange: (next: Condition) => void;
}

function ConditionEditor(props: EditorProps<Condition>) {
  return (
    <>
      <Show when={props.condition.kind === "compare" ? (props.condition as ComparisonCondition) : null}>
        {(condition) => (
          <ComparisonEditor condition={condition()} fields={props.fields} onChange={props.onChange} />
        )}
      </Show>
      <Show when={props.condition.kind === "in" ? (props.condition as MemberCondition) : null}>
        {(condition) => (
          <MemberEditor condition={condition()} fields={props.fields} onChange={props.onChange} />
        )}
      </Show>
      <Show when={props.condition.kind === "between" ? (props.condition as RangeCondition) : null}>
        {(condition) => (
          <RangeEditor condition={condition()} fields={props.fields} onChange={props.onChange} />
        )}
      </Show>
      <Show when={props.condition.kind === "presence" ? (props.condition as PresenceCondition) : null}>
        {(condition) => (
          <PresenceEditor condition={condition()} fields={props.fields} onChange={props.onChange} />
        )}
      </Show>
    </>
  );
}

interface FieldSelectProps {
  fields: FieldDictionary;
  value: FieldRef;
  onChange: (name: FieldRef) => void;
  only?: (field: FieldSpec) => boolean;
}

function FieldSelect(props: FieldSelectProps) {
  const options = createMemo(() => props.fields.filter((field) => props.only?.(field) ?? true));

  return (
    <select
      data-slot="filter-condition-field"
      value={props.value}
      onChange={(event) => props.onChange(event.currentTarget.value)}
    >
      <For each={options()}>{(field) => <option value={field.name}>{field.label}</option>}</For>
    </select>
  );
}

function ComparisonEditor(props: EditorProps<ComparisonCondition>) {
  const type = createMemo(() => typeOf(props.fields, props.condition.field));
  const operators = createMemo(() => operatorsFor(type()));

  const changeField = (name: FieldRef) => {
    const allowed = operatorsFor(typeOf(props.fields, name));
    // Поле сменилось на другой тип — оператор мог стать недопустимым (подстрока в числе).
    // Берём первый допустимый, а не оставляем невозможное сочетание.
    const operator = allowed.includes(props.condition.operator) ? props.condition.operator : allowed[0]!;
    props.onChange({ ...props.condition, field: name, operator });
  };

  return (
    <div data-slot="filter-condition-compare">
      <FieldSelect fields={props.fields} value={props.condition.field} onChange={changeField} />

      <select
        data-slot="filter-condition-operator"
        value={props.condition.operator}
        onChange={(event) =>
          props.onChange({
            ...props.condition,
            operator: event.currentTarget.value as ComparisonOperator,
          })
        }
      >
        <For each={operators()}>
          {(operator) => <option value={operator}>{COMPARISON_OPERATOR_LABELS[operator]}</option>}
        </For>
      </select>

      <Field
        data-slot="filter-condition-input"
        value={props.condition.value}
        onChange={(value) => props.onChange({ ...props.condition, value })}
      >
        <Input placeholder="значение" />
      </Field>

      <Show when={type() === "text"}>
        <label data-slot="filter-condition-sensitive">
          <input
            type="checkbox"
            checked={props.condition.sensitive === true}
            onChange={(event) =>
              props.onChange({ ...props.condition, sensitive: event.currentTarget.checked })
            }
          />
          учитывать регистр
        </label>
      </Show>
    </div>
  );
}

function MemberEditor(props: EditorProps<MemberCondition>) {
  const replace = (index: number, value: string) => {
    props.onChange({
      ...props.condition,
      values: props.condition.values.map((item, at) => (at === index ? value : item)),
    });
  };

  return (
    <div data-slot="filter-condition-in">
      <FieldSelect
        fields={props.fields}
        value={props.condition.field}
        onChange={(name) => props.onChange({ ...props.condition, field: name })}
      />

      <div data-slot="filter-condition-values">
        <For each={props.condition.values}>
          {(value, index) => (
            <span data-slot="filter-condition-value-row">
              <Field value={value} onChange={(next) => replace(index(), next)}>
                <Input placeholder="значение" />
              </Field>
              <Button
                data-slot="filter-condition-value-remove"
                aria-label={`Убрать значение ${index() + 1}`}
                onClick={() =>
                  props.onChange({
                    ...props.condition,
                    values: props.condition.values.filter((_, at) => at !== index()),
                  })
                }
              >
                ×
              </Button>
            </span>
          )}
        </For>
        <Button
          data-slot="filter-condition-value-add"
          onClick={() => props.onChange({ ...props.condition, values: [...props.condition.values, ""] })}
        >
          + значение
        </Button>
      </div>
    </div>
  );
}

function RangeEditor(props: EditorProps<RangeCondition>) {
  return (
    <div data-slot="filter-condition-between">
      <FieldSelect
        fields={props.fields}
        value={props.condition.field}
        onChange={(name) => props.onChange({ ...props.condition, field: name })}
        only={(field) => supportsRange(field.type)}
      />

      <Field
        data-slot="filter-condition-from"
        value={props.condition.from}
        onChange={(from) => props.onChange({ ...props.condition, from })}
      >
        <Input placeholder="от" />
      </Field>

      <Field
        data-slot="filter-condition-to"
        value={props.condition.to}
        onChange={(to) => props.onChange({ ...props.condition, to })}
      >
        <Input placeholder="до" />
      </Field>

      {/* Границы ВКЛЮЧИТЕЛЬНЫ — CQL2 говорит это прямо, и пользователю мы говорим тоже. */}
      <span data-slot="filter-condition-hint">границы включительно</span>
    </div>
  );
}

function PresenceEditor(props: EditorProps<PresenceCondition>) {
  return (
    <div data-slot="filter-condition-presence">
      <div data-slot="filter-condition-presence-head">
        <select
          data-slot="filter-condition-mode"
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
          data-slot="filter-condition-quantifier"
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
  fields: FieldDictionary;
  selected: readonly FieldRef[];
  onToggle: (name: FieldRef) => void;
}

function FieldChips(props: FieldChipsProps) {
  return (
    <div data-slot="filter-field-chips">
      <For each={props.fields}>
        {(field) => (
          <Button
            data-slot="filter-field-chip"
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
