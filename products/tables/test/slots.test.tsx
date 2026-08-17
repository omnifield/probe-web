// Гейт ОБЯЗАТЕЛЬСТВА по `data-slot` и по состояниям (`kb:PROBEWEB-12`, пункт 7; канон
// одевания от owner-skin, требования 1, 2, 5, 6).
//
// Зона `skin` цепляется за имена зацепок, и на них держится всё её оформление. Обещание
// «имена не меняются и не исчезают без мажора» без проверки живёт ровно до первого
// переименования: исчезнувшая зацепка не ломает ни сборку, ни типы, ни один тест поведения —
// разметка остаётся валидной, а оформление у потребителя просто перестаёт применяться.
// Узнаёт об этом он сам, глазами, и уже после выпуска.
//
// Поэтому перечень стерегут С ДВУХ сторон, и обе стороны нужны:
//
//   1. КАЖДОЕ обещанное имя обязано появиться в живом документе. Удалили зацепку,
//      переименовали её, обменяли местами два имени — прогон краснеет и называет имя.
//   2. КАЖДАЯ зацепка из исходников обязана быть в перечне. Новую добавлять можно и без
//      мажора, но молча — нельзя: не попав в перечень, она не станет обещанием, и потребитель
//      будет цепляться за то, чего мы ему не обещали.
//
// Проверка первая — РЕНДЕР, как и весь предмет зоны: снятая с модуля зацепка не отличается от
// поставленной на узел. Проверка вторая читает исходники и потому живёт рядом, а не в
// сборочном прогоне: у обеих один предмет и один адрес, куда смотреть при красноте.
//
// СЦЕНА показывает предметы в тех состояниях, в которых видны ВСЕ их части: таблицу
// сгруппированную, отсортированную по двум ключам, с прижатыми колонками, скрытой колонкой,
// итогами и выделением; конструктор отбора во всех четырёх видах условия и во всех трёх
// состояниях логики; график столбиками, линией и пустой; переходник с удавшимся и с
// провалившимся разбором. Части, которые ИСКЛЮЧАЮТ друг друга (подсказка логики и поле
// формулы, отчёт и отказ переходника), показаны разными экземплярами — иначе одну из них
// нельзя увидеть вовсе, а необойдённая часть и есть та, что молча ломается.

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import type { AdapterSpec } from "../src/adapter/model.js";
import { AdapterBuilder } from "../src/adapter/ui/adapter-builder.jsx";
import { Chart, ChartLegend } from "../src/chart/chart.jsx";
import type { ChartSpec } from "../src/chart/model.js";
import type { FieldDictionary, FilterState } from "../src/filters/model.js";
import { nextConditionId } from "../src/filters/model.js";
import type { Preset, Template } from "../src/filters/presets.js";
import { FilterBuilder } from "../src/filters/ui/filter-builder.jsx";
import type { ColumnDictionary, Row, SessionState, ViewState } from "../src/table/index.js";
import { VIEW_FORMAT_VERSION } from "../src/table/model.js";
import { DataTable, GroupControls, HiddenColumns, TablePager } from "../src/table/table.jsx";
import { all, cleanup, mount, one, press } from "./dom.jsx";
import {
  ADAPTER_SLOTS,
  CHART_SLOTS,
  FAMILIES,
  FILTER_SLOTS,
  FOREIGN_SLOTS,
  PROMISED_SLOTS,
  PROMISED_TABLE_STATES,
  TABLE_SLOTS,
} from "./slot-list.js";

afterEach(cleanup);

// ─── таблица ──────────────────────────────────────────────────────────────────────────────

const COLUMNS: ColumnDictionary = [
  { name: "/region", label: "регион", type: "text", aggregate: "count" },
  { name: "/applicant", label: "заявитель", type: "text" },
  { name: "/amount", label: "сумма", type: "number", aggregate: "sum" },
  { name: "/score", label: "оценка", type: "number", format: "rating", formatOptions: { ratingMax: 5 } },
  { name: "/created", label: "заведена", type: "date" },
  { name: "/urgent", label: "срочная", type: "bool", sortable: false },
  // Скрытая: без неё не появится ни список скрытых колонок, ни кнопка возврата.
  { name: "/note", label: "примечание", type: "text" },
];

const ROWS: Row[] = [
  { region: "Москва", applicant: "Иванов", amount: 1000, score: 4, created: "2026-06-15", urgent: true, note: "—" },
  // Поля `/created` НЕТ вовсе — это `data-missing`, и оно не то же, что пустое.
  { region: "Москва", applicant: "Петров", amount: "", score: 2, urgent: false, note: "—" },
  // `/amount` не разбирается в число — это `data-unformatted`.
  { region: "Тула", applicant: "Сидоров", amount: "нет", score: 5, created: "2026-07-01", urgent: true, note: "—" },
];

const VIEW: ViewState = {
  version: VIEW_FORMAT_VERSION,
  order: [],
  hidden: ["/note"],
  // Два ключа: без второго не появится место ключа в порядке.
  sorting: [
    { field: "/applicant", direction: "asc" },
    { field: "/amount", direction: "desc" },
  ],
  pinned: { start: ["/region"], end: ["/urgent"] },
  widths: { "/amount": 140 },
  grouping: ["/region"],
  pageSize: 25,
};

const SESSION: SessionState = {
  page: 0,
  expanded: "all",
  selected: ["0"],
  pinnedRows: { top: [], bottom: [] },
};

/** Таблица сгруппированная — она даёт строки-группы, сведённые ячейки и глубину. */
function GroupedTable() {
  const [view, setView] = createSignal(VIEW);
  const [session, setSession] = createSignal(SESSION);

  return (
    <>
      <DataTable
        columns={COLUMNS}
        rows={ROWS}
        view={view()}
        onViewChange={setView}
        session={session()}
        onSessionChange={setSession}
        caption="Заявки"
        selectable
        columnMenu
        totals
        onCellClick={() => undefined}
        cellAttrs={(context) => ({ highlighted: context.column.name === "/amount" })}
      />
      <HiddenColumns columns={COLUMNS} view={view()} onViewChange={setView} />
      <TablePager
        total={ROWS.length}
        view={view()}
        onViewChange={setView}
        session={session()}
        onSessionChange={setSession}
      />
      <GroupControls session={session()} onSessionChange={setSession} />
    </>
  );
}

/**
 * Таблица БЕЗ группировки и с закреплённой строкой.
 *
 * Отдельным экземпляром, а не настройкой первого: закрепление строк живёт в сеансе и меряется
 * тождеством строки, а при группировке набор пополняется строками-группами со своими
 * тождествами. Показывать закрепление там, где оно спорно, значит проверять не то.
 */
function PinnedRowTable() {
  const [view, setView] = createSignal({ ...VIEW, grouping: [] });
  const [session, setSession] = createSignal<SessionState>({
    page: 0,
    expanded: [],
    selected: [],
    pinnedRows: { top: ["0"], bottom: [] },
  });

  return (
    <DataTable
      columns={COLUMNS}
      rows={ROWS}
      view={view()}
      onViewChange={setView}
      session={session()}
      onSessionChange={setSession}
      selectable
      columnMenu
    />
  );
}

// ─── отбор ────────────────────────────────────────────────────────────────────────────────

const FIELDS: FieldDictionary = [
  { name: "/applicant", label: "заявитель", type: "text" },
  { name: "/amount", label: "сумма", type: "number" },
];

const FILTER_ROWS: Row[] = [
  { applicant: "Иванов", amount: 100 },
  { applicant: "Петров", amount: 300 },
  // Без `/applicant`: сравнение по нему даёт «неизвестно», и это отдельная часть показа.
  { amount: 500 },
];

const COMPARE_ID = nextConditionId();
const MEMBER_ID = nextConditionId();

/** Все четыре вида условия разом плюс логика «все через И». */
const EVERY_CONDITION: FilterState = {
  version: 1,
  conditions: [
    { id: COMPARE_ID, kind: "compare", field: "/applicant", operator: "contains", value: "ив" },
    { id: MEMBER_ID, kind: "in", field: "/applicant", values: ["Иванов", ""] },
    { id: nextConditionId(), kind: "between", field: "/amount", from: "1", to: "9" },
    { id: nextConditionId(), kind: "presence", quantifier: "any", mode: "exists", fields: ["/applicant"] },
  ],
  logic: { mode: "all" },
};

/** Своя логика, в которой второе условие не участвует. */
const UNUSED_LOGIC: FilterState = {
  version: 1,
  conditions: [
    { id: COMPARE_ID, kind: "compare", field: "/applicant", operator: "contains", value: "ив" },
    { id: MEMBER_ID, kind: "in", field: "/applicant", values: [""] },
  ],
  logic: { mode: "formula", expr: { t: "ref", id: COMPARE_ID } },
};

/** Своя логика, ссылающаяся на условие, которого нет: ошибка и предложенная поправка. */
const BROKEN_LOGIC: FilterState = {
  version: 1,
  conditions: [
    { id: COMPARE_ID, kind: "compare", field: "/applicant", operator: "contains", value: "ив" },
  ],
  logic: { mode: "formula", expr: { t: "ref", id: "нет-такого-условия" } },
};

const PRESETS: readonly Preset[] = [
  { id: "big", label: "крупные", hint: "сумма от 1000", state: EVERY_CONDITION },
];

const TEMPLATES: readonly Template[] = [
  {
    id: "by-name",
    label: "по фамилии",
    hint: "подставить фамилию",
    params: [
      { key: "name", label: "фамилия", kind: "text" },
      // Дырка вида `fields` — она рисует поля плашками.
      { key: "where", label: "где искать", kind: "fields" },
    ],
    state: EVERY_CONDITION,
  },
];

/**
 * Конструктор с заданным начальным состоянием — ЗАМЫКАНИЕМ, а не свойством.
 *
 * Свойство здесь было бы неправдой: сцена начальное состояние не меняет, а прочитанное на
 * входе реактивное свойство ещё и молча теряло бы изменения, если бы меняла.
 */
const filters = (initial: FilterState, toolbar = false) =>
  function Filters() {
    const [state, setState] = createSignal(initial);

    return (
      <FilterBuilder
        fields={FIELDS}
        rows={FILTER_ROWS}
        state={state()}
        onChange={setState}
        presets={toolbar ? PRESETS : undefined}
        templates={toolbar ? TEMPLATES : undefined}
      />
    );
  };

const EveryConditionFilters = filters(EVERY_CONDITION, true);
const UnusedLogicFilters = filters(UNUSED_LOGIC);
const BrokenLogicFilters = filters(BROKEN_LOGIC);

// ─── график ───────────────────────────────────────────────────────────────────────────────

const CHART_COLUMNS: ColumnDictionary = [
  { name: "/region", label: "регион", type: "text" },
  { name: "/status", label: "статус", type: "text" },
  { name: "/amount", label: "сумма", type: "number" },
];

const CHART_ROWS: Row[] = [
  { region: "Москва", status: "новая", amount: 100 },
  { region: "Москва", status: "в работе", amount: 300 },
  { region: "Тула", status: "новая", amount: 50 },
];

// Разбивка на серии обязательна: без неё серия одна, а легенды при одной серии не бывает.
const BAR: ChartSpec = {
  version: 1,
  mark: "bar",
  slice: "/region",
  measure: { field: "/amount", aggregate: "sum" },
  series: "/status",
};

const LINE: ChartSpec = { ...BAR, mark: "line" };

// ─── переходник ───────────────────────────────────────────────────────────────────────────

const ADAPTER_FIELDS: ColumnDictionary = [
  { name: "/applicant", label: "заявитель", type: "text" },
  { name: "/amount", label: "сумма", type: "number" },
  { name: "/status", label: "статус", type: "text" },
];

const SAMPLE = {
  data: {
    items: [
      // `legacy_id` правилом не покрыт — это «их поля без правил».
      { client: { last: "Иванов Иван" }, amount_cents: "125000", state: "new", legacy_id: "A-1" },
      // `amount_cents` не разбирается — правило даёт «не легло», и это видно у правила.
      { client: { last: "Петров Пётр" }, amount_cents: "нет", state: "new", legacy_id: "A-2" },
    ],
  },
};

/** Правила со ВСЕМИ действиями, у которых есть настройки: у каждой своя зацепка. */
const ADAPTER_SPEC: AdapterSpec = {
  version: 1,
  rows: "/data/items",
  fields: [
    {
      target: "/applicant",
      from: "/client/last",
      steps: [
        { kind: "split", separator: " ", take: 0 },
        { kind: "replace", find: "ё", with: "е" },
      ],
    },
    {
      // Отказ по умолчанию — «оставить поле пустым», и тогда не легшее ВИДНО у правила.
      target: "/amount",
      from: "/amount_cents",
      steps: [{ kind: "number" }, { kind: "divide", by: 100 }],
    },
    {
      // А здесь отказ с умолчанием: только он рисует поле умолчания, и он же не легшее
      // ГАСИТ — поэтому оба вида отказа показаны разными правилами, а не одним.
      target: "/status",
      from: "/state",
      steps: [{ kind: "default", value: "новая" }, { kind: "number" }],
      onFail: "default",
      fallback: "0",
    },
  ],
};

/** Тот же образец, но набор строк лежит не там: переходник отказывает, а не молчит. */
const BROKEN_ADAPTER: AdapterSpec = { ...ADAPTER_SPEC, rows: "/data/nowhere" };

const adapter = (initial: AdapterSpec) =>
  function Adapter() {
    const [spec, setSpec] = createSignal(initial);

    return (
      <AdapterBuilder fields={ADAPTER_FIELDS} sample={SAMPLE} spec={spec()} onChange={setSpec} />
    );
  };

const WorkingAdapter = adapter(ADAPTER_SPEC);
const BrokenAdapter = adapter(BROKEN_ADAPTER);

// ─── сцена ────────────────────────────────────────────────────────────────────────────────

function Scene() {
  return (
    <>
      <GroupedTable />
      <PinnedRowTable />

      <EveryConditionFilters />
      <UnusedLogicFilters />
      <BrokenLogicFilters />

      <Chart columns={CHART_COLUMNS} rows={CHART_ROWS} spec={BAR} onSelect={() => undefined} />
      <Chart columns={CHART_COLUMNS} rows={CHART_ROWS} spec={LINE} />
      <Chart columns={CHART_COLUMNS} rows={[]} spec={BAR} />
      <ChartLegend columns={CHART_COLUMNS} rows={CHART_ROWS} spec={BAR} />

      <WorkingAdapter />
      <BrokenAdapter />
    </>
  );
}

/**
 * Монтирует сцену и доводит её до состояния, в котором видно ВСЁ.
 *
 * Заготовку отбора приходится раскрывать нажатием: её форма живёт в собственном состоянии
 * конструктора, снаружи её не задать, а не раскрыв — шесть её частей не увидеть.
 */
function showEverything(): HTMLElement {
  const host = mount(() => <Scene />);
  press(one(host, '[data-slot="filter-template"]'));
  return host;
}

/** Имена зацепок, реально доехавшие до документа, — без повторов и по алфавиту. */
function slotsInDocument(host: ParentNode): string[] {
  const found = [...host.querySelectorAll("[data-slot]")].map(
    (node) => node.getAttribute("data-slot") as string,
  );

  return [...new Set(found)].sort();
}

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(here, "..", "src");

/** Модули ПОСТАВКИ. Стенд сюда не входит — он не поставляется и ничего не обещает. */
const DELIVERED = ["table", "filters", "chart", "adapter", "dataset"];

/**
 * Зацепки, поставленные исходником.
 *
 * Две формы записи, и обе обязаны ловиться: атрибутом в разметке (`data-slot="x"`) и ключом в
 * объекте свойств (`"data-slot": "x"`). Вторая форма живёт у величины графика, которую рисуют
 * то кругом, то прямоугольником с общим набором свойств; регулярка, знающая только первую
 * форму, эту зацепку молча не увидит — и обещание разъедется с документом именно там, где
 * разметка сложнее всего.
 *
 * Комментарии срезаются: в доке `data-slot` стоит примерами CSS, и правило из примера не
 * является зацепкой — предмет здесь только то, что доезжает до узла.
 */
function slotsInSource(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  return [...code.matchAll(/"?data-slot"?\s*[:=]\s*"([^"]+)"/g)].map((match) => match[1]!);
}

/** Все файлы модуля, включая вложенные `ui/`. */
function sourcesOf(module: string): Array<{ name: string; slots: string[] }> {
  const root = join(srcDir, module);
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? walk(join(dir, entry.name))
        : /\.tsx?$/.test(entry.name)
          ? [join(dir, entry.name)]
          : [],
    );

  return walk(root).map((path) => ({
    name: path.slice(srcDir.length + 1),
    slots: slotsInSource(readFileSync(path, "utf8")),
  }));
}

describe("обещанные зацепки доезжают до документа", () => {
  it("перечень в документе совпадает с обещанным плюс чужим — ровно, без лишних и без пропавших", () => {
    const host = showEverything();

    // Равенство, а не вхождение: вхождение не заметит зацепку, появившуюся в документе молча.
    //
    // Чего это равенство НЕ ловит — обмен двух имён местами: множество имён при обмене не
    // меняется, и сверка множеств сойдётся. Обмен ловит проверка остова ниже, и без неё
    // обещание было бы дырявым именно там, где ошибка тише всего.
    expect(slotsInDocument(host)).toEqual([...PROMISED_SLOTS, ...FOREIGN_SLOTS].sort());
  });

  it("в перечне нет повторов — иначе равенство выше сошлось бы вслепую", () => {
    // Повтор в перечне превратил бы сверку в «все имена, кроме задвоенного»: множество
    // документа его схлопнет, а список — нет.
    expect(new Set(PROMISED_SLOTS).size).toBe(PROMISED_SLOTS.length);
    expect(new Set(FOREIGN_SLOTS).size).toBe(FOREIGN_SLOTS.length);
  });

  it("наше и чужое не пересекаются — иначе непонятно, кто обещал имя", () => {
    const ours = new Set(PROMISED_SLOTS);
    expect(FOREIGN_SLOTS.filter((slot) => ours.has(slot))).toEqual([]);
  });

  it("перечень отсортирован — так его читают глазами и так видно пропуск", () => {
    for (const [family, slots] of Object.entries(FAMILIES)) {
      expect([...slots], family).toEqual([...slots].sort());
    }
  });
});

describe("зацепка стоит на своём узле, а не на соседнем", () => {
  // Сверка множеств выше слепа к ОБМЕНУ: поставь `table-body` на шапку, а `table-head` на
  // тело — имена все на месте, множество то же, прогон зелен, а оформление у потребителя
  // встало с ног на голову. Ошибка тише некуда: разметка валидна, поведение цело, типы
  // молчат. Поэтому у несущих частей закреплён и УЗЕЛ, и вложенность.
  //
  // Закреплён именно остов, а не всё подряд: для остова элемент — часть смысла (`thead` это
  // шапка, `td` это ячейка, и подменить их нельзя), а внутри ячейки узел — уже вопрос
  // раскладки, и связывать себе руки там значило бы обещать больше, чем нужно потребителю.
  const SKELETON: ReadonlyArray<{ slot: string; tag: string; inside?: string }> = [
    { slot: "table", tag: "TABLE" },
    { slot: "table-caption", tag: "CAPTION", inside: "table" },
    { slot: "table-head", tag: "THEAD", inside: "table" },
    { slot: "table-head-row", tag: "TR", inside: "table-head" },
    { slot: "table-header", tag: "TH", inside: "table-head-row" },
    { slot: "table-body", tag: "TBODY", inside: "table" },
    { slot: "table-row", tag: "TR", inside: "table-body" },
    { slot: "table-cell", tag: "TD", inside: "table-row" },
    { slot: "table-foot", tag: "TFOOT", inside: "table" },
    { slot: "table-foot-row", tag: "TR", inside: "table-foot" },
    { slot: "table-total", tag: "TD", inside: "table-foot-row" },
    { slot: "table-hidden-columns", tag: "UL" },
    { slot: "table-hidden-column", tag: "LI", inside: "table-hidden-columns" },
    { slot: "table-pager", tag: "NAV" },
    { slot: "table-pager-size-select", tag: "SELECT", inside: "table-pager-size" },
    { slot: "table-pager-size-option", tag: "OPTION", inside: "table-pager-size-select" },
    { slot: "filter-conditions", tag: "OL", inside: "filter-builder" },
    { slot: "filter-condition", tag: "LI", inside: "filter-conditions" },
    { slot: "chart", tag: "svg" },
    { slot: "chart-series", tag: "g", inside: "chart" },
    { slot: "chart-legend", tag: "UL" },
    { slot: "chart-legend-item", tag: "LI", inside: "chart-legend" },
    { slot: "adapter-rules", tag: "OL", inside: "adapter-builder" },
    { slot: "adapter-rule", tag: "LI", inside: "adapter-rules" },
  ];

  for (const part of SKELETON) {
    it(`${part.slot} — ${part.tag}${part.inside ? ` внутри ${part.inside}` : ""}`, () => {
      const host = showEverything();
      const nodes = all(host, `[data-slot="${part.slot}"]`);

      expect(nodes.length, "части нет в документе").toBeGreaterThan(0);
      for (const node of nodes) expect(node.tagName).toBe(part.tag);

      if (part.inside !== undefined) {
        for (const node of nodes) {
          expect(node.closest(`[data-slot="${part.inside}"]`), part.slot).not.toBeNull();
        }
      }
    });
  }
});

describe("имя зацепки несёт своё семейство", () => {
  // Требование 8 канона: `table-select-all`, а не `select-all`. В общем пространстве имён
  // «выделить всё» столкнётся со списком выбора, деревом и галереей.
  for (const [family, slots] of Object.entries(FAMILIES)) {
    it(family, () => {
      for (const slot of slots) {
        expect(slot === family || slot.startsWith(`${family}-`), slot).toBe(true);
      }
    });
  }

  it("семейства покрывают перечень целиком — безродных имён нет", () => {
    const counted = Object.values(FAMILIES).reduce((sum, slots) => sum + slots.length, 0);
    expect(counted).toBe(PROMISED_SLOTS.length);
  });
});

describe("зацепки исходников не выходят за обещанное", () => {
  for (const module of DELIVERED) {
    const sources = sourcesOf(module);

    describe(module, () => {
      for (const source of sources) {
        it(source.name, () => {
          for (const slot of source.slots) expect(PROMISED_SLOTS).toContain(slot);
        });
      }
    });
  }

  it("файлы с предметами вообще нашлись — иначе проверка выше зелена вслепую", () => {
    const found = DELIVERED.flatMap((module) => sourcesOf(module)).filter(
      (source) => source.slots.length > 0,
    );

    expect(found.length).toBeGreaterThan(3);
  });

  it("СТЕНД своих зацепок не ставит — он не поставляется и ничего не обещает", () => {
    // Зацепка, поставленная стендом, выглядела бы обещанием зоны, не будучи им: стенд не
    // уезжает потребителю. Оформление он цепляет за наши имена, а своих не заводит.
    for (const source of sourcesOf("playground")) {
      expect(source.slots, source.name).toEqual([]);
    }
  });
});

describe("состояния таблицы объявлены и совпадают с документом", () => {
  // Требование 5 канона: состояния — атрибутами, и перечислены. Класс как контракт не годится
  // — он уже значение вида, и, поставленный изнутри, стал бы вторым источником оформления.
  const observed = (host: ParentNode, slot: string, attr: string): string[] =>
    all(host, `[data-slot="${slot}"][${attr}]`).map((node) => node.getAttribute(attr) ?? "");

  for (const state of PROMISED_TABLE_STATES) {
    it(`${state.slot}[${state.attr}]`, () => {
      const host = showEverything();
      const values = observed(host, state.slot, state.attr);

      // Обещанное состояние обязано БЫВАТЬ: атрибут, которого сцена не показала ни разу, — это
      // либо мёртвое обещание, либо непокрытая сценой часть, и различить их надо сейчас.
      expect(values.length, "состояния нет в документе").toBeGreaterThan(0);

      if (state.kind === "enum") {
        // Закрытый набор закрыт с двух сторон: значение мимо набора ломает оформление молча.
        for (const value of values) expect(state.values).toContain(value);
      }

      if (state.kind === "flag") {
        // Признак стоит ПУСТЫМ и снимается совсем. `data-empty="false"` сломало бы селектор
        // `[data-empty]`, который по смыслу значит «пусто».
        expect([...new Set(values)]).toEqual([""]);
      }
    });
  }

  it("каждое перечисленное состояние стоит на ОБЕЩАННОЙ зацепке", () => {
    for (const state of PROMISED_TABLE_STATES) {
      expect(TABLE_SLOTS as readonly string[], state.slot).toContain(state.slot);
    }
  });

  it("в перечне состояний нет повторов пары «зацепка + атрибут»", () => {
    const pairs = PROMISED_TABLE_STATES.map((state) => `${state.slot}[${state.attr}]`);
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it("состояния таблицы объявлены ПОЛНОСТЬЮ — ни одного атрибута мимо перечня", () => {
    // Вторая сторона: атрибут, доехавший до документа на зацепке таблицы, но не объявленный,
    // — это то же молчаливое обещание, что и незаявленная зацепка. Потребитель оденется по
    // нему, а мы его не обещали.
    const host = showEverything();
    const promised = new Set(
      PROMISED_TABLE_STATES.map((state) => `${state.slot}[${state.attr}]`),
    );

    // Служебное и общеразметочное: `data-slot` — сама зацепка, `style` названы в доке
    // (ширина колонки), остальное — роли и подписи доступности, они нормированы снаружи.
    const skip = (attr: string) =>
      attr === "data-slot" ||
      attr === "style" ||
      attr === "class" ||
      attr === "title" ||
      attr === "role" ||
      attr === "scope" ||
      attr === "type" ||
      attr === "value" ||
      attr === "checked" ||
      attr === "disabled" ||
      attr === "tabindex" ||
      attr.startsWith("aria-label") ||
      attr === "aria-hidden" ||
      attr === "aria-live" ||
      attr === "aria-orientation" ||
      attr === "aria-pressed" ||
      attr === "aria-rowcount" ||
      attr === "aria-rowindex";

    const unpromised: string[] = [];
    for (const slot of TABLE_SLOTS) {
      for (const node of all(host, `[data-slot="${slot}"]`)) {
        for (const attr of node.getAttributeNames()) {
          if (skip(attr)) continue;
          const pair = `${slot}[${attr}]`;
          if (!promised.has(pair)) unpromised.push(pair);
        }
      }
    }

    expect([...new Set(unpromised)]).toEqual([]);
  });
});

describe("объём семейств", () => {
  // Не число ради числа: пустое семейство означало бы, что перечень для него забыли завести,
  // а гейт при этом зелен — сверять было бы нечего.
  it("ни одно семейство не пусто", () => {
    for (const [family, slots] of Object.entries(FAMILIES)) {
      expect(slots.length, family).toBeGreaterThan(0);
    }
    expect(TABLE_SLOTS.length + FILTER_SLOTS.length + CHART_SLOTS.length + ADAPTER_SLOTS.length).toBe(
      PROMISED_SLOTS.length,
    );
  });
});
