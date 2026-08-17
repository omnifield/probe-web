// ПРОБА: правила цепляются за НАСТОЯЩИЙ узел, а не только похожи на правильные текстом.
//
// Все остальные пробы зоны разбирают CSS как текст. Текст можно написать безупречно и всё
// равно ни за что не зацепиться: опечатка в имени атрибута, лишний пробел в селекторе, правило
// внутри чужого блока. Здесь CSS вставляется в документ, рядом создаётся узел с `data-slot`, и
// стиль спрашивается у самого движка.
//
// ДВЕ ГРАНИЦЫ СРЕДЫ, и обе названы, потому что молчание о них сделало бы пробу враньём:
//
//   1. **jsdom не понимает `@layer`** — правила внутри слоя он игнорирует ЦЕЛИКОМ (проверено:
//      свойство из слоя возвращается дефолтом, а такое же безслойное применяется). Поэтому
//      проба срезает обёртку слоя перед вставкой. Что правила действительно лежат в слое,
//      стережёт `layer.test.ts` по тексту, а порядок слоёв — работа браузера, не jsdom.
//   2. **jsdom не резолвит `var()`** — значение с токеном возвращается пустым. Поэтому здесь
//      проверяются только свойства с собственным значением (`display`, `cursor`, `resize`).
//      Что цвета и размеры взяты из шкал, стерегут `no-literals` и `themes`.
//
// Узел создаётся руками, а не рендером кита: рендер примитивов упирается в пресет `build`
// (см. `naked-dom.test.tsx`), а для вопроса «цепляется ли селектор» достаточно узла с той же
// зацепкой — именно её кит и ставит.

import { beforeEach, describe, expect, it } from "vitest";

import { allSkinCss } from "./css.js";

/** Срезает обёртку `@layer skin { … }`, оставляя правила: jsdom слои не понимает. */
function unwrapLayer(css: string): string {
  return css.replaceAll(/@layer\s+skin\s*;/g, "").replaceAll(/@layer\s+skin\s*\{/g, "@media all {");
}

function dress(): void {
  const style = document.createElement("style");
  style.textContent = unwrapLayer(allSkinCss());
  document.head.append(style);
}

function node(slot: string, tag = "div"): HTMLElement {
  const el = document.createElement(tag);
  el.dataset.slot = slot;
  document.body.append(el);
  return el;
}

beforeEach(() => {
  document.head.innerHTML = "";
  document.body.innerHTML = "";
});

describe("правила цепляются за узел с data-slot", () => {
  it("без оформления узел остаётся голым", () => {
    // Опорная точка: если дефолт совпадёт с нашим значением, проба ниже ничего не докажет.
    const button = node("button", "button");
    expect(getComputedStyle(button).display).not.toBe("inline-flex");
  });

  it("кнопка получает раскладку из оформления", () => {
    dress();
    const button = node("button", "button");

    expect(getComputedStyle(button).display).toBe("inline-flex");
    expect(getComputedStyle(button).cursor).toBe("pointer");
  });

  it("поле и многострочное поле получают своё", () => {
    dress();

    expect(getComputedStyle(node("field")).display).toBe("flex");
    expect(getComputedStyle(node("textarea", "textarea")).resize).toBe("vertical");
  });

  it("список выбора одет во всех частях, которые несут раскладку", () => {
    dress();

    expect(getComputedStyle(node("select-trigger", "button")).display).toBe("inline-flex");
    expect(getComputedStyle(node("select-listbox", "ul")).listStyle).toContain("none");
    expect(getComputedStyle(node("select-item", "li")).cursor).toBe("pointer");
    expect(getComputedStyle(node("select-value", "span")).whiteSpace).toBe("nowrap");
  });

  it("спиннер и разделитель получают своё", () => {
    dress();

    expect(getComputedStyle(node("spinner", "span")).display).toBe("inline-block");
    // `flex: none` движок разворачивает в полную запись — сверяем с ней, а не с сокращением.
    expect(getComputedStyle(node("separator", "hr")).flex).toBe("0 0 auto");
  });

  it("оформление снимается вместе с тегом — узел снова голый", () => {
    // Прямая проверка первого правила зоны в живом документе: сняли — вернулся исходный кит.
    dress();
    const button = node("button", "button");
    expect(getComputedStyle(button).display).toBe("inline-flex");

    document.head.innerHTML = "";
    expect(getComputedStyle(button).display).not.toBe("inline-flex");
  });

  it("составной узел получает оформление ОБОИХ своих имён", () => {
    // Живая проверка того, ради чего мы просили у кита цепочку зацепок: `<DialogTrigger
    // as={Button}>` — ОДИН узел с `data-slot="button dialog-trigger"`. Раньше это означало
    // выбор одного из двух и дублирование правил кнопки в трёх файлах; теперь узел обязан
    // получить и раскладку кнопки, и своё поведение триггера.
    //
    // Текстовая проба формы селектора не заменяет эту: она стережёт `~=` в СВОЕЙ поставке, а
    // здесь спрашивается движок — совпало ли правило с реальным списком имён.
    dress();
    const composed = node("button dialog-trigger", "button");

    expect(getComputedStyle(composed).display, "правило кнопки мимо составного узла").toBe(
      "inline-flex",
    );
  });

  it("чужая зацепка нашего оформления не получает", () => {
    // Селектор обязан цепляться за своё имя, а не за любой `data-slot`.
    dress();
    expect(getComputedStyle(node("not-ours")).display).not.toBe("inline-flex");
  });
});
