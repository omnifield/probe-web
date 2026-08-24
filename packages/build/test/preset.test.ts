// Проверка точки `/vitest`: пресетом ЗАПУСКАЕТСЯ настоящий прогон тестов в тестовом
// приложении, отдельным процессом (`PROBEWEB-9`, Acceptance).
//
// Почему отдельным процессом, а не «применим пресет к себе»: пресет адресован приложениям
// потребителя, и утверждение звучит как «в чужом проекте, где стоит только он, render-тест
// зеленеет». Натянув пресет на собственный конфиг, мы проверили бы своё окружение, а не его.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { defineTestConfig } from "../src/vitest.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixtureDir = resolve(here, "fixture");
const reportPath = join(fixtureDir, "vitest-report.json");

/** Разбор json-отчёта вложенного прогона: тесты, а не строки вывода. */
type Report = {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  testResults: { assertionResults: { title: string; status: string }[] }[];
};

let report: Report;
let output = "";

beforeAll(() => {
  rmSync(reportPath, { force: true });

  const vitest = resolve(fixtureDir, "node_modules/.bin/vitest");
  if (!existsSync(vitest)) throw new Error("в тестовом приложении не установлен vitest");

  try {
    output = execFileSync(
      vitest,
      ["run", "--reporter=json", `--outputFile=${reportPath}`],
      { cwd: fixtureDir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch (error) {
    // Падение вложенного прогона — это и есть содержательный результат: показываем его вывод
    // целиком, иначе разбираться придётся вслепую.
    const failure = error as { stdout?: string; stderr?: string };
    throw new Error(
      `прогон vitest в тестовом приложении упал:\n${failure.stdout ?? ""}\n${failure.stderr ?? ""}`,
    );
  }

  report = JSON.parse(readFileSync(reportPath, "utf8")) as Report;
});

afterAll(() => {
  rmSync(reportPath, { force: true });
});

describe("прогон тестов пресетом /vitest", () => {
  it("зелёный и не пустой", () => {
    expect(report.numFailedTests).toBe(0);
    expect(report.numPassedTests).toBeGreaterThan(0);
    expect(report.numPassedTests).toBe(report.numTotalTests);
  });

  it("включает render-тест с JSX из зависимости", () => {
    const passed = report.testResults
      .flatMap((file) => file.assertionResults)
      .filter((test) => test.status === "passed")
      .map((test) => test.title);

    // Сверяем по имени теста, а не по счётчику: «прогон зелёный» держится и на пустом наборе,
    // и на наборе, из которого нужный тест тихо исчез.
    expect(passed).toContain("рендерит JSX, приехавший из зависимости");
  });

  it("объявляет условия разрешения и окружение ЯВНО", () => {
    // Единственный случай, когда проверка формы объекта уместна: сквозной прогон эти поля не
    // различает — `vite-plugin-solid@2.11.14` подставляет те же значения сам (снято 2026-08-08).
    // Дока называет их обязательными, значит уход поля обязан ронять тест, а не молча
    // перекладывать пресет на внутренности плагина.
    const config = defineTestConfig();

    expect(config.resolve?.conditions).toEqual(["development", "browser"]);
    expect(config.test?.environment).toBe("jsdom");
  });

  it("не оставляет предупреждений про серверную ветку Solid", () => {
    // Условия разрешения из пресета уводят импорт в браузерную ветку; сорвётся — в выводе
    // появится именно это сообщение ядра, и тест назовёт причину.
    expect(output).not.toMatch(/Client-only API called on the server side/);
  });
});
