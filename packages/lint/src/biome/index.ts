import { rules as styleCanon } from "../style/index.js";
import type { StyleCanonRule } from "../style/index.js";

/**
 * Один элемент `groups` у `organizeImports`: либо разделитель (пустая строка между блоками),
 * либо список matcher'ов Biome (`:NODE:`/`:PACKAGE:`/`:PATH:`, glob, `!`-негация) — импорты,
 * попавшие под один список, образуют один блок и сортируются внутри него сами.
 */
type ImportGroupEntry = ":BLANK_LINE:" | readonly string[];

/**
 * Включённая форма `organizeImports` — объектная, не булева `"on"`: нужны свои `groups`
 * (см. `IMPORT_GROUPS` ниже), а плоская форма их не принимает.
 */
interface OrganizeImportsOn {
  readonly level: "on";
  readonly options: { readonly groups: readonly ImportGroupEntry[] };
}

/**
 * Форма ровно тех секций `biome.json`, которые переводит этот канон — `formatter` и
 * `assist.actions.source.organizeImports`. Остальные секции (`linter`, `javascript`, …) не наша
 * забота: Biome здесь стоит за кодстиль/импорты, не за Solid-канон (см. ROADMAP.yaml,
 * `biome-for-style-not-reactivity`) — ESLint остаётся единственным движком той проверки.
 */
export interface BiomeConfig {
  readonly $schema: string;
  readonly formatter: {
    readonly enabled: boolean;
    readonly indentStyle: "space" | "tab";
    readonly indentWidth: number;
  };
  readonly assist: {
    readonly actions: { readonly source: { readonly organizeImports: OrganizeImportsOn | "off" } };
  };
  /**
   * Явно `false`: без этого поля Biome сам включает дефолтный `recommended`-линтер — набор
   * правил, которого канон кодстиля не заявлял и не проверял. Молчаливое включение чужого
   * набора нарушило бы контракт «канон — единственный источник правды о том, что проверяется».
   */
  readonly linter: { readonly enabled: false };
}

const BIOME_SCHEMA = "https://biomejs.dev/schemas/2.5.4/schema.json";

/**
 * `space`/`2` — не дефолт Biome (у него без этого поля TABS), а явное решение движка: весь
 * репозиторий сегодня на 2 пробелах (проверено: `.json`/`.ts` кита). Канон говорит только
 * «форматирование обязательно» (`formatting`, `severity: "required"`) — какой именно отступ,
 * решает движок, не канон, тем же разделением, что `ESLINT_RULE_OPTIONS` в `../eslint/index.ts`
 * держит опцию `jsx-no-undef` отдельно от семантики правила. Молчаливый дефолт здесь недопустим:
 * найдено натурным прогоном `biome check --write` — без этого поля весь кодстиль репозитория
 * тихо переехал бы на табы.
 */
const INDENT_STYLE = "space";
const INDENT_WIDTH = 2;

/**
 * Свои группы импортов, по прямой просьбе user (2026-09-16, изменено тем же днём с первой
 * версии — см. ROADMAP.yaml, `biome-import-groups-web-core-first`): голые имена (node +
 * обычные npm-пакеты) → любой `@`-scoped (наши `@web-core/*` и чужие вперемешку, не разведены
 * — первая версия отделяла `@web-core/*` отдельным блоком, эта нет) → `#`-алиасы (subpath
 * imports вида `#/entities/...`) → относительные пути. БЕЗ пустой строки между блоками —
 * одним куском, порядок задаёт только их взаимное расположение. Строка после последнего
 * импорта перед кодом — ровно одна: это уже формат Biome в принципе не даёт настроить (проверено
 * натурно — 2 пустые строки на входе схлопывает в 1), не решение канона.
 *
 * Натурный прогон (Biome 2.5.13): фикстура node:fs/solid-js/zod/@tanstack/@web-core/io/
 * @web-core/ui/#-алиас/относительный даёт ровно эти четыре блока подряд без пустых строк
 * внутри — см. `test/biome.test.ts`.
 */
const IMPORT_GROUPS: readonly ImportGroupEntry[] = [
  [":NODE:", ":PACKAGE:", "!@*/**", "!#*/**"],
  ["@*/**"],
  ["#*/**"],
  [":PATH:"],
];

function isRequired(canonList: readonly StyleCanonRule[], id: string): boolean {
  return canonList.some((rule) => rule.id === id && rule.severity === "required");
}

/**
 * Переводит канон кодстиля в `biome.json`: `id` канона → включённая секция, тем же приёмом
 * документирования, что `../eslint/index.ts` (канон — единственный источник правды о том, что
 * вообще проверяется; конкретные настройки формата — дело Biome, не канона).
 *
 * В отличие от `defineConfig()` у `./eslint`, этот объект НЕ читает сам Biome — `biome.json`
 * обязан быть статическим JSON-файлом на диске, импортировать в него JS-функцию нельзя (Biome
 * не поддерживает исполняемый конфиг, в отличие от flat-конфига ESLint). Поэтому функция —
 * источник данных, а реальный артефакт для потребителя — `dist/biome/biome.json`,
 * материализуемый из неё сборкой (`scripts/generate-biome-json.mjs`); потребитель подключает
 * канон через `extends` в своём `biome.json`, не через импорт этой функции.
 */
export function defineBiomeConfig(): BiomeConfig {
  return {
    $schema: BIOME_SCHEMA,
    formatter: {
      enabled: isRequired(styleCanon, "formatting"),
      indentStyle: INDENT_STYLE,
      indentWidth: INDENT_WIDTH,
    },
    assist: {
      actions: {
        source: {
          organizeImports: isRequired(styleCanon, "organized-imports")
            ? { level: "on", options: { groups: IMPORT_GROUPS } }
            : "off",
        },
      },
    },
    linter: { enabled: false },
  };
}
