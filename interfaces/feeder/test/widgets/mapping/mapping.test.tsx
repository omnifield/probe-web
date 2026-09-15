import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { Mapping } from "../../../src/widgets/mapping/root.js";
import type { MappingChange } from "../../../src/widgets/mapping/types.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

function mount(a: unknown, b: unknown, onChange: (change: MappingChange) => void): HTMLElement {
  const host = document.createElement("div");
  document.body.append(host);
  dispose = render(() => <Mapping a={a} b={b} onChange={onChange} />, host);
  return host;
}

function selectFor(host: HTMLElement, targetLabelPrefix: string): HTMLSelectElement {
  const label = Array.from(host.querySelectorAll("p")).find((node) =>
    node.textContent?.startsWith(targetLabelPrefix),
  );
  const row = label?.closest('[data-scope="flow"][data-part="root"]');
  const select = row?.querySelector<HTMLSelectElement>("select");
  if (!select) throw new Error(`select для "${targetLabelPrefix}" не найден`);
  return select;
}

function pick(select: HTMLSelectElement, value: string): void {
  select.value = value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

describe("Mapping", () => {
  it("рендерит поле на каждый путь варианта Б", () => {
    const host = mount({ full_name: "Ada" }, { name: "" }, () => {});
    expect(host.textContent).toContain("/name");
  });

  it("на монтировании — onChange с пустыми rules/result", () => {
    const changes: MappingChange[] = [];
    mount({ full_name: "Ada" }, { name: "" }, (change) => changes.push(change));

    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({ rules: [], result: { row: {}, issues: [] } });
  });

  it("выбор пути А для поля Б строит FieldRule и живой результат", () => {
    const changes: MappingChange[] = [];
    const host = mount({ full_name: "Ada", age: 30 }, { name: "" }, (change) => changes.push(change));

    pick(selectFor(host, "/name"), "/full_name");

    const last = changes.at(-1)!;
    expect(last.rules).toEqual([{ target: "/name", from: "/full_name" }]);
    expect(last.result).toEqual({ row: { name: "Ada" }, issues: [] });
  });

  it("сброс на «— не сведено —» убирает правило", () => {
    const changes: MappingChange[] = [];
    const host = mount({ full_name: "Ada" }, { name: "" }, (change) => changes.push(change));

    const select = selectFor(host, "/name");
    pick(select, "/full_name");
    pick(select, "");

    const last = changes.at(-1)!;
    expect(last.rules).toEqual([]);
    expect(last.result).toEqual({ row: {}, issues: [] });
  });

  it("два поля Б, каждое своим путём А — сведение независимое", () => {
    const changes: MappingChange[] = [];
    const host = mount({ full_name: "Ada", years: 30 }, { name: "", age: 0 }, (change) => changes.push(change));

    pick(selectFor(host, "/name"), "/full_name");
    pick(selectFor(host, "/age"), "/years");

    const last = changes.at(-1)!;
    expect(last.rules).toEqual(
      expect.arrayContaining([
        { target: "/name", from: "/full_name" },
        { target: "/age", from: "/years" },
      ]),
    );
    expect(last.result).toEqual({ row: { name: "Ada", age: 30 }, issues: [] });
  });
});
