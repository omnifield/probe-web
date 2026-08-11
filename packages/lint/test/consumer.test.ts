// Acceptance «пресет применяется в чистом проекте» — буквально: отдельный проект, свой
// `eslint.config.js`, своя копия ESLint, пакет подключён как УСТАНОВЛЕННЫЙ (`workspace:*` →
// симлинк на корень). Значит проверяется не файл на диске, а то, что чужой ESLint разрешил
// пакет по `exports`, поднял `dist` и применил правила.
//
// Тест зовёт CLI, а не Node-API: у потребителя пресет запускается именно так, и код
// возврата — часть контракта (`error` роняет команду, `warn` бы не уронил).

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const consumerDir = resolve(here, "consumer");
const eslintBin = join(consumerDir, "node_modules", ".bin", "eslint");

interface LintMessage {
  ruleId: string | null;
  severity: number;
  fatal?: boolean;
}
interface LintResult {
  filePath: string;
  messages: LintMessage[];
  errorCount: number;
}

let results: LintResult[] = [];
let exitCode = 0;

beforeAll(() => {
  if (!existsSync(eslintBin)) {
    throw new Error(
      `не установлен потребитель ${consumerDir}: прогони \`pnpm install\` в пакете — ` +
        "проект подключён рабочим пространством pnpm",
    );
  }

  try {
    const stdout = execFileSync(eslintBin, ["--format", "json", "src"], {
      cwd: consumerDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    results = JSON.parse(stdout) as LintResult[];
  } catch (error) {
    // Ненулевой код — ожидаемый исход: в проекте лежит заведомо нарушающий файл.
    const failure = error as { status?: number; stdout?: string; stderr?: string };
    if (typeof failure.status !== "number" || !failure.stdout) {
      throw new Error(`eslint не запустился: ${failure.stderr ?? String(error)}`);
    }
    exitCode = failure.status;
    results = JSON.parse(failure.stdout) as LintResult[];
  }
});

const forFile = (name: string) => {
  const result = results.find((r) => r.filePath.endsWith(name));
  if (!result) throw new Error(`${name} не попал под пресет в проекте-потребителе`);
  return result;
};

describe("пресет в чистом проекте", () => {
  it("оба файла проекта попали под пресет", () => {
    expect(results.map((r) => r.filePath.split("/").pop()).sort()).toEqual([
      "broken.tsx",
      "clean.tsx",
    ]);
  });

  it("нарушающий файл ловится всеми четырьмя канонными правилами", () => {
    const broken = forFile("broken.tsx");
    const reported = new Set(broken.messages.map((m) => m.ruleId));

    expect(reported).toContain("solid/reactivity");
    expect(reported).toContain("solid/no-destructure");
    expect(reported).toContain("solid/no-react-deps");
    expect(reported).toContain("solid/components-return-once");
  });

  it("каноничный файл проходит чисто", () => {
    expect(forFile("clean.tsx").messages).toEqual([]);
  });

  it("команда падает — уровень error доходит до кода возврата", () => {
    // Ради этой строки тест и зовёт CLI: при `warn` ESLint вышел бы с нулём, диагностики
    // напечатались бы, а сборка прошла. Ровно так канон и перестаёт работать.
    expect(exitCode).toBe(1);
    expect(forFile("broken.tsx").errorCount).toBeGreaterThan(0);
  });

  it("разбор не падает ни на одном файле проекта", () => {
    const fatal = results.flatMap((r) => r.messages.filter((m) => m.fatal));

    expect(fatal).toEqual([]);
  });
});
