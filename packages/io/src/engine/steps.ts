// см. README.md / FAQ.md — закрытый набор Step; причина неудачи возвращается, а не бросается.
import { lookup, type FieldRef } from "./paths.js";

export type StepKind =
  | "trim"
  | "lower"
  | "upper"
  | "concat"
  | "split"
  | "replace"
  | "number"
  | "multiply"
  | "divide"
  | "round"
  | "date"
  | "bool"
  | "dictionary"
  | "coalesce"
  | "default"
  | "constant";

export interface TrimStep {
  kind: "trim";
}

export interface CaseStep {
  kind: "lower" | "upper";
}

export interface ConcatStep {
  kind: "concat";
  parts: Array<{ from?: FieldRef; text?: string }>;
  separator?: string;
}

export interface SplitStep {
  kind: "split";
  separator: string;
  /** Номер куска с нуля; отрицательный — с конца. */
  take: number;
}

export interface ReplaceStep {
  kind: "replace";
  find: string;
  with: string;
}

export interface NumberStep {
  kind: "number";
}

export interface ScaleStep {
  kind: "multiply" | "divide";
  by: number;
}

export interface RoundStep {
  kind: "round";
  digits?: number;
}

export interface DateStep {
  kind: "date";
  from?: "iso" | "dmy" | "unix" | "unix-ms";
}

export interface BoolStep {
  kind: "bool";
}

export interface DictionaryStep {
  kind: "dictionary";
  values: Record<string, string>;
  otherwise?: "keep" | "fail";
}

export interface CoalesceStep {
  kind: "coalesce";
  from: FieldRef[];
}

export interface DefaultStep {
  kind: "default";
  value: string;
}

export interface ConstantStep {
  kind: "constant";
  value: string;
}

export type Step =
  | TrimStep
  | CaseStep
  | ConcatStep
  | SplitStep
  | ReplaceStep
  | NumberStep
  | ScaleStep
  | RoundStep
  | DateStep
  | BoolStep
  | DictionaryStep
  | CoalesceStep
  | DefaultStep
  | ConstantStep;

/** Предел длины цепочки — не про безопасность выражений (действия объявлены), а про опечатку в чужом файле. */
export const MAX_STEPS = 32;

export type StepResult = { ok: true; value: unknown } | { ok: false; reason: string };

/** Пусто — нет значения, `null`, пустая строка или пробелы, пустой массив. */
export function isBlank(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "") ||
    (Array.isArray(value) && value.length === 0)
  );
}

const DMY = /^(\d{2})\.(\d{2})\.(\d{4})$/;

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value.replaceAll(/\s/g, "").replace(",", "."));
  return Number.isNaN(parsed) ? null : parsed;
}

function readFrom(source: unknown, path: FieldRef): unknown {
  const found = lookup(source, path);
  return found.found ? found.value : undefined;
}

/** Выполнить ОДНО действие. */
export function runStep(step: Step, value: unknown, source: unknown): StepResult {
  switch (step.kind) {
    case "trim":
      return { ok: true, value: isBlank(value) ? value : String(value).trim() };

    case "lower":
      return { ok: true, value: isBlank(value) ? value : String(value).toLowerCase() };

    case "upper":
      return { ok: true, value: isBlank(value) ? value : String(value).toUpperCase() };

    case "concat": {
      const pieces = [
        ...(isBlank(value) ? [] : [String(value)]),
        ...step.parts.map((part) =>
          part.text !== undefined ? part.text : part.from === undefined ? "" : readFrom(source, part.from),
        ),
      ];
      const kept = pieces.filter((piece) => !isBlank(piece)).map((piece) => String(piece));
      if (kept.length === 0) return { ok: false, reason: "склеивать нечего" };
      return { ok: true, value: kept.join(step.separator ?? " ") };
    }

    case "split": {
      if (isBlank(value)) return { ok: false, reason: "резать нечего" };
      const parts = String(value).split(step.separator);
      const index = step.take < 0 ? parts.length + step.take : step.take;
      const piece = parts[index];
      if (piece === undefined) return { ok: false, reason: `куска №${step.take} нет` };
      return { ok: true, value: piece };
    }

    case "replace":
      return {
        ok: true,
        value: isBlank(value) ? value : String(value).replaceAll(step.find, step.with),
      };

    case "number": {
      const number = toNumber(value);
      return number === null ? { ok: false, reason: "не число" } : { ok: true, value: number };
    }

    case "multiply":
    case "divide": {
      const number = toNumber(value);
      if (number === null) return { ok: false, reason: "не число" };
      if (step.kind === "divide" && step.by === 0) return { ok: false, reason: "деление на ноль" };
      return { ok: true, value: step.kind === "multiply" ? number * step.by : number / step.by };
    }

    case "round": {
      const number = toNumber(value);
      if (number === null) return { ok: false, reason: "не число" };
      const factor = 10 ** (step.digits ?? 0);
      return { ok: true, value: Math.round(number * factor) / factor };
    }

    case "date": {
      if (isBlank(value)) return { ok: false, reason: "даты нет" };
      const from = step.from ?? "iso";

      let time: number;
      if (from === "unix" || from === "unix-ms") {
        const number = toNumber(value);
        if (number === null) return { ok: false, reason: "не число" };
        time = from === "unix" ? number * 1000 : number;
      } else if (from === "dmy") {
        const parts = DMY.exec(String(value).trim());
        if (!parts) return { ok: false, reason: "не дата вида дд.мм.гггг" };
        time = Date.parse(`${parts[3]}-${parts[2]}-${parts[1]}T00:00:00Z`);
      } else {
        time = Date.parse(String(value));
      }

      if (Number.isNaN(time)) return { ok: false, reason: "не дата" };
      return { ok: true, value: new Date(time).toISOString() };
    }

    case "bool": {
      if (typeof value === "boolean") return { ok: true, value };
      const text = String(value).trim().toLowerCase();
      if (["true", "да", "1", "yes", "y"].includes(text)) return { ok: true, value: true };
      if (["false", "нет", "0", "no", "n"].includes(text)) return { ok: true, value: false };
      return { ok: false, reason: "не да и не нет" };
    }

    case "dictionary": {
      const key = isBlank(value) ? "" : String(value);
      const mapped = step.values[key];
      if (mapped !== undefined) return { ok: true, value: mapped };
      return (step.otherwise ?? "keep") === "keep" ? { ok: true, value } : { ok: false, reason: "нет в словаре" };
    }

    case "coalesce": {
      for (const path of step.from) {
        const candidate = readFrom(source, path);
        if (!isBlank(candidate)) return { ok: true, value: candidate };
      }
      return isBlank(value) ? { ok: false, reason: "все перечисленные поля пусты" } : { ok: true, value };
    }

    case "default":
      return { ok: true, value: isBlank(value) ? step.value : value };

    case "constant":
      return { ok: true, value: step.value };
  }
}

/** Выполнить цепочку. Обрывается на первой неудаче — дальше считать не по чему. */
export function runSteps(steps: readonly Step[], value: unknown, source: unknown): StepResult {
  if (steps.length > MAX_STEPS) {
    return { ok: false, reason: `шагов больше ${MAX_STEPS} — цепочка не выполняется` };
  }

  let current: unknown = value;
  for (const [index, step] of steps.entries()) {
    const result = runStep(step, current, source);
    if (!result.ok) return { ok: false, reason: `шаг ${index + 1} (${step.kind}): ${result.reason}` };
    current = result.value;
  }

  return { ok: true, value: current };
}
