import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "../src/dialog.jsx";
import { cleanup, mount, nextTask, one, press } from "./dom.jsx";

afterEach(cleanup);

/** Окно подтверждения — сборка, близкая к тому, что будет строить `tables`. */
function Confirm(props: { open?: boolean; onOpenChange?: (open: boolean) => void }) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogTrigger>Удалить</DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle>Удалить запись?</DialogTitle>
          <DialogDescription>Действие необратимо</DialogDescription>
          <DialogClose>Отмена</DialogClose>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

describe("Dialog — закрытое состояние", () => {
  it("корень своего узла НЕ рендерит — зацепки `dialog` нет намеренно", () => {
    const host = mount(() => <Confirm />);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.getAttribute("data-slot")).toBe("dialog-trigger");
    expect(host.querySelector("[data-slot='dialog']")).toBeNull();
  });

  it("ни окна, ни подложки в документе нет, пока не открыли", () => {
    mount(() => <Confirm />);

    expect(document.querySelector("[data-slot='dialog-content']")).toBeNull();
    expect(document.querySelector("[data-slot='dialog-overlay']")).toBeNull();
  });
});

describe("Dialog — открытие", () => {
  it("нажатие на кнопку открывает окно", () => {
    const host = mount(() => <Confirm />);
    press(one(host, "[data-slot='dialog-trigger']"));

    expect(one(document, "[data-slot='dialog-content']").getAttribute("role")).toBe("dialog");
  });

  it("окно ставится БЕЗ позиционировщика — это не всплывающая панель", () => {
    mount(() => <Confirm open />);

    const content = one(document, "[data-slot='dialog-content']");

    // Отличие от `Popover`: у окна нет узла-позиционера, значит 1-to-1 не нарушено и место
    // окну задаёт CSS потребителя. Проверяем именно отсутствие — иначе оформление начнёт
    // искать позиционер, которого нет.
    expect(content.parentElement?.hasAttribute("data-popper-positioner")).toBe(false);
  });

  it("заголовок и пояснение связаны с окном", () => {
    mount(() => <Confirm open />);

    const content = one(document, "[data-slot='dialog-content']");
    const title = one(document, "[data-slot='dialog-title']");
    const description = one(document, "[data-slot='dialog-description']");

    expect(title.tagName).toBe("H2");
    expect(description.tagName).toBe("P");
    expect(content.getAttribute("aria-labelledby")).toBe(title.id);
    expect(content.getAttribute("aria-describedby")).toBe(description.id);
  });

  it("подложка — ОТДЕЛЬНЫЙ узел рядом с окном, а не его родитель", () => {
    mount(() => <Confirm open />);

    const overlay = one(document, "[data-slot='dialog-overlay']");
    const content = one(document, "[data-slot='dialog-content']");

    // Поэтому она и не псевдоэлемент: у неё своя жизнь, свой переход и свой клик мимо окна.
    expect(overlay.contains(content)).toBe(false);
    expect(overlay.hasAttribute("class")).toBe(false);
  });
});

describe("Dialog — закрытие", () => {
  it("кнопка закрытия зовёт `onOpenChange` и убирает окно", async () => {
    const onOpenChange = vi.fn();
    const [open, setOpen] = createSignal(true);
    mount(() => (
      <Confirm
        open={open()}
        onOpenChange={(next) => {
          onOpenChange(next);
          setOpen(next);
        }}
      />
    ));

    press(one(document, "[data-slot='dialog-close']"));
    await nextTask();

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(document.querySelector("[data-slot='dialog-content']")).toBeNull();
  });

  it("`Esc` закрывает окно — это поведение kobalte, а не наша надстройка", async () => {
    const [open, setOpen] = createSignal(true);
    mount(() => <Confirm open={open()} onOpenChange={setOpen} />);

    one(document, "[data-slot='dialog-content']").dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    await nextTask();

    expect(document.querySelector("[data-slot='dialog-content']")).toBeNull();
  });
});

describe("Dialog — стилей по умолчанию нет", () => {
  it("ни одна часть не приносит своего класса", () => {
    mount(() => <Confirm open />);

    const parts = document.querySelectorAll("[data-slot^='dialog']");
    expect(parts.length).toBe(6);

    for (const node of parts) expect(node.hasAttribute("class")).toBe(false);
  });

  it("служебный стиль есть только у окна и подложки, и он ровно один", () => {
    // Позиционировать окно некому, поэтому весь его служебный стиль — это `pointer-events`:
    // в модальном режиме страница под окном объявлена недоступной для указателя, а сами окно
    // и подложка обязаны остаться нажимаемыми. Ни цвета, ни размеров, ни затемнения —
    // подложка без правил CSS невидима, и это осознанно.
    mount(() => <Confirm open />);

    for (const slot of ["dialog-overlay", "dialog-content"]) {
      expect(one(document, `[data-slot='${slot}']`).getAttribute("style")).toBe(
        "pointer-events: auto;",
      );
    }

    for (const slot of ["dialog-trigger", "dialog-title", "dialog-description", "dialog-close"]) {
      expect(one(document, `[data-slot='${slot}']`).hasAttribute("style")).toBe(false);
    }
  });
});
