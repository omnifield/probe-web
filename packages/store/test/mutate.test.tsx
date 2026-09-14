import { createAtom } from "@xstate/store";
import { describe, expect, it } from "vitest";

import { castDraft, mutate } from "../src/addons/mutate.js";
import { createActionStore } from "../src/engine/action-store.js";

interface Kit {
  readonly tags: readonly string[];
}

interface ComponentState {
  readonly component?: string;
  readonly outfit?: string;
  readonly kit?: Kit;
}

describe("mutate", () => {
  it("recipe мутирует draft, наружу уходит новое значение, старое не трогает", () => {
    const before: ComponentState = { component: "button" };
    const after = mutate<ComponentState>((draft) => {
      draft.outfit = "dark";
    })(before);

    expect(after).toEqual({ component: "button", outfit: "dark" });
    expect(before).toEqual({ component: "button" }); // не мутирован
    expect(after).not.toBe(before);
  });

  it("работает как updater для createAtom.set()", () => {
    const atom = createAtom<ComponentState>({ component: "button" });
    atom.set(
      mutate((draft) => {
        draft.outfit = "dark";
      }),
    );
    expect(atom.get()).toEqual({ component: "button", outfit: "dark" });
  });

  it("работает как updater для createActionStore's setState", () => {
    const store = createActionStore<ComponentState, { setOutfit(name: string): void }>(
      { component: "button" },
      ({ setState }) => ({
        setOutfit(name) {
          setState(
            mutate((draft) => {
              draft.outfit = name;
            }),
          );
        },
      }),
    );

    store.actions.setOutfit("dark");
    expect(store.get()).toEqual({ component: "button", outfit: "dark" });
  });

  it("castDraft пропускает целую замену поля с readonly-массивом внутри (без as never)", () => {
    const kit: Kit = { tags: ["a", "b"] }; // обычный объект, не draft — readonly tags внутри
    const after = mutate<ComponentState>((draft) => {
      draft.kit = castDraft(kit);
    })({ component: "button" });

    expect(after.kit).toEqual({ tags: ["a", "b"] });
  });
});
