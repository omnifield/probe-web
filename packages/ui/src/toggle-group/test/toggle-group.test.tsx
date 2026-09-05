import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { ToggleGroup, ToggleGroupItem, kit as toggleGroupKit } from "../components/index.js";
import { passport as toggleGroupPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as toggleGroupEditorInfo } from "../playground/index.js";

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
    "toggle-group": { passport: readable(toggleGroupPassport, toggleGroupEditorInfo), parts: toggleGroupKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('toggle group "basic" — buttons from data, single press by default', () => {
  it("shows every item's text, none pressed", () => {
    const data = {
      items: [
        { value: "left", label: "Слева" },
        { value: "center", label: "По центру" },
        { value: "right", label: "Справа" },
      ],
    };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(toggleGroupPassport, assembly as PassportAssembly, "toggle-group", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const items = [...host.querySelectorAll('[data-scope="toggle-group"][data-part="item"]')];
    expect(items.map((item) => item.textContent)).toEqual(["Слева", "По центру", "Справа"]);
    expect(items.every((item) => item.getAttribute("data-state") === "off")).toBe(true);
  });

  it("presses the clicked item and releases the previously pressed one", async () => {
    const data = {
      items: [
        { value: "left", label: "Слева" },
        { value: "right", label: "Справа" },
      ],
    };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(toggleGroupPassport, assembly as PassportAssembly, "toggle-group", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const [left, right] = [...host.querySelectorAll('[data-scope="toggle-group"][data-part="item"]')] as HTMLButtonElement[];
    left.click();
    await Promise.resolve();
    expect(left.getAttribute("data-state")).toBe("on");
    expect(right.getAttribute("data-state")).toBe("off");

    right.click();
    await Promise.resolve();
    expect(left.getAttribute("data-state")).toBe("off");
    expect(right.getAttribute("data-state")).toBe("on");
  });
});

describe("multiple — several items stay pressed at once, not a radio group", () => {
  it("real clicks on both items leave both pressed", async () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <ToggleGroup multiple>
          <ToggleGroupItem value="bold">B</ToggleGroupItem>
          <ToggleGroupItem value="italic">I</ToggleGroupItem>
        </ToggleGroup>
      ),
      host,
    );

    const [bold, italic] = [...host.querySelectorAll("button")] as HTMLButtonElement[];
    bold.click();
    await Promise.resolve();
    italic.click();
    await Promise.resolve();

    expect(bold.getAttribute("data-state")).toBe("on");
    expect(italic.getAttribute("data-state")).toBe("on");
  });
});

describe("deselectable={false} — clicking the already-pressed item keeps it pressed", () => {
  it("real click on the pressed item in a deselectable={false} group changes nothing", async () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <ToggleGroup defaultValue={["left"]} deselectable={false}>
          <ToggleGroupItem value="left">Слева</ToggleGroupItem>
          <ToggleGroupItem value="right">Справа</ToggleGroupItem>
        </ToggleGroup>
      ),
      host,
    );

    const [left] = [...host.querySelectorAll("button")] as HTMLButtonElement[];
    left.click();
    await Promise.resolve();

    expect(left.getAttribute("data-state")).toBe("on");
  });
});
