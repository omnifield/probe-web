// Живая проба: `REGISTRY` (`./registry.ts`) действительно несёт `selfAssembly` каждого
// компонента, не только форму паспорта. Без него ссылка на компонент (`node: "button"` в
// `accordion/playground/assemblies.ts`, `PWEB-166`) рисуется старым плоским путём — узел-ссылка
// сам не несёт ни `children`, ни `on`, и кнопка выходит пустой и не отвечает на клик (найдено
// user 2026-08-28 на живой витрине). `readable()` этот файл строил `passport` вручную и поле
// `selfAssembly` не копировал — единственный ЭТОТ файл и был причиной, механика (`packages/
// assembly`, `packages/ui`) уже проверена живьём отдельно (`packages/ui/src/accordion/
// accordion.test.tsx`, `packages/ui/src/button/button.test.tsx`) и тут не под вопросом.

import { RenderTree } from "@omnifield/probe-web-assembly";
import { baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { editorInfoOf, passportOf } from "./providers.js";
import { REGISTRY } from "./registry.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("REGISTRY (витрина) — ссылка на Button внутри аккордеона", () => {
  it("показывает подпись пункта и отвечает на клик через РЕАЛЬНЫЙ реестр витрины", () => {
    const passport = passportOf("accordion")!;
    const assembly = editorInfoOf("accordion")!.assemblies.find((candidate) => candidate.name === "с-кнопками")!;

    const data = {
      sections: [{ id: "s1", title: "Section 1", items: [{ id: "i1", title: "Item 1" }] }],
    };
    const tree = baseAssemblyOf(passport, assembly, "accordion", data);

    const dispatched: unknown[] = [];
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <RenderTree registry={REGISTRY} tree={tree} data={data} dispatch={(event) => dispatched.push(event)} />
      ),
      host,
    );

    const button = host.querySelector('[data-scope="button"]') as HTMLButtonElement | null;
    expect(button?.textContent).toBe("Item 1");

    button?.click();

    expect(dispatched).toEqual([
      expect.objectContaining({ name: "select", context: { payload: { id: "i1", title: "Item 1" } } }),
    ]);
  });
});
