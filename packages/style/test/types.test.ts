import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PKG, installFromTarball } from "./helpers/install.js";

// Гейт ТИПИЗАЦИИ поверхности: проходит ли импорт нашего подпутя НАСТОЯЩИЙ `tsc` у
// потребителя. Резолвер Node (`pack.test.ts`) на этот вопрос не отвечает: типы для CSS
// приходят wildcard-правилом `declare module '*.css' {}` из `vite/client`, а шаблон
// сопоставляется с ТЕКСТОМ спецификатора, а не с тем, куда он резолвится. Поэтому подпуть
// без расширения резолвился, но ронял `tsc` потребителя (TS2882) — и прошёл мимо всех
// тестов зоны, пока такой проверки не было.
//
// Обратная сторона той же механики: под шаблон попадает ЛЮБОЕ имя на `.css`, поэтому
// зелёный `tsc` не значит «файл в поставке есть». Существование и резолв подпутя держит
// `pack.test.ts` — гейты работают в паре, поодиночке ни один из них не полон.

const require = createRequire(import.meta.url);
const tsc = join(dirname(require.resolve("typescript/package.json")), "bin", "tsc");
const vite = dirname(require.resolve("vite/package.json"));

let install: string;
let work: string;

// `compilerOptions` потребителя — те же, что задаёт `tsconfig` зоны `build`. Повторены
// здесь, а не подтянуты `extends`: в чистой установке зоны `build` нет, а гейт обязан
// работать от одного тарбола `style`. Значимо тут ровно две строки — `moduleResolution:
// bundler` (так резолвит `exports` бандлер) и `types: ["vite/client"]` (оттуда типы CSS).
const tsconfig = (include: string[]) =>
  JSON.stringify({
    compilerOptions: {
      target: "ESNext",
      module: "ESNext",
      moduleResolution: "bundler",
      lib: ["ESNext", "DOM", "DOM.Iterable"],
      types: ["vite/client"],
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
    execFileSync(process.execPath, [tsc, "-p", project], {
      cwd: install,
      encoding: "utf8",
    });
    return "";
  } catch (error) {
    const failed = error as { stdout?: string; stderr?: string };
    return `${failed.stdout ?? ""}${failed.stderr ?? ""}`.trim();
  }
}

beforeAll(() => {
  ({ work, install } = installFromTarball("probe-web-style-types-"));

  // `vite/client` — часть среды потребителя, а не поставки: линкуем в установку так же,
  // как его туда принёс бы менеджер пакетов.
  symlinkSync(vite, join(install, "node_modules", "vite"), "dir");

  writeFileSync(
    join(install, "consumer.ts"),
    [
      `import "${PKG}/base.css";`,
      `import "${PKG}/themes.css";`,
      `import { themeModelToCss, type ThemeModel, type ThemeTokens } from "${PKG}";`,
      "",
      "export type Tokens = ThemeTokens;",
      "",
      "// Генератор — обычный публичный вход, без подпутей во внутренности: у потребителя",
      "// он обязан и резолвиться, и типизироваться из корня поставки.",
      "export const model: ThemeModel = {",
      "  id: 'ocean',",
      "  seeds: { brand: 'oklch(0.55 0.16 248)', neutral: 'oklch(0.62 0.004 248)', danger: 'oklch(0.505 0.196 27)' },",
      "  density: '1',",
      "};",
      "export const css: string = themeModelToCss(model);",
      "",
      "// Порождение CSS по требованию — тоже публичный вход (`PWEB-20`): его зовёт",
      "// дев-сервер, живущий в другой зоне, и типы обязаны складываться у него так же,",
      "// как у любого потребителя поставки.",
      "",
    ].join("\n"),
    "utf8",
  );
  writeFileSync(join(install, "tsconfig.json"), tsconfig(["consumer.ts"]), "utf8");

  writeFileSync(
    join(install, "generate.ts"),
    [
      `import { baseCss, themesCss } from "${PKG}/generate";`,
      "",
      "export const base: string = baseCss();",
      "export const themes: string = themesCss();",
      "",
    ].join("\n"),
    "utf8",
  );
  writeFileSync(join(install, "tsconfig.generate.json"), tsconfig(["generate.ts"]), "utf8");

  writeFileSync(join(install, "no-extension.ts"), `import "${PKG}/css";\n`, "utf8");
  writeFileSync(
    join(install, "tsconfig.no-extension.json"),
    tsconfig(["no-extension.ts"]),
    "utf8",
  );

  // Инструменты стилизации с поверхности СНЯТЫ (`PWEB-3`): они уехали в отдельную
  // необязательную поставку. Держим это гейтом, а не памятью — вернувшийся реэкспорт
  // выглядит удобством и молча возвращает инструменты в каждую установку значений.
  writeFileSync(
    join(install, "tools.ts"),
    `import { cn, createStyle, cva } from "${PKG}";\nexport { cn, createStyle, cva };\n`,
    "utf8",
  );
  writeFileSync(join(install, "tsconfig.tools.json"), tsconfig(["tools.ts"]), "utf8");
});

afterAll(() => {
  rmSync(work, { recursive: true, force: true });
});

describe("типизация у потребителя", () => {
  it("оба CSS-подпутя и корень проходят `tsc` из чистой установки", () => {
    expect(typecheck("tsconfig.json")).toBe("");
  });

  it("подпуть `/generate` типизируется — порождение зовёт чужая зона", () => {
    // Порождение по требованию (`PWEB-20`) зовёт дев-сервер зоны `build`. Он такой же
    // потребитель поставки, как приложение: несложившиеся типы здесь означают, что зацеп
    // придётся писать «на любых», а это ровно тот шов, который потом молча разъедется.
    expect(typecheck("tsconfig.generate.json")).toBe("");
  });

  it("инструментов стилизации на поверхности нет — они отдельная поставка", () => {
    // `TS2305` — «модуль не экспортирует такого имени». Ровно то, что обязан увидеть тот,
    // кто по привычке возьмёт `cn` из набора значений: подсказка ведёт в другую поставку,
    // а не молча привозит инструменты вместе со значениями.
    expect(typecheck("tsconfig.tools.json")).toMatch(/TS2305/);
  });

  it("имя без расширения не типизируется — то, из-за чего подпуть переименован", () => {
    // Негатив держит гейт честным: без него зелёный прогон означал бы и «поверхность
    // типизируется», и «`tsc` до неё вообще не дошёл». Заодно это исполняемая запись
    // причины: сломано было ИМЯ, а не содержимое, — вернётся имя без расширения, вернётся
    // и TS2882 у каждого потребителя.
    expect(typecheck("tsconfig.no-extension.json")).toMatch(/TS2882/);
  });
});
