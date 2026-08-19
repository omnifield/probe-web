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

import { EXPECTED_SURFACE, EXPECTED_TYPE_SURFACE } from "./surface-list.js";

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
  it("объявляет вход примитивов и ОДИН подпуть — паспорт", () => {
    // Подпуть заводится не «на всякий случай», а под появившегося потребителя: паспорт читают
    // механика скина и редактор, и им нужны ДАННЫЕ, а не примитивы (`tasker:PWEB-2`). Равенство,
    // а не вхождение: каждая точка `exports` замерзает выпуском, и появление новой обязано быть
    // решением, а не побочным следствием правки.
    expect(Object.keys(manifest.exports)).toEqual([".", "./passport"]);
  });

  it("у паспорта две ветки — типы и код; ветки `solid` у него нет", () => {
    const passport = manifest.exports["./passport"] as Record<string, string>;

    // JSX внутри нет, и условие `solid` означало бы, что потребителю есть что трансформировать.
    expect(Object.keys(passport)).toEqual(["types", "default"]);
    expect(passport.types).toBe("./dist/passport.d.ts");
    expect(passport.default).toBe("./dist/passport.js");
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
  /** Кладёт `tsconfig.json` чистой установки. Зовётся перед первым прогоном `tsc`. */
  function writeConsumerTsconfig(): void {
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
  }

  /** Кладёт исходник потребителя и просит ЕГО `tsc` его проверить. */
  function typecheckConsumer(app: string): () => string {
    writeFileSync(join(install, "app.tsx"), app, "utf8");

    const tsc = join(pkgRoot, "node_modules", "typescript", "bin", "tsc");

    return () =>
      execFileSync(process.execPath, [tsc, "-p", "tsconfig.json"], {
        cwd: install,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
  }

  it("разрешаются из тарбола и проверяют полиморфные пропсы", () => {
    // Самая тихая поломка поставки: `exports.types` указывает в файл, который ссылается на
    // соседние декларации по расширению `.jsx`. Разрешится ли это у потребителя — вопрос не
    // к нашему `tsc`, а к его: у нас рядом лежат исходники, у него их нет.
    writeConsumerTsconfig();

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

  it("паспорт разрешается подпутём и приезжает типизированным", () => {
    // Гейт `tasker:PWEB-2` со стороны типов: читатель паспорта — чужой инструмент, у него нет
    // наших исходников, и форма обязана разрешиться по декларациям из тарбола.
    writeConsumerTsconfig();

    expect(
      typecheckConsumer(
        `import { type ComponentPassport, passportOf } from "${PKG}/passport";

const кнопка: ComponentPassport | undefined = passportOf("button");

export const части: string[] = кнопка?.parts.map((часть) => часть.name) ?? [];
export const состояния: string[] =
  кнопка?.parts.flatMap((часть) => часть.states.map((состояние) => состояние.name)) ?? [];
export const намерения: string[] = кнопка?.variants.map((вариант) => вариант.name) ?? [];
`,
      ),
    ).not.toThrow();

    // Живость проверки: поле, которого в форме нет, обязано ронять `tsc` потребителя — иначе
    // зелёный прогон подтверждал бы что угодно, включая `any` из ниоткуда.
    expect(
      typecheckConsumer(
        `import { passportOf } from "${PKG}/passport";

export const вид = passportOf("button")?.parts[0].color;
`,
      ),
    ).toThrow();
  });

  it("объявленные ТИПЫ доезжают до потребителя — по перечню, а не по памяти", () => {
    // `EXPECTED_SURFACE` этих имён не поймает: в рантайме типа нет, и равенство с тем, что
    // торчит из модуля, покраснело бы на пустом месте. Поэтому у типов свой перечень и своя
    // проверка — здесь, в чистой установке из тарбола.
    writeConsumerTsconfig();

    expect(EXPECTED_TYPE_SURFACE.length).toBeGreaterThan(0);

    const uses = EXPECTED_TYPE_SURFACE.map(
      (name, index) => `export type Проба${index} = ${name};`,
    ).join("\n");

    expect(
      typecheckConsumer(
        `import type { ${EXPECTED_TYPE_SURFACE.join(", ")} } from "${PKG}";\n\n${uses}\n`,
      ),
    ).not.toThrow();
  });

  it("значение цветовых собирается, НЕ выходя за кит", () => {
    // Главное здесь — строка ввоза: `@kobalte/core` в ней не упомянут ни разу, хотя тип
    // значения приехал именно оттуда. Потребитель, не объявивший его у себя, обязан суметь
    // всё то же самое (`kb:PROBEWEB-4`, поправка 2026-08-18; `kb:PROBEWEB-17` — почему на
    // транзитивную установку опираться нельзя).
    //
    // Проверка живёт в ЧИСТОЙ установке из тарбола, а не рядом с исходниками: у потребителя
    // нет ни нашего `src`, ни наших путей, и разрешиться всё обязано по декларациям.
    writeConsumerTsconfig();

    expect(
      typecheckConsumer(
        `import {
  type Color,
  ColorArea,
  ColorAreaBackground,
  ColorAreaThumb,
  ColorField,
  ColorFieldInput,
  ColorSlider,
  ColorSliderThumb,
  ColorSliderTrack,
  parseColor,
} from "${PKG}";

// Хекс из поля цвета → значение области и ползунка. Перевод в HSL тоже наш: \`toFormat\`
// это метод типа \`Color\`, а не вторая зависимость.
const seed: Color = parseColor("#2f6fed").toFormat("hsl");

export const App = () => (
  <>
    <ColorField value={seed.toString("hex")}>
      <ColorFieldInput />
    </ColorField>
    <ColorArea value={seed} xChannel="saturation" yChannel="brightness">
      <ColorAreaBackground>
        <ColorAreaThumb />
      </ColorAreaBackground>
    </ColorArea>
    <ColorSlider channel="hue" value={seed} onChange={(next: Color) => next.toString("hex")}>
      <ColorSliderTrack>
        <ColorSliderThumb />
      </ColorSliderTrack>
    </ColorSlider>
  </>
);
`,
      ),
    ).not.toThrow();
  });
});

// ГЕЙТ задачи `tasker:PWEB-2`: «сторонний потребитель читает паспорт кнопки из поставки, не
// заглядывая в исходники». Поэтому проба живёт здесь, в чистой установке из тарбола, и читает
// паспорт ИСПОЛНЕНИЕМ — тем же импортом, каким его прочтут механика скина и редактор.
describe("паспорт из поставки", () => {
  /** Исполняет фрагмент в чистой установке и отдаёт то, что он напечатал. */
  function runInConsumer(code: string): unknown {
    const out = execFileSync(process.execPath, ["--input-type=module", "-e", code], {
      cwd: install,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });

    return JSON.parse(out) as unknown;
  }

  it("читается импортом подпути — без исходников и без сборки", () => {
    const passport = runInConsumer(
      `import { passportOf } from "${PKG}/passport";
console.log(JSON.stringify(passportOf("button")));`,
    ) as {
      component: string;
      package: string;
      root: string;
      parts: Array<{ name: string; states: Array<{ name: string }> }>;
      variants: Array<{ name: string }>;
    };

    expect(passport.component).toBe("button");
    expect(passport.package).toBe(PKG);
    expect(passport.root).toBe("button");
    expect(passport.parts.map((part) => part.name)).toEqual(["button"]);

    // Состояния и намерения — то, ради чего паспорт и заводился: без них скину нечего
    // адресовать, кроме покоя, а редактору нечего предложить.
    expect(passport.parts[0].states.map((state) => state.name)).toContain("disabled");
    expect(passport.variants.map((variant) => variant.name).length).toBeGreaterThan(0);
  });

  it("компонент без паспорта отдаёт `undefined`, а не заглушку", () => {
    expect(
      runInConsumer(
        `import { passportOf } from "${PKG}/passport";
console.log(JSON.stringify(passportOf("такого-компонента-нет") ?? null));`,
      ),
    ).toBeNull();
  });

  it("не тянет за собой ни Solid, ни `@kobalte/core`", () => {
    // Ради этого подпуть и отдельный. Утечка импорта означала бы, что чужой инструмент,
    // которому нужен перечень частей, обязан поставить себе весь рантайм примитивов.
    const bundle = readFileSync(join(install, "node_modules", PKG, "dist", "passport.js"), "utf8");

    expect(bundle).not.toContain("solid-js");
    expect(bundle).not.toContain("@kobalte/core");
  });
});
