import {
  createContext,
  createMemo,
  untrack,
  useContext,
  type Accessor,
  type JSX,
  type ParentProps,
} from "solid-js";
import { isContent, type AssemblyNode, type AssemblyTree } from "@web-core/assembly";
import type { z } from "@web-core/io";

import { evaluateRule, type NodeRule, type RuleEffect } from "../engine/rules.js";
import type { ValidationIssue } from "../engine/validate.js";
import { createValidationConnection, type ValidationConnection } from "./connection.js";

const ValidationContext = createContext<ValidationConnection>();

export interface ValidationProviderProps extends ParentProps {
  readonly tree: AssemblyTree;
  readonly schema: z.ZodType;
  readonly data: Accessor<unknown>;
}

/** Заводит `ValidationConnection` на поддерево — тем же приёмом, что `SkinProvider`
 *  (`packages/skin/src/solid/provider.tsx`). */
export function ValidationProvider(props: ValidationProviderProps): JSX.Element {
  const connection = createValidationConnection(
    untrack(() => props.tree),
    untrack(() => props.schema),
    untrack(() => props.data),
  );
  return <ValidationContext.Provider value={connection}>{props.children}</ValidationContext.Provider>;
}

/** Значение ближайшего `ValidationProvider` — `undefined` вне него, НЕ кидает: компонент кита
 *  обязан работать и без валидации в дереве (тот же приём, что `useComponentSkin`'s no-op). */
export function useValidation(): ValidationConnection | undefined {
  return useContext(ValidationContext);
}

/** Issues по ОДНОМУ пути — параллель `useComponentSkinData(component)`. */
export function useIssuesAt(path: string): Accessor<readonly ValidationIssue[] | undefined> {
  const value = useContext(ValidationContext);
  const issues = createMemo(() => value?.issuesByPath()[path]);
  return issues;
}

export interface ComponentValidation extends RuleEffect {
  readonly invalid?: boolean;
  readonly errorText?: string;
}

/**
 * Путь узла-значения — тот путь, что резолвится под ЕДИНСТВЕННЫМ ключом `bind`, каким бы ни было
 * имя пропа: `Field` бинжен как `{value: path}`, `Checkbox` (`@ark-ui/solid`, чужой проп — не
 * `value`, а `checked`) — как `{checked: path}`. Читать конкретно `bind.value` — предполагать имя
 * пропа, которого для чекбокса просто нет: `bind.value` для такого узла всегда `undefined`, узел
 * никогда не получил бы свои issues, хотя формально забинжен. Один ключ в `bind` — однозначно та
 * самая точка данных, которую узел показывает; несколько ключей — какой из них "то самое
 * значение" неоднозначно и без ответа от `passport-validation-field-open-question` (какой пропс
 * компонент считает своим редактируемым значением) не разрешить — не гадаем, отдаём `undefined`.
 */
function ownValuePathOf(node: AssemblyNode | undefined): string | undefined {
  if (!node || isContent(node) || !node.bind) return undefined;
  const paths = Object.values(node.bind);
  return paths.length === 1 ? paths[0] : undefined;
}

/**
 * Внутренний хук для `useKitLife`-fold-in (cross-zone, `kit-life-validation-fold-in`) — НЕ
 * отдельный вызов рядом, компонент кита зовёт его изнутри своего `useKitLife`.
 *
 * Свой путь узнаёт НЕ из пропов компонента: `resolveBind`
 * (`packages/assembly/src/render/props.ts`) резолвит `bind` в готовое значение до рендера, путь
 * потребляется и выбрасывается. Вместо этого — `props["data-node"]` (id узла, реально доезжает
 * как обычный проп, `render-node.tsx`) лукапится в `tree`, который провайдер держит целиком, и
 * путь берётся оттуда (`ownValuePathOf` — единственный `bind`, не жёстко `.value`).
 *
 * `rule`, в отличие от `bind`, доезжает до компонента как есть (`props.meta?.rule`,
 * `render-node.tsx` прокидывает `meta` пропом) — второго лукапа не нужно.
 */
export function useComponentValidation(
  _passport: unknown,
  props: object,
): Accessor<ComponentValidation | undefined> {
  const value = useContext(ValidationContext);
  if (!value) return () => undefined;

  const validation = createMemo(() => {
    const record = props as Record<string, unknown>;
    const nodeId = record["data-node"] as string | undefined;
    const node = nodeId ? value.tree.components.nodes[nodeId] : undefined;
    const path = ownValuePathOf(node);
    const issues = path ? value.issuesByPath()[path] : undefined;

    const rule = (record.meta as { rule?: NodeRule } | undefined)?.rule;
    const effect: RuleEffect = rule ? evaluateRule(rule, value.data()) : {};

    return {
      invalid: (issues?.length ?? 0) > 0,
      errorText: issues?.[0]?.message,
      ...effect,
    };
  });
  return validation;
}

/** Агрегат по ВСЕМУ дереву, не по пути — параллель `useOutfitData()`. Отвечает на «кто скажет
 *  кнопке не нажиматься»: кнопке не нужен свой `bind`-путь, ей нужен этот хук. */
export function useFormValid(): Accessor<boolean> {
  const value = useContext(ValidationContext);
  const valid = createMemo(() => Object.values(value?.issuesByPath() ?? {}).every((list) => list.length === 0));
  return valid;
}
