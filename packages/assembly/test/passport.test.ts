// НАСТОЯЩИЙ паспорт подходит механике как есть — это и стережёт границу зон.
//
// Механика читает паспорт, но зависеть в поставке на кит не вправе: зависимость в поставку —
// решение architect, а не владельца зоны. Поэтому в `src/passport-read.ts` объявлено не второе
// описание паспорта, а самая узкая запись того, что механика с него снимает.
//
// Такая запись живёт ровно до первого расхождения — если её никто не сверяет. Здесь она
// сверяется машиной: берётся ПОСТАВЛЯЕМЫЙ паспорт кнопки (кит стоит в devDependencies, в
// поставку не едет) и проверяется, что он ложится в форму чтения без единого преобразования и
// что механика отвечает по нему теми же ответами, что и по своим паспортам проб.
//
// Разъедется форма — покраснеет этот файл, а не потребитель через выпуск.

import { admits, passportOf } from "@omnifield/probe-web-ui/passport";
import { describe, expect, it } from "vitest";

import { allowedInside, canAdmit, canContain } from "../src/nesting.js";
import type { ReadablePassport } from "../src/passport-read.js";
import { createRegistry, readAddress } from "../src/registry.js";

const Component = () => null;

const real = passportOf("button");

describe("паспорт кита читается механикой", () => {
  it("кнопка объявлена и подходит под форму чтения без преобразования", () => {
    expect(real).toBeDefined();

    // Присваивание и есть проверка: не подойди форма — не собрались бы типы.
    const readable: ReadablePassport = real as ReadablePassport;

    expect(readable.component).toBe("button");
    expect(readable.root).toBe("root");
    expect(readable.anatomy.keys()).toContain("root");
  });

  it("каждая часть анатомии объявлена в добавке — иначе вложенность о ней молчит", () => {
    const readable = real as ReadablePassport;
    const declared = readable.parts.map((part) => part.name);

    expect([...readable.anatomy.keys()].sort()).toEqual([...declared].sort());
  });

  it("механика отвечает по настоящему паспорту и настоящему правилу допуска", () => {
    // Правило берётся из кита, а не пишется здесь: своё было бы вторым экземпляром того же
    // знания, и разъехалось бы с китовым молча — обе стороны остались бы зелёными.
    const registry = createRegistry({
      components: { button: Component },
      passports: { button: real as ReadablePassport },
      admits,
    });

    expect(readAddress(registry, "button")).toMatchObject({ component: "button", part: "root" });
    expect(allowedInside(registry, "button")).toEqual({
      unrestricted: false,
      parts: [],
      genera: ["text", "icon"],
    });

    // «Внутрь кнопки только текст или значок» — то самое правило, которое паспорт научился
    // выражать в `PWEB-24`. Кнопку внутрь кнопки механика отвергает, подпись пускает.
    expect(canAdmit(registry, "button", { kind: "content", genus: "text" })).toEqual({
      allowed: true,
    });
    expect(canContain(registry, "button", "button")).toMatchObject({
      allowed: false,
      refusal: "content-not-admitted",
    });
  });

  it("род компонента объявлен — иначе опознать его было бы нечем", () => {
    expect((real as ReadablePassport).genus).toBe("component");
  });
});
