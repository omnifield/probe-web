// Вторая волна таблицы в документе: закрепление, ширины, группировка с итогами, листание,
// выделение и закрепление строк.

import { afterEach, describe, expect, it } from "vitest";
import { createSignal } from "solid-js";

import { DataTable, TablePager } from "../src/table/table.jsx";
import type { ColumnDictionary, Row, SessionState, ViewState } from "../src/table/index.js";
import { EMPTY_SESSION, EMPTY_VIEW } from "../src/table/model.js";
import { all, cleanup, mount, one, press } from "./dom.jsx";

afterEach(cleanup);

const COLUMNS: ColumnDictionary = [
  { name: "/applicant", label: "заявитель", type: "text" },
  { name: "/region", label: "регион", type: "text", aggregate: "countdistinct" },
  { name: "/amount", label: "сумма", type: "number", aggregate: "sum" },
];

const ROWS: Row[] = [
  { applicant: "Иванов", region: "Москва", amount: 100 },
  { applicant: "Петров", region: "Москва", amount: 300 },
  { applicant: "Сидоров", region: "Тула", amount: 50 },
  { applicant: "Кузнецов", region: "Тула", amount: 200 },
  { applicant: "Белова", region: "Казань", amount: 700 },
];

const rowId = (row: Row) => String(row["applicant"]);

function setup(
  initialView: ViewState = EMPTY_VIEW,
  extra: Partial<Parameters<typeof DataTable>[0]> = {},
  initialSession: SessionState = EMPTY_SESSION,
) {
  const [view, setView] = createSignal(initialView);
  const [session, setSession] = createSignal(initialSession);
  const host = mount(() => (
    <DataTable
      columns={COLUMNS}
      rows={ROWS}
      view={view()}
      onViewChange={setView}
      session={session()}
      onSessionChange={setSession}
      rowId={rowId}
      {...extra}
    />
  ));
  return { host, view, session, setView, setSession };
}

const texts = (host: ParentNode, selector: string) =>
  all(host, selector).map((node) => node.textContent?.trim() ?? "");

const bodyColumn = (host: ParentNode, column: string) =>
  all(host, `tbody [data-slot='table-cell'][data-column='${column}']`).map(
    (node) => node.textContent?.trim() ?? "",
  );

/** Таблица с рядом управления в заголовках — управление колонкой живёт в самой колонке. */
function setupMenu(initial: ViewState = EMPTY_VIEW) {
  const [view, setView] = createSignal(initial);
  const host = mount(() => (
    <DataTable columns={COLUMNS} rows={ROWS} view={view()} onViewChange={setView} columnMenu />
  ));
  return { host, view };
}

describe("закрепление колонок", () => {
  it("прижатая колонка уезжает к краю и помечается атрибутом", () => {
    const { host } = setup({ ...EMPTY_VIEW, pinned: { start: ["/amount"], end: [] } });

    expect(texts(host, "[data-slot='table-header']")).toEqual(["сумма", "заявитель", "регион"]);
    expect(
      one(host, "[data-slot='table-header'][data-column='/amount']").getAttribute("data-pinned"),
    ).toBe("start");
  });

  it("кнопка в заголовке прижимает и отпускает", () => {
    const { host, view } = setupMenu();

    const pin = () =>
      one(host, "[data-slot='table-header'][data-column='/region'] [data-slot='table-column-pin']");

    press(pin());
    expect(view().pinned).toEqual({ start: ["/region"], end: [] });

    press(pin());
    expect(view().pinned).toEqual({ start: [], end: [] });
  });
});

describe("ширины колонок", () => {
  it("заданная ширина уезжает в разметку", () => {
    const { host } = setup({ ...EMPTY_VIEW, widths: { "/amount": 240 } });
    expect(
      one<HTMLElement>(host, "[data-slot='table-header'][data-column='/amount']").style.width,
    ).toBe("240px");
  });

  it("ручка ширины — `separator` и работает с КЛАВИАТУРЫ, а не только мышью", () => {
    const { host, view } = setup();
    const handle = one(host, "[data-slot='table-header'][data-column='/amount'] [data-slot='table-column-resize']");

    expect(handle.getAttribute("role")).toBe("separator");
    expect(handle.getAttribute("tabindex")).toBe("0");

    handle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    const wider = view().widths["/amount"]!;
    expect(wider).toBeGreaterThan(0);

    handle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    expect(view().widths["/amount"]).toBeLessThan(wider);

    // Enter возвращает ширину разметке — иначе суженную колонку ловят мышью по пикселю.
    handle.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    expect(view().widths["/amount"]).toBeUndefined();
  });
});

describe("группировка", () => {
  const groupedView: ViewState = { ...EMPTY_VIEW, grouping: ["/region"] };

  it("строки собираются в группы, и группа знает, сколько в ней строк", () => {
    const { host } = setup(groupedView);

    const groups = all(host, "tbody [data-slot='table-row'][data-group]");
    expect(groups).toHaveLength(3);
    expect(texts(host, "[data-slot='table-group-count']")).toEqual(["2", "2", "1"]);
  });

  it("группа объявляет своё состояние `aria-expanded`, а не только значком", () => {
    const { host, session } = setup(groupedView);
    const group = all(host, "tbody [data-slot='table-row'][data-group]")[0]!;

    expect(group.getAttribute("aria-expanded")).toBe("false");

    press(one(group, "[data-slot='table-group-toggle']"));

    expect(session().expanded).toContain("/region:Москва");
    expect(
      all(host, "tbody [data-slot='table-row'][data-group]")[0]!.getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("раскрытая группа показывает свои строки", () => {
    const { host } = setup(groupedView, {}, { ...EMPTY_SESSION, expanded: "all" });

    // Три группы плюс пять строк под ними.
    expect(all(host, "tbody [data-slot='table-row']")).toHaveLength(8);
    expect(bodyColumn(host, "/applicant")).toContain("Иванов");
  });

  it("в свёрнутой группе колонка со сведением показывает ИТОГ группы, а не пустоту", () => {
    const { host } = setup(groupedView);
    const sums = all(host, "tbody [data-slot='table-cell'][data-column='/amount'][data-aggregated]");

    expect(sums).toHaveLength(3);
    expect(sums.map((node) => node.textContent?.replace(/\s/g, " ").trim())).toEqual(["400", "250", "700"]);
  });

  it("группировка меняет роль на `treegrid` — грид с раскрытием, а не просто грид", () => {
    const { host } = setup(groupedView, { onCellClick: () => {} });
    expect(one(host, "[data-slot='table']").getAttribute("role")).toBe("treegrid");
  });
});

describe("листание", () => {
  const paged: ViewState = { ...EMPTY_VIEW, pageSize: 2 };

  it("на странице ровно столько строк, сколько просили", () => {
    const { host } = setup(paged);
    expect(bodyColumn(host, "/applicant")).toEqual(["Иванов", "Петров"]);
  });

  it("переход на страницу показывает следующие строки", () => {
    const { host, session } = setup(paged);
    expect(session().page).toBe(0);

    const { host: pagerHost } = setupPager(paged);
    press(one(pagerHost, "[data-slot='table-pager-next']"));
    expect(host).toBeTruthy();
  });

  it("при листании таблица объявляет ПОЛНОЕ число строк и позицию каждой", () => {
    // Ровно тот случай, ради которого `aria-rowcount`/`aria-rowindex` и существуют: в DOM
    // лежит не весь набор.
    const { host } = setup(paged, {}, { ...EMPTY_SESSION, page: 1 });

    expect(one(host, "[data-slot='table']").getAttribute("aria-rowcount")).toBe("6");
    const rows = all(host, "tbody [data-slot='table-row']");
    expect(rows[0]?.getAttribute("aria-rowindex")).toBe("4");
    expect(rows[1]?.getAttribute("aria-rowindex")).toBe("5");
  });

  it("без листания номера строк НЕ объявляются — в DOM и так весь набор", () => {
    const { host } = setup();
    expect(one(host, "[data-slot='table']").hasAttribute("aria-rowcount")).toBe(false);
    expect(all(host, "tbody [data-slot='table-row']")[0]?.hasAttribute("aria-rowindex")).toBe(false);
  });

  it("при группировке номера НЕ объявляются: позиция в дереве неопределена", () => {
    const { host } = setup({ ...paged, grouping: ["/region"] });
    expect(one(host, "[data-slot='table']").hasAttribute("aria-rowcount")).toBe(false);
  });

  function setupPager(view: ViewState, initial: SessionState = EMPTY_SESSION) {
    const [current, setCurrent] = createSignal(view);
    const [session, setSession] = createSignal(initial);
    const host = mount(() => (
      <TablePager
        total={ROWS.length}
        view={current()}
        onViewChange={setCurrent}
        session={session()}
        onSessionChange={setSession}
      />
    ));
    return { host, session, view: current };
  }

  it("листалка знает, где мы и сколько всего", () => {
    const { host } = setupPager(paged);
    expect(one(host, "[data-slot='table-pager-position']").textContent).toContain("страница 1 из 3");
  });

  it("на первой странице «назад» недоступно, на последней — «вперёд»", () => {
    const first = setupPager(paged);
    expect(one<HTMLButtonElement>(first.host, "[data-slot='table-pager-prev']").disabled).toBe(true);

    const last = setupPager(paged, { ...EMPTY_SESSION, page: 2 });
    expect(one<HTMLButtonElement>(last.host, "[data-slot='table-pager-next']").disabled).toBe(true);
  });

  it("переход вперёд двигает страницу", () => {
    const { host, session } = setupPager(paged);
    press(one(host, "[data-slot='table-pager-next']"));
    expect(session().page).toBe(1);
  });

  it("смена размера страницы возвращает к началу — иначе человек оказывается неизвестно где", () => {
    const { host, session, view } = setupPager(paged, { ...EMPTY_SESSION, page: 2 });
    const select = one<HTMLSelectElement>(host, "[data-slot='table-pager-size'] select");

    select.value = "";
    select.dispatchEvent(new Event("change", { bubbles: true }));

    expect(view().pageSize).toBeNull();
    expect(session().page).toBe(0);
  });
});

describe("выделение и закрепление строк", () => {
  it("служебная колонка появляется только когда её просят", () => {
    expect(all(setup().host, "[data-slot='table-service']")).toHaveLength(0);
    expect(all(setup(EMPTY_VIEW, { selectable: true }).host, "[data-slot='table-service']").length)
      .toBeGreaterThan(0);
  });

  it("выделение строки объявляется `aria-selected`", () => {
    const { host, session } = setup(EMPTY_VIEW, { selectable: true });

    one<HTMLInputElement>(host, "tbody [data-slot='table-select-row']").click();

    expect(session().selected).toEqual(["Иванов"]);
    expect(all(host, "tbody [data-slot='table-row']")[0]?.getAttribute("aria-selected")).toBe("true");
  });

  it("«выделить все» выделяет весь НАБОР, а не видимую страницу", () => {
    // Иначе «выделить все» на второй странице значило бы разное в разные моменты.
    const { host, session } = setup({ ...EMPTY_VIEW, pageSize: 2 }, { selectable: true });

    one<HTMLInputElement>(host, "[data-slot='table-select-all']").click();

    expect(session().selected).toHaveLength(ROWS.length);
  });

  it("закреплённая строка уходит наверх", () => {
    const { host, session } = setup(
      EMPTY_VIEW,
      { selectable: true },
      { ...EMPTY_SESSION, pinnedRows: { top: ["Белова"], bottom: [] } },
    );

    expect(bodyColumn(host, "/applicant")[0]).toBe("Белова");
    expect(all(host, "tbody [data-slot='table-row']")[0]?.getAttribute("data-pinned")).toBe("top");
    expect(session().pinnedRows.top).toEqual(["Белова"]);
  });
});

describe("итоговая строка", () => {
  it("считается по ВСЕМУ поданному набору, а не по странице", () => {
    // Итог по одной странице — не итог, а сумма того, что попалось на глаза.
    const { host } = setup({ ...EMPTY_VIEW, pageSize: 2 }, { totals: true });

    const sum = one(host, "[data-slot='table-total'][data-column='/amount']");
    expect(sum.textContent?.replace(/\s/g, " ").trim()).toBe("1 350");
  });

  it("счётчик показывается числом, а не форматом колонки", () => {
    const { host } = setup(EMPTY_VIEW, { totals: true });
    expect(one(host, "[data-slot='table-total'][data-column='/region']").textContent?.trim()).toBe("3");
  });

  it("у колонки без метода сведения итога нет", () => {
    const { host } = setup(EMPTY_VIEW, { totals: true });
    expect(one(host, "[data-slot='table-total'][data-column='/applicant']").textContent?.trim()).toBe("");
  });

  it("без просьбы итоговой строки нет вовсе", () => {
    expect(all(setup().host, "[data-slot='table-total']")).toHaveLength(0);
  });
});
