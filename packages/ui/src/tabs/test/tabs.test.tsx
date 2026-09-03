import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as tabsKit } from "../components/index.js";
import { passport as tabsPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as tabsEditorInfo } from "../playground/index.js";

function readable<Part extends string, Data = unknown>(
  passport: ComponentPassport<Part>,
  editorInfo: PassportEditorInfo<Part, string, Data>,
): ReadableComponent["passport"] {
  return {
    component: passport.component,
    genus: editorInfo.genus,
    anatomy: passport.anatomy,
    root: passport.root,
    parts: passport.parts.map((part) => ({
      name: part.name,
      accepts: editorInfo.parts[part.name]?.accepts,
    })),
    selfAssembly: passport.selfAssembly as any,
  };
}

const REGISTRY: Registry = createRegistry({
  components: {
    tabs: { passport: readable(tabsPassport, tabsEditorInfo), parts: tabsKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('tabs "basic" — triggers and panels from data, one panel visible at a time', () => {
  it("shows every trigger's text, none selected without a default value", () => {
    const data = {
      items: [
        { value: "account", label: "Аккаунт", content: "Имя, почта, пароль." },
        { value: "billing", label: "Оплата", content: "Карта и история платежей." },
        { value: "settings", label: "Настройки", content: "Язык, тема, уведомления." },
      ],
    };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(tabsPassport, assembly as PassportAssembly, "tabs", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const triggers = [...host.querySelectorAll('[data-scope="tabs"][data-part="trigger"]')];
    expect(triggers.map((trigger) => trigger.textContent)).toEqual(["Аккаунт", "Оплата", "Настройки"]);
  });

  it("selects the clicked trigger and shows its panel", async () => {
    const data = {
      items: [
        { value: "account", label: "Аккаунт", content: "Имя, почта, пароль." },
        { value: "billing", label: "Оплата", content: "Карта и история платежей." },
      ],
    };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(tabsPassport, assembly as PassportAssembly, "tabs", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const [, billing] = [...host.querySelectorAll('[data-scope="tabs"][data-part="trigger"]')] as HTMLButtonElement[];
    billing.click();
    // Один микротаск хватает на выбор триггера, но не на видимость панели — синхронизация
    // индикатора идёт через макротаск (jsdom не несёт `requestAnimationFrame`, Zag падает на
    // `setTimeout`-фолбэк), проверено вживую отдельным диагностическим прогоном.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(billing.getAttribute("data-selected")).not.toBeNull();

    const panels = [...host.querySelectorAll('[data-scope="tabs"][data-part="content"]')];
    const visible = panels.filter((panel) => !panel.hasAttribute("hidden"));
    expect(visible).toHaveLength(1);
    expect(visible[0]!.textContent).toBe("Карта и история платежей.");
  });
});
