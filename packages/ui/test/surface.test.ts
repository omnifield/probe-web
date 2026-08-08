// Гейт ПОСТАВКИ: что торчит наружу, что уезжает в тарбол и разрешается ли оттуда каждая
// ветка `exports`. По полям манифеста это не проверить — `files`, `exports` и факт
// расходятся молча, и узнаёт об этом потребитель, а не мы.
//
// Отдельный предмет здесь — ветка `solid`. Она несёт НЕпреобразованный JSX, и это не деталь
// сборки: получив уже разобранный код, потребитель не сможет применить свою трансформацию
// под цель. Тест смотрит в оба файла и проверяет, что одна ветка отличается от другой ровно
// этим.

import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { EXPECTED_SURFACE } from "./surface-list.js";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");
const PKG = "@omnifield/probe-web-ui";

type Exports = Record<string, string | Record<string, string>>;

const manifest = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
  name: string;
  type: string;
  sideEffects: boolean;
  exports: Exports;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

/** Все пути, на которые указывает `exports`, — включая ветки условий. */
function exportTargets(exports: Exports): string[] {
  return Object.values(exports).flatMap((entry) =>
    typeof entry === "string" ? [entry] : Object.values(entry),
  );
}

/**
 * Имена, объявленные финальным `export { … }` бандла.
 *
 * Хвостовая ссылка на карту исходников отрезается: она идёт ПОСЛЕ объявления, и без этого
 * якорь конца строки не совпадает.
 */
function exportedNames(source: string): string[] {
  const body = source.trimEnd().replace(/\n\/\/#\s*sourceMappingURL=.*$/, "").trimEnd();
  const declared = /export\s*\{([^}]*)\};?$/.exec(body)?.[1];
  if (!declared) throw new Error("в бандле не нашлось финального `export { … }`");

  return declared
    .split(",")
    .map((entry) => entry.trim().split(/\s+as\s+/).at(-1) as string)
    .filter(Boolean)
    .sort();
}

let packed: string[] = [];
let workDir = "";
/** Распакованный тарбол там, где его ищет резолвер Node, — «чистая установка». */
let install = "";

beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), "probe-web-ui-pack-"));

  execFileSync("pnpm", ["pack", "--pack-destination", workDir], {
    cwd: pkgRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  const tarball = readdirSync(workDir).find((name) => name.endsWith(".tgz"));
  if (!tarball) throw new Error("pnpm pack не оставил тарбол");

  packed = execFileSync("tar", ["-tzf", join(workDir, tarball)], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean)
    // npm-тарбол кладёт всё под `package/` — сравниваем пути такими, какими их увидит
    // потребитель после установки.
    .map((entry) => entry.replace(/^package\//, ""));

  install = join(workDir, "consumer");
  mkdirSync(join(install, "node_modules", "@omnifield"), { recursive: true });
  execFileSync("tar", ["-xzf", join(workDir, tarball), "-C", workDir]);
  execFileSync("mv", [join(workDir, "package"), join(install, "node_modules", PKG)]);

  // Peer-зависимости приносит потребитель — здесь их роль играют ссылки на уже поставленные
  // копии. Без них ветка `default` не разрешится, и тест «пакет поднимается из тарбола»
  // проверял бы не пакет, а отсутствие Solid в пустой папке.
  for (const peer of Object.keys(manifest.peerDependencies ?? {})) {
    const target = join(pkgRoot, "node_modules", peer);
    const link = join(install, "node_modules", peer);
    mkdirSync(dirname(link), { recursive: true });
    symlinkSync(target, link, "dir");
  }
});

afterAll(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe("манифест", () => {
  it("объявляет ровно один вход — подпутей у зоны нет", () => {
    expect(Object.keys(manifest.exports)).toEqual(["."]);
  });

  it("вход разложен на три ветки, и `solid` стоит ПЕРЕД `default`", () => {
    const root = manifest.exports["."] as Record<string, string>;

    // Порядок ключей в `exports` — не оформление: резолвер берёт ПЕРВОЕ совпавшее условие.
    // Уедет `default` наверх — потребитель на Solid получит уже разобранный JSX и молча
    // потеряет возможность применить свою трансформацию.
    expect(Object.keys(root)).toEqual(["solid", "types", "default"]);
    expect(root.solid).toBe("./dist/index.jsx");
    expect(root.default).toBe("./dist/index.js");
  });

  it("ESM и без побочек — иначе неиспользованный примитив не выбросится", () => {
    expect(manifest.type).toBe("module");
    expect(manifest.sideEffects).toBe(false);
  });

  it("`solid-js` и `@kobalte/core` — в peer, обычных зависимостей нет вовсе", () => {
    // Две копии Solid в дереве ломают реактивность, и ядро предупреждает об этом только в
    // dev-сборке (норма фонда). У kobalte та же причина: он держит СВОЙ контекст, и вторая
    // копия рассыпала бы связку `Field` ↔ его частей.
    expect(manifest.peerDependencies).toEqual({
      "@kobalte/core": expect.any(String),
      "solid-js": expect.any(String),
    });
    expect(manifest.dependencies).toBeUndefined();
  });
});

describe("тарбол", () => {
  it("несёт обе ветки JS, типы и доку", () => {
    expect(packed).toEqual(
      expect.arrayContaining(["dist/index.jsx", "dist/index.js", "dist/index.d.ts", "README.md"]),
    );
  });

  it("не везёт исходники, тесты и оснастку", () => {
    const stray = packed.filter(
      (entry) =>
        entry.startsWith("src/") ||
        entry.startsWith("test/") ||
        entry.startsWith("scripts/") ||
        entry.startsWith("tsconfig"),
    );

    expect(stray).toEqual([]);
  });

  it("каждая цель `exports` в тарболе реально лежит", () => {
    const targets = exportTargets(manifest.exports).map((target) => target.replace(/^\.\//, ""));

    expect(targets.length).toBeGreaterThan(0);
    for (const target of targets) expect(packed).toContain(target);
  });
});

describe("ветка `solid` против ветки `default`", () => {
  it("`solid` отдаёт JSX как написан — трансформацию применяет потребитель", () => {
    const jsx = readFileSync(join(install, "node_modules", PKG, "dist", "index.jsx"), "utf8");

    // Разметка на месте, а рантайм-вызовов Solid ещё нет.
    expect(jsx).toContain("<KobalteButton");
    expect(jsx).not.toContain("solid-js/web");
  });

  it("`default` отдаёт уже разобранный код — для тех, кто про условие не знает", () => {
    const js = readFileSync(join(install, "node_modules", PKG, "dist", "index.js"), "utf8");

    expect(js).toContain("solid-js/web");
    expect(js).not.toContain("<KobalteButton");
  });

  it("обе ветки объявляют ОДИН И ТОТ ЖЕ перечень наружу", () => {
    // Исполнить эти файлы здесь нельзя: `@kobalte/core` при загрузке трогает клиентские
    // API, и в серверных условиях Node модуль падает на импорте. Перечень поэтому снимается
    // с текста финального `export { … }`, а живой импорт делает браузерный прогон
    // (`test/exports.test.tsx`). Расхождение веток по составу означало бы, что потребители
    // на разных условиях получают разные пакеты.
    for (const branch of ["index.jsx", "index.js"]) {
      const source = readFileSync(join(install, "node_modules", PKG, "dist", branch), "utf8");

      expect(exportedNames(source)).toEqual(EXPECTED_SURFACE);
    }
  });
});

describe("типы у потребителя", () => {
  it("разрешаются из тарбола и проверяют полиморфные пропсы", () => {
    // Самая тихая поломка поставки: `exports.types` указывает в файл, который ссылается на
    // соседние декларации по расширению `.jsx`. Разрешится ли это у потребителя — вопрос не
    // к нашему `tsc`, а к его: у нас рядом лежат исходники, у него их нет.
    writeFileSync(
      join(install, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "bundler",
          lib: ["ESNext", "DOM"],
          jsx: "preserve",
          jsxImportSource: "solid-js",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
        },
        include: ["app.tsx"],
      }),
      "utf8",
    );

    writeFileSync(
      join(install, "app.tsx"),
      `import { Button, Field, Input, Label, Separator } from "${PKG}";

// Полиморфизм, обработчик и ref разом: если дженерик потерялся в обёртке, здесь и вылезет.
export const App = () => (
  <Field>
    <Label>Почта</Label>
    <Input type="email" ref={(el: HTMLInputElement) => el.focus()} />
    <Separator orientation="vertical" />
    <Button as="a" href="/docs" onClick={(event: MouseEvent) => event.preventDefault()}>
      Документация
    </Button>
  </Field>
);
`,
      "utf8",
    );

    const tsc = join(pkgRoot, "node_modules", "typescript", "bin", "tsc");
    const typecheck = () =>
      execFileSync(process.execPath, [tsc, "-p", "tsconfig.json"], {
        cwd: install,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });

    expect(typecheck).not.toThrow();

    // И обратная сторона: проверка обязана быть ЖИВОЙ. Зелёный `tsc`, который на самом деле
    // не разрешил наши типы (`skipLibCheck`, `any` из ниоткуда), молча подтверждал бы что
    // угодно. Заведомо неверное имя пропа должно ронять его.
    writeFileSync(
      join(install, "app.tsx"),
      `import { Separator } from "${PKG}";

export const App = () => <Separator orientation="наискосок" />;
`,
      "utf8",
    );

    expect(typecheck).toThrow();
  });
});
