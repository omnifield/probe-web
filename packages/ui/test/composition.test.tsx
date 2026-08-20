// Гейт КОМПОЗИЦИИ: что несёт узел, когда один компонент становится другим (`PWEB-25`).
//
// Решение архитектора (`PWEB-14`, страница «Паспорт компонента», раздел «Композиция: вид у
// внутреннего, поведение у внешнего»):
//
//   адрес     → внутреннему компоненту, тому, чем вещь является визуально;
//   состояние → внешнему, чьё это поведение;
//   поведение → внешнему.
//
// Проверяется это на ЖИВОЙ композиции, а не на предположении о слиянии пропов: порядок спреда в
// Solid и `Polymorphic` в kobalte — вещи, о которых легко ошибиться в уме, и ровно здесь ошибка
// стоила бы дороже всего. Адрес правила ложится в хранилище скина: скин, сохранённый против
// одного решения, смены решения не переживёт.
//
// ## Почему рядом с нашими примитивами стоит проба
//
// Адрес сегодня несёт ОДИН компонент кита — кнопка: остальные объявляются волной разноса
// (`PWEB-7`). Значит «внешний свой адрес не ставит» на живом ките пока непроверяемо: у внешних
// адреса ещё нет, и проба была бы зелёной от пустоты.
//
// Поэтому здесь заведён примитив-проба — устроенный ровно так, как обязан быть устроен любой
// адресуемый примитив кита: метка `slotAware`, зацепка через `useSlot`, адрес через
// `useAddress`. Он и есть тот второй адрес, которого в ките ещё нет, — и заодно образец, по
// которому разнос будет делаться.

import { Polymorphic } from "@kobalte/core/polymorphic";
import { createAnatomy } from "@zag-js/anatomy";
import type { JSX, ValidComponent } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import { Button } from "../src/button/index.js";
import { passport } from "../src/button/button.anatomy.js";
import { Popover, PopoverTrigger } from "../src/popover.jsx";
import { useAddress, useSlot, slotAware } from "../src/slot-chain.js";
import { Toggle } from "../src/toggle.jsx";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

const пробаAnatomy = createAnatomy("проба").parts("root");
const пробаParts = пробаAnatomy.build();

interface ПробаProps {
  as?: ValidComponent;
  children?: JSX.Element;
  __slot?: string;
}

/** Примитив-проба: внешнее звено композиции, у которого СВОЙ адрес уже есть. */
const Проба = slotAware(function Проба(props: ПробаProps) {
  const [slot, rest] = useSlot(props, "проба");
  const address = useAddress(props, пробаParts.root.attrs);

  return <Polymorphic as="button" {...address} {...slot} {...rest} />;
});

/** Адреса, реально стоящие на узле: пара «чей компонент · какая часть». */
function addressOf(node: Element): { scope: string | null; part: string | null } {
  return { scope: node.getAttribute("data-scope"), part: node.getAttribute("data-part") };
}

/** Имена зацепок — списком, как их читает `[data-slot~="…"]`. */
function slotsOf(node: Element): string[] {
  return (node.getAttribute("data-slot") ?? "").split(/\s+/).filter(Boolean).sort();
}

describe("адрес при композиции", () => {
  it("голый внешний примитив несёт СВОЙ адрес — он рисует собственный узел", () => {
    const host = mount(() => <Проба>Настройки</Проба>);

    expect(addressOf(one(host, "button"))).toEqual({ scope: "проба", part: "root" });
  });

  it("составленный узел несёт адрес ВНУТРЕННЕГО и не несёт адреса внешнего", () => {
    const host = mount(() => <Проба as={Button}>Настройки</Проба>);
    const node = one(host, "button");

    expect(host.querySelectorAll("button").length).toBe(1);
    expect(addressOf(node)).toEqual({ scope: "button", part: "root" });
  });

  it("списка имён в адресе не появляется — ни разделителем, ни вторым атрибутом", () => {
    // От списка мы и уходим: он у нас БЫЛ, и оформление разрешало его вручную каждый раз
    // заново. Проверяется поэтому не только значение, но и отсутствие второго начертания.
    const host = mount(() => <Проба as={Button}>Настройки</Проба>);
    const node = one(host, "button");
    const адресные = [...node.attributes].filter((a) => a.name.startsWith("data-scope"));

    expect(адресные.length).toBe(1);
    expect(node.getAttribute("data-scope")).toBe("button");
    expect(node.getAttribute("data-scope")).not.toContain("проба");
  });

  it("зацепки при этом целы — обязательство по `data-slot` композиция не трогает", () => {
    // Два обязательства с разной судьбой на одном условии: зацепка внешнего едет вниз и
    // попадает в список, адрес внешнего не едет никуда. Проверяются они вместе, потому что
    // сломать одно, чиня другое, проще всего.
    const host = mount(() => <Проба as={Button}>Настройки</Проба>);

    expect(slotsOf(one(host, "button"))).toEqual(["button", "проба"]);
  });

  it("ГРАНИЦА: чужая обёртка посередине оставляет адрес внешнему", () => {
    // Та же граница, что у цепочки зацепок, и та же причина: метка стоит только на наших
    // примитивах, а компонент потребителя её не имеет. Внешний видит «мой `as` не наш», решает,
    // что узел рисует он сам, и адрес ставит; внутренняя кнопка ставит свой ДО спреда, и он
    // перебивается пришедшим снаружи.
    //
    // Записано явно, чтобы предел был известен заранее: трёхзвенная композиция всегда идёт
    // через обёртку потребителя — `as` у примитива один.
    const host = mount(() => (
      <Проба as={(props: Record<string, unknown>) => <Button {...props} />}>Настройки</Проба>
    ));

    expect(addressOf(one(host, "button"))).toEqual({ scope: "проба", part: "root" });
  });
});

describe("состояния переживают композицию", () => {
  it("раскрытие приходит от окна, а адрес остаётся кнопкиным", () => {
    const host = mount(() => (
      <Popover open>
        <PopoverTrigger as={Button}>Настройки</PopoverTrigger>
      </Popover>
    ));
    const node = one(host, "button");

    // Ничего специально сохранять не пришлось: состояние выражено ОТДЕЛЬНЫМ атрибутом, а не
    // адресом, и слияние пропов его не вытесняет. Проверено, а не предположено.
    expect(node.hasAttribute("data-expanded")).toBe(true);
    expect(node.getAttribute("aria-expanded")).toBe("true");
    expect(addressOf(node)).toEqual({ scope: "button", part: "root" });
  });

  it("нажатость остаётся переключателю, вид — кнопке", () => {
    const host = mount(() => (
      <Toggle as={Button} pressed>
        Жирный
      </Toggle>
    ));
    const node = one(host, "button");

    expect(node.hasAttribute("data-pressed")).toBe(true);
    expect(addressOf(node)).toEqual({ scope: "button", part: "root" });
  });

  it("пришедшее снаружи состояние ОБЪЯВЛЕНО в паспорте внутреннего", () => {
    // Иначе одеть его нечем: правило скина, адресующее необъявленное состояние, невалидно.
    // Обратная сторона правила «паспорт не объявляет ненаблюдаемого»: состояние наблюдаемо,
    // его просто ставит не сам компонент.
    const объявлены = passport.parts.flatMap((part) =>
      part.states.map((state) => (state.mark.kind === "attribute" ? state.mark.name : "")),
    );

    expect(объявлены).toContain("data-expanded");
    expect(объявлены).toContain("data-pressed");
  });
});
