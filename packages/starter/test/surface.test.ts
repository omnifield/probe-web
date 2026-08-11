// ЗАМОРОЖЕННАЯ ПОВЕРХНОСТЬ. Скелет едет placed-once: файлы, которые он положит, зовут наши
// пакеты вечно и той версией вызова, какой их положили. Значит замораживается не файл, а
// ПОВЕРХНОСТЬ, которую скелет трогает, — и держать её узкой обязан именно этот пакет
// (`kb:PROBEWEB-4`).
//
// Проба сторожит ЧИСЛО касаний, а не их правильность: правильность судят пробы самих зон.
// Здесь падает попытка позвать из скелета что-то сверх объявленных точек — то есть
// заморозить у потребителя больше, чем решено контрактом.

import { describe, expect, it } from "vitest";

import { declaration, readTemplate } from "./source.js";

const RUNTIME = "@omnifield/probe-web-runtime";
const BUILD = "@omnifield/probe-web-build";
const UI = "@omnifield/probe-web-ui";
const STYLE = "@omnifield/probe-web-style";

/** Точки контракта, которых касается скелет, — и ни одной больше без мажора и architect'а. */
const FROZEN_ENTRYPOINTS = [
  `${BUILD}/tsconfig`,
  `${BUILD}/vite`,
  RUNTIME,
  `${STYLE}/base.css`,
  `${STYLE}/themes.css`,
  UI,
];

/**
 * Что скелет зовёт ПО ИМЕНАМ и откуда. Типы (`${BUILD}/tsconfig`) точки входа не имеют, CSS
 * (`${STYLE}/base.css`) подключается побочкой — потому их здесь нет.
 */
const FROZEN_IMPORTS: Record<string, readonly string[]> = {
  [RUNTIME]: ["mount"],
  [UI]: ["Button"],
  [`${BUILD}/vite`]: ["defineConfig"],
};

/** Пакет 0.1.0: `kit` растворён на четыре зоны, и в скелете его быть не может. */
const DISSOLVED = "@omnifield/probe-web-kit";

/**
 * Файлы груза, которые ЗОВУТ наши пакеты кодом. Манифест сюда не входит намеренно: он
 * называет пакеты зависимостями, а не точками входа, и его состав судит `template.test.ts`.
 * Смешать эти два перечня значило бы считать строку `"@omnifield/probe-web-style"` в
 * `dependencies` касанием поверхности.
 */
const CODE = declaration.layout.filter((entry) => entry.dest !== "web/package.json");

/** Файл груза без строчных комментариев: судим КОД, а не пояснение над ним. */
function code(src: string): string {
  return readTemplate(src).replace(/^\s*\/\/.*$/gm, "");
}

/** Каждое упоминание наших пакетов в коде скелета: `from "…"`, `import "…"`, `extends`. */
function references(): string[] {
  const found: string[] = [];
  for (const entry of CODE) {
    for (const match of code(entry.src).matchAll(
      /["'](@omnifield\/probe-web-[a-z]+)(\/[a-z0-9./-]*)?["']/g,
    )) {
      found.push(`${match[1]}${match[2] ?? ""}`);
    }
  }
  return found;
}

describe("поверхность зон, вызываемая скелетом", () => {
  it("трогает ровно объявленные точки", () => {
    expect([...new Set(references())].sort()).toEqual([...FROZEN_ENTRYPOINTS].sort());
  });

  it("не тянет ничего мимо объявленных точек", () => {
    // Глубокий путь (`…/dist/…`, `…/src/…`) заморозил бы внутренности, которые зона
    // считает своими и ломает свободно.
    for (const reference of references()) {
      expect(FROZEN_ENTRYPOINTS, reference).toContain(reference);
    }
  });

  it("не помнит растворённый kit", () => {
    // Три точки 0.1.0 пересмотрены один раз и больше никогда (`kb:PROBEWEB-4`). Ссылка,
    // забытая в грузе, уехала бы к потребителю ненаходимой зависимостью.
    for (const entry of declaration.layout) {
      expect(readTemplate(entry.src), entry.src).not.toContain(DISSOLVED);
    }
  });

  it("зовёт по именам только то, что объявлено, и из своей точки", () => {
    const names: Record<string, Set<string>> = {};
    for (const entry of CODE) {
      for (const match of code(entry.src).matchAll(
        /import\s*\{([^}]*)\}\s*from\s*["'](@omnifield\/probe-web-[a-z/.-]*)["']/g,
      )) {
        const from = (names[match[2] ?? ""] ??= new Set<string>());
        for (const name of (match[1] ?? "").split(",")) {
          if (name.trim() !== "") {
            from.add(name.trim());
          }
        }
      }
    }
    expect(
      Object.fromEntries(
        Object.entries(names)
          .map(([module, imported]) => [module, [...imported].sort()] as const)
          .sort(([a], [b]) => a.localeCompare(b)),
      ),
    ).toEqual(FROZEN_IMPORTS);
  });
});

describe("точка входа скелета", () => {
  const main = readTemplate("main.tsx");

  it("монтирует приложение одним вызовом", () => {
    expect(main).toContain(`import { mount } from "${RUNTIME}";`);
    // Счёт по коду без комментариев: пояснение над файлом называет `mount()` вслух, и
    // проба по сырому тексту падала бы на собственной доке.
    expect(code("main.tsx").match(/\bmount\(/g)).toHaveLength(1);
  });

  it("не ищет точку монтирования сама", () => {
    // `#root` ищет рантайм — в сигнатуре её нет намеренно, иначе способ разметки страницы
    // оказался бы заморожен заодно (`kb:PROBEWEB-4`).
    expect(main).not.toContain("getElementById");
    expect(main).not.toContain("querySelector");
  });

  it("показывает работающий кит, а не пустую страницу", () => {
    // Цена названа контрактом и принята: примитив и CSS замерзают в скелете ради того,
    // чтобы `baser add` давал видимый результат, а не белый экран.
    expect(main).toContain(`import { Button } from "${UI}";`);
    expect(main).toMatch(/<Button>[^<]+<\/Button>/);
  });

  it("подключает CSS стилевого слоя напрямую и побочкой", () => {
    // Напрямую — потому что строгий менеджер пакетов транзитивный импорт не разрешит;
    // побочкой — потому что `sideEffects: false` у стиля запрещает отдавать CSS из корня.
    //
    // Подпуть с расширением, а не `/css`: шаблон `declare module '*.css'` из `vite/client`
    // сопоставляется с ТЕКСТОМ спецификатора, и без `.css` на конце `tsc` у потребителя
    // падает с TS2882 (дефект найден зоной `reference`, `tasker:PROBEWEB-14`).
    expect(main).toContain(`import "${STYLE}/base.css";`);
    // Тема — вторая строка, а не избыточность: базовый слой держит инвариант «ни одного
    // литерального цвета», значения приходят темой. Без неё var() не разрешается и
    // страница выходит бесцветной — ровно та «пустая страница», ради которой контракт
    // и велел скелету показывать работающий кит.
    expect(main).toContain(`import "${STYLE}/themes.css";`);
  });

  it("не тянет solid напрямую", () => {
    // Скелету достаточно JSX, который настроен базой типов из `build`. Прямой импорт
    // `solid-js` заморозил бы ещё и его API у каждого потребителя.
    expect(main).not.toContain("solid-js");
  });
});
