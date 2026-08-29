// Живая проба: `REGISTRY` (`./registry.ts`) действительно несёт `selfAssembly` каждого
// компонента, не только форму паспорта. Без него ссылка на компонент (`node: "button"`,
// `PWEB-166`) рисуется старым плоским путём — узел-ссылка сам не несёт ни `children`, ни `on`, и
// кнопка выходит пустой и не отвечает на клик (найдено user 2026-08-28 на живой витрине).
// `readable()` этот файл строил `passport` вручную и поле `selfAssembly` не копировал —
// единственный ЭТОТ файл и был причиной, механика (`packages/assembly`, `packages/ui`) уже
// проверена живьём отдельно (`packages/ui/src/accordion/accordion.test.tsx`,
// `packages/ui/src/button/button.test.tsx`) и тут не под вопросом.
//
// СБОРКА ЗДЕСЬ СВОЯ, НЕ ЖИВОЙ ЧЕРНОВИК `accordion/playground/assemblies.ts`: тот файл — рабочий
// пример user, его содержимое меняется по ходу ручной обкатки в браузере (варианты, подписи) и не
// обязано держать точные значения, на которые эта проба могла бы опереться. Проба строит свой
// минимальный узел-ссылку на анатомии РЕАЛЬНОГО паспорта аккордеона — ей достаточно доказать
// именно границу `registry.ts`, не содержимое чужого черновика.

import { RenderTree, type AssemblyTree } from "@omnifield/probe-web-assembly";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { REGISTRY } from "./registry.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("REGISTRY (витрина) — ссылка на Button", () => {
  it("показывает подпись и вариант, отвечает на клик через РЕАЛЬНЫЙ реестр витрины", () => {
    const tree: AssemblyTree = {
      components: {
        root: "accordion",
        nodes: {
          accordion: { id: "accordion", type: "accordion", parentId: null, children: ["button"] },
          button: {
            id: "button",
            type: "button",
            parentId: "accordion",
            children: [],
            props: { "data-variant": "tertiary" },
            bind: { label: "/title", payload: "/payload" },
          },
        },
      },
    };
    const data = { title: "Item 1", payload: { id: "i1", title: "Item 1" } };

    const dispatched: unknown[] = [];
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => <RenderTree registry={REGISTRY} tree={tree} data={data} dispatch={(event) => dispatched.push(event)} />,
      host,
    );

    const button = host.querySelector('[data-scope="button"]') as HTMLButtonElement | null;
    expect(button?.textContent).toBe("Item 1");
    // The reference's own literal `props` ("data-variant": "tertiary") reaches the real button —
    // through the button's own `bind` (button/entity/passport.ts), not a DOM-prop passthrough.
    expect(button?.getAttribute("data-variant")).toBe("tertiary");

    button?.click();

    expect(dispatched).toEqual([
      expect.objectContaining({ name: "select", context: { payload: { id: "i1", title: "Item 1" } } }),
    ]);
  });
});
