import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { DatePicker, DatePickerValueText, kit as datePickerKit } from "../components/index.js";
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

  it("marks the 25th selected, per the assembly's own defaultValue", () => {
    // `data-today` не проверяется здесь — вычисляется Zag от РЕАЛЬНОГО системного времени, а
    // неделя сборки (24–30 августа 2026) зафиксирована; совпадение было верно только пока часы
    // стояли внутри неё, и неизбежно разъедется снова — не то, что стоит запирать тестом.
    const data = { label: "Дата" };
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(datePickerPassport, assembly as PassportAssembly, "date-picker", data);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={data} />, host);

    const cells = [...host.querySelectorAll('[data-scope="date-picker"][data-part="table-cell-trigger"]')];
    const selected = cells.find((cell) => cell.getAttribute("data-selected") !== null);
    expect(selected?.textContent).toBe("25");
  });
});

describe("DatePickerValueText — placeholder shown when nothing is selected", () => {
  it("renders the placeholder text, not empty", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <DatePicker>
          <DatePickerValueText placeholder="Дата не выбрана" />
        </DatePicker>
      ),
      host,
    );

    expect(host.querySelector('[data-scope="date-picker"][data-part="value-text"]')?.textContent).toBe(
      "Дата не выбрана",
    );
  });
});
