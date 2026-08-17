// Конструктор адаптера — БЕЗГОЛОВЫЙ, как и всё в зоне.
//
// Форма повторяет конструктор фильтров сознательно: плоский нумерованный список правил,
// зацепки `data-slot`, ноль классов. Человек, настроивший фильтр, узнаёт эту форму и не учит
// её заново; а нам она уже известна на практике — включая то, что счётчик рядом с каждой
// строкой полезнее любого описания.
//
// Три вещи, без которых конструктор превращается в гадание:
//   1. пути ИСТОЧНИКА предлагаются списком, а не набираются руками;
//   2. видно ОТЧЁТ: сколько строк доехало, что не легло, с примерами;
//   3. видно ДО и ПОСЛЕ на живых данных.

import { Button, Field, Input } from "@omnifield/probe-web-ui";
import { createMemo, For, Show } from "solid-js";

import type { ColumnDictionary } from "../../table/index.js";
import { applyAdapter } from "../apply.js";
import {
  type AdapterSpec,
  type FieldRule,
  type FieldRef,
  type OnFail,
  ON_FAIL_LABELS,
  type Step,
  type StepKind,
  STEP_LABELS,
} from "../model.js";
import { discoverRowPaths, discoverRowSets, lookup } from "../paths.js";

export interface AdapterBuilderProps {
  /** Наш словарь полей — цели правил берутся из него, а не набираются. */
  fields: ColumnDictionary;
  /** Образец чужого ответа: из него предлагаются пути и считается предпросмотр. */
  sample: unknown;
  spec: AdapterSpec;
  onChange: (next: AdapterSpec) => void;
}

/** Действия без обязательных настроек — их можно добавить одной кнопкой. */
const SIMPLE_STEPS: StepKind[] = ["trim", "lower", "upper", "number", "bool", "date"];

function blankStep(kind: StepKind): Step {
  switch (kind) {
    case "split":
      return { kind, separator: " ", take: 0 };
    case "replace":
      return { kind, find: "", with: "" };
    case "multiply":
    case "divide":
      return { kind, by: 1 };
    case "round":
      return { kind, digits: 0 };
    case "dictionary":
      return { kind, values: {} };
    case "coalesce":
      return { kind, from: [] };
    case "default":
    case "constant":
      return { kind, value: "" };
    case "concat":
      return { kind, parts: [{ text: "" }] };
    default:
      return { kind } as Step;
  }
}

export function AdapterBuilder(props: AdapterBuilderProps) {
  const rowSets = createMemo(() => discoverRowSets(props.sample));

  /** Первая строка ИХ данных — левая половина предпросмотра. */
  const firstSource = createMemo(() => {
    const found = lookup(props.sample as Record<string, unknown>, props.spec.rows);
    const set = props.spec.rows === "" ? props.sample : found.found ? found.value : undefined;
    return Array.isArray(set) ? set[0] : undefined;
  });
  const sourcePaths = createMemo(() => discoverRowPaths(props.sample, props.spec.rows));
  const result = createMemo(() => applyAdapter(props.sample, props.spec));

  const patch = (next: Partial<AdapterSpec>) => props.onChange({ ...props.spec, ...next });

  const replaceRule = (index: number, rule: FieldRule) =>
    patch({ fields: props.spec.fields.map((item, at) => (at === index ? rule : item)) });

  const addRule = () => {
    const taken = new Set(props.spec.fields.map((rule) => rule.target));
    const free = props.fields.find((field) => !taken.has(field.name));
    if (!free) return;
    patch({ fields: [...props.spec.fields, { target: free.name, from: sourcePaths()[0] ?? "" }] });
  };

  return (
    <div data-slot="adapter-builder">
      <div data-slot="adapter-source">
        <label data-slot="adapter-rows">
          набор строк лежит по пути
          {/* Зацепка и на подписи, и на самом поле: полусоставную часть одеть нельзя. */}
          <select
            data-slot="adapter-rows-select"
            value={props.spec.rows}
            onChange={(event) => patch({ rows: event.currentTarget.value })}
          >
            <option value="">ответ целиком — это массив</option>
            <For each={rowSets()}>{(path) => <option value={path}>{path}</option>}</For>
          </select>
        </label>

        <label data-slot="adapter-extra">
          <input
            data-slot="adapter-extra-input"
            type="checkbox"
            checked={props.spec.extra === "keep"}
            onChange={(event) => patch({ extra: event.currentTarget.checked ? "keep" : "drop" })}
          />
          проносить их поля, для которых правил нет
        </label>
      </div>

      <ol data-slot="adapter-rules">
        <For each={props.spec.fields}>
          {(rule, index) => {
            const failures = createMemo(() =>
              result().report.issues.filter((issue) => issue.target === rule.target),
            );

            return (
              <li data-slot="adapter-rule" data-target={rule.target}>
                <span data-slot="adapter-rule-number">{index() + 1}</span>

                <select
                  data-slot="adapter-rule-target"
                  value={rule.target}
                  onChange={(event) =>
                    replaceRule(index(), { ...rule, target: event.currentTarget.value })
                  }
                >
                  <For each={props.fields}>
                    {(field) => <option value={field.name}>{field.label}</option>}
                  </For>
                </select>

                <span data-slot="adapter-rule-arrow" aria-hidden="true">
                  ←
                </span>

                <select
                  data-slot="adapter-rule-from"
                  value={rule.from ?? ""}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    replaceRule(index(), {
                      ...rule,
                      ...(value === "" ? { from: undefined } : { from: value }),
                    });
                  }}
                >
                  <option value="">— без источника —</option>
                  <For each={sourcePaths()}>{(path) => <option value={path}>{path}</option>}</For>
                </select>

                <div data-slot="adapter-rule-steps">
                  <For each={rule.steps ?? []}>
                    {(step, at) => (
                      <span data-slot="adapter-rule-step" data-kind={step.kind}>
                        {STEP_LABELS[step.kind]}
                        <StepParams
                          step={step}
                          onChange={(next) =>
                            replaceRule(index(), {
                              ...rule,
                              steps: (rule.steps ?? []).map((item, i) => (i === at() ? next : item)),
                            })
                          }
                        />
                        <Button
                          data-slot="button adapter-rule-step-remove"
                          aria-label={`Убрать действие ${at() + 1}`}
                          onClick={() =>
                            replaceRule(index(), {
                              ...rule,
                              steps: (rule.steps ?? []).filter((_, i) => i !== at()),
                            })
                          }
                        >
                          ×
                        </Button>
                      </span>
                    )}
                  </For>

                  <select
                    data-slot="adapter-rule-step-add"
                    value=""
                    onChange={(event) => {
                      const kind = event.currentTarget.value as StepKind;
                      if (kind === ("" as StepKind)) return;
                      event.currentTarget.value = "";
                      replaceRule(index(), {
                        ...rule,
                        steps: [...(rule.steps ?? []), blankStep(kind)],
                      });
                    }}
                  >
                    <option value="">+ действие</option>
                    <For each={Object.keys(STEP_LABELS) as StepKind[]}>
                      {(kind) => (
                        <option value={kind}>
                          {STEP_LABELS[kind]}
                          {SIMPLE_STEPS.includes(kind) ? "" : "…"}
                        </option>
                      )}
                    </For>
                  </select>
                </div>

                <select
                  data-slot="adapter-rule-on-fail"
                  value={rule.onFail ?? "skip"}
                  onChange={(event) =>
                    replaceRule(index(), { ...rule, onFail: event.currentTarget.value as OnFail })
                  }
                >
                  <For each={Object.entries(ON_FAIL_LABELS)}>
                    {([value, label]) => <option value={value}>{label}</option>}
                  </For>
                </select>

                <Show when={rule.onFail === "default"}>
                  <Field
                    data-slot="field adapter-rule-fallback"
                    value={rule.fallback ?? ""}
                    onChange={(value) => replaceRule(index(), { ...rule, fallback: value })}
                  >
                    <Input placeholder="умолчание" />
                  </Field>
                </Show>

                {/* Счётчик у правила — то же, что счётчик у условия фильтра: настройку видно
                    сразу, а не по пропавшим данным через месяц. */}
                <Show when={failures().length > 0}>
                  <span data-slot="adapter-rule-issues">
                    <For each={failures()}>
                      {(issue) => (
                        <span data-slot="adapter-rule-issue">
                          не легло {issue.count}: {issue.reason}
                          <Show when={issue.examples.length > 0}>
                            {" "}
                            (например «{issue.examples[0]}»)
                          </Show>
                        </span>
                      )}
                    </For>
                  </span>
                </Show>

                <Button
                  data-slot="button adapter-rule-remove"
                  aria-label={`Убрать правило ${index() + 1}`}
                  onClick={() => patch({ fields: props.spec.fields.filter((_, at) => at !== index()) })}
                >
                  ×
                </Button>
              </li>
            );
          }}
        </For>
      </ol>

      <Button data-slot="button adapter-add" onClick={addRule}>
        + правило
      </Button>

      <div data-slot="adapter-report">
        <Show
          when={result().error === null}
          fallback={<p data-slot="adapter-error">{result().error}</p>}
        >
          <p data-slot="adapter-count">
            прочитано {result().report.total}, доехало {result().report.converted}
            <Show when={result().report.rejected > 0}>
              , забраковано {result().report.rejected}
            </Show>
          </p>

          <Show when={result().report.unmapped.length > 0}>
            <p data-slot="adapter-unmapped">
              их поля без правил:{" "}
              {result()
                .report.unmapped.map((entry) => `${entry.path} (${entry.count})`)
                .join(", ")}
            </p>
          </Show>
        </Show>
      </div>

      <div data-slot="adapter-preview">
        <Show when={result().rows[0]}>
          {(row) => (
            <div data-slot="adapter-pair">
              <pre data-slot="adapter-before">{JSON.stringify(firstSource(), null, 2)}</pre>
              <pre data-slot="adapter-after">{JSON.stringify(row(), null, 2)}</pre>
            </div>
          )}
        </Show>
      </div>
    </div>
  );
}

interface StepParamsProps {
  step: Step;
  onChange: (next: Step) => void;
}

/** Настройки действия. Показываются только у тех, кому они нужны. */
function StepParams(props: StepParamsProps) {
  return (
    <>
      <Show when={props.step.kind === "split" ? props.step : null}>
        {(step) => (
          <>
            <Field
              data-slot="field adapter-step-separator"
              value={step().separator}
              onChange={(value) => props.onChange({ ...step(), separator: value })}
            >
              <Input placeholder="разделитель" />
            </Field>
            <Field
              data-slot="field adapter-step-take"
              value={String(step().take)}
              onChange={(value) => props.onChange({ ...step(), take: Number(value) || 0 })}
            >
              <Input placeholder="номер куска" />
            </Field>
          </>
        )}
      </Show>

      <Show when={props.step.kind === "replace" ? props.step : null}>
        {(step) => (
          <>
            <Field
              data-slot="field adapter-step-find"
              value={step().find}
              onChange={(value) => props.onChange({ ...step(), find: value })}
            >
              <Input placeholder="найти" />
            </Field>
            <Field
              data-slot="field adapter-step-with"
              value={step().with}
              onChange={(value) => props.onChange({ ...step(), with: value })}
            >
              <Input placeholder="заменить на" />
            </Field>
          </>
        )}
      </Show>

      <Show
        when={
          props.step.kind === "multiply" || props.step.kind === "divide" ? props.step : null
        }
      >
        {(step) => (
          <Field
            data-slot="field adapter-step-by"
            value={String(step().by)}
            onChange={(value) => props.onChange({ ...step(), by: Number(value) || 1 })}
          >
            <Input placeholder="на сколько" />
          </Field>
        )}
      </Show>

      <Show
        when={props.step.kind === "default" || props.step.kind === "constant" ? props.step : null}
      >
        {(step) => (
          <Field
            data-slot="field adapter-step-value"
            value={step().value}
            onChange={(value) => props.onChange({ ...step(), value })}
          >
            <Input placeholder="значение" />
          </Field>
        )}
      </Show>
    </>
  );
}

export type { FieldRef };
