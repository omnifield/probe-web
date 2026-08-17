// Гейт ЦЕПОЧКИ зацепок при композиции `as={…}` (`kb:PROBEWEB-4`, решение architect 2026-08-17).
//
// `<DialogTrigger as={Button}>` рендерит ОДИН узел, и раньше `data-slot` на нём был один —
// зацепка кнопки терялась. Теперь это СПИСОК имён через пробел, а читается он `[data-slot~=…]`.
//
// Проверяется здесь ровно три вещи, и все три обязательны:
//
//   1. композиция сохраняет ОБЕ зацепки;
//   2. явный `data-slot` потребителя по-прежнему перебивает всё — на этом стоит право взять
//      кит без чужого оформления;
//   3. внутренний проп цепочки НЕ доезжает до DOM. Утёкший атрибутом, он стал бы частью
//      наблюдаемой поверхности, а её потом не убрать.

import { afterEach, describe, expect, it } from "vitest";

import { Button } from "../src/button.jsx";
import { Dialog, DialogTrigger } from "../src/dialog.jsx";
import { Popover, PopoverTrigger } from "../src/popover.jsx";
import { Tooltip, TooltipTrigger } from "../src/tooltip.jsx";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

/** Имена зацепок на узле — списком, как их читает `[data-slot~="…"]`. */
function slotsOf(node: Element): string[] {
  return (node.getAttribute("data-slot") ?? "").split(/\s+/).filter(Boolean).sort();
}

describe("композиция сохраняет обе зацепки", () => {
  it("`as={Button}` даёт и кнопку, и триггер — на ОДНОМ узле", () => {
    const host = mount(() => (
      <Dialog>
        <DialogTrigger as={Button}>Удалить</DialogTrigger>
      </Dialog>
    ));

    const node = one(host, "button");

    expect(host.querySelectorAll("button").length).toBe(1);
    expect(slotsOf(node)).toEqual(["button", "dialog-trigger"]);
  });

  it("работает для любого триггера цепочки, а не только у окна", () => {
    const host = mount(() => (
      <Popover>
        <PopoverTrigger as={Button}>Настройки</PopoverTrigger>
      </Popover>
    ));

    expect(slotsOf(one(host, "button"))).toEqual(["button", "popover-trigger"]);
  });

  it("ГРАНИЦА механики: чужая обёртка посередине разрывает цепочку", () => {
    // Цепочка держится на метке «умею снять внутренний проп», и стоит она только на наших
    // примитивах. Компонент потребителя посередине метки не имеет — значит зацепку ему не
    // отдают (иначе она утекла бы в DOM атрибутом), и он ведёт себя как обычный потребитель:
    // его `data-slot` перебивает список.
    //
    // Проверка держит это ЯВНЫМ. Схлопывать три звена в одно `as` нельзя — `as` у примитива
    // один, — поэтому трёхзвенная композиция всегда идёт через обёртку потребителя, и знать
    // про этот предел надо заранее.
    const host = mount(() => (
      <Tooltip>
        <Dialog>
          <TooltipTrigger
            as={(props: Record<string, unknown>) => <DialogTrigger as={Button} {...props} />}
          >
            Удалить
          </TooltipTrigger>
        </Dialog>
      </Tooltip>
    ));

    const node = one(host, "button");

    expect(host.querySelectorAll("button").length).toBe(1);
    expect(slotsOf(node)).toEqual(["tooltip-trigger"]);
  });
});

describe("явный `data-slot` потребителя перебивает всё", () => {
  it("на композиции", () => {
    // Это право потребителя отписаться от чужого оформления: он ставит СВОЁ имя, и ни одно
    // наше в списке не остаётся.
    const host = mount(() => (
      <Dialog>
        <DialogTrigger as={Button} data-slot="моя-кнопка">
          Удалить
        </DialogTrigger>
      </Dialog>
    ));

    expect(slotsOf(one(host, "button"))).toEqual(["моя-кнопка"]);
  });

  it("на одиночном примитиве", () => {
    const host = mount(() => <Button data-slot="моя-кнопка">Сохранить</Button>);

    expect(slotsOf(one(host, "button"))).toEqual(["моя-кнопка"]);
  });
});

describe("внутренний проп цепочки не доезжает до DOM", () => {
  const attributesOf = (node: Element) => [...node.attributes].map((attribute) => attribute.name);

  it("при обычном примитиве", () => {
    const host = mount(() => <Button>Сохранить</Button>);

    expect(attributesOf(one(host, "button"))).not.toContain("__slot");
  });

  it("при `as` тегом — тут он и утёк бы", () => {
    // Именно этот случай замер и показал: kobalte спредит неизвестные пропы атрибутами, и
    // строковый проп появился бы в разметке. Поэтому вниз он идёт только помеченным примитивам.
    const host = mount(() => (
      <Dialog>
        <DialogTrigger as="a" href="/удалить">
          Удалить
        </DialogTrigger>
      </Dialog>
    ));

    const node = one(host, "a");

    expect(attributesOf(node)).not.toContain("__slot");
    expect(slotsOf(node)).toEqual(["dialog-trigger"]);
  });

  it("при композиции наших примитивов", () => {
    const host = mount(() => (
      <Dialog>
        <DialogTrigger as={Button}>Удалить</DialogTrigger>
      </Dialog>
    ));

    expect(attributesOf(one(host, "button"))).not.toContain("__slot");
  });

  it("при `as` ЧУЖИМ компонентом — ему проп тоже не отдаётся", () => {
    // Чужой компонент спредит пропы в DOM так же, как kobalte. Проверка держит границу:
    // помечены только наши, значит утечь нечему.
    const Foreign = (props: Record<string, unknown>) => <button type="button" {...props} />;

    const host = mount(() => (
      <Dialog>
        <DialogTrigger as={Foreign}>Удалить</DialogTrigger>
      </Dialog>
    ));

    expect(attributesOf(one(host, "button"))).not.toContain("__slot");
  });
});
