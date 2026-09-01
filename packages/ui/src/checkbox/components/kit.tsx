import {
  CheckboxControl as ArkControl,
  CheckboxHiddenInput as ArkHiddenInput,
  CheckboxIndicator as ArkIndicator,
  CheckboxLabel as ArkLabel,
  CheckboxRoot as ArkRoot,
  type CheckboxControlProps as ArkControlProps,
  type CheckboxHiddenInputProps as ArkHiddenInputProps,
  type CheckboxIndicatorProps as ArkIndicatorProps,
  type CheckboxLabelProps as ArkLabelProps,
  type CheckboxRootProps as ArkRootProps,
} from "@ark-ui/solid/checkbox";

import { splitProps } from "solid-js";

import { dropAddress } from "../../utils/slot-chain.js";
import { traceLife } from "../../utils/trace.js";

// Чекбокс — первый компонент ФОРМЫ, из Ark (`PWEB-114`).
//
// Тем же приёмом, что гармошка: анатомия чужая, адрес ставит сам Ark (спредит `parts.*.attrs`
// внутри `getXxxProps()`, `checkbox.connect.mjs`), обёртки — тонкие, `dropAddress` снимает
// адрес, случайно пришедший СНАРУЖИ (руками или из внешнего звена композиции), чтобы узел не
// соврал о том, чем является (`PWEB-46`).
//
// Скрытый ввод остаётся в документе ради фокуса, формы и скринридера, но своего адреса не
// несёт — паспорт объясняет это в `../entity/passport.ts`, здесь же его просто пропускают насквозь.

/** Пропсы `Checkbox` — корня. */
export type CheckboxProps = ArkRootProps;

/**
 * Корень чекбокса — узел `<label>` плюс контекст своих частей.
 *
 * Держит отмеченность (`checked` / `defaultChecked` / `onCheckedChange`), которая бывает и
 * `"indeterminate"` — отмечен отчасти.
 *
 * Несёт свой скрытый настоящий `<input type="checkbox">` (постановка user, 2026-09-01, README
 * «`extras` — проверка по всему киту: кейса не нашлось ни одного») — он не берёт от сборки НИ
 * ОДНОГО поля, только контекст, который уже поднял этот же корень, поэтому кладётся сюда сам,
 * потребителю его добавлять не нужно.
 *
 * @example
 * ```tsx
 * <Checkbox>
 *   <CheckboxControl>
 *     <CheckboxIndicator>✓</CheckboxIndicator>
 *   </CheckboxControl>
 *   <CheckboxLabel>Согласен с условиями</CheckboxLabel>
 * </Checkbox>
 * ```
 */
export function Checkbox(props: CheckboxProps) {
  traceLife("ui.checkbox");

  const [local, rest] = splitProps(props, ["children"]);

  return (
    <ArkRoot {...dropAddress(rest)}>
      {local.children}
      <ArkHiddenInput />
    </ArkRoot>
  );
}

/** Пропсы `CheckboxControl`. */
export type CheckboxControlProps = ArkControlProps;

/** Управляющая рамка — ОДИН узел, видимый квадрат для указателя отметки. */
export function CheckboxControl(props: CheckboxControlProps) {
  traceLife("ui.checkbox-control");

  return <ArkControl {...dropAddress(props)} />;
}

/** Пропсы `CheckboxIndicator`. */
export type CheckboxIndicatorProps = ArkIndicatorProps;

/**
 * Указатель отметки — ОДИН узел, спрятанный китом, когда чекбокс не отмечен и не «отчасти».
 *
 * Галочку или черту кладёт внутрь потребитель: своей графики кит не привозит, тем же приёмом,
 * что указатель раскрытия у гармошки.
 */
export function CheckboxIndicator(props: CheckboxIndicatorProps) {
  traceLife("ui.checkbox-indicator");

  return <ArkIndicator {...dropAddress(props)} />;
}

/** Пропсы `CheckboxLabel`. */
export type CheckboxLabelProps = ArkLabelProps;

/** Подпись чекбокса — ОДИН узел `<span>`. */
export function CheckboxLabel(props: CheckboxLabelProps) {
  traceLife("ui.checkbox-label");

  return <ArkLabel {...dropAddress(props)} />;
}

/** Пропсы `CheckboxHiddenInput`. */
export type CheckboxHiddenInputProps = ArkHiddenInputProps;

/**
 * Скрытый настоящий `<input type="checkbox">` — ради фокуса, формы и скринридера.
 *
 * Адреса не несёт (`../entity/passport.ts`, «Скрытый ввод — без адреса»): часть, которую
 * поставщик не адресовал, не адресуема ничем. `Checkbox` (выше) уже кладёт один такой сам —
 * этот экспорт остаётся для ручной композиции вне сборки, не для повторного использования рядом.
 */
export function CheckboxHiddenInput(props: CheckboxHiddenInputProps) {
  traceLife("ui.checkbox-hidden-input");

  return <ArkHiddenInput {...dropAddress(props)} />;
}

// КАРТА чекбокса: часть паспорта → компонент, которым она рисуется (`PWEB-84`, `PWEB-114`).

import { defineKitComponent } from "../../kit-form.js";
import { passport } from "../entity/passport.js";

/**
 * Паспорт чекбокса вместе с тем, чем рисуется каждая его часть.
 *
 * НЕТ `hiddenInput` в карте (постановка user, 2026-09-01, README «`extras` — проверка по всему
 * киту: кейса не нашлось ни одного») — он не берёт от сборки данных, `Checkbox` кладёт его сам,
 * схема его нигде не адресует.
 */
export const kit = defineKitComponent(passport, {
  root: Checkbox,
  control: CheckboxControl,
  indicator: CheckboxIndicator,
  label: CheckboxLabel,
});
