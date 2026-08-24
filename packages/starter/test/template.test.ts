// ГРУЗ. Судим содержимое пяти файлов и подстановку — тем же ejs и с теми же дефолтами,
// какими её сделает дверь (`baser-cli/dist/lib/render.js`: `ejs.render(шаблон, значения)`).

import ejs from "ejs";
import { describe, expect, it } from "vitest";

import { declaration, defaults, readTemplate } from "./source.js";

const RUNTIME = "@omnifield/probe-web-runtime";
const BUILD = "@omnifield/probe-web-build";
const UI = "@omnifield/probe-web-ui";
const STYLE = "@omnifield/probe-web-style";

interface SkeletonManifest {
  readonly name: string;
  readonly dependencies: Record<string, string>;
  readonly devDependencies: Record<string, string>;
}

describe("язык подстановки", () => {
  const rendered = declaration.layout.filter((entry) => entry.render !== false);

  it("рендеримый шаблон не пользуется экранирующим выводом и include", () => {
    for (const entry of rendered) {
      const text = readTemplate(entry.src);
      // `<%=` превращает кавычку в `&#34;` и валидный JSON перестаёт быть JSON;
      // `include(…)` тянул бы содержимое мимо объявленной раскладки. Оба запрещены
      // формой (`baser-contracts/template.ts`).
      expect(text, entry.src).not.toContain("<%=");
      expect(text, entry.src).not.toMatch(/include\s*\(/);
    }
  });

  it("нерендеримые файлы не содержат тегов подстановки вовсе", () => {
    // Они едут байт в байт: тег в них уехал бы к потребителю как текст.
    for (const entry of declaration.layout.filter((e) => e.render === false)) {
      expect(readTemplate(entry.src), entry.src).not.toContain("<%");
    }
  });
});

describe("манифест скелета", () => {
  const render = (values: Record<string, unknown>): SkeletonManifest =>
    JSON.parse(ejs.render(readTemplate("package.json.ejs"), { ...values }, {})) as SkeletonManifest;

  it("на дефолтах даёт валидный JSON", () => {
    expect(() => render(defaults)).not.toThrow();
  });

  it("берёт версии наших пакетов настройками, а не хардкодом", () => {
    // Версию в шаблоне не хардкодим: дефолт проставляет architect при публикации, и
    // незаполненная у локации настройка едет за нашими выпусками (`PROBEWEB-4`).
    // Это же снимает блокировку между зонами — starter не ждёт ничьей публикации.
    const source = readTemplate("package.json.ejs");
    for (const setting of ["runtimeVersion", "buildVersion", "uiVersion", "styleVersion"]) {
      expect(source, setting).toContain(`<%- ${setting} %>`);
    }

    const own = render({
      ...defaults,
      runtimeVersion: "1.2.3",
      buildVersion: "2.3.4",
      uiVersion: "3.4.5",
      styleVersion: "4.5.6",
    });
    expect(own.dependencies[RUNTIME]).toBe("1.2.3");
    expect(own.devDependencies[BUILD]).toBe("2.3.4");
    expect(own.dependencies[UI]).toBe("3.4.5");
    expect(own.dependencies[STYLE]).toBe("4.5.6");
  });

  it("берёт имя продукта настройкой", () => {
    expect(render({ ...defaults, productName: "sandbox" }).name).toBe("sandbox");
  });

  it("зовёт зоны зависимостями, а не копией их кода", () => {
    // Критерий готовности выпуска — «приложение собралось из УСТАНОВЛЕННЫХ пакетов».
    // Скопированный в скелет код подтвердил бы укладку файлов и не подтвердил бы шов.
    const own = render(defaults);
    expect(Object.keys(own.dependencies).sort()).toEqual([RUNTIME, STYLE, UI, "solid-js"].sort());
    // `build` — оснастка сборки: у потребителя она нужна только когда он собирает.
    // vite и typescript стоят рядом с ней потому, что зоны держат их peer-зависимостями:
    // поставить их за потребителя они не могут.
    expect(Object.keys(own.devDependencies).sort()).toEqual([BUILD, "typescript", "vite"].sort());
  });

  it("называет style явно, а не транзитивно через ui", () => {
    // Приложение импортирует CSS стилевого слоя напрямую (`main.tsx`), а строгий менеджер
    // пакетов транзитивный импорт не разрешит. Это не избыточность (`PROBEWEB-4`).
    const own = render(defaults);
    expect(own.dependencies).toHaveProperty(STYLE);
    expect(readTemplate("main.tsx")).toContain(`"${STYLE}/base.css"`);
  });
});

describe("разметка страницы", () => {
  const html = readTemplate("index.html");

  it("даёт точку монтирования #root", () => {
    // DOM-контракт: идентификатор `root` — часть замороженной поверхности наравне с
    // экспортами, потому что живёт в placed-once-файле у потребителя.
    expect(html).toContain('<div id="root"></div>');
  });

  it("подключает точку входа скелета", () => {
    expect(html).toContain('<script type="module" src="/src/main.tsx"></script>');
  });
});

describe("сборка у потребителя", () => {
  it("конфиг Vite не знает ни про плагины, ни про версию", () => {
    const config = readTemplate("vite.config.ts");
    expect(config).toContain(`from "${BUILD}/vite"`);
    expect(config).toContain("export default defineConfig()");
    // Судим КОД, а не пояснение над ним: комментарий эти же слова называет вслух, и
    // проба по сырому тексту падала бы на собственной доке.
    const code = config.replace(/^\s*\/\/.*$/gm, "").trim();
    // Всё, что обязано двигаться, спрятано за точкой: назови плагин или порт здесь —
    // и он замёрзнет у каждого потребителя навсегда (`PROBEWEB-4`).
    expect(code).not.toMatch(/solid|plugins|\bserver\b|\bport\b/);
    expect(code.split("\n")).toHaveLength(3);
  });

  it("tsconfig наследует базу build одной строкой", () => {
    const tsconfig = JSON.parse(readTemplate("tsconfig.json")) as Record<string, unknown>;
    expect(tsconfig).toEqual({
      extends: `${BUILD}/tsconfig`,
      include: ["src", "vite.config.ts"],
    });
    // `compilerOptions` здесь — это замороженные цель компиляции и способ разрешения
    // путей; они живут в build и двигаются его выпуском. Смена `jsxImportSource` на
    // Solid 2.0 доедет выпуском, не задев ни одного созданного продукта.
    expect(tsconfig).not.toHaveProperty("compilerOptions");
  });
});
