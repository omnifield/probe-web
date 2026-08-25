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
  existsSync,
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

// ЛОВУШКА, ОПЛАЧЕННАЯ ДВАЖДЫ (`PWEB-91`, `PWEB-92`): здесь меряется СОБРАННОЕ, а не исходники.
//
// `pnpm pack` кладёт в тарбол то, что лежит в `dist` СЕЙЧАС, и никакой сборки перед этим не
// запускает. Значит прогон без предшествующей сборки проверяет вчерашнюю поставку: правка формы в
// `src/` до него не доезжает, и мутация, которой мерят строгость, не краснеет. Замер выглядит
// зелёным, а проверено им — ничто.
//
// В штатном пути этого не случается: `pnpm test` — это `build && vitest`. Ловушка бьёт по ручному
// прогону `vitest run test/surface.test.ts`, и била уже: владелец механики скина дважды получил
// пустой замер обязательности `settings` именно так. Меряешь строгость поставки — собери сначала.
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

  // Peer-зависимости приносит потребитель, обычные ставит менеджер пакетов — здесь роль обоих
  // играют ссылки на уже поставленные копии. Без них ветка `default` не разрешится, и тест
  // «пакет поднимается из тарбола» проверял бы не пакет, а отсутствие Solid в пустой папке.
  for (const dep of [
    ...Object.keys(manifest.peerDependencies ?? {}),
    ...Object.keys(manifest.dependencies ?? {}),
  ]) {
    const target = join(pkgRoot, "node_modules", dep);
    const link = join(install, "node_modules", dep);
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
    // механика скина и редактор, и им нужны ДАННЫЕ, а не примитивы (`PWEB-2`). Равенство,
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

  it("Solid и оба поставщика кита — в peer; обычная зависимость ровно одна", () => {
    // Две копии Solid в дереве ломают реактивность, и ядро предупреждает об этом только в
    // dev-сборке (норма фонда). У kobalte та же причина: он держит СВОЙ контекст, и вторая
    // копия рассыпала бы связку `Field` ↔ его частей. У Ark причина та же и даже жёстче: он
    // держит машины состояний Zag, и вторая копия рассыпала бы связку «корень ↔ части» у
    // каждого составного компонента.
    //
    // Поставщиков кита сегодня ДВА, и это переходное состояние: кит переезжает на Ark по одному
    // компоненту (`PWEB-37` — первый), и kobalte уйдёт вместе с последним, кто на нём стоит.
    expect(manifest.peerDependencies).toEqual({
      "@ark-ui/solid": expect.any(String),
      "@kobalte/core": expect.any(String),
      "solid-js": expect.any(String),
    });

    // Равенство, а не вхождение: каждая новая зависимость поставки становится зависимостью
    // КАЖДОГО потребителя, и появиться она обязана решением architect, а не побочно.
    //
    // Четыре обычные зависимости, и у каждой своя причина:
    //   • `@omnifield/probe-web-skin` (`PWEB-110`, `PWEB-111`) — форма паспорта (`definePassport`,
    //     `admits`, …) переехала туда физически: она общая для любого поставщика компонентов, а
    //     не привилегия этого кита, и каждый `*.anatomy.ts` зовёт её на исполнении, не только
    //     типом. `createAnatomy` (`@zag-js/anatomy`) едет ТЕМ ЖЕ путём — реэкспортом из skin, а
    //     не вторым npm-именем на один поток (`PWEB-112`): пакет ушёл из ЭТИХ зависимостей в
    //     `devDependencies` ровно потому, что теперь ни один файл `src/` не зовёт его напрямую;
    //   • `@zag-js/accordion` — тот подпуть, где физически лежит анатомия гармошки (`PWEB-37`);
    //     Ark берёт её оттуда же, брать через него значило бы тянуть в подпуть данных ветку
    //     `solid` с JSX;
    //   • `@zag-js/checkbox` (`PWEB-114`) — тот же приём, тот же довод: подпуть без Solid и без
    //     машины состояний, анатомия чекбокса физически лежит там же, откуда её берёт Ark;
    //   • `lucide-solid` (`PWEB-107`) — РАНТАЙМ, но в бандл поставки не попадает ни строкой: кит
    //     ввозит из него только тип (`import type { LucideProps }`), а конкретный значок
    //     приходит пропом от потребителя, который импортирует его сам, точечно. Зависимость
    //     нужна ради типа, свежего вместе с пакетом, — сверено на реальном бандле выше
    //     («не тянет `lucide-solid` в бандл поставки»).
    expect(manifest.dependencies).toEqual({
      "@omnifield/probe-web-skin": expect.any(String),
      "@zag-js/accordion": expect.any(String),
      "@zag-js/checkbox": expect.any(String),
      "lucide-solid": expect.any(String),
    });
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

  // `Icon` (`PWEB-107`) ввозит `lucide-solid` ТОЛЬКО типом (`import type { LucideProps }`) —
  // конкретный значок приходит пропом от потребителя, который импортирует его сам, точечно
  // (`lucide-solid/icons/<имя>`). Тип стирается сборкой целиком, поэтому бандл поставки не несёт
  // ни одного байта lucide, независимо от того, сколько значков подключит потребитель, — гейт
  // «не тянет остальные 1499» здесь читается сильнее: не тянет НИ ОДНОГО.
  it("`Icon` не тянет `lucide-solid` в бандл поставки — импорт был только типом", () => {
    const jsx = readFileSync(join(install, "node_modules", PKG, "dist", "index.jsx"), "utf8");
    const js = readFileSync(join(install, "node_modules", PKG, "dist", "index.js"), "utf8");

    // Ищем ИМПОРТ, а не голую строку: доку компонента (эту же) законно упоминает `lucide-solid`
    // прозой, и наивная подстрока ловила бы собственный комментарий, а не факт зависимости.
    const importsLucide = /(?:from|require)\(?\s*["']lucide-solid/;

    expect(jsx).not.toMatch(importsLucide);
    expect(js).not.toMatch(importsLucide);
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
    // Гейт `PWEB-2` со стороны типов: читатель паспорта — чужой инструмент, у него нет наших
    // исходников, и форма обязана разрешиться по декларациям из тарбола. Заодно проверяется,
    // что типы взятой анатомии доезжают до него ЖИВЫМИ: `build()` и `keys()` — это то, чем
    // скин строит адрес, и приехать они обязаны не как `any`.
    writeConsumerTsconfig();

    expect(
      typecheckConsumer(
        `import { type ComponentPassport, passportOf } from "${PKG}/passport";

const кнопка: ComponentPassport | undefined = passportOf("button");

export const части: string[] = кнопка?.anatomy.keys() ?? [];
export const адреса: string[] = Object.values(кнопка?.anatomy.build() ?? {}).map(
  (часть) => часть.selector,
);
export const состояния: string[] =
  кнопка?.parts.flatMap((часть) => часть.states.map((состояние) => состояние.name)) ?? [];
export const ось: string | undefined = кнопка?.variantAxis.mark.name;
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

  it("паспорт БЕЗ настроек не собирается У ПОТРЕБИТЕЛЯ — обязательность едет в поставке", () => {
    // Гейт `PWEB-92`, и мерится он ЗДЕСЬ, а не у читателя формы: строгость поля — свойство
    // ПОСТАВКИ, и проверять её надо тем же `tsc`, которым её увидит чужой поставщик, на чистой
    // установке из тарбола. Владелец механики скина дважды пробовал измерить это у себя и оба
    // раза получил пустой замер (`PWEB-91`) — на нестрогом типе мерить было нечего.
    //
    // Пустая запись — УТВЕРЖДЕНИЕ «настроек нет». Не объяви поставщик поля вовсе — «настроек
    // нет» стало бы в редакторе неотличимо от «поставщик не подумал», а умолчание заполняло бы
    // пустым за него.
    writeConsumerTsconfig();

    const паспорт = (settings: string) =>
      // `createAnatomy` — из `@omnifield/probe-web-skin`, не из `@zag-js/anatomy` напрямую
      // (`PWEB-112`): чужой поставщик компонентов берёт форму ровно тем же реэкспортом, что и
      // этот кит, — второго npm-имени на один поток у него быть не должно.
      `import { createAnatomy } from "@omnifield/probe-web-skin/model";
import { definePassport } from "${PKG}/passport";

export const паспорт = definePassport({
  anatomy: createAnatomy("проба").parts("root"),
  root: "root",
  parts: [{ name: "root", states: [] }],
  variantAxis: { mark: { kind: "attribute", name: "data-variant" } },${settings}
});
`;

    // Контроль: с пустой записью — проходит. Без него отказ ниже мог бы быть про что угодно.
    expect(typecheckConsumer(паспорт("\n  settings: {},"))).not.toThrow();

    // И сам замер: поля нет — `tsc` потребителя падает, и падает ЗА ЭТО. Голый `toThrow()` тут
    // не годится: диагностику `tsc` пишет в свой вывод, а не в текст ошибки, и проба была бы
    // зелена на любой поломке потребителя — ровно тот пустой замер, что и хотим исключить.
    let отказ = "";

    try {
      typecheckConsumer(паспорт(""))();
    } catch (сбой) {
      отказ = String((сбой as { stdout?: string }).stdout ?? "");
    }

    expect(отказ).toMatch(/settings/);
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
    // всё то же самое (`PROBEWEB-4`, поправка 2026-08-18; `PROBEWEB-17` — почему на
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

// ГЕЙТ задачи `PWEB-2`: «сторонний потребитель читает паспорт кнопки из поставки, отдельным
// подпутём, не заглядывая в исходники». Поэтому проба живёт здесь, в чистой установке из
// тарбола, и читает паспорт ИСПОЛНЕНИЕМ — тем же импортом, каким его прочтут механика скина и
// редактор.
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
    // Читаем ровно то, чем скин строит правило: перечень частей и АДРЕСА из анатомии. Оба
    // приезжают вызовом, а не полем: `@zag-js/anatomy` порождает атрибуты узла и селектор
    // стиля из одного объявления, и разъехаться им негде по построению.
    const passport = runInConsumer(
      `import { editorInfoOf, GROUPS, groupOf, passportOf } from "${PKG}/passport";

const кнопка = passportOf("button");
const editorInfo = editorInfoOf("button");

console.log(JSON.stringify({
  component: кнопка.component,
  package: editorInfo.package,
  root: кнопка.root,
  keys: кнопка.anatomy.keys(),
  attrs: кнопка.anatomy.build()[кнопка.root].attrs,
  selector: кнопка.anatomy.build()[кнопка.root].selector,
  parts: кнопка.parts.map((часть) => часть.name),
  states: кнопка.parts.flatMap((часть) => часть.states.map((с) => с.name)),
  axis: кнопка.variantAxis.mark,
  group: editorInfo.group,
  подписьГруппы: GROUPS[groupOf(editorInfo)],
}));`,
    ) as {
      component: string;
      package: string;
      root: string;
      keys: string[];
      attrs: Record<string, string>;
      selector: string;
      parts: string[];
      states: string[];
      axis: { kind: string; name: string; value?: string };
      group: string;
      подписьГруппы: string;
    };

    expect(passport.component).toBe("button");
    expect(passport.package).toBe(PKG);
    expect(passport.root).toBe("root");
    expect(passport.keys).toEqual(["root"]);
    expect(passport.parts).toEqual(["root"]);

    // Обе стороны обещания из одного объявления: атрибуты для узла и селектор для стиля.
    expect(passport.attrs).toEqual({ "data-scope": "button", "data-part": "root" });
    expect(passport.selector).toContain('[data-scope="button"][data-part="root"]');

    // Состояния — то, ради чего добавка сверху и нужна: без них скину нечего адресовать,
    // кроме покоя, а редактору нечего предложить.
    expect(passport.states).toContain("disabled");

    // Ось вариаций объявлена, а имён у неё нет: их создаёт человек в редакторе вместе со
    // скином. Приехало бы отсюда имя — паспорт объявил бы то, чего нельзя проверить.
    expect(passport.axis).toEqual({ kind: "attribute", name: "data-variant" });

    // Место в перечне и его подпись едут ВМЕСТЕ (`PWEB-34`): доедь одно без другого — раздел
    // назвал бы каждый пульт сам, и перечни разошлись бы ровно так же, как без поля вовсе.
    expect(passport.group).toBe("actions");
    expect(passport.подписьГруппы).toBe("Действия");
  });

  it("правило вложенности приезжает решением, а не только данными", () => {
    // Гейт `PWEB-24`. Читателю паспорта — редактору и механике сборки — нужен ОТВЕТ «пускать
    // или отвергнуть», и ответ обязан приехать из поставки вместе с паспортом. Не уедь он —
    // каждый читатель написал бы своё правило поверх одних и тех же данных, и правила разошлись
    // бы молча: оба зелёные, дерево у каждого своё.
    const решение = runInConsumer(
      `import { admits, editorInfoOf, passportOf } from "${PKG}/passport";

const кнопка = passportOf("button");
const editorInfo = editorInfoOf("button");
const корень = editorInfo.parts[кнопка.root];

console.log(JSON.stringify({
  genus: editorInfo.genus,
  подпись: admits(корень, { kind: "content", genus: "text" }),
  значок: admits(корень, { kind: "content", genus: "icon" }),
  компонент: admits(корень, { kind: "content", genus: editorInfo.genus }),
}));`,
    ) as { genus: string; подпись: boolean; значок: boolean; компонент: boolean };

    // Род компонента — вторая сторона того же правила: без него кандидата опознавали бы по
    // имени пакета, а такой перечень отстанет на первом же новом значке.
    expect(решение.genus).toBe("component");
    expect(решение.подпись).toBe(true);
    expect(решение.значок).toBe(true);
    expect(решение.компонент).toBe(false);
  });

  it("мост «узел → координата» приезжает тем же подпутём", () => {
    // Гейт `PWEB-27`, средство 1. Скину нужен не только паспорт, но и превращение узла в
    // координату, и жить оно обязано рядом с формой: узкая запись на стороне скина стала бы
    // ТРЕТЬЕЙ копией формы — после самой формы и после узкой записи механики сборки.
    //
    // Здесь предмет — что мост доехал до потребителя и решает через поставку. Узел поэтому
    // заменён самым узким, что от него нужно: DOM в этом бандле нет и быть не должно, а
    // настоящая проба идёт по живому документу (`test/passport-view.test.tsx`).
    const снято = runInConsumer(
      `import { coordinateOf, passportOf } from "${PKG}/passport";

const адрес = { "data-scope": "button", "data-part": "root" };
const узел = {
  getAttribute: (имя) => адрес[имя] ?? null,
  hasAttribute: () => false,
  matches: () => false,
  parentElement: null,
};

console.log(JSON.stringify({
  адресуем: coordinateOf(узел, passportOf),
  безПаспорта: coordinateOf(узел, () => undefined) ?? null,
}));`,
    ) as { адресуем: { component: string; part: string; states: string[] }; безПаспорта: null };

    expect(снято.адресуем).toEqual({ component: "button", part: "root", states: [] });

    // И вторая сторона: компонент, паспорта не объявивший, не адресуем — заглушки, похожей на
    // объявленный контракт, читатель не получает.
    expect(снято.безПаспорта).toBeNull();
  });

  it("настройки, переменные узла и базовая сборка едут ТЕМ ЖЕ подпутём", () => {
    // Гейт `PWEB-89`. Все три — знание поставщика, которого машина прочесть не могла: настройки
    // проходили насквозь и не были названы нигде, сборку выдумывала витрина, переменные Zag
    // существовали только в комментарии. Проверяется, что они доехали до потребителя ИСПОЛНЕНИЕМ
    // из чистой установки, а не лежат в исходниках.
    //
    // Сборка при этом СОБИРАЕТСЯ — `baseAssemblyOf` отдаёт плоское дерево с корнем, ту самую
    // форму, которую читает механика сборки. Проверь мы здесь только запись, гейт был бы зелен и
    // на объявлении, которое ни во что не разворачивается.
    const снято = runInConsumer(
      `import { baseAssemblyOf, editorInfoOf, passportOf, SETTINGS } from "${PKG}/passport";

const гармошка = passportOf("accordion");
const editorInfo = editorInfoOf("accordion");
const содержимое = гармошка.parts.find((часть) => часть.name === "itemContent");
const сборка = editorInfo.assemblies[0];
const дерево = baseAssemblyOf(гармошка, сборка);
const подЧужимИменем = baseAssemblyOf(гармошка, сборка, "ui.accordion");
const значокБезСборки = editorInfoOf("icon").assemblies.length === 0 ? null : "есть";

console.log(JSON.stringify({
  настройки: Object.keys(гармошка.settings).sort(),
  вПеречне: Object.keys(гармошка.settings).every((имя) => имя in SETTINGS),
  положение: гармошка.settings.orientation.values.kind,
  умолчание: гармошка.settings.orientation.byDefault,
  переменные: содержимое.variables.map((переменная) => переменная.name),
  ставит: содержимое.variables.map((переменная) => переменная.setBy),
  корень: дерево.components.root,
  узлов: Object.keys(дерево.components.nodes).length,
  адреса: [...new Set(Object.values(дерево.components.nodes).map((узел) => узел.type).filter(Boolean))].sort(),
  пропыРаздела: Object.values(дерево.components.nodes).find((узел) => узел.type === "accordion.item").props,
  подписи: Object.values(дерево.components.nodes).filter((узел) => узел.genus).map((узел) => узел.value),
  чужоеИмя: подЧужимИменем.components.root,
  чужиеАдреса: [...new Set(Object.values(подЧужимИменем.components.nodes).map((узел) => узел.type).filter(Boolean))].sort(),
  безСборки: значокБезСборки,
}));`,
    ) as {
      настройки: string[];
      вПеречне: boolean;
      положение: string;
      умолчание: string;
      переменные: string[];
      ставит: string[];
      корень: string;
      узлов: number;
      адреса: string[];
      пропыРаздела: Record<string, unknown>;
      подписи: string[];
      чужоеИмя: string;
      чужиеАдреса: string[];
      безСборки: string | null;
    };

    // 1. Настройки — чем компонент МОЖЕТ БЫТЬ. Ключи сверены с пропами типом при объявлении;
    // здесь проверяется, что объявленное доехало и что имена из закрытого перечня.
    expect(снято.настройки).toEqual(["collapsible", "multiple", "orientation"]);
    expect(снято.вПеречне).toBe(true);
    expect(снято.положение).toBe("choice");
    expect(снято.умолчание).toBe("vertical");

    // 2. Переменные, которые кит кладёт на узел. Без них анимации раскрытия не существует:
    // `auto` не анимируется, а придумать число за чужое содержимое нельзя.
    expect(снято.переменные).toEqual(["--height", "--width"]);
    expect(снято.ставит).toEqual(["kit", "kit"]);

    // 3. Базовая сборка — собранная, а не записанная. Три раздела, у каждого свой `value`:
    // без него Ark не знает, какой пункт раскрывать.
    expect(снято.корень).toBe("accordion");
    expect(снято.узлов).toBeGreaterThan(3);
    expect(снято.адреса).toEqual([
      "accordion",
      "accordion.item",
      "accordion.itemContent",
      "accordion.itemIndicator",
      "accordion.itemTrigger",
    ]);
    expect(снято.пропыРаздела).toEqual({ value: "раздел-1" });
    expect(снято.подписи).toContain("Раздел 1");

    // Адрес компонента — ВХОД, а не константа: в реестре он может лежать под чужим
    // пространством имён, и зашитый адрес сломал бы сборку у первого же такого потребителя.
    expect(снято.чужоеИмя).toBe("ui.accordion");
    expect(снято.чужиеАдреса).toContain("ui.accordion.itemTrigger");

    // Компонент, не объявивший сборку (значок), отдаёт ПУСТОЙ перечень — честно, а не пустым
    // деревом: пустое дерево выглядело бы как объявленный экземпляр, которого нет.
    expect(снято.безСборки).toBeNull();
  });

  it("ненадёжный признак доезжает пометкой, а не комментарием — вместе с правилом о нём", () => {
    // Гейт `PWEB-97`. Комментарий в исходнике потребителю не достаётся вовсе, а решать по этому
    // знанию обязаны двое: вид отбрасывает состояние, движение его читает. Поэтому проверяется
    // ИСПОЛНЕНИЕМ из чистой установки, что доехали обе половины — данные и правило.
    const снято = runInConsumer(
      `import { addressesView, coordinateOf, passportOf } from "${PKG}/passport";

const гармошка = passportOf("accordion");
const содержимое = гармошка.parts.find((часть) => часть.name === "itemContent");
const раскрытость = (часть) => гармошка.parts.find((ч) => ч.name === часть).states.find((с) => с.name === "open");

// Узел содержимого — руками: браузера здесь нет, а признак нужен ИМЕННО приехавший, чтобы было
// видно, что мост отбрасывает состояние по объявлению, а не по его отсутствию на узле.
const адрес = { "data-scope": "accordion", "data-part": "item-content", "data-state": "open" };
const узел = {
  getAttribute: (имя) => адрес[имя] ?? null,
  hasAttribute: (имя) => имя in адрес,
  matches: () => false,
  parentElement: null,
};

console.log(JSON.stringify({
  объявлено: содержимое.states.map((состояние) => состояние.name),
  оговорка: Boolean(раскрытость("itemContent").absentWhen),
  уПункта: раскрытость("item").absentWhen ?? null,
  годитсяВиду: addressesView(раскрытость("itemContent")),
  надёжноеГодится: addressesView(раскрытость("item")),
  вКоординате: coordinateOf(узел, passportOf).states,
}));`,
    ) as {
      объявлено: string[];
      оговорка: boolean;
      уПункта: string | null;
      годитсяВиду: boolean;
      надёжноеГодится: boolean;
      вКоординате: string[];
    };

    // Состояние объявлено — движению есть что адресовать; оговорка приехала данными.
    expect(снято.объявлено).toContain("open");
    expect(снято.оговорка).toBe(true);
    // И только у содержимого: у пункта раскрытость надёжна, и оговорка там соврала бы.
    expect(снято.уПункта).toBeNull();

    // Правило доехало вместе с данными — иначе каждый читатель написал бы своё.
    expect(снято.годитсяВиду).toBe(false);
    expect(снято.надёжноеГодится).toBe(true);

    // И мост под вид его применяет: признак на узле стоит, а в координате состояния нет.
    expect(снято.вКоординате).not.toContain("open");
  });

  it("перечень паспортов порождён сборкой — по папкам компонентов, а не руками", () => {
    // Гейт `PWEB-2`: файла, в который дописывает строку каждый новый компонент, быть не
    // должно. Проверяется это единственным честным способом — сверкой того, что уехало в
    // поставку, с тем, что лежит в исходниках: папка с анатомией обязана дать паспорт, и
    // паспорт обязан иметь папку.
    const declared = readdirSync(join(pkgRoot, "src"), { withFileTypes: true })
      .filter((item) => item.isDirectory())
      .map((item) => item.name)
      .filter((name) => existsSync(join(pkgRoot, "src", name, `${name}.anatomy.ts`)));

    const shipped = runInConsumer(
      `import { PASSPORTS } from "${PKG}/passport";
console.log(JSON.stringify(Object.keys(PASSPORTS)));`,
    ) as string[];

    expect(declared.length).toBeGreaterThan(0);
    expect([...shipped].sort()).toEqual([...declared].sort());
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
    // `@omnifield/probe-web-skin` тут исключение и названо им: это и есть предмет чтения —
    // форма паспорта, включая `createAnatomy`, приезжает РЕЭКСПОРТОМ оттуда (`PWEB-110`,
    // `PWEB-112`), а не прямым импортом `@zag-js/anatomy` — второго npm-имени на один поток
    // здесь больше нет.
    const bundle = readFileSync(join(install, "node_modules", PKG, "dist", "passport.js"), "utf8");

    expect(bundle).not.toContain("solid-js");
    expect(bundle).not.toContain("@kobalte/core");
    expect(bundle).toContain("@omnifield/probe-web-skin");

    // Анатомия компонента, приехавшего из Ark, берётся у ПЕРВОИСТОЧНИКА —
    // `@zag-js/accordion/anatomy`, — а не через `@ark-ui/solid/anatomy` (`PWEB-37`). Разница не
    // косметическая: у подпути Ark есть ветка `solid` с файлом `.jsx`, и читатель паспорта, чей
    // резолвер её понимает, получает JSX там, где ждал данные. Здесь же нет ни Solid, ни машины
    // состояний — только объявление частей, и Ark берёт его оттуда же.
    expect(bundle).toContain("@zag-js/accordion/anatomy");
    expect(bundle).not.toContain("@ark-ui/solid");
  });
});
