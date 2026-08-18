// ПРОБА НАБОРА ЗНАЧКОВ: имя ведёт к картинке, картинка — из набора, и файл не разошёлся с моделью.
//
// Значок отличается от остального оформления тем, что его ставит ПОТРЕБИТЕЛЬ по имени. Значит
// проверять надо не «правила написаны», а три вещи, каждая из которых ломается молча:
//
//   1. КАЖДОЕ имя из ядра доехало до CSS и ведёт к своей переменной. Опечатка в имени не роняет
//      ничего — потребитель просто получает пустоту там, где ждал значок.
//   2. ФОЛБЭК на месте. Без пустой маски неизвестное имя даёт ЗАКРАШЕННЫЙ КВАДРАТ: `mask-image:
//      none` означает «маски нет», и заливка `currentColor` красится целиком. Поймано замером на
//      живой странице, а не рассуждением.
//   3. ФАЙЛ РАВЕН МОДЕЛИ. Файл сгенерирован и лежит в репозитории; правка модели без прогона
//      генератора означала бы, что на стенде одно, а у потребителя другое.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { CORE, KIT_GLYPHS, TRIGGER_MARKS } from "../src/icons/core.js";
import { skinFile, stripComments, ZONE } from "./css.js";

const icons = () => skinFile("icons.css");

/** Набор Lucide как данные — тот же файл, из которого генерируется CSS. */
function lucide(): { icons: Record<string, { body: string }> } {
  const path = join(ZONE, "node_modules", "@iconify-json", "lucide", "icons.json");
  return JSON.parse(readFileSync(path, "utf8")) as { icons: Record<string, { body: string }> };
}

describe("ядро набора", () => {
  it("имена уникальны и годятся для атрибута", () => {
    // Имя уезжает в `data-icon` и в имя переменной: пробел или заглавная сломают одно из двух.
    const names = CORE.map((icon) => icon.name);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it("у каждого значка названа причина, по которой он в ядре", () => {
    // Без причины набор растёт до тысячи имён и перестаёт быть набором: «может пригодиться» —
    // не отбор. Проверяется не красота текста, а его наличие и осмысленная длина.
    const silent = CORE.filter((icon) => icon.why.trim().length < 10);
    expect(silent, "значок без причины в ядре").toEqual([]);
  });

  it("каждый значок ядра существует в наборе Lucide", () => {
    const set = lucide();
    const missing = CORE.filter((icon) => !set.icons[icon.name]);
    expect(missing.map((i) => i.name), "имени нет в наборе — значок будет пустым").toEqual([]);
  });

  it("каждое имя ядра доехало до CSS и ведёт к своей переменной", () => {
    const css = stripComments(icons());
    const broken = CORE.filter(
      (icon) =>
        !css.includes(`--icon-${icon.name}: url(`) ||
        !css.includes(`[data-icon="${icon.name}"] { --icon: var(--icon-${icon.name}); }`),
    );

    expect(broken.map((i) => i.name), "имя есть в ядре, но не работает в CSS").toEqual([]);
  });

  it("в CSS нет значков, которых нет в ядре", () => {
    // Вторая сторона: правка руками в сгенерированном файле проезжает молча, пока её кто-нибудь
    // не сотрёт следующим прогоном генератора.
    const css = stripComments(icons());
    const inCss = [...css.matchAll(/\[data-icon="([a-z0-9-]+)"\]/g)].map(([, name]) => name);
    const extra = inCss.filter((name) => !CORE.some((icon) => icon.name === name));

    expect([...new Set(extra)], "значок в CSS мимо ядра").toEqual([]);
  });
});

describe("общее правило значка", () => {
  it("размер в em и цвет currentColor — иначе значок не следует за контролом", () => {
    const css = stripComments(icons());

    expect(css, "нет размера в em: значок перестанет следовать за кеглем").toMatch(
      /\[data-icon\]\s*\{[^}]*inline-size:\s*1em/,
    );
    expect(css, "нет currentColor: значок перестанет брать роль у места установки").toMatch(
      /\[data-icon\]\s*\{[^}]*background-color:\s*currentColor/,
    );
  });

  it("у маски есть ПУСТОЙ фолбэк — иначе неизвестное имя даёт закрашенный квадрат", () => {
    // Самая обидная поломка набора: `mask-image: none` это «маски нет», и заливка красится
    // целиком. Потребитель видит чёрный квадрат и думает, что сломано оформление, а не имя.
    const css = stripComments(icons());

    expect(css, "маска читается без фолбэка").toContain("mask-image: var(--icon, var(--icon-empty))");
    expect(css, "нет самой пустой маски").toMatch(/--icon-empty:\s*url\(/);
  });
});

describe("значки в узлах кита", () => {
  it("подменяется только дефолт кита, а содержимое потребителя не трогается", () => {
    // `:not(:has(*))` — вся защита прав потребителя в этом наборе: поставил свой значок
    // элементом, наше правило снялось. Без этого набор отбирал бы у него разметку.
    const css = stripComments(icons());

    for (const slot of Object.keys(KIT_GLYPHS)) {
      expect(css, `${slot}: правило не уступает содержимому потребителя`).toContain(
        `[data-slot~="${slot}"]:not(:has(*))`,
      );
    }
  });

  it("метка открывашки уступает своему значку потребителя", () => {
    const css = stripComments(icons());

    for (const slot of Object.keys(TRIGGER_MARKS)) {
      expect(css, `${slot}: метка не уступает значку потребителя`).toContain(
        `[data-slot~="${slot}"]:not(:has([data-icon]))::after`,
      );
    }
  });

  it("значок навешен только на зацепку, которую кит обещал", () => {
    // Опора на выдуманное имя не упадёт сама: правило просто не применится.
    const promised = readFileSync(
      join(ZONE, "..", "..", "packages", "ui", "test", "slot-list.ts"),
      "utf8",
    );
    const slots = [...Object.keys(KIT_GLYPHS), ...Object.keys(TRIGGER_MARKS)];
    const unknown = slots.filter((slot) => !promised.includes(`"${slot}"`));

    expect(unknown, "зацепки нет в обещании кита").toEqual([]);
  });
});

describe("сгенерированный файл", () => {
  it("совпадает с тем, что выпускает генератор", () => {
    // Тот же приём, что у пресетов: файл в репозитории — поставка, модель — источник. Разойтись
    // они могут только молча, поэтому сверяем прогоном, а не глазами.
    const before = icons();
    execFileSync("node", ["--experimental-strip-types", "scripts/build-icons.mjs"], { cwd: ZONE });
    const after = icons();

    expect(after, "icons.css разошёлся с моделью — перегенерируйте: pnpm run build:icons").toBe(
      before,
    );
  });
});
