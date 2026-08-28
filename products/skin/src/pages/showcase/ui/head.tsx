// ХЕДЕР: что надето и в каком режиме.
//
// Оба выбора здесь, а не на странице компонента, по одной причине: **они общие на всю витрину**.
// Скин один на всё, режим один на всё; стой они на странице кнопки, показалось бы, что одеваешь
// кнопку, а одевается всё.
//
// СКИН — списком выбора, а не рядом кнопок: скинов станет много, и ряд кнопок расползётся по
// ширине, отбирая место у самого показа. «Снят» — первый пункт списка и полноправный выбор:
// голый кит это рабочее состояние продукта, а не отсутствие выбора.
//
// ТРИ СОСТОЯНИЯ ХРАНИЛИЩА говорятся врозь, потому что лечатся разным: перечень есть · служба
// отвечает, но пуста · службы нет. Слепи их в одно «ничего нет» — человек пойдёт чинить не то, а
// пустой список прочтёт как «скинов не существует».
//
// ЭЛЕМЕНТЫ ЗДЕСЬ НАСТОЯЩИЕ, НЕ НАТИВНЫЕ (решение user 2026-08-27, отменяет прежнее «витрина —
// инструмент, своего скина не носит»): пульт продукта одевается ТЕМ ЖЕ нарядом, что и показанные
// продукты, — переключил скин, и одновременно меняется вид того, ЧЕМ ты его переключаешь. Прежний
// довод («ждать скина, чтобы витриной можно было пользоваться») оказался мнимым: голый кит —
// рабочее состояние по всему киту (`Surface`/`Button`/`Field` рисуют себя корректно и без наряда,
// та же логика, что у `Rail`, который настоящими компонентами кита стоит уже давно), а не повод
// держать один-единственный узел витрины на голой разметке.

import type { SkinMode } from "@omnifield/probe-web-runtime";
import { Button, Surface } from "@omnifield/probe-web-ui";
import type { PassportAssembly } from "@omnifield/probe-web-ui/passport";
import { For, Show, type JSX } from "solid-js";

import { EMPTY_HINT, SERVICE_HINT, type StoreRecord } from "../../../entities/outfit/model/index.js";
import type { Axis } from "../../../entities/catalog/model/cases.js";
import { Axes } from "./axes.jsx";
import { partOf } from "./kit-bridge.js";

const Field = partOf<{ children?: JSX.Element }>("field", "root");
const FieldLabel = partOf<{ children?: JSX.Element }>("field", "label");
const FieldSelect = partOf<JSX.SelectHTMLAttributes<HTMLSelectElement>>("field", "select");

export function Head(props: {
  component: string;
  variants: readonly string[];
  variant: Axis<string>;
  state: Axis<string | null>;
  assemblies: readonly PassportAssembly[];
  assembly: string;
  worn: string | null;
  records: readonly StoreRecord[] | undefined;
  failure: unknown;
  refusal: string | null;
  mode: SkinMode;
  onVariant: (variant: Axis<string>) => void;
  onState: (state: Axis<string | null>) => void;
  onAssembly: (assembly: string) => void;
  onWear: (name: string) => void;
  onTakeOff: () => void;
  onMode: (mode: SkinMode) => void;
}) {
  const choose = (value: string) => {
    if (value === "") props.onTakeOff();
    else props.onWear(value);
  };

  const trouble = (): string | null => {
    if (props.failure !== undefined) {
      return `${String((props.failure as Error).message)} · ${SERVICE_HINT}`;
    }

    // ТРЕТЬЕ состояние, и порядок здесь не случаен: службы нет — надевать нечего вообще, и об
    // этом говорят первым. Отказ надевания идёт следом: список пришёл, скин выбран, а вида нет —
    // без этой строки человек видел бы голый кит и ни слова о том, почему.
    if (props.refusal !== null) return props.refusal;

    return (props.records?.length ?? 0) === 0 ? `Скинов в службе нет · ${EMPTY_HINT}` : null;
  };

  return (
    <Surface as="header" data-variant="raised" style={{ display: "flex", "align-items": "center", "justify-content": "space-between", gap: "var(--space-4)" }}>
      {/* Слева — про ОДИН компонент: как его зовут и что из него показать. */}
      <div style={{ display: "flex", "align-items": "center", gap: "var(--space-3)" }}>
        <b>{props.component}</b>

        <Axes
          component={props.component}
          variants={props.variants}
          variant={props.variant}
          state={props.state}
          assemblies={props.assemblies}
          assembly={props.assembly}
          onVariant={props.onVariant}
          onState={props.onState}
          onAssembly={props.onAssembly}
        />
      </div>

      {/* Справа — про ВСЮ витрину: чем одето, в каком режиме, и куда перейти.
          РЕЖИМ ПОКАЗЫВАЕТСЯ ТОЛЬКО ПРИ НАДЕТОМ СКИНЕ. Светлая и тёмная половины — это половины
          СКИНА: цвет принадлежит одежде, а не тому, на что её надевают. Нет скина — переключать
          нечего, и кнопки режима были бы обещанием вида там, где вида нет.
          Что режим при этом всё равно меняет вид голого кита — вопрос основания, поднятый к
          архитектору: набор значений держит собственную тёмную пару и одевает приложение без
          скина. Мы этого не прячем и не обходим — мы просто не предлагаем человеку ручку,
          которой у витрины нет предмета. */}
      <div style={{ display: "flex", "align-items": "center", gap: "var(--space-3)" }}>
        <Show when={trouble()}>{(said) => <span>{said()}</span>}</Show>

        <Show when={props.worn !== null}>
          <div role="group" aria-label="Режим" style={{ display: "flex", gap: "var(--space-1)" }}>
            <For each={["light", "dark"] as const}>
              {(value) => (
                <Button
                  data-variant="tertiary"
                  data-pressed={props.mode === value ? "" : undefined}
                  aria-pressed={props.mode === value}
                  onClick={() => props.onMode(value)}
                >
                  {value === "light" ? "светлый" : "тёмный"}
                </Button>
              )}
            </For>
          </div>
        </Show>

        <Field>
          <FieldLabel>Скин</FieldLabel>
          <FieldSelect
            value={props.worn ?? ""}
            disabled={props.failure !== undefined || (props.records?.length ?? 0) === 0}
            onChange={(event) => choose(event.currentTarget.value)}
          >
            <option value="">без скина</option>
            <For each={props.records ?? []}>{(record) => <option value={record.name}>{record.label}</option>}</For>
          </FieldSelect>
        </Field>
      </div>
    </Surface>
  );
}
