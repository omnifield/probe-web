// Вложенность — главный гейт задачи: недопустимое отвергается, и отвергается НА ОБОИХ
// уровнях, потому что уровень на самом деле один.
//
// Решение принимает правило допуска кита (`admits`), а не механика: здесь проверяется, что
// механика задаёт правилу верный вопрос и верно называет отказ. Правило в пробах настоящее —
// подменять его двойником значило бы проверять не то, чем механика работает у потребителя.

import { describe, expect, it } from "vitest";

import {
  allowedInside,
  canAdmit,
  canContain,
  ownersAdmitting,
  possibleOwnersOf,
} from "../src/nesting.js";
import { createRegistry } from "../src/registry.js";
import { spec } from "./passports.js";

const Component = () => null;

const registry = createRegistry(
  spec({
    layout: Component,
    button: Component,
    icon: Component,
    открытый: Component,
    accordion: { item: Component, itemTrigger: Component, itemContent: Component },
  }),
);

describe("уровень страницы: компонент внутрь компонента", () => {
  it("пускает компонент туда, где паспорт объявил род «компонент»", () => {
    expect(canContain(registry, "layout", "button")).toEqual({ allowed: true });
    expect(canContain(registry, "layout", "accordion")).toEqual({ allowed: true });
  });

  it("пускает значок туда, где ждут значок, и туда, где ждут любой компонент", () => {
    expect(canContain(registry, "button", "icon")).toEqual({ allowed: true });
    expect(canContain(registry, "layout", "icon")).toEqual({ allowed: true });
  });

  it("ОТВЕРГАЕТ компонент там, где ждут только текст или значок", () => {
    // Ровно то, чего прежний паспорт сказать не мог: «внутрь кнопки только текст или значок».
    expect(canContain(registry, "button", "layout")).toMatchObject({
      allowed: false,
      refusal: "content-not-admitted",
    });
    expect(canContain(registry, "button", "button")).toMatchObject({
      refusal: "content-not-admitted",
    });
  });

  it("отвергает содержимое там, где место занято самим компонентом", () => {
    expect(canContain(registry, "icon", "button")).toMatchObject({
      allowed: false,
      refusal: "content-not-admitted",
    });
  });

  it("отвергает компонент внутрь части, которая ждёт только свои части", () => {
    expect(canContain(registry, "accordion.item", "button")).toMatchObject({
      refusal: "content-not-admitted",
    });
  });

  it("не знает адресов, которых нет в реестре, — и говорит об этом раздельно", () => {
    expect(canContain(registry, "нет", "button")).toMatchObject({ refusal: "parent-unknown" });
    expect(canContain(registry, "layout", "нет")).toMatchObject({ refusal: "child-unknown" });
  });
});

describe("уровень компонента: часть внутрь части", () => {
  it("пускает часть, названную владельцем среди допустимого", () => {
    expect(canContain(registry, "accordion", "accordion.item")).toEqual({ allowed: true });
    expect(canContain(registry, "accordion.item", "accordion.itemTrigger")).toEqual({
      allowed: true,
    });
  });

  it("отвергает часть, которую владелец допустимой не называл", () => {
    expect(canContain(registry, "accordion", "accordion.itemTrigger")).toMatchObject({
      allowed: false,
      refusal: "part-not-admitted",
    });
  });

  it("отвергает часть чужого компонента: чужое кладётся компонентом целиком", () => {
    expect(canContain(registry, "accordion", "half.forgotten")).toMatchObject({
      refusal: "foreign-part",
    });
  });

  it("корневая часть приходит как компонент целиком — по роду, а не по имени", () => {
    // `button.root` — это сам `button`: внутрь раскладки он идёт содержимым рода «компонент».
    expect(canContain(registry, "layout", "button.root")).toEqual({ allowed: true });
    // А внутрь части, ждущей только свои части, — не идёт.
    expect(canContain(registry, "accordion.item", "button.root")).toMatchObject({
      refusal: "content-not-admitted",
    });
  });

  it("говорит «неизвестно», когда паспорт о части ничего не сказал", () => {
    expect(canContain(registry, "half.forgotten", "button")).toMatchObject({
      allowed: false,
      refusal: "part-undeclared",
    });
  });
});

describe("три состояния правила вложенности", () => {
  it("не объявлено — часть не запрещает ничего", () => {
    expect(canContain(registry, "открытый", "button")).toEqual({ allowed: true });
    expect(canContain(registry, "открытый", "icon")).toEqual({ allowed: true });
    expect(allowedInside(registry, "открытый")).toEqual({
      unrestricted: true,
      parts: [],
      genera: [],
    });
  });

  it("пустой перечень — не пускает ничего", () => {
    expect(canContain(registry, "icon", "icon")).toMatchObject({ allowed: false });
    expect(allowedInside(registry, "icon")).toEqual({
      unrestricted: false,
      parts: [],
      genera: [],
    });
  });

  it("перечень — допустимо ровно перечисленное", () => {
    expect(allowedInside(registry, "button")).toEqual({
      unrestricted: false,
      parts: [],
      genera: ["text", "icon"],
    });
  });
});

describe("кандидат без адреса", () => {
  it("подпись спрашивается родом — узла для неё ещё нет", () => {
    expect(canAdmit(registry, "button", { kind: "content", genus: "text" })).toEqual({
      allowed: true,
    });
    expect(canAdmit(registry, "layout", { kind: "content", genus: "text" })).toMatchObject({
      allowed: false,
      refusal: "content-not-admitted",
    });
  });

  it("часть спрашивается именем", () => {
    expect(canAdmit(registry, "accordion", { kind: "part", name: "item" })).toEqual({
      allowed: true,
    });
    expect(canAdmit(registry, "accordion", { kind: "part", name: "itemContent" })).toMatchObject({
      refusal: "part-not-admitted",
    });
  });
});

describe("обратное чтение: возможные владельцы", () => {
  // Поле «предок» в адресе правила скина перечисляется ТОЛЬКО так. Перечень обязан совпадать с
  // ходом вперёд: что здесь названо владельцем, то и должно пустить гостя внутрь.
  const addresses = (found: ReturnType<typeof ownersAdmitting>) => found.map((one) => one.address);

  it("часть ищет владельцев только среди частей своего компонента", () => {
    expect(addresses(possibleOwnersOf(registry, "accordion.item") ?? [])).toEqual(["accordion"]);
    expect(addresses(possibleOwnersOf(registry, "accordion.itemTrigger") ?? [])).toEqual([
      "accordion.item",
    ]);
  });

  it("владелец назван частью, а не только адресом — состояния берутся у неё", () => {
    expect(possibleOwnersOf(registry, "accordion.itemTrigger")?.[0]).toEqual({
      address: "accordion.item",
      component: "accordion",
      part: "item",
    });
  });

  it("компонент ищет владельцев по всему реестру — его опознают родом", () => {
    // Значок подходит и туда, где ждут значок (кнопка, вкладка гармошки), и туда, где ждут
    // любой компонент (раскладка, содержимое вкладки), и туда, где не запрещено ничего.
    expect(addresses(possibleOwnersOf(registry, "icon") ?? [])).toEqual([
      "accordion.itemContent",
      "accordion.itemTrigger",
      "button",
      "layout",
      "popover.content",
      "popover.trigger",
      "ui.button",
      "открытый",
    ]);
  });

  it("компонент рода «компонент» в место под значок не попадает", () => {
    const owners = addresses(possibleOwnersOf(registry, "layout") ?? []);

    expect(owners).toContain("layout");
    expect(owners).toContain("accordion.itemContent");
    expect(owners).not.toContain("button");
    expect(owners).not.toContain("accordion.itemTrigger");
  });

  it("совпадает с ходом вперёд — на каждом найденном владельце", () => {
    for (const child of ["icon", "layout", "accordion.item", "button"]) {
      for (const owner of possibleOwnersOf(registry, child) ?? []) {
        expect(canContain(registry, owner.address, child)).toEqual({ allowed: true });
      }
    }
  });

  it("кандидат без адреса спрашивается родом или именем части", () => {
    expect(addresses(ownersAdmitting(registry, { kind: "content", genus: "text" }))).toEqual([
      "accordion.itemTrigger",
      "button",
      "ui.button",
      "открытый",
    ]);
    expect(
      addresses(ownersAdmitting(registry, { kind: "part", name: "item" }, "accordion")),
    ).toEqual(["accordion"]);
  });

  it("неизвестный адрес — `undefined`, а не пустой перечень", () => {
    expect(possibleOwnersOf(registry, "нет")).toBeUndefined();
    // Пустой перечень значил бы «владельцев нет», и редактор показал бы пустой список вместо
    // сообщения об опечатке в адресе.
    expect(possibleOwnersOf(registry, "icon")).not.toHaveLength(0);
  });
});

describe("перечень допустимого", () => {
  it("отдаёт части полными адресами, рода — как названы", () => {
    expect(allowedInside(registry, "accordion")).toEqual({
      unrestricted: false,
      parts: ["accordion.item"],
      genera: [],
    });
    expect(allowedInside(registry, "accordion.item")).toEqual({
      unrestricted: false,
      parts: ["accordion.itemTrigger", "accordion.itemContent"],
      genera: [],
    });
  });

  it("молчит там, где паспорт молчит", () => {
    expect(allowedInside(registry, "нет")).toBeUndefined();
    expect(allowedInside(registry, "half.forgotten")).toBeUndefined();
  });
});
