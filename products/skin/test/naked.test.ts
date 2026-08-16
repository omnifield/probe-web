// ПРОБА, КОТОРАЯ СТЕРЕЖЁТ ПЕРВОЕ ПРАВИЛО ЗОНЫ: кит без `skin` остаётся голым.
//
// Правило первое (kb:PROBEWEB-11): оформление подключается отдельно и снимается отдельно;
// потребитель, взявший кит без нас, получает ровно то, что получал раньше. Нарушить его можно
// тихо — достаточно, чтобы наш CSS где-нибудь импортировался побочным эффектом, и оформление
// начнёт приезжать всем.
//
// Здесь — часть, проверяемая по ИСХОДНИКАМ. Вторая половина, рендер примитива в документ,
// живёт в `naked-dom.test.tsx` и сейчас не запускается: пресет тестов из зоны `build` не
// разрешает `.jsx` из kobalte. Причина названа там же.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { ZONE } from "./css.js";

const UI_SRC = join(ZONE, "..", "..", "packages", "ui", "src");

function uiSources(): { name: string; text: string }[] {
  return readdirSync(UI_SRC)
    .filter((name) => name.endsWith(".ts") || name.endsWith(".tsx"))
    .map((name) => ({ name, text: readFileSync(join(UI_SRC, name), "utf8") }));
}

describe("кит без skin остаётся голым", () => {
  it("зона ui нигде не упоминает skin — зависимость односторонняя", () => {
    const mentions = uiSources()
      .filter((f) => /\bskin\b/i.test(f.text))
      .map((f) => f.name);

    expect(mentions, "кит знает про оформление — это нарушение правила первого").toEqual([]);
  });

  it("кит не привозит собственного CSS", () => {
    // Второй способ одеть кит молча — положить стили внутрь него самого. Тогда снять их
    // потребитель уже не сможет, и безголовость кончится, не объявив об этом.
    const css = readdirSync(UI_SRC).filter((name) => name.endsWith(".css"));

    expect(css, "в исходниках кита появился CSS").toEqual([]);
  });

  it("наши модули не импортируют оформление побочным эффектом", () => {
    // Оформление обязано подключаться ЯВНО, потребителем. Импорт из нашего же кода означал бы,
    // что оно приезжает вместе с чем угодно и снять его нельзя.
    const src = join(ZONE, "src");
    const offenders: string[] = [];

    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(path);
          continue;
        }
        if (!/\.tsx?$/.test(entry.name)) continue;
        // Комментарии снимаем: в них у нас приведён ПРИМЕР того, как импортирует потребитель,
        // и проба по сырому тексту ловила бы собственное пояснение.
        const text = readFileSync(path, "utf8").replaceAll(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
        // Стенд берёт оформление строкой (`?inline`) и вставляет его сам — это показ снятия,
        // а не побочный импорт. Запрещён именно импорт-эффект: `import "…skin.css"`.
        if (/import\s+"[^"]*skin[^"]*\.css"/.test(text)) offenders.push(entry.name);
      }
    };
    walk(src);

    expect(offenders, "оформление импортируется побочным эффектом").toEqual([]);
  });

  it("поставка не содержит ни одного JS-модуля", () => {
    // Оформление — только CSS. Появившийся здесь `.ts` означал бы рантайм в поставке: его
    // нельзя ни снять импортом, ни переопределить каскадом.
    const files = readdirSync(join(ZONE, "src", "skin"));
    const notCss = files.filter((name) => !name.endsWith(".css"));

    expect(notCss, "в поставке появился не-CSS").toEqual([]);
  });
});
