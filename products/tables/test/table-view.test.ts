// Состояние вида: порядок, видимость, сортировка — и чтение чужого JSON с границы.

import { describe, expect, it } from "vitest";

import type { ColumnDictionary, ViewState } from "../src/table/model.js";
import { EMPTY_VIEW } from "../src/table/model.js";
import {
  columnOrder,
  isVisible,
  moveColumn,
  parseView,
  serializeView,
  sortDirectionOf,
  sortPositionOf,
  toggleColumn,
  toggleSort,
  visibleColumns,
} from "../src/table/view.js";

const COLUMNS: ColumnDictionary = [
  { name: "/applicant", label: "заявитель", type: "text" },
  { name: "/amount", label: "сумма", type: "number" },
  { name: "/created", label: "заведена", type: "date" },
];

const names = (columns: { name: string }[]) => columns.map((column) => column.name);

describe("порядок колонок", () => {
  it("пустое состояние — порядок словаря", () => {
    expect(columnOrder(COLUMNS, EMPTY_VIEW)).toEqual(["/applicant", "/amount", "/created"]);
  });

  it("колонка, которой нет в состоянии, идёт ПОСЛЕ перечисленных, а не пропадает", () => {
    // Иначе добавление колонки в словарь ломало бы каждый сохранённый вид.
    const view: ViewState = { ...EMPTY_VIEW, order: ["/amount"] };
    expect(columnOrder(COLUMNS, view)).toEqual(["/amount", "/applicant", "/created"]);
  });

  it("колонка из состояния, которой нет в словаре, игнорируется", () => {
    const view: ViewState = { ...EMPTY_VIEW, order: ["/gone", "/amount"] };
    expect(columnOrder(COLUMNS, view)).toEqual(["/amount", "/applicant", "/created"]);
  });

  it("сдвиг меняет соседей местами", () => {
    const moved = moveColumn(COLUMNS, EMPTY_VIEW, "/amount", -1);
    expect(columnOrder(COLUMNS, moved)).toEqual(["/amount", "/applicant", "/created"]);
  });

  it("сдвиг за край ничего не делает", () => {
    expect(moveColumn(COLUMNS, EMPTY_VIEW, "/applicant", -1)).toBe(EMPTY_VIEW);
    expect(moveColumn(COLUMNS, EMPTY_VIEW, "/created", 1)).toBe(EMPTY_VIEW);
  });

  it("сдвиг считается по ПОЛНОМУ порядку, включая скрытые", () => {
    // Иначе перенос через скрытую колонку менял бы её место молча, и вид «поехал» бы,
    // как только её вернут.
    const view: ViewState = { ...EMPTY_VIEW, hidden: ["/amount"] };
    const moved = moveColumn(COLUMNS, view, "/created", -1);
    expect(columnOrder(COLUMNS, moved)).toEqual(["/applicant", "/created", "/amount"]);
  });
});

describe("видимость", () => {
  it("скрывает и возвращает", () => {
    const hidden = toggleColumn(EMPTY_VIEW, "/amount");
    expect(isVisible(hidden, "/amount")).toBe(false);
    expect(names(visibleColumns(COLUMNS, hidden))).toEqual(["/applicant", "/created"]);

    const back = toggleColumn(hidden, "/amount");
    expect(isVisible(back, "/amount")).toBe(true);
    expect(names(visibleColumns(COLUMNS, back))).toEqual(["/applicant", "/amount", "/created"]);
  });

  it("хранится СКРЫТОЕ, поэтому новая колонка видна по умолчанию", () => {
    const view: ViewState = { ...EMPTY_VIEW, hidden: ["/amount"] };
    const wider: ColumnDictionary = [...COLUMNS, { name: "/status", label: "статус", type: "text" }];
    expect(names(visibleColumns(wider, view))).toEqual(["/applicant", "/created", "/status"]);
  });
});

describe("сортировка", () => {
  it("переключается по кругу: нет → по возрастанию → по убыванию → нет", () => {
    const asc = toggleSort(EMPTY_VIEW, "/amount");
    expect(sortDirectionOf(asc, "/amount")).toBe("asc");

    const desc = toggleSort(asc, "/amount");
    expect(sortDirectionOf(desc, "/amount")).toBe("desc");

    const none = toggleSort(desc, "/amount");
    expect(sortDirectionOf(none, "/amount")).toBeNull();
    expect(none.sorting).toEqual([]);
  });

  it("обычное нажатие ЗАМЕНЯЕТ ключи, а не копит их", () => {
    const first = toggleSort(EMPTY_VIEW, "/amount");
    const second = toggleSort(first, "/created");
    expect(second.sorting).toEqual([{ field: "/created", direction: "asc" }]);
  });

  it("добавляющее нажатие копит ключи и сохраняет их порядок", () => {
    const first = toggleSort(EMPTY_VIEW, "/amount");
    const second = toggleSort(first, "/created", true);

    expect(second.sorting).toEqual([
      { field: "/amount", direction: "asc" },
      { field: "/created", direction: "asc" },
    ]);
    expect(sortPositionOf(second, "/amount")).toBe(1);
    expect(sortPositionOf(second, "/created")).toBe(2);
  });

  it("повторное добавляющее нажатие переносит ключ в конец", () => {
    const view = toggleSort(toggleSort(EMPTY_VIEW, "/amount"), "/created", true);
    const again = toggleSort(view, "/amount", true);

    expect(again.sorting).toEqual([
      { field: "/created", direction: "asc" },
      { field: "/amount", direction: "desc" },
    ]);
  });
});

describe("чтение и запись вида", () => {
  const view: ViewState = {
    version: 1,
    order: ["/amount", "/applicant"],
    hidden: ["/created"],
    sorting: [{ field: "/amount", direction: "desc" }],
  };

  it("круг без потерь", () => {
    const parsed = parseView(JSON.parse(JSON.stringify(serializeView(view))));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.view).toEqual(view);
  });

  it("без версии не читаем", () => {
    const parsed = parseView({ order: [], hidden: [], sorting: [] });
    expect(parsed).toEqual({ ok: false, error: "у вида нет версии формата — прочитать его нечем" });
  });

  it.each([
    [{ version: 2, order: [], hidden: [], sorting: [] }, "версия формата 2 не поддерживается, нужна 1"],
    [
      { version: 1, order: ["amount"], hidden: [], sorting: [] },
      "порядок колонок: «amount» — не путь вида «/имя» (JSON Pointer)",
    ],
    [{ version: 1, order: [], hidden: {}, sorting: [] }, "скрытые колонки: должно быть массивом"],
    [
      { version: 1, order: [], hidden: [], sorting: [{ field: "/a", direction: "вверх" }] },
      "ключ сортировки №1: направление «вверх» неизвестно",
    ],
    [
      {
        version: 1,
        order: [],
        hidden: [],
        sorting: [
          { field: "/a", direction: "asc" },
          { field: "/a", direction: "desc" },
        ],
      },
      "ключ сортировки №2: поле «/a» уже участвует",
    ],
  ])("испорченный вид не проходит: %o", (input, error) => {
    const parsed = parseView(input);
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.error).toBe(error);
  });
});
