import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "../src/context-menu.jsx";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarPortal,
  MenubarTrigger,
} from "../src/menubar.jsx";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuMenu,
  NavigationMenuPortal,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "../src/navigation-menu.jsx";
import { cleanup, mount, nextTask, one, press } from "./dom.jsx";

afterEach(cleanup);

/** Правый клик по узлу: `contextmenu` — именно то событие, которым это меню и открывают. */
function rightClick(node: Element): void {
  node.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 2 }));
  node.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, button: 2 }));
}

describe("ContextMenu — зацепка это ОБЛАСТЬ, а не кнопка", () => {
  const RowMenu = (props: { onSelect?: () => void }) => (
    <ContextMenu>
      <ContextMenuTrigger>Строка таблицы</ContextMenuTrigger>
      <ContextMenuPortal>
        <ContextMenuContent>
          <ContextMenuItem onSelect={props.onSelect}>Удалить</ContextMenuItem>
          <ContextMenuSeparator />
        </ContextMenuContent>
      </ContextMenuPortal>
    </ContextMenu>
  );

  it("область видна в разметке — в отличие от кнопки выпадающего меню", () => {
    const host = mount(() => <RowMenu />);
    const trigger = one(host, "[data-slot='context-menu-trigger']");

    expect(trigger.textContent).toBe("Строка таблицы");
    expect(host.querySelector("[data-slot='context-menu']")).toBeNull();
  });

  it("меню открывается ПРАВЫМ кликом, а не обычным", () => {
    const host = mount(() => <RowMenu />);
    const trigger = one(host, "[data-slot='context-menu-trigger']");

    (trigger as HTMLElement).click();
    expect(document.querySelector("[data-slot='context-menu-content']")).toBeNull();

    rightClick(trigger);

    expect(one(document, "[data-slot='context-menu-content']").getAttribute("role")).toBe("menu");
  });

  it("пункты работают так же, как в выпадающем меню", async () => {
    const onSelect = vi.fn();
    const host = mount(() => <RowMenu onSelect={onSelect} />);

    rightClick(one(host, "[data-slot='context-menu-trigger']"));
    press(one(document, "[data-slot='context-menu-item']"));
    await nextTask();

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(document.querySelector("[data-slot='context-menu-content']")).toBeNull();
  });

  it("класса нет ни у одной части", () => {
    const host = mount(() => <RowMenu />);
    rightClick(one(host, "[data-slot='context-menu-trigger']"));

    for (const node of document.querySelectorAll("[data-slot^='context-menu']")) {
      expect(node.hasAttribute("class")).toBe(false);
    }
  });
});

describe("Menubar — строка меню приложения", () => {
  const AppMenu = () => (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>Файл</MenubarTrigger>
        <MenubarPortal>
          <MenubarContent>
            <MenubarItem>Сохранить</MenubarItem>
          </MenubarContent>
        </MenubarPortal>
      </MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>Правка</MenubarTrigger>
        <MenubarPortal>
          <MenubarContent>
            <MenubarItem>Отменить</MenubarItem>
          </MenubarContent>
        </MenubarPortal>
      </MenubarMenu>
    </Menubar>
  );

  it("корень объявлен строкой меню, заголовки стоят в ней", () => {
    const host = mount(() => <AppMenu />);

    expect(one(host, "[data-slot='menubar']").getAttribute("role")).toBe("menubar");
    expect(host.querySelectorAll("[data-slot='menubar-trigger']").length).toBe(2);
  });

  it("обёртка одного меню своего узла НЕ рендерит — зацепки у неё нет", () => {
    // `MenubarMenu` это контекст, а не элемент: в строке остаются только заголовки.
    const host = mount(() => <AppMenu />);
    const bar = one(host, "[data-slot='menubar']");

    expect(bar.children.length).toBe(2);
    expect(host.querySelector("[data-slot='menubar-menu']")).toBeNull();
  });

  it("панель открывается по своему заголовку", () => {
    const host = mount(() => <AppMenu />);

    press(one(host, "[data-slot='menubar-trigger']"));

    expect(one(document, "[data-slot='menubar-content']").textContent).toBe("Сохранить");
  });
});

describe("NavigationMenu — главное меню сайта", () => {
  const SiteMenu = () => (
    <NavigationMenu>
      <NavigationMenuMenu>
        <NavigationMenuTrigger>Продукты</NavigationMenuTrigger>
        <NavigationMenuPortal>
          <NavigationMenuContent>
            <NavigationMenuItem href="/tables">Таблицы</NavigationMenuItem>
          </NavigationMenuContent>
        </NavigationMenuPortal>
      </NavigationMenuMenu>
      <NavigationMenuViewport />
    </NavigationMenu>
  );

  it("разметка списком: корень — `<ul>`, заголовок раздела — кнопка", () => {
    // Навигация сайта это список ссылок, и вспомогательная техника читает её именно так.
    const host = mount(() => <SiteMenu />);

    expect(one(host, "[data-slot='navigation-menu']").tagName).toBe("UL");
    expect(one(host, "[data-slot='navigation-menu-trigger']").tagName).toBe("BUTTON");
  });

  it("окно-приёмник появляется ВМЕСТЕ с открытым разделом, а не стоит всегда", () => {
    // Часть, которой нет ни у одного другого меню зоны: панель ОДНА и переезжает в это окно.
    // Пока не открыт ни один раздел, окна в документе нет — как и панели.
    const host = mount(() => <SiteMenu />);

    expect(host.querySelector("[data-slot='navigation-menu-viewport']")).toBeNull();

    press(one(host, "[data-slot='navigation-menu-trigger']"));

    expect(one(host, "[data-slot='navigation-menu-viewport']").tagName).toBe("LI");
  });

  it("раздел раскрывается по своему заголовку", () => {
    const host = mount(() => <SiteMenu />);

    press(one(host, "[data-slot='navigation-menu-trigger']"));

    const item = one<HTMLAnchorElement>(document, "[data-slot='navigation-menu-item']");
    expect(item.tagName).toBe("A");
    expect(item.getAttribute("href")).toBe("/tables");
  });
});
