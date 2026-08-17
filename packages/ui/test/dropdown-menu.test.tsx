import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DropdownMenu,
  DropdownMenuArrow,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuIcon,
  DropdownMenuItem,
  DropdownMenuItemDescription,
  DropdownMenuItemIndicator,
  DropdownMenuItemLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../src/dropdown-menu.jsx";
import { cleanup, mount, nextTask, one, press } from "./dom.jsx";

afterEach(cleanup);

/** Меню действий строки — сборка, близкая к тому, что строит зона `tables`. */
function RowMenu(props: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelect?: () => void;
  hidden?: boolean;
  sort?: string;
  onSortChange?: (value: string) => void;
}) {
  return (
    <DropdownMenu open={props.open} onOpenChange={props.onOpenChange}>
      <DropdownMenuTrigger>
        Ещё
        <DropdownMenuIcon>▾</DropdownMenuIcon>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent>
          <DropdownMenuArrow />
          <DropdownMenuGroup>
            <DropdownMenuGroupLabel>Правка</DropdownMenuGroupLabel>
            <DropdownMenuItem onSelect={props.onSelect}>
              <DropdownMenuItemLabel>Переименовать</DropdownMenuItemLabel>
              <DropdownMenuItemDescription>F2</DropdownMenuItemDescription>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={props.hidden}>
            Показывать скрытые
            <DropdownMenuItemIndicator>✓</DropdownMenuItemIndicator>
          </DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value={props.sort} onChange={props.onSortChange}>
            <DropdownMenuRadioItem value="по имени">По имени</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="по дате">По дате</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}

describe("DropdownMenu — закрытое состояние", () => {
  it("корень своего узла НЕ рендерит — зацепки `dropdown-menu` нет намеренно", () => {
    const host = mount(() => <RowMenu />);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.getAttribute("data-slot")).toBe("dropdown-menu-trigger");
    expect(host.querySelector("[data-slot='dropdown-menu']")).toBeNull();
  });

  it("кнопка объявляет меню, место под стрелку — отдельный узел", () => {
    const host = mount(() => <RowMenu />);
    const trigger = one<HTMLButtonElement>(host, "[data-slot='dropdown-menu-trigger']");

    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.getAttribute("aria-haspopup")).toBe("true");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    // Стрелка живёт своим узлом, потому что состояние открытости приезжает именно на неё —
    // по нему её и поворачивают, без единого класса от нас.
    const icon = one(host, "[data-slot='dropdown-menu-icon']");
    expect(icon.getAttribute("aria-hidden")).toBe("true");
  });

  it("панели в документе нет вовсе, пока не открыли", () => {
    mount(() => <RowMenu />);

    expect(document.querySelector("[data-slot='dropdown-menu-content']")).toBeNull();
  });
});

describe("DropdownMenu — открытие и пункты", () => {
  it("нажатие на кнопку открывает меню", () => {
    const host = mount(() => <RowMenu />);
    press(one(host, "[data-slot='dropdown-menu-trigger']"));

    expect(one(document, "[data-slot='dropdown-menu-content']").getAttribute("role")).toBe("menu");
    expect(one(host, "[data-slot='dropdown-menu-trigger']").getAttribute("aria-expanded")).toBe(
      "true",
    );
  });

  it("у каждой разновидности пункта СВОЯ роль — оформлять их одним правилом нельзя", () => {
    mount(() => <RowMenu open />);

    expect(one(document, "[data-slot='dropdown-menu-item']").getAttribute("role")).toBe("menuitem");
    expect(one(document, "[data-slot='dropdown-menu-checkbox-item']").getAttribute("role")).toBe(
      "menuitemcheckbox",
    );
    expect(one(document, "[data-slot='dropdown-menu-radio-item']").getAttribute("role")).toBe(
      "menuitemradio",
    );
    expect(one(document, "[data-slot='dropdown-menu-separator']").tagName).toBe("HR");
  });

  it("выбор пункта зовёт `onSelect` и закрывает меню", async () => {
    const onSelect = vi.fn();
    const [open, setOpen] = createSignal(true);
    mount(() => <RowMenu open={open()} onOpenChange={setOpen} onSelect={onSelect} />);

    press(one(document, "[data-slot='dropdown-menu-item']"));

    expect(onSelect).toHaveBeenCalledTimes(1);

    // Закрытие приходит СЛЕДУЮЩЕЙ задачей, а не тем же тактом (см. `nextTask`).
    await nextTask();

    expect(document.querySelector("[data-slot='dropdown-menu-content']")).toBeNull();
  });

  it("группа связана со своей подписью, а не просто стоит рядом", () => {
    mount(() => <RowMenu open />);

    const group = one(document, "[data-slot='dropdown-menu-group']");
    const label = one(document, "[data-slot='dropdown-menu-group-label']");

    expect(group.getAttribute("role")).toBe("group");
    expect(group.getAttribute("aria-labelledby")).toBe(label.id);
  });

  it("пояснение пункта уезжает в `aria-describedby`, а подпись — в имя", () => {
    mount(() => <RowMenu open />);

    const item = one(document, "[data-slot='dropdown-menu-item']");
    const label = one(document, "[data-slot='dropdown-menu-item-label']");
    const description = one(document, "[data-slot='dropdown-menu-item-description']");

    expect(item.getAttribute("aria-labelledby")).toBe(label.id);
    expect(item.getAttribute("aria-describedby")).toBe(description.id);
  });
});

describe("DropdownMenu — состояние пунктов", () => {
  it("отметка флажка рендерится ТОЛЬКО во включённом состоянии", () => {
    const [hidden, setHidden] = createSignal(false);
    mount(() => <RowMenu open hidden={hidden()} />);

    expect(document.querySelector("[data-slot='dropdown-menu-item-indicator']")).toBeNull();

    setHidden(true);

    expect(one(document, "[data-slot='dropdown-menu-item-indicator']").textContent).toBe("✓");
    expect(
      one(document, "[data-slot='dropdown-menu-checkbox-item']").getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("выбор в группе переключателей зовёт `onChange` со значением", () => {
    const onSortChange = vi.fn();
    mount(() => <RowMenu open sort="по имени" onSortChange={onSortChange} />);

    const items = document.querySelectorAll("[data-slot='dropdown-menu-radio-item']");
    expect(items[0].getAttribute("aria-checked")).toBe("true");

    press(items[1]);

    expect(onSortChange).toHaveBeenCalledWith("по дате");
  });
});

describe("DropdownMenu — подменю", () => {
  const WithSub = (props: { open?: boolean }) => (
    <DropdownMenu open>
      <DropdownMenuTrigger>Ещё</DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent>
          <DropdownMenuSub open={props.open}>
            <DropdownMenuSubTrigger>Ещё действия</DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Архивировать</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );

  it("пункт-открывашка отличается от обычного пункта своей зацепкой", () => {
    mount(() => <WithSub />);

    const subTrigger = one(document, "[data-slot='dropdown-menu-sub-trigger']");

    // Он открывает, а не выполняет: у него стрелка вбок и состояние раскрытости, поэтому
    // оформляется он иначе — и зацепка у него своя, а не `dropdown-menu-item`.
    expect(subTrigger.getAttribute("aria-haspopup")).toBe("true");
    expect(document.querySelector("[data-slot='dropdown-menu-sub-content']")).toBeNull();
  });

  it("панель подменю приезжает в СВОЁМ позиционере", () => {
    mount(() => <WithSub open />);

    const sub = one(document, "[data-slot='dropdown-menu-sub-content']");

    expect(sub.getAttribute("role")).toBe("menu");
    expect(sub.parentElement?.hasAttribute("data-popper-positioner")).toBe(true);
  });
});

describe("DropdownMenu — стилей по умолчанию нет", () => {
  /** Части, на которых kobalte держит СВОЙ служебный стиль — разбор в `src/popover.tsx`. */
  const WITH_SERVICE_STYLE = new Set(["dropdown-menu-content", "dropdown-menu-arrow"]);

  it("ни одна часть не приносит своего класса", () => {
    mount(() => <RowMenu open hidden sort="по дате" />);

    const parts = document.querySelectorAll("[data-slot^='dropdown-menu']");
    expect(parts.length).toBeGreaterThan(10);

    for (const node of parts) {
      expect(node.hasAttribute("class")).toBe(false);

      if (!WITH_SERVICE_STYLE.has(node.getAttribute("data-slot") as string)) {
        expect(node.hasAttribute("style")).toBe(false);
      }
    }
  });
});
