# 📅 Date Picker

🏷️ inputs · 🧬 component · 📐 regular · 📦 `@web-core/ui`

Самый крупный компонент кита — 25 частей в анатомии, `tableCellTrigger` несёт больше состояний,
чем любая другая часть кита когда-либо несла (двадцать).

## 🧭 Навигация

- 🧩 [Анатомия](#анатомия)
- 🎛️ [Состояния](#состояния)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- 🚀 [Использование](#использование)
- [Доступность](#доступность)

<h2 id="анатомия">🧩 Анатомия</h2>

```
root
├─ label 🏷️
├─ control
│  ├─ input[]
│  ├─ trigger
│  └─ clearTrigger ✕
├─ positioner
│  └─ content 📃
│     └─ view[day|month|year]
│        ├─ viewControl
│        │  ├─ prevTrigger ‹
│        │  ├─ viewTrigger
│        │  │  └─ rangeText
│        │  ├─ monthSelect
│        │  ├─ yearSelect
│        │  └─ nextTrigger ›
│        └─ table 🗓️
│           ├─ tableHead
│           │  └─ tableRow
│           │     └─ tableHeader[]
│           └─ tableBody
│              └─ tableRow[]
│                 └─ tableCell[]
│                    └─ tableCellTrigger
├─ presetTrigger[]
└─ valueText
```

| часть              | значение                                                                       | принимает внутри                    | рисуется                          |
| -------------------- | --------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------ |
| 📅 `root`           | пикер даты целиком — подпись, контрол и плавающий календарь вместе               | `label`, `control`, `positioner`      | `DatePicker`               |
| 🏷️ `label`          | собственная подпись пикера                                                       | текст                                  | `DatePickerLabel`          |
| `control`           | оборачивает поле ввода и кнопки открытия/сброса — видимая строка, пока пикер закрыт | `input`, `trigger`, `clearTrigger`  | `DatePickerControl`        |
| `input`             | поле ввода даты текстом — по одному на индекс в режиме диапазона/множественного выбора | —                                | `DatePickerInput`          |
| ✕ `clearTrigger`    | сбрасывает выбранное значение — скрыт китом, пока ничего не выбрано              | текст, иконка                          | `DatePickerClearTrigger`   |
| `trigger`           | открывает или закрывает панель календаря                                         | текст, иконка                          | `DatePickerTrigger`        |
| 📃 `content`        | плавающая панель — держит все виды                                               | `view`                                 | `DatePickerContent`        |
| `positioner`        | позиционирует плавающую панель относительно контрола                             | `content`                              | `DatePickerPositioner`     |
| `view`              | панель одного вида (день, месяц или год) — скрыта, пока активен другой           | `viewControl`, `table`                 | `DatePickerView`           |
| `viewControl`       | оборачивает собственную строку назад/вперёд/переключения вида                     | `prevTrigger`, `viewTrigger`, `nextTrigger`, `monthSelect`, `yearSelect` | `DatePickerViewControl` |
| `viewTrigger`       | переключает на следующий, более широкий вид (день → месяц → год)                 | `rangeText`, текст                     | `DatePickerViewTrigger`    |
| `rangeText`         | собственная подпись видимого диапазона (например, название месяца) — текст задаёт кит | —                                 | `DatePickerRangeText`      |
| ‹ `prevTrigger`     | сдвигает видимый диапазон назад                                                  | текст, иконка                          | `DatePickerPrevTrigger`    |
| › `nextTrigger`     | сдвигает видимый диапазон вперёд                                                 | текст, иконка                          | `DatePickerNextTrigger`    |
| `monthSelect`       | прыгает к нужному месяцу напрямую — нативный выпадающий список                   | —                                       | `DatePickerMonthSelect`    |
| `yearSelect`        | прыгает к нужному году напрямую — нативный выпадающий список                     | —                                       | `DatePickerYearSelect`     |
| 🗓️ `table`          | сетка календаря — по одной на вид                                                | `tableHead`, `tableBody`               | `DatePickerTable`          |
| `tableHead`         | оборачивает строку заголовка сетки                                               | `tableRow`                             | `DatePickerTableHead`      |
| `tableHeader`       | собственная ячейка заголовка одного столбца (день недели, в дневном виде)        | текст                                  | `DatePickerTableHeader`    |
| `tableBody`         | оборачивает строки данных сетки                                                  | `tableRow`                             | `DatePickerTableBody`      |
| `tableRow`          | одна строка — заголовок дней недели, либо одна неделя (дневной вид) / строка месяцев или лет | `tableHeader`, `tableCell`  | `DatePickerTableRow`       |
| `tableCell`         | одна ячейка сетки — оборачивает кликабельный триггер внутри                      | `tableCellTrigger`                     | `DatePickerTableCell`      |
| `tableCellTrigger`  | кликабельная поверхность внутри ячейки — выбирает эту дату/месяц/год             | текст                                  | `DatePickerTableCellTrigger` |
| `presetTrigger`     | прыгает сразу к именованному диапазону (например, «последние 7 дней»)            | текст                                  | `DatePickerPresetTrigger`  |
| `valueText`         | показывает выбранное значение(я) текстом, форматирует кит                        | —                                       | `DatePickerValueText`      |

> [!NOTE]
> Анатомия НЕ объявляется здесь — приезжает готовой. `@zag-js/date-picker/anatomy` объявляет 24
> части; Ark расширяет её на одну (`.extendWith("view", "valueText")`, проверено в собранном чанке)
> — `"view"` уже одна из 24 (повторное добавление ничего не меняет), `"valueText"` — по-настоящему
> новая: у неё нет `getValueTextProps` в `date-picker.connect.mjs` вовсе, адрес приходит ТОЛЬКО из
> этого барреля (`@ark-ui/solid/dist/chunk/RFHGTBGX.jsx`'s собственный `DatePickerValueText`,
> который спредит `datePickerAnatomy.build().valueText.attrs` напрямую, не через коннектор Zag) —
> та же форма находки, что уже нашёл собственный анатомии карусели для `autoplayIndicator`.
> `@ark-ui/solid/anatomy` (баррель пакета) несёт РАСШИРЕННУЮ версию — 25-я часть берётся оттуда;
> голые 24 всё равно читаются напрямую с `@zag-js/date-picker/anatomy` (без Solid, без `.jsx`-файла,
> безопасно для паспортного читателя без Solid — `packages/assembly`) — два источника согласны на
> общих 24, проверено вживую (`Object.keys` на каждом `.build()`), не принято на веру.

> [!NOTE]
> Две части адресуются, но не несут СВОЕГО `getXxxProps` в коннекторе вовсе: ячейки номера недели
> (`week-number`) переиспользуют адрес `tableCell` (`getWeekNumberCellProps`/
> `getWeekNumberHeaderCellProps` обе спредят `parts.tableCell.attrs`, не собственную часть) —
> отдельной записи `weekNumberCell` среди 25 нет, и это не пробел: два Solid-компонента, которые
> Ark поставляет для номеров недели (`DatePickerWeekNumberCell`/`DatePickerWeekNumberHeaderCell`),
> реальны, адресуемы и ВИЗУАЛЬНО ОТЛИЧАЮТСЯ, просто делят координату `tableCell` — то же различие
> «часть, не компонент», которое паспортная модель кита проводит везде. Оба экспортированы, но НЕ
> входят в карту кита (`components/index.ts`) — карта кита требует ровно один компонент на ЧАСТЬ,
> а номера недели не часть сами по себе, лишь третий способ нарисовать существующую.

<h2 id="состояния">🎛️ Состояния</h2>

|      | часть                                              | состояние        | метка                          | значение                                                    |
| ---- | ----------------------------------------------------- | ------------------ | --------------------------------- | ------------------------------------------------------------- |
| 🔓   | root, label, content, trigger, input                 | open               | `[data-state="open"]`             | панель календаря показана                                     |
| 🔐   | root, label, content, trigger, input                 | closed             | `[data-state="closed"]`           | панель календаря скрыта                                       |
| 🚫   | root, label, control, viewTrigger, prevTrigger, nextTrigger, table, tableHead, tableHeader, tableBody, tableRow, tableCellTrigger | disabled | `[data-disabled]` | весь пикер отключён (кроме отдельных сносок ниже)              |
| 🔒   | root, label                                           | readonly           | `[data-readonly]`                 | значение видно, изменить нельзя                                |
| ⬜   | root                                                  | empty               | `[data-empty]`                    | значение ещё не выбрано                                        |
| ⬜   | control, input, trigger                              | empty               | `[data-placeholder-shown]`        | значение ещё не выбрано (та же суть, другой атрибут)           |
| ❌   | input                                                 | invalid             | `[data-invalid]`                  | форма отвергла значение                                        |
| 🚫   | input                                                 | disabled            | `:disabled`                       | это поле нельзя использовать                                   |
| 🔒   | input                                                 | readonly            | `:read-only`                      | значение видно, изменить нельзя                                |
| ❗   | input                                                 | required            | `:required`                       | форма потребует значение при отправке                          |
| 👆🎯⌨️ | clearTrigger, tableCellTrigger, presetTrigger       | hover / focus-visible / active | `:hover` / `:focus-visible` / `:active` | обычное поведение кнопки (`role="button"` на `<div>` у `tableCellTrigger`, без JS-перехвата) |
| 🚫   | trigger                                               | disabled            | `:disabled`                       | эту кнопку нельзя использовать                                 |
| ➡️   | content                                               | inline              | `[data-inline]`                   | показан прямо в потоке страницы, не всплывает над ней          |
| 📅🈷️🈺 | view, viewControl, viewTrigger, table, tableHead, tableHeader, tableBody, tableRow, tableCell, tableCellTrigger | day / month / year | `[data-view="day\|month\|year"]` | какая сетка показана сейчас — общий атрибут на ДЕСЯТИ частях |
| 🚫   | viewTrigger, prevTrigger, nextTrigger                 | disabled            | `[data-disabled]`                 | сдвигать/переключать больше некуда, либо весь пикер отключён   |
| 🚫   | monthSelect, yearSelect                               | disabled            | `:disabled`                       | этот контрол нельзя использовать                                |
| ✅   | tableCell                                             | selected            | `[data-selected]`                 | значение ячейки выбрано (только в видах месяца/года — см. ниже) |
| 🎯   | tableCellTrigger                                      | selectable          | `[data-selectable]`               | эту ячейку вообще МОЖНО выбрать — база, которую уточняют остальные |
| ✅   | tableCellTrigger                                      | selected            | `[data-selected]`                 | собственное значение этой ячейки и есть выбранное сейчас        |
| 🎯   | tableCellTrigger                                      | focus               | `[data-focus]`                    | клавиатурный roving-фокус стоит на этой ячейке                  |
| 🌫️   | tableCellTrigger                                      | outside-range       | `[data-outside-range]`            | принадлежит соседнему месяцу/году, показана только для заполнения сетки |
| ▶️   | tableCellTrigger                                      | range-start          | `[data-range-start]`              | первая дата выбранного диапазона                                |
| ◀️   | tableCellTrigger                                      | range-end            | `[data-range-end]`                | последняя дата выбранного диапазона                             |
| ▬    | tableCellTrigger                                      | in-range             | `[data-in-range]`                 | попадает между началом и концом выбранного диапазона            |
| ▭    | tableCellTrigger                                      | in-hover-range       | `[data-in-hover-range]`           | попадает между началом диапазона и наведением указателя (только режим диапазона) |
| ▶️   | tableCellTrigger                                      | hover-range-start    | `[data-hover-range-start]`        | станет началом диапазона при следующем клике (только режим диапазона) |
| ◀️   | tableCellTrigger                                      | hover-range-end      | `[data-hover-range-end]`          | станет концом диапазона при следующем клике (только режим диапазона) |
| ☀️   | tableCellTrigger                                      | today                | `[data-today]`                    | эта ячейка — сегодняшняя дата (только дневной вид)               |
| 🚫   | tableCellTrigger                                      | unavailable          | `[data-unavailable]`              | эту дату нельзя выбрать, например вне min/max (только дневной вид) |
| 🏖️   | tableCellTrigger                                      | weekend              | `[data-weekend]`                  | эта ячейка приходится на выходной (только дневной вид)           |

`positioner`/`rangeText`/`valueText` состояний не несут вовсе.

> [!NOTE]
> `data-view` достаёт до ДЕСЯТИ частей одним общим атрибутом с тремя значениями, не десятью
> повторёнными булевыми — тот же приём, что уже несут `orientation` табов и `checked`/`unchecked`/
> `indeterminate` чекбокса для одного общего атрибута с более чем двумя значениями. Здесь это
> СОСТОЯНИЕ, не НАСТРОЙКА: `view` не входит в закрытый словарь трёх имён (`orientation`/`multiple`/
> `collapsible`) и меняется в РАНТАЙМЕ (клик по `viewTrigger`), а не фиксируется автором один раз в
> редакторе.

> [!NOTE]
> `tableCellTrigger` — самая богатая часть в ките, с большим отрывом. Двадцать состояний: три
> значения `view`; восемь общих для любого вида (`disabled`/`selectable`/`selected`/`focus`/
> `outside-range`/`range-start`/`range-end`/`in-range`); три только для превью наведения, реальные,
> но истинные только при `selectionMode="range"` (`in-hover-range`/`hover-range-start`/
> `hover-range-end` — ключи атрибутов присутствуют всегда, `dataAttr(false)` просто опускает их вне
> режима диапазона, та же категория «реальное состояние, узкое условие», что и `indeterminate`
> чекбокса); три ТОЛЬКО-ДНЕВНОГО-ВИДА, отсутствующие у ячеек месяца/года целиком (`today`/
> `unavailable`/`weekend`); и три настоящих псевдокласса (`hover`/`focus-visible`/`active`) —
> `role="button"` на `<div>` (`DatePickerTableCellTriggerBaseProps extends PolymorphicProps<'div'>`
> в `@ark-ui/solid/date-picker`), не настоящая `<button>`, но всё равно настоящий DOM-узел, который
> браузер наводит/нажимает/фокусирует обычным образом (roving `tabIndex`) — никакой JS-перехват
> указателя не подменяет это для hover/press, только для атрибутов превью диапазона выше.

> [!NOTE]
> `tableCell`'s `selected` НЕ симметричен между видами — реальная непоследовательность Zag, не
> недосмотр здесь. `getDayTableCellProps` пишет `aria-selected`, но НИКОГДА `data-selected`;
> `getMonthTableCellProps`/`getYearTableCellProps` обе пишут `data-selected` дополнительно.
> Объявлено один раз на `tableCell` (та же часть служит всем трём видам) — отсутствие в дневном
> виде названо здесь, не спрятано.

> [!NOTE]
> `positioner`'s геометрические переменные — ТОТ ЖЕ механизм поппера, что у `popover`/`select`.
> `getPositionerProps` вызывает ТОТ ЖЕ `@zag-js/popper`'s `getPlacementStyles`/трекинг, на котором
> уже стоит собственный `positioner` `popover`'а — те же четыре кастомных свойства, проверено
> напрямую в `@zag-js/popper/get-placement.mjs`: `--reference-width`/`--reference-height` задают
> размер плавающего содержимого под контрол, `--available-width`/`--available-height` ограничивают
> его областью просмотра.

> [!NOTE]
> `valueText` не несёт `getXxxProps` вовсе — ЕДИНСТВЕННАЯ часть в ките, адресуемая ВНЕ коннектора.
> `date-picker.connect.mjs` ни разу не упоминает `valueText`; её адрес приходит из собственного
> `DatePickerValueText` пакета `@ark-ui/solid/date-picker`, который спредит
> `datePickerAnatomy.build().valueText.attrs` напрямую (см. заметку про `.extendWith(...)` выше).
> Своих состояний не несёт — ничего кроме самого текста не вычисляет look-значимого факта для неё.

> [!NOTE]
> `data-placement`/`data-side`/`data-index` — исключены, те же категории, что и везде. `content`/
> `trigger` несут `data-placement`/`data-side` — внутренности позиционирования, не зацепка для
> скина, то же исключение, что уже делает собственный паспорт `popover`'а для тех же двух
> атрибутов. `label`/`input` несут `data-index` (какой из нескольких вводов, в режиме диапазона/
> множественного выбора) — идентичность, не вид, та же категория, что исключённый `data-value`
> табов.

> [!NOTE]
> Нативные `disabled`/`readOnly`/`required` — псевдокласс там, где НЕ зеркалится атрибутом данных.
> `trigger`/`monthSelect`/`yearSelect`/`input` ставят нативный `disabled` (у `input` ещё `readOnly`/
> `required`) БЕЗ парного `data-*` — псевдоклассы, тот же довод, что у обычной кнопки. `root`/
> `label`/`control`/`nextTrigger`/`prevTrigger`/`viewTrigger`/`tableHead`/`tableHeader`/`tableBody`/
> `tableRow`/`tableCellTrigger` получают ЯВНЫЙ `data-disabled` (некоторые вместе с избыточным
> нативным `disabled`) — объявляется та метка, что реально кладётся явно, то же правило, что уже
> применяет собственный триггер `tabs`'а для точно такого же выбора. У `clearTrigger`/
> `presetTrigger` НЕТ понятия disabled в коннекторе ВООБЩЕ (проверено — ни один не ставит его, ни
> нативно, ни атрибутом) — и здесь оно не выдумывается.

<h2 id="io">🔌 IO</h2>

<h3 id="io-вход">📥 Вход</h3>

```json
{ "label": "string" }
```

<h3 id="io-выход">📤 Выход</h3>

Пикер ничего не диспатчит через сборку — выбор ведёт настоящая машина Zag сама, это не событие
наружу схемы.

> [!NOTE]
> Из всей сборки данными связана только подпись. Сетка календаря (дни недели, семь дат недели,
> иконки навигации) остаётся структурной, не привязанной к схеме — названная граница, не тихое
> решение: `tableCell`'s `value` требует настоящий `DateValue` (`parseDate`, из
> `@ark-ui/solid/date-picker`), который JSON-схема `entity/io.ts` не может произвести сама по себе
> — тот же класс ограничения, что уже решило разработку коллекций `select`/`listbox` (там кит сам
> строит `ListCollection` из плоских данных ВНУТРИ компонента), но здесь на один шаг менее
> автоматично: даты собираются в самой сборке (`playground/assemblies/basic.ts`), не внутри кита.
> Находка для архитектора, если календарь понадобится собрать целиком из данных (потребует
> способа задать трансформацию строки в `DateValue` в самом дереве сборки), не решение, принятое
> здесь молча.

<h2 id="сборки">🏗️ Сборки</h2>

<h3 id="сборка-basic">🧱 basic</h3>

Рабочий календарь: открыт, одна настоящая неделя дней (24–30 августа 2026), 25-е выбрано, 27-е —
сегодня. Подпись — из данных; дни недели, сама неделя и иконки навигации — структурные (см. заметку
в IO выше).

```
root · props: defaultOpen, defaultValue
  label 🏷️           · text: {label}
  control
    input
    trigger          · text: "📅"
    clearTrigger ✕    · text: "✕"
  positioner
    content 📃
      view[day]
        viewControl
          prevTrigger ‹ · text: "‹"
          viewTrigger
            rangeText
          nextTrigger › · text: "›"
        table 🗓️
          tableHead
            tableRow
              tableHeader[×7] · text: "Mo".."Su"
          tableBody
            tableRow
              tableCell[×7]  · props: value (реальный DateValue)
                tableCellTrigger · text: "24".."30"
```

Даты — НАСТОЯЩИЕ `DateValue` (`parseDate`), не строки: проп `TableCellProps.value` типизирован
`DateValue`, и рисуется тот же самый живой Ark-компонент, что и в любой другой сборке кита —
`today`/`selected`/`weekend` вычисляет реальная машина по этим реальным датам, не проставлены
руками.

> [!NOTE]
> Названное сужение объёма: неделя (24–30 августа 2026) намеренно остаётся внутри одного месяца,
> поэтому показывает `today`/`selected`/`weekend`, но не `outside-range` — вторая строка,
> пересекающая границу месяца, показала бы и его; оставлено тому, кто расширит эту сборку дальше.

<h2 id="рецепт">🎨 Рецепт</h2>

Доказательный рецепт (`playground/recipe.ts`) — доказывает, что паспорт МОЖНО одеть целиком
настоящей скин-механикой (`skinGaps` пуст, `checkSkin` чист, CSS реально генерируется). В
продакшене не участвует.

`tableCellTrigger` несёт основную часть визуального языка календаря — `selected`,
`range-start`/`range-end`/`in-range`, `in-hover-range` с парой начала/конца, `today`,
`unavailable`, `weekend` и `outside-range` — одиннадцать независимых меток, которые одна ячейка
может нести одновременно (ячейка может быть `today` И `weekend` И `in-range` сразу).

`positioner` читает `--available-width`/`--available-height` (свои же измеренные переменные) — тот
же приём «правило читает переменную только там, где паспорт говорит, что она лежит», что уже
называет собственный шаблон `popover`'а.

<h2 id="использование">🚀 Использование</h2>

**Ручная сборка** — компонент собирается вручную, JSX-композицией, без схемы и движка.

```tsx
<DatePicker>
  <DatePickerLabel>Дата</DatePickerLabel>
  <DatePickerControl>
    <DatePickerInput />
    <DatePickerTrigger>Открыть</DatePickerTrigger>
  </DatePickerControl>
  <DatePickerPositioner>
    <DatePickerContent>
      <DatePickerView view="day">
        <DatePickerViewControl>
          <DatePickerPrevTrigger>‹</DatePickerPrevTrigger>
          <DatePickerViewTrigger>
            <DatePickerRangeText />
          </DatePickerViewTrigger>
          <DatePickerNextTrigger>›</DatePickerNextTrigger>
        </DatePickerViewControl>
        <DatePickerTable>
          <DatePickerTableHead>
            <DatePickerTableRow>
              <DatePickerTableHeader>Пн</DatePickerTableHeader>
              {/* ...остальные дни недели */}
            </DatePickerTableRow>
          </DatePickerTableHead>
          <DatePickerTableBody>
            <DatePickerTableRow>
              <DatePickerTableCell value={someDate}>
                <DatePickerTableCellTrigger>1</DatePickerTableCellTrigger>
              </DatePickerTableCell>
              {/* ...остаток недели/месяца, по одному реальному DateValue на ячейку */}
            </DatePickerTableRow>
          </DatePickerTableBody>
        </DatePickerTable>
      </DatePickerView>
    </DatePickerContent>
  </DatePickerPositioner>
</DatePicker>
```

**Рендер через движок** — та же композиция, но по схеме (сборка `basic`), которую рисует
`RenderTree`.

```tsx
const data = { label: "Дата" };
const tree = instanceOf("date-picker", {}, "basic", data);

<RenderTree tree={tree} registry={registry} data={data} />;
```

**Диапазон, с двумя полями ввода и пресетом.** `selectionMode="range"` ждёт два `DatePickerInput`,
по одному на `index`:

```tsx
<DatePicker selectionMode="range">
  <DatePickerLabel>Даты проживания</DatePickerLabel>
  <DatePickerControl>
    <DatePickerInput index={0} />
    <DatePickerInput index={1} />
    <DatePickerTrigger>Открыть</DatePickerTrigger>
    <DatePickerClearTrigger>Очистить</DatePickerClearTrigger>
  </DatePickerControl>
  <DatePickerPresetTrigger value="last7Days">Последние 7 дней</DatePickerPresetTrigger>
  <DatePickerPositioner>
    <DatePickerContent>{/* та же таблица дневного вида, что выше */}</DatePickerContent>
  </DatePickerPositioner>
</DatePicker>
```

Ячейки внутри диапазона несут `range-start`/`range-end`/`in-range`, пока диапазон зафиксирован, и
`in-hover-range`/`hover-range-start`/`hover-range-end`, пока указатель наводит на будущий диапазон
до второго клика, который его фиксирует.

**Несколько отдельных дат.** `selectionMode="multiple"`, опционально ограничено
`maxSelectedDates`:

```tsx
<DatePicker selectionMode="multiple" maxSelectedDates={3}>
  <DatePickerLabel>Заблокированные даты</DatePickerLabel>
  <DatePickerControl>
    <DatePickerInput />
    <DatePickerTrigger>Открыть</DatePickerTrigger>
    <DatePickerClearTrigger>Очистить</DatePickerClearTrigger>
  </DatePickerControl>
  <DatePickerPositioner>
    <DatePickerContent>{/* та же таблица дневного вида, что выше */}</DatePickerContent>
  </DatePickerPositioner>
</DatePicker>
```

**Ограниченные и частично недоступные даты.** `min`/`max` жёстко ограничивают диапазон;
`isDateUnavailable` исключает отдельные даты внутри него (здесь — выходные) — ячейки, попавшие под
любое из правил, несут `unavailable`:

```tsx
import { parseDate } from "@ark-ui/solid/date-picker";

<DatePicker
  min={parseDate("2026-09-01")}
  max={parseDate("2026-12-31")}
  isDateUnavailable={(date) => date.toDate("UTC").getDay() % 6 === 0}
>
  <DatePickerLabel>Дата доставки</DatePickerLabel>
  <DatePickerControl>
    <DatePickerInput />
    <DatePickerTrigger>Открыть</DatePickerTrigger>
  </DatePickerControl>
  <DatePickerPositioner>
    <DatePickerContent>{/* та же таблица дневного вида, что выше */}</DatePickerContent>
  </DatePickerPositioner>
</DatePicker>
```

**Отрисован инлайн, без плавающей панели.** `inline` полностью снимает поведение попапа —
`positioner`/`content` остаются в собственном потоке страницы, `content` несёт `data-inline` вместо
обычной пары open/closed:

```tsx
<DatePicker inline defaultValue={[someDate]}>
  <DatePickerPositioner>
    <DatePickerContent>{/* та же таблица дневного вида, всегда видна */}</DatePickerContent>
  </DatePickerPositioner>
</DatePicker>
```

**Номера недели.** `showWeekNumbers` добавляет ведущий столбец — рисуют его
`DatePickerWeekNumberCell`/`DatePickerWeekNumberHeaderCell`, два реальных, отдельно рисуемых
компонента, которые делят адрес `tableCell` вместо собственного (см. заметку в анатомии).

**Настоящее участие в форме.** `name` на корне делает вложенные `input`(ы) настоящим полем формы.

## Доступность

Пикер даты следует паттерну WAI-ARIA
[Date Picker (Dialog)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), применённому к
собственной сетке календаря:

| Клавиша | Действие |
| --- | --- |
| `←` / `→` | Двигает фокус на предыдущий/следующий день той же недели |
| `↑` / `↓` | Двигает фокус на тот же день недели на неделю раньше/позже |
| `Home` / `End` | Двигает фокус на первый/последний день текущего месяца |
| `PageUp` / `PageDown` | Двигает фокус на тот же день предыдущего/следующего месяца |
| `Enter` | Выбирает сфокусированную дату и закрывает пикер |
| `Esc` | Закрывает пикер без выбора |
