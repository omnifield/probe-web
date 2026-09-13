import jsonLogic from "json-logic-js";
import type { AdditionalOperation, RulesLogic } from "json-logic-js";
import { resolveDataBinding } from "@web-core/assembly";

/** Производное UI-состояние узла — не валидность: живёт на дереве композиции, не в io-схеме
 *  (Zod issue не умеет «спрячь ДРУГОЙ узел»). `vars` — те же пути, что `bind`, `when` — предикат
 *  JsonLogic поверх резолвленных значений. */
export interface NodeRule {
  readonly effect: "SHOW" | "HIDE" | "ENABLE" | "DISABLE";
  readonly vars: Readonly<Record<string, string>>;
  readonly when: RulesLogic<AdditionalOperation>;
}

export interface RuleEffect {
  readonly hidden?: boolean;
  readonly disabled?: boolean;
}

/**
 * Одно правило, локально — в отличие от валидности (один вызов на всю схему сборки), обхода
 * всего дерева не требует: у узла есть СВОЙ `rule`, `vars` резолвятся по данным сборки.
 */
export function evaluateRule(rule: NodeRule, data: unknown): RuleEffect {
  const vars = Object.fromEntries(
    Object.entries(rule.vars).map(([name, path]) => [name, resolveDataBinding(data, path)]),
  );
  const matched = Boolean(jsonLogic.apply(rule.when, vars));

  return {
    hidden: rule.effect === "HIDE" ? matched : rule.effect === "SHOW" ? !matched : undefined,
    disabled: rule.effect === "DISABLE" ? matched : rule.effect === "ENABLE" ? !matched : undefined,
  };
}
