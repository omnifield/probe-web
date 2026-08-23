// ГАРМОШКА НА ВИТРИНЕ — то, чего кнопка проверить не могла (`PWEB-37`).
//
// ЭКЗЕМПЛЯР ПРИЕЗЖАЕТ ОТ ПОСТАВЩИКА: сколько разделов, какие подписи, какой раскрыт — объявляет
// паспорт, а не витрина. Поэтому пробы ниже спрашивают не «сколько именно», а то, что обязано
// быть верным при любой объявленной сборке: части на месте, вложенность настоящая, подпись и
// часть сосуществуют в объявленном порядке, состояния живут там, где объявлены.
//
// У кнопки одна часть, ни вложенности, ни повторов, ни содержимого рядом с частью. Здесь есть всё
// сразу, и каждая проба ниже проверяет ровно один шов, который на кнопке лежал непроверенным:
//
//   1. **карта частей приходит от кита**, а не собирается здесь руками — иначе двадцать
//      потребителей написали бы двадцать карт, и добавленная китом часть молча осталась бы голой;
//   2. **вложенные части рисуются**: пункт внутри корня, кнопка и содержимое внутри пункта;
//   3. **подпись и часть сосуществуют**, и порядок между ними выразим: «подпись, потом стрелка»;
//   4. **повтор части**: пунктов много, адрес один, и правило скина одно на всех;
//   5. **состояние живёт не на корне**: раскрытость принадлежит пункту.

import { RenderTree } from "@omnifield/probe-web-assembly";
import { passportOf } from "@omnifield/probe-web-ui/passport";
import { afterEach, describe, expect, it } from "vitest";

import { ANY, casesOf } from "../src/showcase/cases.js";
import { REGISTRY } from "../src/showcase/registry.js";

import { cleanup, mount } from "./dom.jsx";

afterEach(cleanup);

/**
 * Рисует первый случай гармошки в названном срезе и отдаёт разметку.
 *
 * Часть названа вместе с состоянием, потому что состояния принадлежат ЧАСТЯМ: раскрытости у
 * корня нет вовсе, и спрашивать её там — спрашивать не по адресу.
 */
function draw(state: string | null = null, part = "root"): HTMLElement {
  const [случай] = casesOf("accordion", { part, variant: ANY, state, variants: ["plain"] });

  return mount(() => <RenderTree tree={случай?.tree} registry={REGISTRY} />);
}

describe("составной компонент собирается механикой", () => {
  it("все части паспорта доезжают до разметки", () => {
    const host = draw();

    for (const часть of passportOf("accordion")?.anatomy.keys() ?? []) {
      // Имя части в разметке — то, что печатает анатомия (`item-trigger`), а не то, как она
      // названа в записи (`itemTrigger`): перевод делает механика, и скин цепляется за первое.
      const дефисом = часть.replaceAll(/[A-Z]/gu, (буква) => `-${буква.toLowerCase()}`);
      const узел = host.querySelector(
        `[data-scope="accordion"][data-part="${дефисом === "root" ? "root" : дефисом}"]`,
      );

      expect(узел, часть).not.toBeNull();
    }
  });

  it("вложенность настоящая: кнопка и содержимое лежат ВНУТРИ пункта", () => {
    const host = draw();
    const пункт = host.querySelector('[data-part="item"]');

    expect(пункт?.querySelector('[data-part="item-trigger"]')).not.toBeNull();
    expect(пункт?.querySelector('[data-part="item-content"]')).not.toBeNull();
  });
});

describe("содержимое и часть сосуществуют", () => {
  it("подпись стоит ПЕРЕД указателем — порядок выразим", () => {
    const host = draw();
    const кнопка = host.querySelector('[data-part="item-trigger"]');
    const первый = кнопка?.firstChild;

    // Прежде подпись клали пропом `children`, и она пропадала, как только у части появлялся
    // вложенный узел. Узлом она не только видна, но и стоит там, где её поставили.
    expect(первый?.nodeType).toBe(Node.TEXT_NODE);
    expect((первый?.textContent ?? "").length).toBeGreaterThan(0);
    expect(кнопка?.querySelector('[data-part="item-indicator"]')).not.toBeNull();
  });

  it("указатель наполнен: стрелку кладёт потребитель, а не кит", () => {
    const host = draw();

    expect(host.querySelector('[data-part="item-indicator"]')?.textContent).not.toBe("");
  });
});

describe("повтор части", () => {
  it("разделов несколько — так объявил поставщик, и разделители видны", () => {
    const host = draw();

    expect(host.querySelectorAll('[data-part="item"]').length).toBeGreaterThan(1);
  });

  it("разделы различимы по подписи, а указатель у всех один", () => {
    const host = draw();
    const подписи = [...host.querySelectorAll('[data-part="item-trigger"]')].map(
      (узел) => узел.firstChild?.textContent ?? "",
    );
    const стрелки = [...host.querySelectorAll('[data-part="item-indicator"]')].map(
      (узел) => узел.textContent ?? "",
    );

    // Разделы человек различает по названию. Указатель у всех одинаков: разный соврал бы, что
    // это разные вещи. Оба факта объявил поставщик — мы их только не портим по дороге.
    expect(new Set(подписи).size).toBe(подписи.length);
    expect(new Set(стрелки).size).toBe(1);
  });

  it("у каждого пункта свой ключ — иначе кит не знает, какой раскрывать", () => {
    const host = draw();
    const ключи = [...host.querySelectorAll('[data-part="item"]')].map((узел) => узел.id);

    expect(new Set(ключи).size).toBe(ключи.length);
    expect(ключи.some((ключ) => ключ.includes("undefined"))).toBe(false);
  });
});

describe("состояние живёт не на корне", () => {
  it("в объявленной сборке есть и раскрытый раздел, и закрытые", () => {
    const host = draw();
    const пункты = [...host.querySelectorAll('[data-part="item"]')];
    const открытые = пункты.filter((пункт) => пункт.getAttribute("data-state") === "open");

    // Сколько именно раскрыто — дело поставщика. Витрине важно, что видна САМА РАЗНИЦА: показ, где
    // все разделы одинаковы, умолчал бы о половине вида.
    expect(открытые.length).toBeGreaterThan(0);
    expect(открытые.length).toBeLessThan(пункты.length);
  });

  it("раскрытость принадлежит ПУНКТУ, а не набору", () => {
    const host = draw();
    const корень = host.querySelector('[data-part="root"]');

    // На корне такого атрибута не появляется — паспорт этого и не обещал.
    expect(корень?.hasAttribute("data-state")).toBe(false);
  });

  it("срез по состоянию пункта даёт случаи, а не пустоту", () => {
    const случаи = casesOf("accordion", {
      part: "item",
      variant: ANY,
      state: "disabled",
      variants: ["plain"],
    });

    expect(случаи.length).toBeGreaterThan(0);
    expect(случаи.every((случай) => случай.at.part === "item")).toBe(true);
  });
});
