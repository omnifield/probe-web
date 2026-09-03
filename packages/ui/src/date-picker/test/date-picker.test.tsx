import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@omnifield/probe-web-assembly";
import { admits, baseAssemblyOf } from "@omnifield/probe-web-skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as datePickerKit } from "../components/index.js";
import { passport as datePickerPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as datePickerEditorInfo } from "../playground/index.js";

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
    "date-picker": {
      passport: readable(datePickerPassport, datePickerEditorInfo),
      parts: datePickerKit.parts,
    },
  },
  admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe('date picker "basic" — one week of days from the assembly, label from data', () => {
  it("shows the label from data and every weekday/day cell the assembly brings", () => {
    const data = { label: "Дата" };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(datePickerPassport, assembly as PassportAssembly, "date-picker", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    expect(host.querySelector('[data-scope="date-picker"][data-part="label"]')?.textContent).toBe("Дата");

    const headers = [...host.querySelectorAll('[data-scope="date-picker"][data-part="table-header"]')];
    expect(headers.map((header) => header.textContent)).toEqual(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]);

    const cells = [...host.querySelectorAll('[data-scope="date-picker"][data-part="table-cell-trigger"]')];
    expect(cells.map((cell) => cell.textContent)).toEqual(["24", "25", "26", "27", "28", "29", "30"]);
  });

  it("marks the 25th selected and the 27th today, per the assembly's own defaultValue", () => {
    const data = { label: "Дата" };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(datePickerPassport, assembly as PassportAssembly, "date-picker", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const cells = [...host.querySelectorAll('[data-scope="date-picker"][data-part="table-cell-trigger"]')];
    const selected = cells.find((cell) => cell.getAttribute("data-selected") !== null);
    expect(selected?.textContent).toBe("25");

    const today = cells.find((cell) => cell.getAttribute("data-today") !== null);
    expect(today?.textContent).toBe("27");
  });
});
