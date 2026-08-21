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

import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemTrigger,
} from "../src/accordion/index.js";
import { Button } from "../src/button/index.js";
import { passport } from "../src/button/button.anatomy.js";
import { Popover, PopoverTrigger } from "../src/popover.jsx";
import { useAddress, useSlot, slotAware } from "../src/slot-chain.js";
import { Surface } from "../src/surface/index.js";
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

/**
 * Примитив-проба: внешнее звено композиции, у которого СВОЙ адрес уже есть.
 *
 * Устроен ровно так, как обязан быть устроен адресуемый примитив кита, включая ПОРЯДОК спреда:
 * зацепка дефолтом впереди, адрес — последним и неперебиваемым (`PWEB-46`).
 */
const Проба = slotAware(function Проба(props: ПробаProps) {
  const [slot, rest] = useSlot(props, "проба");
  const [address, clean] = useAddress(rest, пробаParts.root.attrs);

  return <Polymorphic as="button" {...slot} {...clean} {...address} />;
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

  it("чужая обёртка посередине адрес больше не отбирает", () => {
    // ПРЕЖНИЙ ПРЕДЕЛ, снятый решением `PWEB-46`. Раньше внешний видел «мой `as` не наш», решал,
    // что узел рисует он сам, и его адрес перебивал адрес кнопки, потому что кнопка ставила свой
    // ДО спреда. Теперь адрес ставится последним, а пришедший снаружи отбрасывается — и узнавать
    // происхождение обёртки не нужно вовсе.
    const host = mount(() => (
      <Проба as={(props: Record<string, unknown>) => <Button {...props} />}>Настройки</Проба>
    ));

    expect(addressOf(one(host, "button"))).toEqual({ scope: "button", part: "root" });
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

describe("адрес не перебивается ничем (`PWEB-46`)", () => {
  // Решение архитектора: адрес ставится последним, пришедший снаружи отбрасывается — от кого бы
  // ни пришёл. Прежде он стоял до спреда намеренно, чтобы потребитель мог перебить; для
  // имён-зацепок это верно и сегодня, для адреса — нет: адрес это личность узла, и дав переписать
  // её, мы дали бы узлу соврать о том, чем он является.

  it("потребитель не перепишет адрес нашего компонента", () => {
    const host = mount(() => (
      <Button data-scope="мой" data-part="моя">
        Сохранить
      </Button>
    ));

    expect(addressOf(one(host, "button"))).toEqual({ scope: "button", part: "root" });
  });

  it("не перепишет и у компонента без поведения", () => {
    const host = mount(() => <Surface data-scope="мой" data-part="моя" />);

    expect(addressOf(one(host, "div"))).toEqual({ scope: "surface", part: "root" });
  });

  it("не перепишет и у компонента, чей адрес ставит Ark", () => {
    // Решение действует на весь кит, а не только там, где адрес ставим мы. Ark спредит пропы
    // потребителя ПОСЛЕ своих, поэтому чужой адрес снимает наша обёртка.
    const host = mount(() => (
      <Accordion>
        <AccordionItem value="доставка">
          <AccordionItemTrigger data-scope="мой" data-part="моя">Доставка</AccordionItemTrigger>
        </AccordionItem>
      </Accordion>
    ));

    expect(addressOf(one(host, "button"))).toEqual({ scope: "accordion", part: "item-trigger" });
  });

  it("а `data-slot` перебивается по-прежнему — обещание зоны цело", () => {
    // Две половины одного спреда с разной судьбой, и проверяются они рядом намеренно: сломать
    // одну, чиня другую, проще всего.
    const host = mount(() => (
      <Button data-slot="моя-зацепка" data-scope="мой">
        Сохранить
      </Button>
    ));
    const node = one(host, "button");

    expect(slotsOf(node)).toEqual(["моя-зацепка"]);
    expect(addressOf(node)).toEqual({ scope: "button", part: "root" });
  });
});

describe("чужое внешнее звено", () => {
  /**
   * Вставка компонента в часть Ark через `asChild`.
   *
   * Приведение здесь не «чтобы собралось»: у Ark 5.38.2 тип `asChild` объявляет ОБЪЕКТ пропов
   * (`(props: ParentProps<T>) => JSX.Element`), а на исполнении приезжает АКСЕССОР — функция,
   * отдающая слитые пропы (`factory.tsx`, `withAsProp`). Проверено по коду поставки и на живом
   * узле; пишем как есть на самом деле, а расхождение называем здесь, чтобы следующий не искал
   * его заново.
   */
  const вставить = (render: (props: () => Record<string, unknown>) => JSX.Element) =>
    render as unknown as Parameters<typeof AccordionItemTrigger>[0]["asChild"];

  /** Гармошка Ark, в триггер которой вставлена наша кнопка. */
  const составленная = (open: boolean) => () => (
    <Accordion value={open ? ["доставка"] : []}>
      <AccordionItem value="доставка">
        <AccordionItemTrigger asChild={вставить((props) => <Button {...props()}>Доставка</Button>)} />
        <AccordionItemContent>Курьером</AccordionItemContent>
      </AccordionItem>
    </Accordion>
  );

  it("составленный чужим звеном узел несёт адрес НАШЕГО внутреннего компонента", () => {
    // То, ради чего решение и принято. Прежде здесь стоял адрес гармошки: Ark не знает нашей
    // метки и спредит свои пропы на вставленный компонент.
    const host = mount(составленная(false));

    expect(addressOf(one(host, "button"))).toEqual({ scope: "button", part: "root" });
  });

  it("состояние от чужого звена на узле ПРИСУТСТВУЕТ", () => {
    // Отбрасывается ровно пара адресных атрибутов. Всё остальное — поведение внешнего звена, и
    // потерять его значило бы вылечить адрес ценой раскрытия.
    const host = mount(составленная(true));
    const node = one(host, "button");

    expect(node.getAttribute("data-state")).toBe("open");
    expect(node.getAttribute("aria-expanded")).toBe("true");
    expect(node.hasAttribute("aria-controls")).toBe(true);
  });

  it("голое чужое звено несёт СВОЙ адрес", () => {
    const host = mount(() => (
      <Accordion>
        <AccordionItem value="доставка">
          <AccordionItemTrigger>Доставка</AccordionItemTrigger>
        </AccordionItem>
      </Accordion>
    ));

    expect(addressOf(one(host, "button"))).toEqual({ scope: "accordion", part: "item-trigger" });
  });
});
