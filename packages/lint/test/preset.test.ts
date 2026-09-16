import { fileURLToPath } from "node:url";
import { ESLint, type Linter } from "eslint";
import solid from "eslint-plugin-solid";
import { describe, expect, it } from "vitest";

import { canonRulesEslint, defineConfig, offRulesEslint, rules } from "../src/eslint/index.js";
import {
  canonRules as canonData,
  companionRules as companionData,
  offRules as offData,
  rules as canonAll,
} from "../src/solid/index.js";

const fixtures = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

/**
 * ESLint поднимается ровно так, как его поднимет потребитель: настоящий движок, настоящие
 * файлы с диска. `overrideConfigFile: true` отключает поиск конфига в дереве — иначе тест
 * зависел бы от того, что лежит выше по репозиторию.
 */
const lint = async (dir: string, config = defineConfig()) => {
  const eslint = new ESLint({
    cwd: fixtures(""),
    overrideConfigFile: true,
    overrideConfig: config,
    // Без этого ESLint на явно переданный, но исключённый файл отвечает служебным
    // предупреждением — оно бы читалось как срабатывание правила.
    warnIgnored: false,
  });

  return eslint.lintFiles([fixtures(dir)]);
};

/**
 * Правила, сработавшие в файле, вместе с уровнем — перечнем, а не «сколько ошибок».
 * Сообщения без правила разведены: `<parse>` — падение разбора, `<eslint>` — служебное
 * сообщение самого движка. Свалить их в одно значило бы принять поломку парсера за норму.
 */
const reported = (result: ESLint.LintResult) =>
  result.messages
    .map((m) => `${m.fatal ? "<parse>" : (m.ruleId ?? "<eslint>")}:${m.severity}`)
    .sort();

describe("канон Solid — данные, независимо от движка (`../src/solid/index.js`)", () => {
  it("три списка заморожены и не пересекаются по id", () => {
    for (const list of [canonData, companionData, offData]) {
      expect(Object.isFrozen(list)).toBe(true);
    }
    const ids = [...canonData, ...companionData, ...offData].map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("полная карта канона — это ровно три списка вместе", () => {
    expect(canonAll).toHaveLength(canonData.length + companionData.length + offData.length);
  });
});

describe("фикстуры-нарушения ловятся именно тем правилом, ради которого написаны", () => {
  const cases = [
    ["reactivity.tsx", "solid/reactivity"],
    ["no-destructure.tsx", "solid/no-destructure"],
    ["no-react-deps.tsx", "solid/no-react-deps"],
    ["components-return-once.tsx", "solid/components-return-once"],
    ["prefer-for.tsx", "solid/prefer-for"],
    ["no-react-specific-props.tsx", "solid/no-react-specific-props"],
  ] as const;

  it.each(cases)("%s → %s, уровень error", async (file, rule) => {
    const [result] = await lint(`violation/${file}`);

    expect(result, `фикстура ${file} не была прочитана линтером`).toBeDefined();
    // Уровень проверяется вместе с правилом: `warn` тут значил бы, что пресет
    // диагностику печатает, но сборку не роняет, — то есть канон не работает.
    expect(reported(result!)).toContain(`${rule}:2`);
    expect(result!.errorCount).toBeGreaterThan(0);
  });

  it("ни одна фикстура-нарушение не проваливается в парсер", async () => {
    const results = await lint("violation");

    expect(results).toHaveLength(cases.length);
    for (const result of results) {
      expect(reported(result)).not.toContain("<parse>:2");
    }
  });
});

describe("фикстуры-канон проходят чисто", () => {
  it("на каноничном коде пресет молчит целиком", async () => {
    const results = await lint("canon");

    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(reported(result), `${result.filePath} должен быть чист`).toEqual([]);
    }
  });
});

describe("названная граница `no-destructure`", () => {
  it("деструктуризация в ТЕЛЕ функции этим правилом не ловится", async () => {
    const [result] = await lint("limit/destructure-in-body.tsx");

    // Утверждение узкое и намеренно неудобное: именно `no-destructure` тут молчит.
    // Если выпуск плагина закроет дыру — тест упадёт, и мы поправим доку, а не наоборот.
    expect(reported(result!)).not.toContain("solid/no-destructure:2");
  });

  it("дыра закрыта не полностью: чтение подхватывает `reactivity`", async () => {
    const [result] = await lint("limit/destructure-in-body.tsx");

    // Не «граница безопасна», а точный замер: одно правило её не видит, другое —
    // частично видит. Дока обязана говорить ровно это.
    expect(reported(result!)).toContain("solid/reactivity:2");
  });
});

describe("состав пресета ESLint", () => {
  it("каждое правило плагина рассмотрено — включено или выключено явно", () => {
    const shipped = Object.keys(solid.rules)
      .map((name) => `solid/${name}`)
      .sort();

    // Тест падает на выпуске плагина, который принёс новое правило. Это не помеха, а
    // смысл: «не включено» обязано отличаться от «не посмотрели».
    expect(Object.keys(rules).sort()).toEqual(shipped);
  });

  it("промежуточного уровня нет: включено значит error", () => {
    const levels = Object.entries(rules)
      .filter(([name]) => !(name in offRulesEslint))
      .map(([, entry]) => (Array.isArray(entry) ? entry[0] : entry));

    expect([...new Set(levels)]).toEqual(["error"]);
  });

  it("четыре канонных правила из контракта зон включены", () => {
    expect(Object.keys(canonRulesEslint).sort()).toEqual([
      "solid/components-return-once",
      "solid/no-destructure",
      "solid/no-react-deps",
      "solid/reactivity",
    ]);

    // Не «ключи есть», а «запись доехала целиком»: полная карта обязана нести канон
    // ровно тем же уровнем, каким он объявлен.
    for (const [name, entry] of Object.entries(canonRulesEslint)) {
      expect(rules[name as keyof typeof rules]).toEqual(entry);
    }
  });
});

describe("форма пресета", () => {
  it("это массив flat-конфигов — разворачивается спредом в чужой конфиг", () => {
    const config: Linter.Config[] = defineConfig();

    expect(config.map((section) => section.name)).toEqual([
      "@web-core/lint/eslint/rules",
      "@web-core/lint/eslint/parser-ts",
      "@web-core/lint/eslint/parser-jsx",
    ]);
  });

  it("`ignores` ложится на все секции сразу", () => {
    const config = defineConfig({ ignores: ["**/legacy/**"] });

    for (const section of config) {
      expect(section.ignores).toEqual(["**/legacy/**"]);
    }
  });

  it("`ignores` не появляется в конфиге, пока его не попросили", () => {
    for (const section of defineConfig()) {
      expect("ignores" in section).toBe(false);
    }
  });

  it("`ignores` действительно выводит файл из-под пресета", async () => {
    const config = defineConfig({ ignores: ["**/violation/**"] });
    const results = await lint("violation/no-destructure.tsx", config);

    // Файл исключён целиком: ESLint не возвращает по нему ни одного сообщения.
    expect(results.flatMap((result) => reported(result))).toEqual([]);
  });
});
