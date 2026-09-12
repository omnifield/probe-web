import { render } from "solid-js/web";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Toast } from "../components/root.js";
import { toast } from "../control.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("Toast — каждая часть несёт свой адрес (data-scope/data-part), не только рецепт на бумаге", () => {
  it("group/root/title/description/closeTrigger все совпадают с anatomyParts, Zag их сам не ставит", async () => {
    dispose = render(() => <Toast />, document.body);
    toast.create({ title: "Готово", description: "Заказ оформлен" });

    const root = await vi.waitFor(() => {
      const found = document.body.querySelector('[data-scope="toast"][data-part="root"]');
      if (found === null) throw new Error("toast root not rendered yet");
      return found;
    });

    expect(document.body.querySelector('[data-scope="toast"][data-part="group"]')).not.toBeNull();
    expect(root.querySelector('[data-scope="toast"][data-part="title"]')?.textContent).toBe("Готово");
    expect(root.querySelector('[data-scope="toast"][data-part="description"]')?.textContent).toBe(
      "Заказ оформлен",
    );
    expect(root.querySelector('[data-scope="toast"][data-part="close-trigger"]')).not.toBeNull();
  });
});
