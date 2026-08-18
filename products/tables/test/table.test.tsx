// Таблица проверяется РЕНДЕРОМ в документ: нажали на заголовок — посмотрели, что состояние
// вида изменилось, порядок строк поехал, а `aria-sort` сказал об этом вслух.

import { afterEach, describe, expect, it, vi } from "vitest";
import { createSignal } from "solid-js";

import { DataTable, HiddenColumns } from "../src/table/table.jsx";
import type { CellContext, ColumnDictionary, Row, ViewState } from "../src/table/index.js";
import { EMPTY_VIEW } from "../src/table/model.js";
import { all, cleanup, mount, one, press } from "./dom.jsx";

afterEach(cleanup);

const COLUMNS: ColumnDictionary = [
  { name: "/applicant", label: "заявитель", type: "text" },
  { name: "/amount", label: "сумма", type: "number" },
  { name: "/created", label: "заведена", type: "date" },
  { name: "/urgent", label: "срочная", type: "bool", sortable: false },
];

const ROWS: Row[] = [
  { applicant: "Петров", amount: 300, created: "2026-07-01", urgent: true },
  { applicant: "Иванов", amount: 1000, created: "2026-06-15" },
  { applicant: "Сидоров", amount: "", urgent: false },
];

function setup(
  initial: ViewState = EMPTY_VIEW,
  extra: Partial<Parameters<typeof DataTable>[0]> = {},
  rows: Row[] = ROWS,
) {
  const [view, setView] = createSignal(initial);
  const host = mount(() => (
    <DataTable columns={COLUMNS} rows={rows} view={view()} onViewChange={setView} {...extra} />
  ));
  return { host, view };
}

const texts = (host: ParentNode, selector: string) =>
  all(host, selector).map((node) => node.textContent?.trim() ?? "");

const columnValues = (host: ParentNode, column: string) =>
  texts(host, `[data-slot~='table-cell'][data-column='${column}']`);

describe("разметка", () => {
  it("рисует заголовки в порядке словаря", () => {
    const { host } = setup();
    expect(texts(host, "[data-slot~='table-header']")).toEqual([
      "заявитель",
      "сумма",
      "заведена",
      "срочная",
    ]);
  });

  it("показывает значения по формату колонки", () => {
    const { host } = setup();
    // Разделитель разрядов у русского формата — неразрывный пробел; нормализуем перед сверкой.
    const shown = columnValues(host, "/amount").map((text) => text.replace(/\s/g, " "));

    // Третье значение — «пусто» СЛОВОМ, а не пустой строкой: текст пустоты теперь живёт в
    // разметке, а не в `content:` у оформления. Его переводят и читают вслух, и из CSS
    // нельзя ни того, ни другого.
    expect(shown).toEqual(["300", "1 000", "пусто"]);
    expect(columnValues(host, "/created")).toEqual(["01.07.2026", "15.06.2026", "нет поля"]);
    // У средней строки поля `/urgent` НЕТ вовсе — и это «нет поля», а не «пусто». Ровно та
    // разница, ради которой два состояния и заведены.
    expect(columnValues(host, "/urgent")).toEqual(["да", "нет поля", "нет"]);
  });

  it("оценка рисуется СТУПЕНЯМИ, а не числом", () => {
    // Значением атрибута её не нарисовать: посчитать «залить три из пяти» по числу в
    // `data-rating` средствами CSS нельзя. Поэтому ступени — узлы, по одному на деление.
    const columns: ColumnDictionary = [
      { name: "/score", label: "оценка", type: "number", format: "rating", formatOptions: { ratingMax: 5 } },
    ];
    const rated = mount(() => (
      <DataTable columns={columns} rows={[{ score: 4 }]} view={EMPTY_VIEW} onViewChange={() => undefined} />
    ));

    const steps = all(rated, "[data-slot~='table-rating-step']");
    expect(steps).toHaveLength(5);
    expect(steps.filter((node) => node.hasAttribute("data-filled"))).toHaveLength(4);

    // Число никуда не делось: оно в атрибутах и в подписи, поэтому смысл ячейки читается
    // вслух, а не выводится из количества значков.
    const scale = one(rated, "[data-slot~='table-rating']");
    expect(scale.getAttribute("aria-label")).toBe("4 из 5");
    expect(one(rated, "[data-slot~='table-cell']").getAttribute("data-rating")).toBe("4");
  });

  it("различает «поля нет» и «поле есть, но пустое» — как фильтр", () => {
    const { host } = setup();

    const empty = all(host, "[data-slot~='table-cell'][data-column='/amount']")[2];
    expect(empty?.hasAttribute("data-empty")).toBe(true);
    expect(empty?.hasAttribute("data-missing")).toBe(false);

    const missing = all(host, "[data-slot~='table-cell'][data-column='/created']")[2];
    expect(missing?.hasAttribute("data-missing")).toBe(true);
  });

  it("без обработчика клика роль `grid` НЕ объявляется", () => {
    // `grid` обещает вспомогательной технологии клавиатурную модель — объявлять его без неё
    // значит соврать.
    const { host } = setup();
    expect(one(host, "[data-slot~='table']").hasAttribute("role")).toBe(false);
  });
});

describe("сортировка", () => {
  it("нажатие на заголовок сортирует по возрастанию и говорит об этом `aria-sort`", () => {
    const { host, view } = setup();

    press(one(host, "[data-slot~='table-header'][data-column='/amount'] [data-slot~='table-header-sort']"));

    expect(view().sorting).toEqual([{ field: "/amount", direction: "asc" }]);
    expect(
      one(host, "[data-slot~='table-header'][data-column='/amount']").getAttribute("aria-sort"),
    ).toBe("ascending");
    expect(columnValues(host, "/applicant")).toEqual(["Петров", "Иванов", "Сидоров"]);
  });

  it("второе нажатие — по убыванию, третье снимает сортировку", () => {
    const { host, view } = setup();
    const button = () =>
      one(host, "[data-slot~='table-header'][data-column='/amount'] [data-slot~='table-header-sort']");

    press(button());
    press(button());
    expect(view().sorting).toEqual([{ field: "/amount", direction: "desc" }]);
    // Пустая сумма идёт ПЕРВОЙ: правило «пустое больше непустого» разворачивается вместе с
    // направлением — это и есть `NULLS FIRST` по умолчанию для убывания в SQL.
    expect(columnValues(host, "/applicant")).toEqual(["Сидоров", "Иванов", "Петров"]);

    press(button());
    expect(view().sorting).toEqual([]);
    expect(
      one(host, "[data-slot~='table-header'][data-column='/amount']").getAttribute("aria-sort"),
    ).toBe("none");
  });

  it("пустое значение уходит в конец при «по возрастанию» — умолчание SQL", () => {
    const { host } = setup({ ...EMPTY_VIEW, sorting: [{ field: "/amount", direction: "asc" }] });
    expect(columnValues(host, "/applicant")).toEqual(["Петров", "Иванов", "Сидоров"]);
  });

  it("и в начало при «по убыванию» — второе умолчание SQL, из того же правила", () => {
    const { host } = setup({ ...EMPTY_VIEW, sorting: [{ field: "/amount", direction: "desc" }] });
    expect(columnValues(host, "/applicant")).toEqual(["Сидоров", "Иванов", "Петров"]);
  });

  it("равные значения не скачут: порядок ПОЛНЫЙ, с тай-брейкером", () => {
    // Устойчивость сортировки рынком не требуется, поэтому её обеспечиваем мы сами.
    const same: Row[] = [
      { applicant: "третий", amount: 5 },
      { applicant: "первый", amount: 5 },
      { applicant: "второй", amount: 5 },
    ];
    const view: ViewState = { ...EMPTY_VIEW, sorting: [{ field: "/amount", direction: "asc" }] };

    const first = setup(view, { rowId: (row: Row) => String(row["applicant"]) }, same);
    expect(columnValues(first.host, "/applicant")).toEqual(["второй", "первый", "третий"]);

    const second = setup(view, { rowId: (row: Row) => String(row["applicant"]) }, same);
    expect(columnValues(second.host, "/applicant")).toEqual(columnValues(first.host, "/applicant"));
  });

  it("колонка, которую сортировать нельзя, не даёт ни кнопки, ни `aria-sort`", () => {
    const { host } = setup();
    const header = one(host, "[data-slot~='table-header'][data-column='/urgent']");

    expect(header.querySelector("[data-slot~='table-header-sort']")).toBeNull();
    expect(header.hasAttribute("aria-sort")).toBe(false);
  });

  it("нажатие с shift копит ключи и нумерует их", () => {
    const { host, view } = setup();

    press(one(host, "[data-column='/amount'] [data-slot~='table-header-sort']"));
    const withShift = new MouseEvent("click", { bubbles: true, shiftKey: true });
    one(host, "[data-column='/applicant'] [data-slot~='table-header-sort']").dispatchEvent(withShift);

    expect(view().sorting).toEqual([
      { field: "/amount", direction: "asc" },
      { field: "/applicant", direction: "asc" },
    ]);
    // Номера читаются в порядке КОЛОНОК, а не ключей: «заявитель» стоит первым в таблице,
    // но в сортировке он второй.
    expect(
      one(host, "[data-column='/amount'] [data-slot~='table-header-sort-position']").textContent,
    ).toBe("1");
    expect(
      one(host, "[data-column='/applicant'] [data-slot~='table-header-sort-position']").textContent,
    ).toBe("2");
  });
});

describe("управление колонкой живёт В КОЛОНКЕ", () => {
  /** Что за колонки стоят в таблице и в каком порядке — по зацепке, а не по тексту заголовка. */
  const headers = (host: ParentNode) =>
    all(host, "[data-slot~='table-header']").map((node) => node.getAttribute("data-column"));

  function withMenu(initial: ViewState = EMPTY_VIEW) {
    const [view, setView] = createSignal(initial);
    const host = mount(() => (
      <>
        <HiddenColumns columns={COLUMNS} view={view()} onViewChange={setView} />
        <DataTable
          columns={COLUMNS}
          rows={ROWS}
          view={view()}
          onViewChange={setView}
          columnMenu
        />
      </>
    ));
    return { host, view };
  }

  it("без спроса ряда управления в заголовке НЕТ — таблица остаётся показом данных", () => {
    const { host } = setup();
    expect(host.querySelector("[data-slot~='table-column-menu']")).toBeNull();
  });

  it("ряд стоит в каждом заголовке и назван колонкой, к которой относится", () => {
    const { host } = withMenu();

    expect(all(host, "[data-slot~='table-column-menu']").length).toBe(COLUMNS.length);
    expect(
      one(
        host,
        "[data-slot~='table-header'][data-column='/amount'] [data-slot~='table-column-menu']",
      ).getAttribute("aria-label"),
    ).toBe("Колонка «сумма»");
  });

  it("✕ в колонке скрывает её, и вернуть её можно из списка скрытых", () => {
    const { host, view } = withMenu();

    press(one(host, "[data-slot~='table-header'][data-column='/amount'] [data-slot~='table-column-hide']"));

    expect(view().hidden).toEqual(["/amount"]);
    expect(headers(host)).toEqual(["/applicant", "/created", "/urgent"]);

    press(one(host, "[data-slot~='table-hidden-column'][data-column='/amount'] [data-slot~='table-column-show']"));

    expect(view().hidden).toEqual([]);
    // Колонка вернулась НА СВОЁ МЕСТО, а не в конец: порядок задаёт вид, а не порядок возврата.
    expect(headers(host)).toEqual(["/applicant", "/amount", "/created", "/urgent"]);
  });

  it("списка скрытых нет, пока ничего не скрыто", () => {
    const { host } = withMenu();
    expect(host.querySelector("[data-slot~='table-hidden-columns']")).toBeNull();
  });

  it("стрелка двигает колонку прямо из её заголовка", () => {
    const { host, view } = withMenu();

    press(one(host, "[data-slot~='table-header'][data-column='/amount'] [data-slot~='table-column-up']"));

    expect(view().order).toEqual(["/amount", "/applicant", "/created", "/urgent"]);
    expect(headers(host)).toEqual(["/amount", "/applicant", "/created", "/urgent"]);
  });

  it("шаг меряется ВИДИМЫМИ соседями: нажатие не бывает холостым", () => {
    // «сумма» скрыта и стоит между «заявителем» и «заведена».
    const { host, view } = withMenu({ ...EMPTY_VIEW, hidden: ["/amount"] });

    press(one(host, "[data-slot~='table-header'][data-column='/created'] [data-slot~='table-column-up']"));

    // Шагнули ЗА скрытую — через неё, а не в неё: на экране «заведена» ушла влево, и это видно.
    expect(headers(host)).toEqual(["/created", "/applicant", "/urgent"]);
    expect(view().order).toEqual(["/created", "/applicant", "/amount", "/urgent"]);
  });

  it("крайняя колонка не двигается за край", () => {
    const { host } = withMenu();
    const up = one<HTMLButtonElement>(
      host,
      "[data-slot~='table-header'][data-column='/applicant'] [data-slot~='table-column-up']",
    );
    expect(up.disabled).toBe(true);
  });

  it("у прижатой колонки стрелок нет: её место задаёт край, а не порядок", () => {
    const { host } = withMenu({ ...EMPTY_VIEW, pinned: { start: ["/amount"], end: [] } });

    const menu = one(host, "[data-slot~='table-header'][data-column='/amount'] [data-slot~='table-column-menu']");
    expect(menu.querySelector("[data-slot~='table-column-up']")).toBeNull();
    // Кнопка прижатия на месте — иначе колонку было бы не отпустить.
    expect(menu.querySelector("[data-slot~='table-column-pin']")).not.toBeNull();
  });
});

describe("ячейка: клик, клавиатура и разметка потребителя", () => {
  it("клик отдаёт контекст ячейки", () => {
    const onCellClick = vi.fn();
    const { host } = setup(EMPTY_VIEW, { onCellClick });

    press(all(host, "[data-slot~='table-cell'][data-column='/amount']")[0]!);

    expect(onCellClick).toHaveBeenCalledTimes(1);
    const context = onCellClick.mock.calls[0]![0] as CellContext;
    expect(context.value).toBe(300);
    expect(context.text).toBe("300");
    expect(context.present).toBe(true);
    expect(context.column.name).toBe("/amount");
    expect(context.rowIndex).toBe(0);
  });

  it("контекст отличает «поля нет» от пустого значения", () => {
    const onCellClick = vi.fn();
    const { host } = setup(EMPTY_VIEW, { onCellClick });

    press(all(host, "[data-slot~='table-cell'][data-column='/created']")[2]!);

    const context = onCellClick.mock.calls[0]![0] as CellContext;
    expect(context.present).toBe(false);
    expect(context.value).toBeUndefined();
  });

  it("интерактивная таблица объявляет роль `grid` и держит ОДНУ остановку табуляции", () => {
    // Роящийся tabindex: иначе таблица на тысячу строк добавила бы тысячи остановок.
    const { host } = setup(EMPTY_VIEW, { onCellClick: () => {} });

    expect(one(host, "[data-slot~='table']").getAttribute("role")).toBe("grid");
    const tabbable = all(host, "[data-slot~='table-cell']").filter(
      (cell) => cell.getAttribute("tabindex") === "0",
    );
    expect(tabbable).toHaveLength(1);
  });

  it("клавиша Enter на ячейке делает то же, что клик", () => {
    const onCellClick = vi.fn();
    const { host } = setup(EMPTY_VIEW, { onCellClick });

    const cell = all(host, "[data-slot~='table-cell']")[0]!;
    cell.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(onCellClick).toHaveBeenCalledTimes(1);
  });

  it("стрелка переносит фокус на соседнюю ячейку", () => {
    const { host } = setup(EMPTY_VIEW, { onCellClick: () => {} });

    const first = all<HTMLElement>(host, "[data-slot~='table-cell']")[0]!;
    first.focus();
    first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

    const focused = document.activeElement as HTMLElement | null;
    expect(focused?.getAttribute("data-column")).toBe("/amount");
    expect(focused?.getAttribute("data-row-index")).toBe("0");
  });

  it("разметка потребителя приезжает атрибутом и классом, а стилей таблица не привозит", () => {
    const { host } = setup(EMPTY_VIEW, {
      cellAttrs: (context: CellContext) =>
        context.column.name === "/amount" && Number(context.value) > 500
          ? { highlighted: true, class: "big", title: "крупная сумма" }
          : undefined,
    });

    const cells = all(host, "[data-slot~='table-cell'][data-column='/amount']");
    expect(cells[0]?.hasAttribute("data-highlighted")).toBe(false);
    expect(cells[1]?.hasAttribute("data-highlighted")).toBe(true);
    expect(cells[1]?.getAttribute("class")).toBe("big");
    expect(cells[1]?.getAttribute("title")).toBe("крупная сумма");
    expect(one(host, "[data-slot~='table']").hasAttribute("class")).toBe(false);
  });
});
