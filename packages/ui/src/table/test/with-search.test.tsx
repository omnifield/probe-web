import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import type { DispatchedEvent } from "@web-core/assembly";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { createSignal } from "solid-js";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { kit as tableKit } from "../components/index.js";
import { passport as tablePassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as tableEditorInfo } from "../playground/index.js";

// Repro заявки: global-search на реальной таблице требует table.setGlobalFilter(value) с текущим
// текстом инпута — теперь, когда `on`/`dispatch` умеет EventBinding (packages/assembly), поле
// ввода — своя маленькая сборка (не часть анатомии table, см. README §IO), таблица — сборка
// `with-search` с `globalFilter` под внешним контролем. Обе рендерятся своим RenderTree, склеены
// одним `dispatch`, который держит настоящий Solid-сигнал — та самая роль, которую в реальном
// приложении играет стор.

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

function SearchInput(props: { onInput?: (event: InputEvent) => void }) {
  return <input data-testid="search" onInput={(event) => props.onInput?.(event)} />;
}

const REGISTRY: Registry = createRegistry({
  components: {
    table: { passport: readable(tablePassport, tableEditorInfo), parts: tableKit.parts },
    search: {
      passport: {
        component: "search",
        genus: "component",
        anatomy: { keys: () => ["root"] },
        root: "root",
        parts: [{ name: "root" }],
      } as any,
      parts: { root: SearchInput },
    },
  },
  admits,
});

const SEARCH_TREE = {
  components: {
    root: "root",
    nodes: {
      root: {
        id: "root",
        type: "search",
        parentId: null,
        children: [],
        on: {
          input: {
            event: { name: "search", context: { term: { event: "target.value" } } },
          },
        },
      },
    },
  },
} as const;

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("table with-search — typed text reaches globalFilter through EventBinding, on a real TableRoot", () => {
  it("narrows rows as the search box is typed into, widens back on clear", async () => {
    const initialData = {
      data: [
        { name: "Аня", role: "Дизайнер", age: 29 },
        { name: "Борис", role: "Инженер", age: 34 },
        { name: "Вера", role: "Менеджер", age: 41 },
      ],
      columns: [
        { accessorKey: "name", header: "Имя" },
        { accessorKey: "role", header: "Роль" },
        { accessorKey: "age", header: "Возраст" },
      ],
      defaultSorting: [{ columnId: "name", desc: false }],
      globalFilter: "",
    };
    const [data, setData] = createSignal(initialData);

    const dispatch = (event: DispatchedEvent) => {
      if (event.name === "search") setData((prev) => ({ ...prev, globalFilter: String(event.context.term ?? "") }));
    };

    const assembly = assemblies.find((candidate) => candidate.name === "with-search")!;
    const tree = baseAssemblyOf(tablePassport, assembly as PassportAssembly, "table", initialData);

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <>
          <RenderTree registry={REGISTRY} tree={SEARCH_TREE as any} dispatch={dispatch} />
          <RenderTree registry={REGISTRY} tree={tree} data={data()} />
        </>
      ),
      host,
    );

    expect(host.querySelectorAll('[data-scope="table"][data-part="row"]')).toHaveLength(3);

    const input = host.querySelector<HTMLInputElement>('[data-testid="search"]')!;
    input.value = "инженер";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await Promise.resolve();

    const rows = [...host.querySelectorAll('[data-scope="table"][data-part="row"]')];
    expect(rows).toHaveLength(1);
    expect(rows[0]?.textContent).toBe("БорисИнженер34");

    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await Promise.resolve();

    expect(host.querySelectorAll('[data-scope="table"][data-part="row"]')).toHaveLength(3);
  });
});
