import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from "../src/tabs.jsx";
import { cleanup, mount, one, press } from "./dom.jsx";

afterEach(cleanup);

/** Вкладки панели настроек — сборка, та же что в доке компонента. */
function Settings(props: { value?: string; onChange?: (value: string) => void }) {
  return (
    <Tabs value={props.value} onChange={props.onChange}>
      <TabsList>
        <TabsTrigger value="вид">Вид</TabsTrigger>
        <TabsTrigger value="доступ">Доступ</TabsTrigger>
        <TabsIndicator />
      </TabsList>
      <TabsContent value="вид">Настройки вида</TabsContent>
      <TabsContent value="доступ">Настройки доступа</TabsContent>
    </Tabs>
  );
}

describe("Tabs — узлы и роли", () => {
  it("у корня узел ЕСТЬ, в отличие от всплывающих", () => {
    // Вкладки не всплывают и никуда не переносятся — это кусок страницы. Поэтому зацепка
    // `tabs` существует, и оформление вправе на неё опереться.
    const host = mount(() => <Settings value="вид" />);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.getAttribute("data-slot")).toBe("tabs");
  });

  it("полоса, вкладки и панель объявлены своими ролями", () => {
    const host = mount(() => <Settings value="вид" />);

    expect(one(host, "[data-slot='tabs-list']").getAttribute("role")).toBe("tablist");

    const trigger = one(host, "[data-slot='tabs-trigger']");
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.getAttribute("role")).toBe("tab");

    expect(one(host, "[data-slot='tabs-content']").getAttribute("role")).toBe("tabpanel");
  });

  it("вкладка указывает на свою панель, а панель доступна с клавиатуры", () => {
    const host = mount(() => <Settings value="вид" />);

    const trigger = one(host, "[data-slot='tabs-trigger']");
    const panel = one(host, "[data-slot='tabs-content']");

    // Связка односторонняя — так её делает kobalte 0.13.12: вкладка называет панель через
    // `aria-controls`. Обратной ссылки `aria-labelledby` на панели НЕТ, и придумывать её
    // обёрткой мы не станем: это поведение библиотеки, а не наш пробел.
    expect(trigger.getAttribute("aria-controls")).toBe(panel.id);
    // Панель сама попадает в порядок обхода — иначе до её содержимого не дойти с клавиатуры,
    // когда внутри нет ни одного фокусируемого элемента.
    expect(panel.getAttribute("tabindex")).toBe("0");
  });
});

describe("Tabs — выбор", () => {
  it("активность приезжает атрибутом данных, а не классом", () => {
    const host = mount(() => <Settings value="вид" />);
    const [first, second] = host.querySelectorAll("[data-slot='tabs-trigger']");

    expect(first.hasAttribute("data-selected")).toBe(true);
    expect(first.getAttribute("aria-selected")).toBe("true");
    expect(second.hasAttribute("data-selected")).toBe(false);
  });

  it("нажатие на вкладку зовёт `onChange` со значением", () => {
    const onChange = vi.fn();
    const host = mount(() => <Settings value="вид" onChange={onChange} />);

    press(host.querySelectorAll("[data-slot='tabs-trigger']")[1]);

    expect(onChange).toHaveBeenCalledWith("доступ");
  });

  it("управляемое значение приходит снаружи, а не из клика", () => {
    const [value, setValue] = createSignal("вид");
    const host = mount(() => <Settings value={value()} />);
    const selected = () =>
      [...host.querySelectorAll("[data-slot='tabs-trigger']")].find((node) =>
        node.hasAttribute("data-selected"),
      )?.textContent;

    expect(selected()).toBe("Вид");

    setValue("доступ");

    expect(selected()).toBe("Доступ");
  });

  it("неактивной панели в документе НЕТ — она размонтирована, а не спрятана", () => {
    // Важное для оформления: спрятанную панель нельзя ни анимировать, ни измерить — её просто
    // не существует. Нужно сохранить состояние внутри (набранный текст, прокрутка) — это
    // `forceMount` на панели, и тогда она остаётся в документе.
    const host = mount(() => <Settings value="вид" />);

    expect(host.querySelectorAll("[data-slot='tabs-content']").length).toBe(1);

    cleanup();

    const forced = mount(() => (
      <Tabs value="вид">
        <TabsList>
          <TabsTrigger value="вид">Вид</TabsTrigger>
          <TabsTrigger value="доступ">Доступ</TabsTrigger>
        </TabsList>
        <TabsContent value="вид">Настройки вида</TabsContent>
        <TabsContent value="доступ" forceMount>
          Настройки доступа
        </TabsContent>
      </Tabs>
    ));

    expect(forced.querySelectorAll("[data-slot='tabs-content']").length).toBe(2);
  });
});

describe("Tabs — стилей по умолчанию нет, кроме размеров полоски", () => {
  it("класса нет ни у одной части", () => {
    const host = mount(() => <Settings value="вид" />);

    for (const node of host.querySelectorAll("[data-slot^='tabs']")) {
      expect(node.hasAttribute("class")).toBe(false);
    }
  });

  it("полоска несёт только измеренные размеры, а не вид", () => {
    // Положение и ширину активной вкладки знает только kobalte — он их измеряет и пишет сюда.
    // Цвет, толщину и скорость перехода пишет оформление; ничего этого в стиле быть не должно.
    const host = mount(() => <Settings value="вид" />);
    const style = one(host, "[data-slot='tabs-indicator']").getAttribute("style") ?? "";

    expect(style).not.toMatch(/color|background|font|radius|border/);
  });
});
