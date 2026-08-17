import { afterEach, describe, expect, it } from "vitest";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastList,
  ToastProgressFill,
  ToastProgressTrack,
  ToastRegion,
  ToastTitle,
  toaster,
} from "../src/toast.jsx";
import { cleanup, mount, nextTask, one, press } from "./dom.jsx";

afterEach(() => {
  toaster.clear();
  cleanup();
});

/** Область уведомлений — ставится один раз в скелете приложения. */
const Region = () => (
  <ToastRegion>
    <ToastList />
  </ToastRegion>
);

/** Одно уведомление — то, что возвращает `toaster.show`. */
const Saved = (props: { toastId: number }) => (
  <Toast toastId={props.toastId}>
    <ToastTitle>Сохранено</ToastTitle>
    <ToastDescription>Изменения уехали на сервер</ToastDescription>
    <ToastClose>×</ToastClose>
    <ToastProgressTrack>
      <ToastProgressFill />
    </ToastProgressTrack>
  </Toast>
);

describe("Toast — единственный примитив, который зовут кодом", () => {
  it("область пуста, пока никто ничего не показал", () => {
    const host = mount(() => <Region />);

    expect(one(host, "[data-slot='toast-list']").children.length).toBe(0);
  });

  it("`toaster.show` кладёт уведомление в список", async () => {
    const host = mount(() => <Region />);

    toaster.show((props) => <Saved toastId={props.toastId} />);
    await nextTask();

    const toast = one(host, "[data-slot='toast']");
    expect(toast.tagName).toBe("LI");
    expect(one(host, "[data-slot='toast-title']").textContent).toBe("Сохранено");
  });

  it("список — `<ol>`: у уведомлений есть порядок, и его читают", async () => {
    const host = mount(() => <Region />);

    toaster.show((props) => <Saved toastId={props.toastId} />);
    toaster.show((props) => <Saved toastId={props.toastId} />);
    await nextTask();

    const list = one(host, "[data-slot='toast-list']");
    expect(list.tagName).toBe("OL");
    expect(list.querySelectorAll("[data-slot='toast']").length).toBe(2);
  });

  it("уведомление связано со своим заголовком и пояснением", async () => {
    const host = mount(() => <Region />);

    toaster.show((props) => <Saved toastId={props.toastId} />);
    await nextTask();

    const toast = one(host, "[data-slot='toast']");
    expect(toast.getAttribute("aria-labelledby")).toBe(
      one(host, "[data-slot='toast-title']").id,
    );
    expect(toast.getAttribute("aria-describedby")).toBe(
      one(host, "[data-slot='toast-description']").id,
    );
  });

  it("кнопка закрытия убирает уведомление из списка", async () => {
    const host = mount(() => <Region />);

    toaster.show((props) => <Saved toastId={props.toastId} />);
    await nextTask();

    press(one(host, "[data-slot='toast-close']"));
    await nextTask();

    expect(host.querySelector("[data-slot='toast']")).toBeNull();
  });

  it("`toaster.dismiss` закрывает по идентификатору — уведомление зовут кодом и убирают кодом", async () => {
    const host = mount(() => <Region />);

    const id = toaster.show((props) => <Saved toastId={props.toastId} />);
    await nextTask();
    expect(host.querySelector("[data-slot='toast']")).not.toBeNull();

    toaster.dismiss(id);
    await nextTask();

    expect(host.querySelector("[data-slot='toast']")).toBeNull();
  });
});

describe("Toast — стилей по умолчанию нет", () => {
  it("класса нет ни у одной части", async () => {
    const host = mount(() => <Region />);

    toaster.show((props) => <Saved toastId={props.toastId} />);
    await nextTask();

    const parts = host.querySelectorAll("[data-slot^='toast']");
    expect(parts.length).toBeGreaterThan(5);

    for (const node of parts) expect(node.hasAttribute("class")).toBe(false);
  });
});
