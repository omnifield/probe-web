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

import { Choice, Tick } from "../../ui/choice.jsx";
import { createEffect, createMemo, createSignal, For, on, Show } from "solid-js";

import { countMatching } from "../evaluate.js";
import {
  danglingIds,
  defaultExpr,
  defaultFormula,
  formatFormula,
  negatedIds,
  parseFormula,
  referencedIds,
} from "../formula.js";
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
  isIncomplete,
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
  const unused = createMemo(() => {
    if (props.state.logic.mode !== "formula") return new Set<string>();
    const used = referencedIds(props.state.logic.expr);
    return new Set(ids().filter((id) => !used.has(id)));
  });

  const unusedNumbers = createMemo(() =>
    ids()
      .map((id, index) => (unused().has(id) ? index + 1 : null))
      .filter((number): number is number => number !== null),
  );

  /**
   * Условия под отрицанием.
   *
   * Отрицание живёт в ФОРМУЛЕ, а не в условии: условие говорит «сумма больше ста», а нужно ли
   * обратное — решает логика сборки. Поэтому строка условия сама про своё отрицание не знает,
   * и без этого разбора одеть её как отрицаемую нельзя.
   */
  const negated = createMemo(() =>
    props.state.logic.mode === "formula" ? negatedIds(props.state.logic.expr) : new Set<string>(),
  );

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
                data-slot="button filter-preset"
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
                data-slot="button filter-template"
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
                        data-slot="field filter-template-param-input"
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
                data-slot="button filter-template-apply"
                onClick={() => {
                  props.onChange(applyTemplate(template(), templateValues()));
                  setOpenTemplate(null);
                }}
              >
                Применить
              </Button>
              <Button data-slot="button filter-secondary" onClick={() => setOpenTemplate(null)}>
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
              <li
                data-slot="filter-condition"
                data-kind={condition.kind}
                // Недописанное условие — не ошибка, а не законченная работа: показать это и
                // когда показать, решает тот, кто одевает.
                data-incomplete={isIncomplete(condition) ? "" : undefined}
                data-negated={negated().has(condition.id) ? "" : undefined}
                data-unused={unused().has(condition.id) ? "" : undefined}
              >
                <span data-slot="filter-condition-number">{index() + 1}</span>

                <div data-slot="filter-condition-body">
                  <ConditionEditor
                    condition={condition}
                    fields={props.fields}
                    onChange={(next) => replaceCondition(condition.id, next)}
                  />
                </div>

                <span
                  data-slot="filter-condition-count"
                  data-unknown={count().unknown > 0 ? "" : undefined}
                >
                  оставляет {count().matched} из {props.rows.length}
                  <Show when={count().unknown > 0}>
                    {/* Трёхзначность выходит на экран ровно здесь: «неизвестно» — это не
                        «не подошло», а «сравнивать не с чем», и лечится оно другим. */}
                    <span data-slot="filter-condition-unknown">, неизвестно {count().unknown}</span>
                  </Show>
                </span>

                <Button
                  data-slot="button filter-condition-remove"
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

      {/* У каждой кнопки добавления своя зацепка: они добавляют РАЗНОЕ, и одеть их одним
          правилом значит лишить человека возможности отличить их взглядом. */}
      <div data-slot="filter-add">
        <Button data-slot="button filter-add-compare" onClick={() => addCondition(newComparison())}>
          + сравнение
        </Button>
        <Button
          data-slot="button filter-add-in"
          onClick={() =>
            addCondition({ id: nextConditionId(), kind: "in", field: firstField(), values: [""] })
          }
        >
          + одно из списка
        </Button>
        <Button
          data-slot="button filter-add-between"
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
          data-slot="button filter-add-presence"
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

      <div
        data-slot="filter-logic"
        data-active={props.state.logic.mode === "formula" ? "" : undefined}
        data-invalid={formulaError() ? "" : undefined}
      >
        {/* Обёртка — `span`, а не `label`: подпись теперь внутри галки и связана с вводом
            самим китом, а второй `label` поверх перехватывал бы щелчок на себя. Зацепка есть
            и на обёртке, и на галке: одеть одну через другую нельзя. */}
        <span data-slot="filter-logic-toggle">
          <Tick
            slot="filter-logic-toggle-input"
            label="Своя логика"
            checked={props.state.logic.mode === "formula"}
            disabled={props.state.conditions.length === 0}
            onChange={(checked) => {
              setDraft(null);
              const expr = defaultExpr(ids());
              patch({
                logic: checked && expr !== null ? { mode: "formula", expr } : { mode: "all" },
              });
            }}
          >
            Своя логика
          </Tick>
        </span>

        <Show
          when={props.state.logic.mode === "formula"}
          fallback={<span data-slot="filter-logic-hint">все условия через И</span>}
        >
          <Field
            data-slot="field filter-logic-field"
            value={formulaText()}
            validationState={formulaError() ? "invalid" : "valid"}
            onChange={editFormula}
          >
            <Input data-slot="input filter-logic-input" placeholder="например: (1 И 2) ИЛИ 3" />
          </Field>
        </Show>

        <Show when={formulaError()}>
          {(error) => (
            <p data-slot="filter-logic-error">
              {error()}
              <Show when={suggestion()}>
                {(fix) => (
                  <Button
                    data-slot="button filter-logic-fix"
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
  const options = createMemo(() =>
    props.fields
      .filter((field) => props.only?.(field) ?? true)
      .map((field) => ({ value: field.name, label: field.label })),
  );

  return (
    <Choice
      slot="filter-condition-field"
      label="Поле"
      value={props.value}
      options={options()}
      onChange={props.onChange}
    />
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
    <div
      data-slot="filter-condition-compare"
      // РЕЖИМ сравнения: «содержит» и «больше или равно» — разной ширины и разного смысла, и
      // оформление вправе развести их, не разбирая подпись оператора обратно.
      data-operator={props.condition.operator}
      data-sensitive={props.condition.sensitive === true ? "" : undefined}
    >
      <FieldSelect fields={props.fields} value={props.condition.field} onChange={changeField} />

      <Choice
        slot="filter-condition-operator"
        label="Как сравнивать"
        value={props.condition.operator}
        options={operators().map((operator) => ({
          value: operator,
          label: COMPARISON_OPERATOR_LABELS[operator],
        }))}
        onChange={(value) =>
          props.onChange({ ...props.condition, operator: value as ComparisonOperator })
        }
      />

      <Field
        data-slot="field filter-condition-input"
        value={props.condition.value}
        onChange={(value) => props.onChange({ ...props.condition, value })}
      >
        <Input placeholder="значение" />
      </Field>

      <Show when={type() === "text"}>
        <span data-slot="filter-condition-sensitive">
          <Tick
            slot="filter-condition-sensitive-input"
            label="Учитывать регистр"
            checked={props.condition.sensitive === true}
            onChange={(checked) => props.onChange({ ...props.condition, sensitive: checked })}
          >
            учитывать регистр
          </Tick>
        </span>
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
              <Field
                data-slot="field filter-condition-value"
                value={value}
                onChange={(next) => replace(index(), next)}
              >
                <Input placeholder="значение" />
              </Field>
              <Button
                data-slot="button filter-condition-value-remove"
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
          data-slot="button filter-condition-value-add"
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
        data-slot="field filter-condition-from"
        value={props.condition.from}
        onChange={(from) => props.onChange({ ...props.condition, from })}
      >
        <Input placeholder="от" />
      </Field>

      <Field
        data-slot="field filter-condition-to"
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
    <div
      data-slot="filter-condition-presence"
      data-mode={props.condition.mode}
      data-quantifier={props.condition.quantifier}
    >
      <div data-slot="filter-condition-presence-head">
        <Choice
          slot="filter-condition-mode"
          label="Что проверять"
          value={props.condition.mode}
          options={Object.entries(PRESENCE_MODE_LABELS).map(([value, label]) => ({ value, label }))}
          onChange={(value) => props.onChange({ ...props.condition, mode: value as PresenceMode })}
        />

        <Choice
          slot="filter-condition-quantifier"
          label="Сколько полей должно подойти"
          value={props.condition.quantifier}
          options={Object.entries(QUANTIFIER_LABELS).map(([value, label]) => ({ value, label }))}
          onChange={(value) =>
            props.onChange({ ...props.condition, quantifier: value as Quantifier })
          }
        />
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
            data-slot="button filter-field-chip"
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
