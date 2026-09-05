import type { ESLint, Linter } from "eslint";
import babelParser from "@babel/eslint-parser";
import solid from "eslint-plugin-solid";

import { canonRules, companionRules, offRules, rules as canonAll } from "../engine/index.js";
import type { CanonRule } from "../engine/index.js";

/**
 * Опции конкретных правил `eslint-plugin-solid`, которых нет в каноне (канон — id + severity,
 * не формат опций движка). Сегодня ровно одна: `jsx-no-undef` отдаёт проверку известных имён
 * компилятору TS, и это включается опцией самого плагина.
 */
const ESLINT_RULE_OPTIONS: Readonly<Partial<Record<string, unknown>>> = Object.freeze({
  "jsx-no-undef": { typescriptEnabled: true },
});

/** Переводит канон в реальную запись `eslint-plugin-solid`: `id` → `solid/<id>`, severity → уровень ESLint. */
function toEslintRules(canonList: readonly CanonRule[]): Linter.RulesRecord {
  const out: Record<string, Linter.RuleEntry> = {};
  for (const rule of canonList) {
    const level = rule.severity === "off" ? "off" : "error";
    const options = ESLINT_RULE_OPTIONS[rule.id];
    out[`solid/${rule.id}`] = options ? [level, options] : level;
  }
  return out;
}

/** ESLint-запись канона — тем же делением, что и сам канон (`@web-core/lint`). */
export const canonRulesEslint: Linter.RulesRecord = toEslintRules(canonRules);
export const companionRulesEslint: Linter.RulesRecord = toEslintRules(companionRules);
export const offRulesEslint: Linter.RulesRecord = toEslintRules(offRules);
/** Полная ESLint-запись канона — отдаётся наружу, чтобы собрать свой конфиг вокруг того же канона. */
export const rules: Linter.RulesRecord = toEslintRules(canonAll);

/** Файлы без JSX: там угловые скобки — это TS-каст, а не элемент. */
const TS_FILES = ["**/*.{ts,mts,cts}"] as const;
/** Файлы с JSX. */
const TSX_FILES = ["**/*.{tsx,jsx,mjsx,cjsx}"] as const;
/** Все файлы пресета — на них навешиваются плагин и правила. */
const ALL_FILES = [...TS_FILES, ...TSX_FILES] as const;

/**
 * Разбор синтаксиса — Babel, а не `@typescript-eslint/parser`. Обоснование — FAQ.md.
 */
const babel = (jsx: boolean): Linter.LanguageOptions => ({
  parser: babelParser as Linter.Parser,
  ecmaVersion: "latest",
  sourceType: "module",
  parserOptions: {
    // Конфиг Babel у потребителя не ищем и не читаем: пресету нужен разбор, а не сборка,
    // и чужая настройка сборки не должна менять то, что видит линтер.
    requireConfigFile: false,
    babelOptions: {
      babelrc: false,
      configFile: false,
      parserOpts: { plugins: jsx ? ["typescript", "jsx"] : ["typescript"] },
    },
  },
});

export interface PresetOptions {
  /**
   * Что вывести из-под пресета. Пусто по умолчанию: игнор сборок и `node_modules` — дело
   * базового конфига потребителя, а не пресета правил.
   */
  readonly ignores?: readonly string[];
}

/**
 * ESLint-плагин канона `@web-core/lint` — сегодня единственная реализация, позже рядом
 * появится `./biome`. Возвращает МАССИВ flat-конфигов — плоский конфиг ESLint это массив,
 * поэтому пресет разворачивается в чужой спредом и может вырасти в новые секции, не меняя
 * вызов.
 *
 * Секций три: правила общие для всего кода, а `jsx` в разборе включается только там, где JSX
 * бывает — обоснование и граница `no-destructure` — FAQ.md.
 */
export function defineConfig(options: PresetOptions = {}): Linter.Config[] {
  const { ignores } = options;
  const withIgnores = <T extends Linter.Config>(config: T): T =>
    ignores ? { ...config, ignores: [...ignores] } : config;

  return [
    withIgnores({
      name: "@web-core/lint/eslint/rules",
      files: [...ALL_FILES],
      plugins: { solid: solid as unknown as ESLint.Plugin },
      rules: { ...rules },
    }),
    withIgnores({
      name: "@web-core/lint/eslint/parser-ts",
      files: [...TS_FILES],
      languageOptions: babel(false),
    }),
    withIgnores({
      name: "@web-core/lint/eslint/parser-jsx",
      files: [...TSX_FILES],
      languageOptions: babel(true),
    }),
  ];
}
