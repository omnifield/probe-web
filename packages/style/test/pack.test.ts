import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PKG, installFromTarball, pkgRoot } from "./helpers/install.js";

// Гейт ПОСТАВКИ: что окажется в тарболе и разрешится ли из него подпуть. Проверять это по
// полям манифеста бессмысленно — `files` и `exports` расходятся с фактом молча, и узнаёт
// об этом потребитель, а не мы. Ответ на вопрос «а ТИПИЗИРУЕТСЯ ли подпуть у потребителя»
// этот гейт не даёт — он в `types.test.ts`.

let work: string;
let entries: string[];
let install: string;

beforeAll(() => {
  ({ work, install, entries } = installFromTarball("probe-web-style-pack-"));
  writeFileSync(join(install, "index.cjs"), "", "utf8");
});

afterAll(() => {
  rmSync(work, { recursive: true, force: true });
});

describe("pnpm pack", () => {
  it("везёт сборку — JS, типы и единственный CSS-артефакт", () => {
    expect(entries).toEqual(
      expect.arrayContaining([
        "dist/index.js",
        "dist/index.d.ts",
        "dist/values.js",
        "dist/values.d.ts",
        "dist/css/base.css",
        "dist/css/generate.js",
        "dist/css/generate.d.ts",
        "package.json",
        "README.md",
      ]),
    );
  });

  it("исходников и тестов в тарболе нет", () => {
    const leaked = entries.filter(
      (entry) =>
        entry.startsWith("src/") ||
        entry.startsWith("test/") ||
        entry.startsWith("scripts/") ||
        entry.startsWith("tsconfig"),
    );
    expect(leaked).toEqual([]);
  });
});

describe("разрешение из установки", () => {
  const req = () => createRequire(join(install, "index.cjs"));

  it("корень отдаёт собранный модуль", () => {
    expect(req().resolve(PKG)).toBe(
      join(install, "node_modules", PKG, "dist", "index.js"),
    );
  });

  it("подпуть `/base.css` резолвится в базовый CSS", () => {
    expect(req().resolve(`${PKG}/base.css`)).toBe(
      join(install, "node_modules", PKG, "dist", "css", "base.css"),
    );
  });

  it("старого подпутя `/css` нет — алиаса не осталось", () => {
    // Два имени одного файла = второй источник правды: через месяц не сказать, какое
    // каноническое, и в скелетах разъедутся оба.
    expect(() => req().resolve(`${PKG}/css`)).toThrow();
  });

  it("подпуть `/generate` резолвится в порождение CSS", () => {
    // Подпуть объявлен ради того, чтобы CSS порождался ПО ТРЕБОВАНИЮ (`PWEB-20`): зовёт его
    // дев-сервер, живущий в другой зоне, и знать нашу раскладку он при этом не должен —
    // спецификатор пакета вместо пути внутрь.
    expect(req().resolve(`${PKG}/generate`)).toBe(
      join(install, "node_modules", PKG, "dist", "css", "generate.js"),
    );
  });

  it("подпутя `/themes.css` НЕТ — надеваемой палитры по умолчанию не осталось", () => {
    // Палитра без рецептов это половина скина, отгруженная фреймворком (`PWEB-50`). Негатив
    // здесь обязателен: снятый экспорт легко вернуть «для совместимости», и вернулся бы вместе
    // с ним отгружаемый вид.
    expect(() => req().resolve(`${PKG}/themes.css`)).toThrow();
    expect(entries).not.toContain("dist/css/themes.css");
  });

  it("подпуть `/values` резолвится в узкий вход", () => {
    expect(req().resolve(`${PKG}/values`)).toBe(
      join(install, "node_modules", PKG, "dist", "values.js"),
    );
  });

  it("внутренние файлы наружу не торчат — только объявленные подпути", () => {
    expect(() => req().resolve(`${PKG}/dist/tokens.js`)).toThrow();
  });

  it("установка значений не привозит зависимостей инструментов", () => {
    // Разрез считается сделанным не тогда, когда `cn` исчез с поверхности, а когда его
    // зависимости перестали приезжать вместе со значениями. Пока `clsx`, `tailwind-merge`
    // и `cva` стоят в манифесте, «инструменты необязательны» неправда: их ставит каждый,
    // кто взял значения (`PWEB-3`).
    const manifest = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    const declared = [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.peerDependencies ?? {}),
    ];

    for (const tool of ["clsx", "tailwind-merge", "class-variance-authority"]) {
      expect(declared, `${tool} — зависимость инструментов, а не значений`).not.toContain(tool);
    }
  });

  it("установка состоит только из поставки", () => {
    expect(readdirSync(join(install, "node_modules", PKG)).sort()).toEqual([
      "README.md",
      "dist",
      "package.json",
    ]);
  });
});

// Solid зоне не нужен ВООБЩЕ (`PWEB-56`): его трогала одна лишь реактивная часть, а её больше
// нет. Проверяется это ЗАПУСКОМ в установке, где Solid физически отсутствует, — манифест
// расходится с фактом молча.
//
// Прежде здесь стояла пара «узкий вход поднимается / корень падает»: падение корня было
// положительным контролем, доказывающим, что установка честно чистая. Теперь падать нечему, и
// контроль пришлось заменить — иначе зелёный прогон означал бы и «Solid не нужен», и «проверка
// до импорта вообще не дошла». Контролем стал заведомо отсутствующий подпуть.
//
// Установка здесь та же, что выше, — распакованный тарбол и ничего больше: ни `solid-js`, ни
// прочего dev-обвеса. Импорт идёт ОТДЕЛЬНЫМ процессом node с рабочей папкой потребителя, чтобы
// спецификатор разрешался по `exports` поставки, а не по нашему `node_modules`.
describe("Solid в чистой установке", () => {
  /** Пробует импорт в установке потребителя. Возвращает пусто при успехе, иначе — текст отказа. */
  const tryImport = (specifier: string): string => {
    try {
      execFileSync(
        process.execPath,
        ["--input-type=module", "-e", `await import(${JSON.stringify(specifier)});`],
        { cwd: install, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      );
      return "";
    } catch (error) {
      const failed = error as { stdout?: string; stderr?: string };
      return `${failed.stdout ?? ""}${failed.stderr ?? ""}`.trim();
    }
  };

  it("КОРНЕВОЙ вход поднимается там, где `solid-js` не установлен", () => {
    // Главная строка задачи: прежде корень тут падал, потому что вёз реактивную часть.
    expect(tryImport(PKG)).toBe("");
  });

  it("узкий вход поднимается там же", () => {
    expect(tryImport(`${PKG}/values`)).toBe("");
  });

  it("положительный контроль: несуществующий подпуть в той же установке НЕ поднимается", () => {
    // Иначе зелёные пробы выше значили бы и «Solid не нужен», и «импорт вообще не выполнялся».
    expect(tryImport(`${PKG}/nothing-here`)).toMatch(/ERR_(PACKAGE_PATH_NOT_EXPORTED|MODULE_NOT_FOUND)/);
  });

  it("порождение CSS тоже обходится без Solid — подпуть зовёт чужая зона", () => {
    // `/generate` Solid не тянул и раньше, но держалось это тем, что никто не дописал в него
    // импорт. Теперь держится гейтом.
    expect(tryImport(`${PKG}/generate`)).toBe("");
  });

  it("`solid-js` не объявлен НИКАКОЙ зависимостью поставки", () => {
    // Пробы выше меряют ГРАФ МОДУЛЕЙ, а эта — установку: pnpm с 8-й версии доставляет
    // одноранговые сам (`auto-install-peers` включён по умолчанию, проверено на pnpm 11).
    // Оставленная в манифесте зависимость привезла бы Solid на диск каждому потребителю, и
    // «зоне он не нужен» осталось бы верным только внутри пакета.
    //
    // Раньше здесь стояло «объявлен необязательным одноранговым» — точное описание факта,
    // когда Solid был нужен одному входу из четырёх (`PWEB-44`). Нужных входов не осталось.
    const manifest = JSON.parse(readFileSync(join(pkgRoot, "package.json"), "utf8")) as Record<
      string,
      Record<string, unknown> | undefined
    >;

    for (const kind of [
      "dependencies",
      "peerDependencies",
      "peerDependenciesMeta",
      "devDependencies",
    ]) {
      expect(manifest[kind] ?? {}, `${kind} всё ещё называет solid-js`).not.toHaveProperty(
        "solid-js",
      );
    }
  });
});
