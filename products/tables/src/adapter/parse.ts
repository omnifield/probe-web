// Чтение файла адаптера с границы.
//
// Файл ПОДМЕНЯЕМЫЙ и приходит из-за границы всегда — из пульта, с сервера, из чужих рук.
// Значит проверяется целиком и с адресом: «правило №2, шаг 3: неизвестное действие». Молчать
// про испорченный файл нельзя: адаптер стоит на входе, и его ошибка выглядит как «данные
// пропали», а не как «файл кривой».
//
// Версия формата — с первого дня и по той же причине, что у фильтра и вида: собранные людьми
// файлы переживут любую нашу правку, и однажды их придётся прочитать старыми.

import {
  ADAPTER_FORMAT_VERSION,
  type AdapterSpec,
  type FieldRule,
  MAX_STEPS,
  type OnFail,
  type Step,
  type StepKind,
} from "./model.js";
import { isFieldRef } from "./paths.js";

export type ParsedAdapter = { ok: true; spec: AdapterSpec } | { ok: false; error: string };

const STEPS = new Set<string>([
  "trim",
  "lower",
  "upper",
  "concat",
  "split",
  "replace",
  "number",
  "multiply",
  "divide",
  "round",
  "date",
  "bool",
  "dictionary",
  "coalesce",
  "default",
  "constant",
]);

const ON_FAIL = new Set<string>(["skip", "default", "reject"]);
const DATE_FROM = new Set<string>(["iso", "dmy", "unix", "unix-ms"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isText(value: unknown): value is string {
  return typeof value === "string";
}

function parseStep(input: unknown, where: string): Step | string {
  if (!isObject(input)) return `${where}: шаг должен быть объектом`;

  const kind = input["kind"];
  if (!isText(kind) || !STEPS.has(kind)) return `${where}: неизвестное действие «${String(kind)}»`;

  switch (kind as StepKind) {
    case "trim":
    case "lower":
    case "upper":
    case "number":
    case "bool":
      return { kind } as Step;

    case "concat": {
      const parts = input["parts"];
      if (!Array.isArray(parts) || parts.length === 0) {
        return `${where}: у склейки должен быть непустой список кусков`;
      }
      const kept: Array<{ from?: string; text?: string }> = [];
      for (const part of parts) {
        if (!isObject(part)) return `${where}: кусок склейки должен быть объектом`;
        const from = part["from"];
        const text = part["text"];
        if (from !== undefined && (!isText(from) || !isFieldRef(from))) {
          return `${where}: «${String(from)}» — не путь вида «/имя»`;
        }
        if (text !== undefined && !isText(text)) return `${where}: постоянный кусок должен быть строкой`;
        if (from === undefined && text === undefined) return `${where}: кусок склейки пуст`;
        kept.push({ ...(isText(from) ? { from } : {}), ...(isText(text) ? { text } : {}) });
      }
      const separator = input["separator"];
      if (separator !== undefined && !isText(separator)) return `${where}: разделитель должен быть строкой`;
      return { kind: "concat", parts: kept, ...(isText(separator) ? { separator } : {}) };
    }

    case "split": {
      const separator = input["separator"];
      const take = input["take"];
      if (!isText(separator) || separator === "") return `${where}: у разреза нужен разделитель`;
      if (typeof take !== "number" || !Number.isInteger(take)) return `${where}: номер куска — целое число`;
      return { kind: "split", separator, take };
    }

    case "replace": {
      const find = input["find"];
      const to = input["with"];
      if (!isText(find) || find === "") return `${where}: у замены нужен искомый кусок`;
      if (!isText(to)) return `${where}: замена должна быть строкой`;
      return { kind: "replace", find, with: to };
    }

    case "multiply":
    case "divide": {
      const by = input["by"];
      if (typeof by !== "number" || !Number.isFinite(by)) return `${where}: множитель должен быть числом`;
      return { kind: kind as "multiply" | "divide", by };
    }

    case "round": {
      const digits = input["digits"];
      if (digits !== undefined && (typeof digits !== "number" || !Number.isInteger(digits))) {
        return `${where}: число знаков — целое`;
      }
      return { kind: "round", ...(typeof digits === "number" ? { digits } : {}) };
    }

    case "date": {
      const from = input["from"];
      if (from !== undefined && (!isText(from) || !DATE_FROM.has(from))) {
        return `${where}: неизвестный вид даты «${String(from)}»`;
      }
      return { kind: "date", ...(isText(from) ? { from: from as "iso" | "dmy" | "unix" | "unix-ms" } : {}) };
    }

    case "dictionary": {
      const values = input["values"];
      if (!isObject(values)) return `${where}: словарь должен быть объектом`;
      const pairs: Record<string, string> = {};
      for (const [key, value] of Object.entries(values)) {
        if (!isText(value)) return `${where}: значение словаря у «${key}» должно быть строкой`;
        pairs[key] = value;
      }
      const otherwise = input["otherwise"];
      if (otherwise !== undefined && otherwise !== "keep" && otherwise !== "fail") {
        return `${where}: неизвестное поведение вне словаря «${String(otherwise)}»`;
      }
      return {
        kind: "dictionary",
        values: pairs,
        ...(otherwise === "keep" || otherwise === "fail" ? { otherwise } : {}),
      };
    }

    case "coalesce": {
      const from = input["from"];
      if (!Array.isArray(from) || from.length === 0) return `${where}: нужен непустой список путей`;
      for (const path of from) {
        if (!isText(path) || !isFieldRef(path)) return `${where}: «${String(path)}» — не путь вида «/имя»`;
      }
      return { kind: "coalesce", from: [...(from as string[])] };
    }

    case "default":
    case "constant": {
      const value = input["value"];
      if (!isText(value)) return `${where}: значение должно быть строкой`;
      return { kind: kind as "default" | "constant", value };
    }
  }
}

function parseRule(input: unknown, index: number): FieldRule | string {
  const where = `правило №${index + 1}`;
  if (!isObject(input)) return `${where}: должно быть объектом`;

  const target = input["target"];
  if (!isText(target) || !isFieldRef(target) || target === "") {
    return `${where}: цель «${String(target)}» — не путь вида «/имя»`;
  }

  const from = input["from"];
  if (from !== undefined && (!isText(from) || !isFieldRef(from))) {
    return `${where}: источник «${String(from)}» — не путь вида «/имя»`;
  }

  const rawSteps = input["steps"];
  const steps: Step[] = [];
  if (rawSteps !== undefined) {
    if (!Array.isArray(rawSteps)) return `${where}: шаги должны быть массивом`;
    if (rawSteps.length > MAX_STEPS) return `${where}: шагов больше ${MAX_STEPS}`;
    for (const [at, raw] of rawSteps.entries()) {
      const step = parseStep(raw, `${where}, шаг ${at + 1}`);
      if (typeof step === "string") return step;
      steps.push(step);
    }
  }

  const onFail = input["onFail"];
  if (onFail !== undefined && (!isText(onFail) || !ON_FAIL.has(onFail))) {
    return `${where}: неизвестное поведение при неудаче «${String(onFail)}»`;
  }

  const fallback = input["fallback"];
  if (fallback !== undefined && !isText(fallback)) return `${where}: умолчание должно быть строкой`;
  if (onFail === "default" && fallback === undefined) {
    // Иначе «подставить умолчание» молча превращается в «пропустить», и человек об этом
    // не узнает: настроил одно, получил другое.
    return `${where}: выбрано «подставить умолчание», но само умолчание не задано`;
  }

  if (from === undefined && steps.length === 0) {
    return `${where}: нечего брать — нет ни источника, ни действий`;
  }

  return {
    target,
    ...(isText(from) ? { from } : {}),
    ...(steps.length > 0 ? { steps } : {}),
    ...(isText(onFail) ? { onFail: onFail as OnFail } : {}),
    ...(isText(fallback) ? { fallback } : {}),
  };
}

/** Прочитать файл адаптера. Ошибка — строкой с адресом, а не исключением. */
export function parseAdapter(input: unknown): ParsedAdapter {
  if (!isObject(input)) return { ok: false, error: "адаптер должен быть объектом" };

  const version = input["version"];
  if (version !== ADAPTER_FORMAT_VERSION) {
    return {
      ok: false,
      error:
        version === undefined
          ? "у адаптера нет версии формата — прочитать его нечем"
          : `версия формата ${String(version)} не поддерживается, нужна ${ADAPTER_FORMAT_VERSION}`,
    };
  }

  const rows = input["rows"];
  if (!isText(rows) || !isFieldRef(rows)) {
    return { ok: false, error: `путь к набору строк «${String(rows)}» — не путь вида «/имя»` };
  }

  const rawFields = input["fields"];
  if (!Array.isArray(rawFields)) return { ok: false, error: "правила должны быть массивом" };

  const fields: FieldRule[] = [];
  const targets = new Set<string>();

  for (const [index, raw] of rawFields.entries()) {
    const rule = parseRule(raw, index);
    if (typeof rule === "string") return { ok: false, error: rule };
    // Два правила на одно поле — противоречие: какое главнее, сказать нечем, и второе молча
    // затирало бы первое.
    if (targets.has(rule.target)) {
      return { ok: false, error: `правило №${index + 1}: поле «${rule.target}» уже заполняется выше` };
    }
    targets.add(rule.target);
    fields.push(rule);
  }

  const extra = input["extra"];
  if (extra !== undefined && extra !== "drop" && extra !== "keep") {
    return { ok: false, error: `неизвестное поведение с лишними полями «${String(extra)}»` };
  }

  const label = input["label"];
  if (label !== undefined && !isText(label)) return { ok: false, error: "название должно быть строкой" };

  return {
    ok: true,
    spec: {
      version: ADAPTER_FORMAT_VERSION,
      ...(isText(label) ? { label } : {}),
      rows,
      fields,
      ...(extra === "keep" || extra === "drop" ? { extra } : {}),
    },
  };
}

/** Отдать адаптер наружу копией — тем же, чем его прочитают обратно. */
export function serializeAdapter(spec: AdapterSpec): AdapterSpec {
  return JSON.parse(JSON.stringify(spec)) as AdapterSpec;
}
