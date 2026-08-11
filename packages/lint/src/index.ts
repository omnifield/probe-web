import type { ESLint, Linter } from "eslint";
import babelParser from "@babel/eslint-parser";
import solid from "eslint-plugin-solid";

import { rules } from "./rules.js";

export { canonRules, companionRules, offRules, rules } from "./rules.js";

/** Файлы без JSX: там угловые скобки — это TS-каст, а не элемент. */
const TS_FILES = ["**/*.{ts,mts,cts}"] as const;
/** Файлы с JSX. */
const TSX_FILES = ["**/*.{tsx,jsx,mjsx,cjsx}"] as const;
/** Все файлы пресета — на них навешиваются плагин и правила. */
const ALL_FILES = [...TS_FILES, ...TSX_FILES] as const;

/**
 * Разбор синтаксиса — Babel, а не `@typescript-eslint/parser`.
 *
 * Причина названа рынком прямым текстом: `@typescript-eslint/parser@8.66.0` (последний на
 * 2026-08-08) при старте бросает «typescript-eslint does not support TS 7.0» и предлагает
 * держать рядом TS 6 — проверено на этом пакете 2026-08-08, продукт стоит на TS 7.0.2.
 * Поддержка TS 7 у них открытым вопросом (`typescript-eslint#10940`, последнее движение
 * 2026-07-09). Ставить вторую копию компилятора ради линтера — подпорка, а не решение.
 *
 * Причина глубже версий: **линтеру здесь не нужны типы.** Ни одно правило
 * `eslint-plugin-solid` не спрашивает у компилятора тип — им хватает синтаксиса. Babel
 * разбирает TS и JSX как СИНТАКСИС, компилятор для этого не нужен вовсе, поэтому пресет
 * вообще не зависит от версии TypeScript и не может от неё сломаться. Сам плагин держит
 * оба парсера — его тестовая матрица гоняет и babel, и ts (`PARSER=all`).
 *
 * Плагины парсера перечислены явным `parserOpts.plugins`, а не пресетом
 * `@babel/preset-typescript`: `@babel/eslint-parser@8` собирает список плагинов ровно
 * отсюда (`configuration-shared.js`, `getParserPlugins`), пресеты в него не разворачиваются —
 * проверено 2026-08-08, с пресетом файл падает на `import { type JSX }`.
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
 * Пресет ESLint: канон Solid, выраженный машиной.
 *
 * Возвращает МАССИВ flat-конфигов — плоский конфиг ESLint это массив, поэтому пресет
 * разворачивается в чужой спредом и может вырасти в новые секции, не меняя вызов.
 *
 * Секций три, и это не дробление ради красоты: правила общие для всего кода, а вот `jsx`
 * в разборе включается только там, где JSX бывает. Включи его в `.ts` — и `<T>value`
 * (угловой каст) перестанет разбираться, то есть пресет начнёт давать ложные ошибки
 * парсера на законном TS. Ложная ошибка хуже пропущенной.
 *
 * Область по расширениям — часть контракта пресета, а не настройка: на ней завязан разбор.
 * Нужно уже своё — секция потребителя ниже по массиву переопределяет что угодно.
 *
 * Уровень всех включённых правил — `error`; почему без ручки «понизить», написано в
 * `rules.ts` и в README.
 */
export function defineConfig(options: PresetOptions = {}): Linter.Config[] {
  const { ignores } = options;
  const withIgnores = <T extends Linter.Config>(config: T): T =>
    ignores ? { ...config, ignores: [...ignores] } : config;

  return [
    withIgnores({
      name: "@omnifield/probe-web-lint/rules",
      files: [...ALL_FILES],
      plugins: { solid: solid as unknown as ESLint.Plugin },
      rules: { ...rules },
    }),
    withIgnores({
      name: "@omnifield/probe-web-lint/parser-ts",
      files: [...TS_FILES],
      languageOptions: babel(false),
    }),
    withIgnores({
      name: "@omnifield/probe-web-lint/parser-jsx",
      files: [...TSX_FILES],
      languageOptions: babel(true),
    }),
  ];
}
