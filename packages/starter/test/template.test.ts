// ГРУЗ. Судим содержимое пяти файлов и подстановку — тем же ejs и с теми же дефолтами,
// какими её сделает дверь (`baser-cli/dist/lib/render.js`: `ejs.render(шаблон, значения)`).

import ejs from "ejs";
import { describe, expect, it } from "vitest";

import { declaration, defaults, readTemplate } from "./source.js";

const KIT = "@omnifield/probe-web-kit";

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
  const render = (values: Record<string, unknown>): Record<string, never> =>
    JSON.parse(ejs.render(readTemplate("package.json.ejs"), { ...values }, {}));

  it("на дефолтах даёт валидный JSON", () => {
    expect(() => render(defaults)).not.toThrow();
  });

  it("берёт версию kit настройкой, а не хардкодом", () => {
    // Версию в шаблоне не хардкодим: дефолт проставляет architect при публикации, и
    // незаполненная у локации настройка едет за нашими выпусками (`kb:PROBEWEB-2`).
    expect(readTemplate("package.json.ejs")).toContain("<%- kitVersion %>");

    const own = render({ ...defaults, kitVersion: "1.2.3" }) as unknown as {
      dependencies: Record<string, string>;
    };
    expect(own.dependencies[KIT]).toBe("1.2.3");
  });

  it("берёт имя продукта настройкой", () => {
    const own = render({ ...defaults, productName: "sandbox" }) as unknown as {
      name: string;
    };
    expect(own.name).toBe("sandbox");
  });

  it("зовёт kit зависимостью, а не копией его кода", () => {
    // Критерий готовности шва — «фронт собран из УСТАНОВЛЕННОГО пакета». Скопированный
    // в скелет код подтвердил бы укладку файлов и не подтвердил бы шов (`kb:PROBEWEB-2`).
    const own = render(defaults) as unknown as {
      dependencies: Record<string, string>;
      devDependencies: Record<string, string>;
    };
    expect(own.dependencies).toHaveProperty(KIT);
    expect(Object.keys(own.dependencies).sort()).toEqual([KIT, "solid-js"]);
    // vite и typescript стоят в скелете потому, что kit держит их peer-зависимостями:
    // поставить их за потребителя он не может.
    expect(Object.keys(own.devDependencies).sort()).toEqual(["typescript", "vite"]);
  });
});

describe("разметка страницы", () => {
  const html = readTemplate("index.html");

  it("даёт точку монтирования #root", () => {
    // DOM-контракт: идентификатор `root` — часть замороженной поверхности наравне с
    // тремя экспортами, потому что живёт в placed-once-файле у потребителя.
    expect(html).toContain('<div id="root"></div>');
  });

  it("подключает точку входа скелета", () => {
    expect(html).toContain('<script type="module" src="/src/main.tsx"></script>');
  });
});

describe("сборка у потребителя", () => {
  it("конфиг Vite не знает ни про плагины, ни про версию", () => {
    const config = readTemplate("vite.config.ts");
    expect(config).toContain(`from "${KIT}/vite"`);
    expect(config).toContain("export default defineConfig()");
    // Судим КОД, а не пояснение над ним: комментарий эти же слова называет вслух, и
    // проба по сырому тексту падала бы на собственной доке.
    const code = config.replace(/^\s*\/\/.*$/gm, "").trim();
    // Всё, что обязано двигаться, спрятано за точкой: назови плагин или порт здесь —
    // и он замёрзнет у каждого потребителя навсегда (`kb:PROBEWEB-2`).
    expect(code).not.toMatch(/solid|plugins|\bserver\b|\bport\b/);
    expect(code.split("\n")).toHaveLength(3);
  });

  it("tsconfig наследует базу kit одной строкой", () => {
    const tsconfig = JSON.parse(readTemplate("tsconfig.json")) as Record<string, unknown>;
    expect(tsconfig).toEqual({
      extends: `${KIT}/tsconfig`,
      include: ["src", "vite.config.ts"],
    });
    // `compilerOptions` здесь — это замороженные цель компиляции и способ разрешения
    // путей; они живут в kit и двигаются его выпуском.
    expect(tsconfig).not.toHaveProperty("compilerOptions");
  });
});
