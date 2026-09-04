import { createRegistry, RenderTree, type ReadableComponent, type Registry } from "@web-core/assembly";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { TableRoot, type TableColumnVisibility, kit as tableKit } from "../components/index.js";
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
    expect(headers.map((header) => header.textContent)).toEqual(["Имя (1)", "Роль", "Возраст"]);

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

  it("shift-clicking a second header adds it as a secondary sort, priority index on both", async () => {
    const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
    const tree = baseAssemblyOf(tablePassport, assembly as PassportAssembly, "table", {});

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{}} />, host);

    const triggers = [...host.querySelectorAll('[data-scope="table"][data-part="header-sort-trigger"]')] as HTMLButtonElement[];
    const [nameTrigger, roleTrigger] = triggers;

    roleTrigger!.dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true }));
    await Promise.resolve();

    expect(nameTrigger!.getAttribute("data-state")).toBe("ascending");
    expect(roleTrigger!.getAttribute("data-state")).toBe("ascending");
    expect(nameTrigger!.style.getPropertyValue("--sort-index")).toBe("1");
    expect(roleTrigger!.style.getPropertyValue("--sort-index")).toBe("2");

    const headers = [...host.querySelectorAll('[data-scope="table"][data-part="header-cell"]')];
    expect(headers.map((header) => header.textContent)).toEqual(["Имя (1)", "Роль (2)", "Возраст"]);
  });
});

describe('table row selection — enableRowSelection grows a real checkbox column, DefaultTableBody', () => {
  const columns = [
    { accessorKey: "name" as const, header: "Имя" },
    { accessorKey: "role" as const, header: "Роль" },
  ];
  const data = [
    { name: "Аня", role: "Дизайнер" },
    { name: "Борис", role: "Инженер" },
  ];

  it("no checkbox column at all when enableRowSelection is not set", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <TableRoot columns={columns} data={data} />, host);

    expect(host.querySelector('[data-scope="table"][data-part="header-select-trigger"]')).toBeNull();
    expect(host.querySelector('[data-scope="table"][data-part="row-select-trigger"]')).toBeNull();
  });

  it("starts with everything unchecked, no row marked selected", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <TableRoot columns={columns} data={data} enableRowSelection />, host);

    const selectAll = host.querySelector(
      '[data-scope="table"][data-part="header-select-trigger"]',
    ) as HTMLInputElement;
    expect(selectAll.checked).toBe(false);
    expect(selectAll.indeterminate).toBe(false);

    const rows = [...host.querySelectorAll('[data-scope="table"][data-part="row"]')];
    expect(rows.every((row) => row.getAttribute("data-selected") === null)).toBe(true);
  });

  it("clicking one row's checkbox selects that row and makes select-all indeterminate", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <TableRoot columns={columns} data={data} enableRowSelection />, host);

    const rowTriggers = [...host.querySelectorAll('[data-scope="table"][data-part="row-select-trigger"]')] as HTMLInputElement[];
    rowTriggers[0]!.click();
    await Promise.resolve();

    const rows = [...host.querySelectorAll('[data-scope="table"][data-part="row"]')];
    expect(rows[0]?.getAttribute("data-selected")).toBe("");
    expect(rows[1]?.getAttribute("data-selected")).toBeNull();

    const selectAll = host.querySelector(
      '[data-scope="table"][data-part="header-select-trigger"]',
    ) as HTMLInputElement;
    expect(selectAll.checked).toBe(false);
    expect(selectAll.indeterminate).toBe(true);
  });

  it("clicking select-all selects every row, and un-checks back to none on a second click", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <TableRoot columns={columns} data={data} enableRowSelection />, host);

    const selectAll = host.querySelector(
      '[data-scope="table"][data-part="header-select-trigger"]',
    ) as HTMLInputElement;
    selectAll.click();
    await Promise.resolve();

    let rows = [...host.querySelectorAll('[data-scope="table"][data-part="row"]')];
    expect(rows.every((row) => row.getAttribute("data-selected") === "")).toBe(true);
    expect(selectAll.checked).toBe(true);
    expect(selectAll.indeterminate).toBe(false);

    selectAll.click();
    await Promise.resolve();

    rows = [...host.querySelectorAll('[data-scope="table"][data-part="row"]')];
    expect(rows.every((row) => row.getAttribute("data-selected") === null)).toBe(true);
    expect(selectAll.checked).toBe(false);
  });
});

describe('table column visibility — hidden columns disappear from both header and rows', () => {
  const columns = [
    { accessorKey: "name" as const, header: "Имя" },
    { accessorKey: "role" as const, header: "Роль" },
    { accessorKey: "age" as const, header: "Возраст" },
  ];
  const data = [
    { name: "Аня", role: "Дизайнер", age: 29 },
    { name: "Борис", role: "Инженер", age: 34 },
  ];

  it("shows every column when nothing is hidden", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <TableRoot columns={columns} data={data} />, host);

    const headers = [...host.querySelectorAll('[data-scope="table"][data-part="header-cell"]')];
    expect(headers.map((header) => header.textContent)).toEqual(["Имя", "Роль", "Возраст"]);

    const rows = [...host.querySelectorAll('[data-scope="table"][data-part="row"]')];
    expect(rows[0]?.textContent).toBe("АняДизайнер29");
  });

  it("defaultColumnVisibility hides a column from the header and every row's cells", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => <TableRoot columns={columns} data={data} defaultColumnVisibility={{ role: false }} />,
      host,
    );

    const headers = [...host.querySelectorAll('[data-scope="table"][data-part="header-cell"]')];
    expect(headers.map((header) => header.textContent)).toEqual(["Имя", "Возраст"]);

    const rows = [...host.querySelectorAll('[data-scope="table"][data-part="row"]')];
    expect(rows[0]?.textContent).toBe("Аня29");
  });

  it("controlled columnVisibility reacts to an external toggle", async () => {
    const [visibility, setVisibility] = createSignal<TableColumnVisibility>({});
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => <TableRoot columns={columns} data={data} columnVisibility={visibility()} />,
      host,
    );

    expect(host.querySelectorAll('[data-scope="table"][data-part="header-cell"]')).toHaveLength(3);

    setVisibility({ age: false });
    await Promise.resolve();

    const headers = [...host.querySelectorAll('[data-scope="table"][data-part="header-cell"]')];
    expect(headers.map((header) => header.textContent)).toEqual(["Имя", "Роль"]);
  });
});

describe('table column pinning — pinned columns move to the edges and carry data-pinned', () => {
  const columns = [
    { accessorKey: "name" as const, header: "Имя" },
    { accessorKey: "role" as const, header: "Роль" },
    { accessorKey: "age" as const, header: "Возраст" },
  ];
  const data = [
    { name: "Аня", role: "Дизайнер", age: 29 },
    { name: "Борис", role: "Инженер", age: 34 },
  ];

  it("no data-pinned at all when nothing is pinned", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <TableRoot columns={columns} data={data} />, host);

    const headers = [...host.querySelectorAll('[data-scope="table"][data-part="header-cell"]')];
    expect(headers.every((header) => header.getAttribute("data-pinned") === null)).toBe(true);
  });

  it("pinning a column to the start moves it first, both header and every row's cell", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => <TableRoot columns={columns} data={data} defaultColumnPinning={{ start: ["age"], end: [] }} />,
      host,
    );

    const headers = [...host.querySelectorAll('[data-scope="table"][data-part="header-cell"]')];
    expect(headers.map((header) => header.textContent)).toEqual(["Возраст", "Имя", "Роль"]);
    expect(headers[0]?.getAttribute("data-pinned")).toBe("start");
    expect(headers[1]?.getAttribute("data-pinned")).toBeNull();

    const rows = [...host.querySelectorAll('[data-scope="table"][data-part="row"]')];
    expect(rows[0]?.textContent).toBe("29АняДизайнер");

    const cells = [...host.querySelectorAll('[data-scope="table"][data-part="cell"]')];
    expect(cells[0]?.getAttribute("data-pinned")).toBe("start");
  });

  it("pinning a column to the end moves it last", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => <TableRoot columns={columns} data={data} defaultColumnPinning={{ start: [], end: ["name"] }} />,
      host,
    );

    const headers = [...host.querySelectorAll('[data-scope="table"][data-part="header-cell"]')];
    expect(headers.map((header) => header.textContent)).toEqual(["Роль", "Возраст", "Имя"]);
    expect(headers[2]?.getAttribute("data-pinned")).toBe("end");
  });
});

describe('table global filter — narrows rows by substring across every column, case-insensitive', () => {
  const columns = [
    { accessorKey: "name" as const, header: "Имя" },
    { accessorKey: "role" as const, header: "Роль" },
  ];
  const data = [
    { name: "Аня", role: "Дизайнер" },
    { name: "Борис", role: "Инженер" },
    { name: "Вера", role: "Менеджер" },
  ];

  it("shows every row when the filter is empty", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <TableRoot columns={columns} data={data} />, host);

    expect(host.querySelectorAll('[data-scope="table"][data-part="row"]')).toHaveLength(3);
  });

  it("defaultGlobalFilter narrows to rows matching any column, case-insensitively", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <TableRoot columns={columns} data={data} defaultGlobalFilter="инжен" />, host);

    const rows = [...host.querySelectorAll('[data-scope="table"][data-part="row"]')];
    expect(rows).toHaveLength(1);
    expect(rows[0]?.textContent).toBe("БорисИнженер");
  });

  it("controlled globalFilter reacts to an external change", async () => {
    const [filter, setFilter] = createSignal("");
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <TableRoot columns={columns} data={data} globalFilter={filter()} />, host);

    expect(host.querySelectorAll('[data-scope="table"][data-part="row"]')).toHaveLength(3);

    setFilter("Вера");
    await Promise.resolve();

    const rows = [...host.querySelectorAll('[data-scope="table"][data-part="row"]')];
    expect(rows).toHaveLength(1);
    expect(rows[0]?.textContent).toBe("ВераМенеджер");
  });

  it("matches on any column, not just the first", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <TableRoot columns={columns} data={data} defaultGlobalFilter="Дизайнер" />, host);

    const rows = [...host.querySelectorAll('[data-scope="table"][data-part="row"]')];
    expect(rows).toHaveLength(1);
    expect(rows[0]?.textContent).toBe("АняДизайнер");
  });
});

describe('table column filter — narrows rows by a single column\'s value, other columns untouched', () => {
  const columns = [
    { accessorKey: "name" as const, header: "Имя" },
    { accessorKey: "role" as const, header: "Роль" },
  ];
  const data = [
    { name: "Аня", role: "Дизайнер" },
    { name: "Борис", role: "Инженер" },
    { name: "Дизайнерова", role: "Менеджер" },
  ];

  it("shows every row when no column filters are set", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <TableRoot columns={columns} data={data} />, host);

    expect(host.querySelectorAll('[data-scope="table"][data-part="row"]')).toHaveLength(3);
  });

  it("defaultColumnFilters narrows to rows whose named column matches, ignoring the same substring elsewhere", () => {
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => <TableRoot columns={columns} data={data} defaultColumnFilters={[{ id: "role", value: "диз" }]} />,
      host,
    );

    const rows = [...host.querySelectorAll('[data-scope="table"][data-part="row"]')];
    expect(rows).toHaveLength(1);
    expect(rows[0]?.textContent).toBe("АняДизайнер");
  });

  it("controlled columnFilters reacts to an external change", async () => {
    const [filters, setFilters] = createSignal<{ id: string; value: unknown }[]>([]);
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <TableRoot columns={columns} data={data} columnFilters={filters()} />, host);

    expect(host.querySelectorAll('[data-scope="table"][data-part="row"]')).toHaveLength(3);

    setFilters([{ id: "name", value: "Борис" }]);
    await Promise.resolve();

    const rows = [...host.querySelectorAll('[data-scope="table"][data-part="row"]')];
    expect(rows).toHaveLength(1);
    expect(rows[0]?.textContent).toBe("БорисИнженер");
  });
});

describe("table faceted values — table.getColumn(id).getFacetedUniqueValues() counts occurrences", () => {
  const columns = [
    { accessorKey: "name" as const, header: "Имя" },
    { accessorKey: "role" as const, header: "Роль" },
  ];
  const data = [
    { name: "Аня", role: "Дизайнер" },
    { name: "Борис", role: "Инженер" },
    { name: "Вера", role: "Дизайнер" },
  ];

  it("counts every distinct value in the column across all rows", () => {
    let captured: Map<unknown, number> | undefined;
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <TableRoot columns={columns} data={data}>
          {(table) => {
            captured = table.getColumn("role")!.getFacetedUniqueValues();
            return <></>;
          }}
        </TableRoot>
      ),
      host,
    );

    expect(captured?.get("Дизайнер")).toBe(2);
    expect(captured?.get("Инженер")).toBe(1);
  });

  it("excludes the column's own filter, so the facet still lists options the current filter hides", () => {
    let captured: Map<unknown, number> | undefined;
    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(
      () => (
        <TableRoot columns={columns} data={data} defaultColumnFilters={[{ id: "role", value: "Инженер" }]}>
          {(table) => {
            captured = table.getColumn("role")!.getFacetedUniqueValues();
            return <></>;
          }}
        </TableRoot>
      ),
      host,
    );

    expect(captured?.get("Дизайнер")).toBe(2);
    expect(captured?.get("Инженер")).toBe(1);
  });
});
