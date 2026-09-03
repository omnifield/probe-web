import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as tableKit } from "../components/index.js";
import { passport as tablePassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as tableEditorInfo } from "../playground/index.js";

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
    table: { passport: readable(tablePassport, tableEditorInfo), parts: tableKit.parts },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('table "basic" — three rows, sorting by name works by click', () => {
  it("shows every header and every row's cells, in column order", () => {
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(tablePassport, assembly as PassportAssembly, "table", {});

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{}} />, host);

    const headers = [...host.querySelectorAll('[data-scope="table"][data-part="header-cell"]')];
    expect(headers.map((header) => header.textContent)).toEqual(["Имя", "Роль", "Возраст"]);

    const rows = [...host.querySelectorAll('[data-scope="table"][data-part="row"]')];
    expect(rows).toHaveLength(3);
    expect(rows[0]?.textContent).toBe("АняДизайнер29");
  });

  it("starts sorted ascending by name, per the assembly's own defaultSorting", () => {
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(tablePassport, assembly as PassportAssembly, "table", {});

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{}} />, host);

    const nameHeader = host.querySelector('[data-scope="table"][data-part="header-cell"]');
    expect(nameHeader?.getAttribute("data-state")).toBe("ascending");
    expect(nameHeader?.getAttribute("aria-sort")).toBe("ascending");
  });

  it("flips to descending on a real click of the sort trigger, and the rows re-order", async () => {
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(tablePassport, assembly as PassportAssembly, "table", {});

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{}} />, host);

    const nameSortTrigger = host.querySelector(
      '[data-scope="table"][data-part="header-sort-trigger"]',
    ) as HTMLButtonElement;
    nameSortTrigger.click();
    await Promise.resolve();

    expect(nameSortTrigger.getAttribute("data-state")).toBe("descending");

    const rows = [...host.querySelectorAll('[data-scope="table"][data-part="row"]')];
    expect(rows[0]?.textContent).toBe("ВераМенеджер41");
  });
});
