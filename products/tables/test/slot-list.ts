/**
 * ОБЯЗАТЕЛЬСТВО зоны: имена зацепок `data-slot` и состояний, за которые цепляется чужое
 * оформление.
 *
 * Это не перечень «что сейчас в коде», а обещание потребителю (`kb:PROBEWEB-4`, раздел про
 * `data-slot`; решение — `kb:PROBEWEB-12`, пункт 7): **имя из этого списка не меняется и не
 * исчезает без мажорного поднятия версии.** Добавить новое имя можно минором — тех, кто
 * цеплялся за прежние, добавление не ломает.
 *
 * Форма повторяет кит (`packages/ui/test/slot-list.ts`) сознательно: канон одевания един для
 * любого компонента, который хочет быть одеваемым, и механика у него обязана быть одна. Своя
 * копия, а не импорт: `test/` кита в его поверхность не входит, тянуть оттуда значит
 * завязаться на то, что он никому не обещал.
 *
 * Список выписан РУКАМИ, а не снят с исходников: снятый с кода перечень подтверждал бы сам
 * себя и переименование проезжало бы молча вместе с правкой. Правка этого файла в сторону
 * удаления или переименования = ломающее изменение поставки, и она обязана быть решением, а
 * не побочным следствием рефакторинга.
 *
 * Стережёт перечень `test/slots.test.tsx` — с обеих сторон: имя из списка обязано появиться
 * в живом документе, а зацепка из исходников обязана быть в списке.
 *
 * Числа зацепок здесь нет и не будет: число устаревает при каждом добавлении части, а
 * обещание — нет. Контракт — перечень, а не его длина.
 */

/**
 * СЕМЕЙСТВО — первое слово имени, и оно обязательно.
 *
 * `table-select-all`, а не `select-all`: выделить всё захотят и список выбора, и дерево, и
 * галерея, и в общем пространстве имён они столкнутся. Семейство — не украшение имени, а
 * адрес: по нему потребитель считает полноту («все ли части таблицы одеты») и по нему же
 * видно, что разделитель внутри меню и разделитель сам по себе — разные предметы.
 */
export const FAMILY_PREFIXES = ["table", "filter", "chart", "adapter"] as const;

/**
 * Таблица — `src/table`.
 *
 * Составной предмет, и зацепка есть у КАЖДОЙ части: у остова (`table`, `table-head`,
 * `table-body`, `table-foot` и их строки), у заголовка колонки и всего, что в нём живёт, у
 * ячейки, у служебной колонки выделения, у списка скрытых колонок, у листалки и у управления
 * группами. Полусоставной предмет одеть нельзя — вышла бы таблица с одетой шапкой и голым
 * подвалом.
 */
export const TABLE_SLOTS = [
  "table",
  "table-body",
  "table-caption",
  "table-cell",
  "table-collapse-all",
  "table-column-down",
  "table-column-group",
  "table-column-hide",
  "table-column-menu",
  "table-column-pin",
  "table-column-pin-end",
  "table-column-resize",
  "table-column-show",
  "table-column-up",
  "table-column-width-reset",
  "table-expand-all",
  "table-foot",
  "table-foot-row",
  "table-group-controls",
  "table-group-count",
  "table-group-toggle",
  "table-head",
  "table-head-row",
  "table-header",
  "table-header-label",
  "table-header-sort",
  "table-header-sort-position",
  "table-hidden-column",
  "table-hidden-columns",
  "table-pager",
  "table-pager-next",
  "table-pager-position",
  "table-pager-prev",
  "table-pager-size",
  "table-pager-size-select",
  "table-pin-row",
  "table-row",
  "table-select-all",
  "table-select-row",
  "table-service",
  "table-total",
] as const;

/**
 * Конструктор отбора — `src/filters`.
 *
 * Ветвлений здесь больше, чем где-либо в зоне: строка условия принимает четыре вида
 * (сравнение · одно из списка · диапазон · наличие полей), и у каждого своя начинка. Поэтому
 * зацепки идут не по «строке условия» вообще, а по каждому виду отдельно —
 * `filter-condition-compare` и `filter-condition-between` это разные предметы с разной
 * раскладкой, и одеть их одним правилом значит одеть неправильно оба.
 */
export const FILTER_SLOTS = [
  "filter-add",
  "filter-add-between",
  "filter-add-compare",
  "filter-add-in",
  "filter-add-presence",
  "filter-builder",
  "filter-condition",
  "filter-condition-between",
  "filter-condition-body",
  "filter-condition-compare",
  "filter-condition-count",
  "filter-condition-field",
  "filter-condition-from",
  "filter-condition-hint",
  "filter-condition-in",
  "filter-condition-input",
  "filter-condition-mode",
  "filter-condition-number",
  "filter-condition-operator",
  "filter-condition-presence",
  "filter-condition-presence-head",
  "filter-condition-quantifier",
  "filter-condition-remove",
  "filter-condition-sensitive",
  "filter-condition-sensitive-input",
  "filter-condition-to",
  "filter-condition-unknown",
  "filter-condition-value",
  "filter-condition-value-add",
  "filter-condition-value-remove",
  "filter-condition-value-row",
  "filter-condition-values",
  "filter-conditions",
  "filter-field-chip",
  "filter-field-chips",
  "filter-logic",
  "filter-logic-error",
  "filter-logic-field",
  "filter-logic-fix",
  "filter-logic-hint",
  "filter-logic-input",
  "filter-logic-toggle",
  "filter-logic-toggle-input",
  "filter-logic-unused",
  "filter-preset",
  "filter-secondary",
  "filter-template",
  "filter-template-actions",
  "filter-template-apply",
  "filter-template-form",
  "filter-template-param",
  "filter-template-param-input",
  "filter-template-param-label",
  "filter-template-title",
  "filter-toolbar",
] as const;

/**
 * График — `src/chart`, свой SVG.
 *
 * Ряды помечены ИНДЕКСОМ (`data-series`), а не цветом: цвет — работа того, кто одевает, и
 * палитру мы не выбираем. В компоненте нет ни одного значения цвета, только `currentColor`
 * — иначе цвет из компонента и цвет из шкалы разъехались бы, а разъехавшись, сделали бы
 * график неодеваемым.
 */
export const CHART_SLOTS = [
  "chart",
  "chart-empty",
  "chart-grid",
  "chart-legend",
  "chart-legend-item",
  "chart-legend-mark",
  "chart-line",
  "chart-mark",
  "chart-series",
  "chart-slice-axis",
  "chart-slice-label",
  "chart-summary",
  "chart-tick",
  "chart-tick-label",
  "chart-value-axis",
] as const;

/**
 * Переходник — `src/adapter`.
 *
 * Своё семейство, а не часть фильтров: `adapter-rule-*` и `adapter-step-*` описывают правило
 * приведения чужой формы к нашей, и с условием отбора у них общего только внешний вид списка.
 */
export const ADAPTER_SLOTS = [
  "adapter-add",
  "adapter-after",
  "adapter-before",
  "adapter-builder",
  "adapter-count",
  "adapter-error",
  "adapter-extra",
  "adapter-extra-input",
  "adapter-pair",
  "adapter-preview",
  "adapter-report",
  "adapter-rows",
  "adapter-rows-select",
  "adapter-rule",
  "adapter-rule-arrow",
  "adapter-rule-fallback",
  "adapter-rule-from",
  "adapter-rule-issue",
  "adapter-rule-issues",
  "adapter-rule-number",
  "adapter-rule-on-fail",
  "adapter-rule-remove",
  "adapter-rule-step",
  "adapter-rule-step-add",
  "adapter-rule-step-remove",
  "adapter-rule-steps",
  "adapter-rule-target",
  "adapter-rules",
  "adapter-source",
  "adapter-step-by",
  "adapter-step-find",
  "adapter-step-separator",
  "adapter-step-take",
  "adapter-step-value",
  "adapter-step-with",
  "adapter-unmapped",
] as const;

export const FAMILIES = {
  table: TABLE_SLOTS,
  filter: FILTER_SLOTS,
  chart: CHART_SLOTS,
  adapter: ADAPTER_SLOTS,
} as const;

export const PROMISED_SLOTS: readonly string[] = [
  ...TABLE_SLOTS,
  ...FILTER_SLOTS,
  ...CHART_SLOTS,
  ...ADAPTER_SLOTS,
];

/**
 * ЧУЖИЕ зацепки, доезжающие до нашего документа, — кита, не наши.
 *
 * Конструкторы стоят на примитивах кита (`Button`, `Field`, `Input`). Корень каждого мы
 * перекрываем своим именем — кнопка добавления условия это `filter-add-compare`, а не «ещё
 * одна кнопка». Не перекрыт один `input`: это ПОЛЕ ВВОДА, и одевать все поля ввода зоны
 * одинаково, правилом кита, — то, чего от него и ждут. Перекрыть его значило бы заставить
 * потребителя писать то же правило заново под каждым нашим именем.
 *
 * Обещаем это имя НЕ мы: его обещает кит (`packages/ui/test/slot-list.ts`), и меняется оно по
 * его правилам, не по нашим.
 *
 * Перечень нужен, чтобы равенство в пробе было ТОЧНЫМ. Без него пришлось бы проверять
 * вхождение вместо равенства — а вхождение не заметит зацепку, появившуюся в документе
 * молча. Покраснеет этот перечень тогда, когда кит сменит то, что кладёт в наш документ:
 * это ровно то событие, о котором нам надо узнать сразу, а не у потребителя.
 */
export const FOREIGN_SLOTS = ["input"] as const;

/** Чем состояние является для того, кто одевает. */
export type StateKind =
  /** Признак: атрибут либо стоит (пустым), либо его нет. Значений не имеет. */
  | "flag"
  /** Состояние со значением из закрытого набора. */
  | "enum"
  /** Тождество или место: по нему адресуются, а не одеваются. */
  | "identity"
  /** Машинное значение показанного: число, дата, флаг — до показа человеку. */
  | "value";

export interface StatePromise {
  /** Зацепка, на которой атрибут стоит. */
  slot: string;
  attr: string;
  kind: StateKind;
  /** Закрытый набор значений — только у `enum`. У остальных пуст. */
  values: readonly string[];
  /** Что атрибут означает. Одеваем по смыслу, а не по догадке об имени. */
  means: string;
}

/**
 * СОСТОЯНИЯ ТАБЛИЦЫ — атрибутами, и перечислены.
 *
 * Класс как контракт не годится: класс это уже значение вида, и, поставив его изнутри, мы
 * стали бы вторым источником оформления рядом с потребителем. Атрибут вида не несёт — он
 * говорит, ЧТО с частью происходит, а как это выглядит, решает тот, кто одевает.
 *
 * Признак (`flag`) стоит пустым и снимается совсем, а не выставляется в `"false"`: `[data-empty]`
 * в CSS должно значить «пусто», и `data-empty="false"` сломало бы этот селектор молча.
 */
export const PROMISED_TABLE_STATES: readonly StatePromise[] = [
  {
    slot: "table",
    attr: "data-grouped",
    kind: "flag",
    values: [],
    means: "строки собраны в группы хотя бы по одной колонке",
  },
  {
    slot: "table-header",
    attr: "data-column",
    kind: "identity",
    values: [],
    means: "имя колонки из словаря",
  },
  {
    slot: "table-header",
    attr: "data-pinned",
    kind: "enum",
    values: ["start", "end"],
    means: "колонка прижата к краю",
  },
  {
    slot: "table-header",
    attr: "data-grouped",
    kind: "flag",
    values: [],
    means: "по этой колонке собирают группы",
  },
  {
    slot: "table-header",
    attr: "aria-sort",
    kind: "enum",
    values: ["ascending", "descending", "none"],
    means:
      "направление порядка по этой колонке. У несортируемой колонки атрибута нет вовсе — " +
      "`none` значит «сортировать можно, сейчас не сортируют», и путать это с «нельзя» нельзя",
  },
  {
    slot: "table-header-sort",
    attr: "data-direction",
    kind: "enum",
    values: ["asc", "desc"],
    means: "направление порядка. Не сортируют — атрибута нет",
  },
  {
    slot: "table-column-pin",
    attr: "data-pinned",
    kind: "enum",
    values: ["start", "end"],
    means: "к какому краю колонка прижата сейчас — на кнопке прижатия к началу",
  },
  {
    slot: "table-column-pin-end",
    attr: "data-pinned",
    kind: "enum",
    values: ["start", "end"],
    means: "то же на кнопке прижатия к концу",
  },
  {
    slot: "table-row",
    attr: "data-row-id",
    kind: "identity",
    values: [],
    means: "тождество строки — то, которым её знает выделение и закрепление",
  },
  {
    slot: "table-row",
    attr: "data-pinned",
    kind: "enum",
    values: ["top", "bottom"],
    means: "строка закреплена сверху или снизу набора",
  },
  {
    slot: "table-row",
    attr: "data-depth",
    kind: "value",
    values: [],
    means: "глубина в дереве групп, числом. У корневых строк атрибута нет",
  },
  {
    slot: "table-row",
    attr: "data-group",
    kind: "flag",
    values: [],
    means: "строка не данные, а заголовок группы",
  },
  {
    slot: "table-row",
    attr: "aria-selected",
    kind: "enum",
    values: ["true", "false"],
    means: "строка выделена. Атрибут стоит только там, где выделение вообще включено",
  },
  {
    slot: "table-row",
    attr: "aria-expanded",
    kind: "enum",
    values: ["true", "false"],
    means: "группа раскрыта. Только у строки-группы",
  },
  {
    slot: "table-group-toggle",
    attr: "aria-expanded",
    kind: "enum",
    values: ["true", "false"],
    means: "группа раскрыта — на кнопке, которой её раскрывают",
  },
  {
    slot: "table-pin-row",
    attr: "data-pinned",
    kind: "enum",
    values: ["top", "bottom"],
    means: "куда закреплена строка — на её кнопке закрепления",
  },
  {
    slot: "table-cell",
    attr: "data-column",
    kind: "identity",
    values: [],
    means: "имя колонки, к которой ячейка относится",
  },
  {
    slot: "table-cell",
    attr: "data-row-index",
    kind: "identity",
    values: [],
    means: "номер строки среди показанных — счёт от нуля, по странице, а не по набору",
  },
  {
    slot: "table-cell",
    attr: "data-column-index",
    kind: "identity",
    values: [],
    means: "номер колонки среди ПОКАЗАННЫХ — скрытые не считаются",
  },
  {
    slot: "table-cell",
    attr: "data-pinned",
    kind: "enum",
    values: ["start", "end"],
    means: "колонка ячейки прижата к краю",
  },
  {
    slot: "table-cell",
    attr: "data-format",
    kind: "enum",
    values: ["text", "number", "percent", "date", "datetime", "bool", "rating"],
    means: "чем показано значение. Стоит всегда — у колонки без явного показа берётся по типу",
  },
  {
    slot: "table-cell",
    attr: "data-group-cell",
    kind: "flag",
    values: [],
    means: "в ячейке значение, по которому собрана группа",
  },
  {
    slot: "table-cell",
    attr: "data-aggregated",
    kind: "flag",
    values: [],
    means: "в ячейке сведённое по группе, а не значение строки",
  },
  {
    slot: "table-cell",
    attr: "data-missing",
    kind: "flag",
    values: [],
    means:
      "поля в строке НЕТ. Отдельно от пустого: «нет поля» и «поле есть и пустое» — разные " +
      "вещи и на экране, и в отборе, и рисовать их одинаково значит соврать",
  },
  {
    slot: "table-cell",
    attr: "data-empty",
    kind: "flag",
    values: [],
    means: "поле есть, а показывать нечего",
  },
  {
    slot: "table-cell",
    attr: "data-highlighted",
    kind: "flag",
    values: [],
    means: "потребитель отметил ячейку через `cellAttrs`",
  },
  {
    slot: "table-cell",
    attr: "data-clickable",
    kind: "flag",
    values: [],
    means: "по ячейке нажимают: есть `onCellClick` и строка не группа",
  },
  {
    slot: "table-cell",
    attr: "data-value",
    kind: "value",
    values: [],
    means:
      "значение ДО показа человеку: число, доля, дата по ISO, да/нет. Числа и даты одевают " +
      "по нему, а не разбирая обратно показанный текст",
  },
  {
    slot: "table-cell",
    attr: "data-unformatted",
    kind: "flag",
    values: [],
    means: "показано как есть: под объявленный показ значение не разобралось",
  },
  {
    slot: "table-cell",
    attr: "data-rating",
    kind: "value",
    values: [],
    means: "оценка числом. Звёзды рисует тот, кто одевает, — компонент их не рисует",
  },
  {
    slot: "table-cell",
    attr: "data-rating-max",
    kind: "value",
    values: [],
    means: "предел оценки: сколько звёзд всего",
  },
  {
    slot: "table-total",
    attr: "data-column",
    kind: "identity",
    values: [],
    means: "имя колонки, по которой сведён итог",
  },
  {
    slot: "table-total",
    attr: "data-aggregate",
    kind: "enum",
    values: ["count", "sum", "min", "max", "average", "countdistinct"],
    means: "чем сведён итог",
  },
  {
    slot: "table-hidden-column",
    attr: "data-column",
    kind: "identity",
    values: [],
    means: "имя скрытой колонки",
  },
];

/**
 * СОСТОЯНИЯ ОТБОРА.
 *
 * Строка условия — самая ветвистая часть зоны, и без перечня одеть её можно только по
 * догадкам. Четыре состояния из пяти ВЫВОДИМЫ, а не хранятся:
 *
 *   • `data-negated` — отрицание живёт в ФОРМУЛЕ, а не в условии: условие говорит «сумма
 *     больше ста», а нужно ли обратное — решает логика сборки. Считается чётность отрицаний,
 *     `НЕ (НЕ 1)` отрицанием не является;
 *   • `data-unused` — формула условие не упоминает, значит в отборе он не участвует. Раньше
 *     это было видно только общей строчкой под формулой, то есть не там, где смотрят;
 *   • `data-incomplete` — форма собрана, чем наполнить, ещё не сказано. Это НЕ ошибка:
 *     недописанное условие законно существует с секунды добавления, и ругаться на него сразу
 *     значит ругаться на человека за то, что он не закончил печатать. Когда и как это
 *     показать — решает тот, кто одевает;
 *   • `data-invalid` на логике — формула не разобралась или ссылается на удалённое условие.
 *     Верхний комментарий конструктора обещал этот атрибут и раньше, но не ставил его: то
 *     самое молчаливое расхождение доки с разметкой, которое канон и закрывает.
 */
export const PROMISED_FILTER_STATES: readonly StatePromise[] = [
  {
    slot: "filter-condition",
    attr: "data-kind",
    kind: "enum",
    values: ["compare", "in", "between", "presence"],
    means: "вид условия. Каждый вид — своя раскладка, и одеть их одним правилом нельзя",
  },
  {
    slot: "filter-condition",
    attr: "data-incomplete",
    kind: "flag",
    values: [],
    means: "условие недописано: значения, списка, границ или полей ещё нет",
  },
  {
    slot: "filter-condition",
    attr: "data-negated",
    kind: "flag",
    values: [],
    means: "формула берёт это условие с отрицанием",
  },
  {
    slot: "filter-condition",
    attr: "data-unused",
    kind: "flag",
    values: [],
    means: "формула условие не упоминает — в отборе он не участвует",
  },
  {
    slot: "filter-condition-count",
    attr: "data-unknown",
    kind: "flag",
    values: [],
    means:
      "у условия есть строки, про которые ответа НЕТ: «неизвестно» — это не «не подошло», " +
      "и лечится оно другим",
  },
  {
    slot: "filter-condition-compare",
    attr: "data-operator",
    kind: "enum",
    values: ["eq", "ne", "contains", "gt", "ge", "lt", "le"],
    means: "режим сравнения",
  },
  {
    slot: "filter-condition-compare",
    attr: "data-sensitive",
    kind: "flag",
    values: [],
    means: "сравнение учитывает регистр",
  },
  {
    slot: "filter-condition-presence",
    attr: "data-mode",
    kind: "enum",
    values: ["exists", "filled"],
    means: "про что условие: поле присутствует или поле заполнено — это разные вопросы",
  },
  {
    slot: "filter-condition-presence",
    attr: "data-quantifier",
    kind: "enum",
    values: ["all", "any", "none"],
    means: "сколько из перечисленных полей должно подойти",
  },
  {
    slot: "filter-logic",
    attr: "data-active",
    kind: "flag",
    values: [],
    means: "логика своя, формулой, а не «все условия через И»",
  },
  {
    slot: "filter-logic",
    attr: "data-invalid",
    kind: "flag",
    values: [],
    means: "формула не разобралась или ссылается на условие, которого больше нет",
  },
  {
    slot: "filter-field-chip",
    attr: "data-selected",
    kind: "flag",
    values: [],
    means: "поле выбрано плашкой",
  },

  // Ниже — состояния, которые ставит КИТ, а не мы: поле формулы это его `Field`, и годность
  // ввода он выражает сам. Они объявлены, потому что доезжают до НАШЕЙ зацепки и потребитель
  // оденется по ним; но менять их вправе кит, и покраснеет здесь именно его правка.
  {
    slot: "filter-logic-field",
    attr: "data-valid",
    kind: "flag",
    values: [],
    means: "формула разобралась. Ставит кит по `validationState`",
  },
  {
    slot: "filter-logic-field",
    attr: "data-invalid",
    kind: "flag",
    values: [],
    means: "формула не разобралась. Ставит кит; наш собственный признак того же — на `filter-logic`",
  },
  {
    slot: "filter-logic-input",
    attr: "data-valid",
    kind: "flag",
    values: [],
    means: "то же на самом поле ввода — кит переносит признак и туда",
  },
  {
    slot: "filter-logic-input",
    attr: "data-invalid",
    kind: "flag",
    values: [],
    means: "то же на самом поле ввода",
  },
];
