// Поверхность пакета — ПЕРЕЧНЕМ, а не на глаз (Acceptance задачи `tasker:PROBEWEB-11`).
//
// Проверяем четыре разных утверждения:
//   1. манифест объявляет ровно одну точку наружу — лишний экспорт замерзает навсегда;
//   2. в зависимостях поставки нет ничего, и в частности build-инструментов, — это тот самый
//      дефект, ради которого зона отделена от `build` (kb:PROBEWEB-4);
//   3. `solid-js` — в `peerDependencies`: две копии Solid в дереве ломают реактивность;
//   4. тарбол несёт только `dist` и доку, и каждая цель `exports` в нём реально лежит —
//      иначе `exports` указывает в пустоту и пакет ломается у потребителя, а не у нас.

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const pkgRoot = resolve(here, "..");

type Exports = Record<string, string | Record<string, string>>;

const manifest = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
  name: string;
  type: string;
  sideEffects: boolean;
  exports: Exports;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

/** Все пути, на которые указывает `exports`, — включая ветки условий (`types`/`default`). */
function exportTargets(exports: Exports): string[] {
  return Object.values(exports).flatMap((entry) =>
    typeof entry === "string" ? [entry] : Object.values(entry),
  );
}

/** Содержимое тарбола, пути — уже без служебного префикса `package/`. */
let packed: string[] = [];
let workDir = "";

beforeAll(() => {
  workDir = mkdtempSync(join(tmpdir(), "probe-web-runtime-pack-"));

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
    .map((entry) => entry.replace(/^package\//, ""));
});

afterAll(() => {
  rmSync(workDir, { recursive: true, force: true });
});

describe("манифест", () => {
  it("объявляет ровно одну точку наружу", () => {
    expect(Object.keys(manifest.exports)).toEqual(["."]);
  });

  it("назван по эко-канону @omnifield/<продукт>-<пакет>", () => {
    expect(manifest.name).toBe("@omnifield/probe-web-runtime");
  });

  it("ESM-only и без побочных эффектов", () => {
    expect(manifest.type).toBe("module");
    expect(manifest.sideEffects).toBe(false);
  });

  it("не тащит потребителю НИКАКИХ зависимостей — тем более build-инструментов", () => {
    expect(manifest.dependencies ?? {}).toEqual({});
  });

  it("держит solid-js peer-зависимостью, а не обычной", () => {
    expect(Object.keys(manifest.peerDependencies ?? {})).toEqual(["solid-js"]);
  });
});

describe("тарбол pnpm pack", () => {
  it("содержит каждую цель из exports", () => {
    const missing = exportTargets(manifest.exports)
      .map((target) => target.replace(/^\.\//, ""))
      .filter((target) => !packed.includes(target));

    expect(missing).toEqual([]);
  });

  it("несёт собранный рантайм и его типы", () => {
    expect(packed).toEqual(
      expect.arrayContaining(["dist/index.js", "dist/index.d.ts", "README.md"]),
    );
  });

  it("кроме dist и доки не несёт ничего — ни исходников, ни тестов, ни конфигов", () => {
    const extra = packed.filter(
      (entry) => !entry.startsWith("dist/") && entry !== "README.md" && entry !== "package.json",
    );
    expect(extra).toEqual([]);
  });
});

describe("импорт пакета", () => {
  // `sideEffects: false` в манифесте — не украшение, а обещание трясуну. Механика скина не
  // смеет ничего делать на импорте: самоинициализация сделала бы обещание ложью, а трясун
  // вырезал бы то, на что кто-то рассчитывает. Проверяем это средой БЕЗ DOM: любое обращение
  // к `document` на уровне модуля здесь упало бы.
  it("поднимается там, где DOM'а нет вовсе — самоинициализации на уровне модуля нет", async () => {
    expect(globalThis.document).toBeUndefined();

    const loaded = (await import(
      pathToFileURL(join(pkgRoot, "dist/index.js")).href
    )) as Record<string, unknown>;

    expect(Object.keys(loaded).sort()).toEqual(
      ["mount", "applySkin", "readSkin", "restoreSkin", "checkStyleOrder", "makeSkinSwitch"].sort(),
    );
  });
});

describe("собранные декларации", () => {
  const dts = () => readFileSync(join(pkgRoot, "dist/index.d.ts"), "utf8");

  // Перечень ЯВНЫЙ, а не «содержит»: смысл пробы в том, что лишний экспорт замерзает навсегда.
  // Список расширен по разрешению architect от 2026-08-19 (`tasker:PROBEWEB-52`): заморожена
  // СИГНАТУРА `mount()` и идентификатор `#root`, а не запрет на соседние экспорты. Механика
  // скина едет именованными экспортами ТОЙ ЖЕ точки — подпуть остаётся один.
  it("объявляют ровно тот перечень значений, который мы называли", () => {
    const exported = [...dts().matchAll(/^export\s+declare\s+\w+\s+(\w+)/gm)].map((m) => m[1]);

    expect(exported).toEqual([
      "mount",
      "applySkin",
      "readSkin",
      "restoreSkin",
      "checkStyleOrder",
      "makeSkinSwitch",
    ]);
  });

  it("объявляют ровно тот перечень типов, который мы называли", () => {
    const exported = [...dts().matchAll(/^export\s+(?:interface|type)\s+(\w+)/gm)].map(
      (m) => m[1],
    );

    expect(exported).toEqual([
      "SkinMode",
      "SkinChoice",
      "SkinPatch",
      "RestoreSkinOptions",
      "StyleMarker",
      "StyleOrderOptions",
      "StyleOrderStatus",
      "StyleOrderReport",
      "SkinSource",
      "SkinSwitchOptions",
      "SkinWearOptions",
      "SkinSwitch",
    ]);
  });

  it("не собраны реэкспорт-бочкой", () => {
    expect(dts()).not.toMatch(/^export\s+\{/m);
  });
});
