import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PKG, installFromTarball, pkgRoot } from "./helpers/install.js";

// Гейт ТИПИЗАЦИИ поверхности: проходит ли импорт входа НАСТОЯЩИЙ `tsc` у потребителя.
// Резолвер Node (`pack.test.ts`) на этот вопрос не отвечает: он проверяет, что файл найден,
// а не что объявленные типы складываются у того, кто их читает. Гейты работают в паре.

const require = createRequire(import.meta.url);
const tsc = join(dirname(require.resolve("typescript/package.json")), "bin", "tsc");

// Зависимости поставки и одноранговая `solid-js` — часть среды потребителя: в настоящей
// установке их привозит менеджер пакетов. Линкуем ровно так же, иначе `tsc` не найдёт типы
// `cva` и `Accessor`, и гейт покраснел бы на том, чего у потребителя не бывает.
const ENV_PACKAGES = ["class-variance-authority", "clsx", "tailwind-merge", "solid-js"];

let install: string;
let work: string;

const tsconfig = (include: string[]) =>
  JSON.stringify({
    compilerOptions: {
      target: "ESNext",
      module: "ESNext",
      moduleResolution: "bundler",
      lib: ["ESNext", "DOM", "DOM.Iterable"],
      strict: true,
      verbatimModuleSyntax: true,
      skipLibCheck: true,
      noEmit: true,
    },
    include,
  });

/** Прогон `tsc` в установке потребителя. Возвращает вывод; пусто — прогон чист. */
function typecheck(project: string): string {
  try {
    execFileSync(process.execPath, [tsc, "-p", project], { cwd: install, encoding: "utf8" });
    return "";
  } catch (error) {
    const failed = error as { stdout?: string; stderr?: string };
    return `${failed.stdout ?? ""}${failed.stderr ?? ""}`.trim();
  }
}

beforeAll(() => {
  ({ work, install } = installFromTarball("probe-web-style-tools-types-"));

  for (const name of ENV_PACKAGES) {
    // Папку пакета берём из СВОЕЙ установки, а не спрашиваем у самого пакета, где лежит его
    // манифест: `require.resolve("<name>/package.json")` работает только пока пакет объявил
    // этот подпуть в `exports`, а `class-variance-authority` его не объявляет — гейт падал
    // бы на чужой раскладке экспортов, ничего не сказав про нашу поставку.
    symlinkSync(join(pkgRoot, "node_modules", name), join(install, "node_modules", name), "dir");
  }

  writeFileSync(
    join(install, "consumer.ts"),
    [
      `import { cn, createStyle, cva, type VariantProps } from "${PKG}";`,
      "",
      "export const cls: string = cn('p-2', 'p-4');",
      "",
      "const button = cva('inline-flex', {",
      "  variants: { size: { sm: 'text-sm', lg: 'text-lg' } },",
      "  defaultVariants: { size: 'sm' },",
      "});",
      "",
      "export type ButtonProps = VariantProps<typeof button>;",
      "",
      "// Обвязка вариантов возвращает аксессор Solid — тип обязан сложиться у потребителя,",
      "// у которого `solid-js` стоит одноранговой зависимостью.",
      "export const style = createStyle(button, { size: 'lg' as const });",
      "export const applied: string = style();",
      "",
    ].join("\n"),
    "utf8",
  );
  writeFileSync(join(install, "tsconfig.json"), tsconfig(["consumer.ts"]), "utf8");

  writeFileSync(join(install, "subpath.ts"), `import { cn } from "${PKG}/cn";\nexport { cn };\n`, "utf8");
  writeFileSync(join(install, "tsconfig.subpath.json"), tsconfig(["subpath.ts"]), "utf8");
});

afterAll(() => {
  rmSync(work, { recursive: true, force: true });
});

describe("типизация у потребителя", () => {
  it("вход поставки проходит `tsc` из чистой установки", () => {
    expect(typecheck("tsconfig.json")).toBe("");
  });

  it("подпутей во внутренности нет — импорт мимо входа не типизируется", () => {
    // Негатив держит гейт честным: без него зелёный прогон означал бы и «поверхность
    // типизируется», и «`tsc` до неё вообще не дошёл». Заодно это исполняемая запись
    // границы: вход у поставки ровно один.
    expect(typecheck("tsconfig.subpath.json")).toMatch(/TS2307/);
  });
});
