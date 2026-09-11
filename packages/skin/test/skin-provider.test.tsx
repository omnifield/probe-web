import { render } from "solid-js/web";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { SkinProvider, useSkin } from "../src/solid/index.js";
import { DEFAULT_STORAGE_KEY } from "../src/wear/memory.js";
import type { SkinSource } from "../src/wear/switch.js";

function stubSource(names: readonly string[]): SkinSource {
  return { names: () => names, css: () => "" };
}

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

let dispose: (() => void) | undefined;

beforeEach(() => {
  localStorage.removeItem(DEFAULT_STORAGE_KEY);
  document.documentElement.removeAttribute("data-skin");
  document.documentElement.classList.remove("dark");
});

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("useSkin() вне SkinProvider", () => {
  it("отказывает явно, не тихим undefined", () => {
    expect(() => useSkin()).toThrow(/SkinProvider/);
  });
});

describe("SkinProvider — контекст на поддерево", () => {
  it("отдаёт names() источника и восстанавливает fallback-скин на монтировании", async () => {
    let seen: { name: string | undefined; names: readonly string[] } | undefined;

    function Consumer() {
      const skin = useSkin();
      seen = { name: skin.worn()?.name, names: skin.names() ?? [] };
      return <span>{skin.worn()?.name ?? "none"}</span>;
    }

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <SkinProvider source={stubSource(["brand"])} options={{ fallback: { skin: "brand", mode: "light" } }}>
          <Consumer />
        </SkinProvider>
      ),
      host,
    );

    await tick();
    await tick();

    expect(seen?.names).toEqual(["brand"]);
    expect(host.textContent).toBe("brand");
    expect(document.documentElement.getAttribute("data-skin")).toBe("brand");
  });

  it("wear()/takeOff() через контекст меняют worn() у любого потребителя поддерева", async () => {
    let skinRef: ReturnType<typeof useSkin> | undefined;

    function Consumer() {
      const skin = useSkin();
      skinRef = skin;
      return <span>{skin.worn()?.name ?? "none"}</span>;
    }

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <SkinProvider source={stubSource(["brand"])}>
          <Consumer />
        </SkinProvider>
      ),
      host,
    );

    await tick();
    expect(host.textContent).toBe("none");

    await skinRef!.wear("brand");
    expect(host.textContent).toBe("brand");

    skinRef!.takeOff();
    expect(host.textContent).toBe("none");
  });
});
