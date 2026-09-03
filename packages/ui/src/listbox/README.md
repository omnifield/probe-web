# 📃 Listbox

🏷️ iteration · 🧬 component · 📐 regular · 📦 `@omnifield/probe-web-ui`

## 🧭 Навигация

- 🧩 [Анатомия](#анатомия)
- 🎛️ [Состояния](#состояния)
- 🎚️ [Настройки](#настройки)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- 🚀 [Использование](#использование)

<h2 id="анатомия">🧩 Анатомия</h2>

```
root
├─ label 🏷️
├─ input 🔍
├─ content 📃
│  ├─ itemGroup 📁
│  │  ├─ itemGroupLabel 🏷️
│  │  └─ item[]
│  │     ├─ itemText
│  │     └─ itemIndicator ✓
│  ├─ item[] (напрямую, без группы)
│  └─ empty
└─ valueText
```

| часть              | значение                                                                | принимает внутри                        | рисуется                    |
| ------------------- | ---------------------------------------------------------------------- | -------------------------------------------- | -------------------------------- |
| 📃 `root`          | лист целиком — подпись, поле фильтра и список пунктов вместе            | `label`, `input`, `content`, `valueText`      | `Listbox`               |
| 🏷️ `label`         | собственная подпись листа                                              | текст                                         | `ListboxLabel`          |
| 🔍 `input`         | необязательное поле фильтра/поиска — сужает, какие пункты показаны      | —                                              | `ListboxInput`          |
| 📃 `content`       | оборачивает пункты — прокручиваемая, навигируемая область, всегда в разметке | `itemGroup`, `item`, `empty`             | `ListboxContent`        |
| 📁 `itemGroup`     | группирует связанные пункты под одной подписью                          | `itemGroupLabel`, `item`                      | `ListboxItemGroup`      |
| 🏷️ `itemGroupLabel`| подпись группы пунктов                                                  | текст                                          | `ListboxItemGroupLabel` |
| `item`             | один выбираемый пункт                                                  | `itemText`, `itemIndicator`                    | `ListboxItem`           |
| `itemText`         | видимая подпись пункта                                                  | текст                                          | `ListboxItemText`       |
| ✓ `itemIndicator`  | указатель выбранного пункта — галочку кладёт потребитель                | иконка                                         | `ListboxItemIndicator`  |
| `valueText`        | показывает выбранное значение(я) строкой через запятую, либо плейсхолдер | —                                             | `ListboxValueText`      |
| `empty`            | показан, только пока набор пуст                                         | текст                                          | `ListboxEmpty`          |

> [!NOTE]
> Третье настоящее исключение из «анатомия всегда берётся из `@zag-js/<x>/anatomy`» (первые два —
> у карусели и у поля). Голая `@zag-js/listbox/anatomy` объявляет только десять частей — Ark-овский
> Solid-слой достраивает `empty` поверх неё (`.extendWith("empty")`), и `ListboxEmpty` реально
> кладёт адрес этой части на узел. Значит анатомия берётся из пакетного барреля
> `@ark-ui/solid/anatomy`, а не из голого `@zag-js/listbox/anatomy` (там `empty` бы не было) и не
> из адресного подпути `@ark-ui/solid/listbox/anatomy` (тот несёт `.jsx`-файл и валит паспортного
> читателя без Solid, `packages/assembly`).

> [!NOTE]
> Нет ни одного `open`/`closed` — определяющее структурное отличие от `select`, не недосмотр
> паспорта. У листа нет плавающего слоя: `content` всегда в документе, всегда интерактивен, и
> коннектор ни разу не пишет `data-state` на `content`, `root` или где-либо ещё, кроме собственного
> состояния выбора пункта.

<h2 id="состояния">🎛️ Состояния</h2>

|      | часть                              | состояние       | метка                         | значение                                             |
| ---- | ----------------------------------- | ---------------- | ------------------------------- | --------------------------------------------------------- |
| 🚫   | root, label, input, valueText       | disabled         | `[data-disabled]`               | весь лист отключён                                         |
| ⬜   | content, itemGroup                  | empty            | `[data-empty]`                  | показывать нечего / в группе нет пунктов                   |
| 🚫   | itemGroup                           | disabled         | `[data-disabled]`               | весь лист отключён                                         |
| ✅   | item, itemText                      | checked          | `[data-state="checked"]`        | этот пункт выбран                                          |
| ⬜   | item, itemText                      | unchecked        | `[data-state="unchecked"]`      | этот пункт не выбран                                       |
| 🎯   | item, itemText                      | highlighted      | `[data-highlighted]`            | клавиатура или указатель перешли на пункт, ещё не выбрали   |
| 🚫   | item, itemText                      | disabled         | `[data-disabled]`               | весь лист отключён                                         |
| ✅   | itemIndicator                       | checked          | `[data-state="checked"]`        | этот пункт выбран                                          |
| ⬜   | itemIndicator                       | unchecked        | `[data-state="unchecked"]`      | этот пункт не выбран                                       |

`itemGroupLabel` и `empty` состояний не несут вовсе — подпись группы ничего не отражает сама по
себе, а присутствие `empty` в документе уже и есть весь факт, который эта часть несёт.

> [!NOTE]
> Выбранность пункта несёт ДВЕ избыточные метки в самом коннекторе — `data-selected` (только
> присутствует) и `data-state="checked"|"unchecked"` (всегда одно из двух) за один и тот же факт.
> Объявлены была бы двойная зацепка за одну правду без способа узнать по паспорту, что они не
> могут разойтись. Паспорт объявляет только `data-state` — тот же общий атрибут словаря Zag, что
> несёт собственный пункт `select`'а, и тот же, что несёт `itemText`.

> [!NOTE]
> `disabled` на `input` — выбор в пользу атрибута данных, а не нативного: коннектор кладёт ОБА,
> настоящий `disabled` и `data-disabled`, за одну и ту же связь. Паспорт `select`'а уже решил эту
> форму для своего `trigger` — объявляется атрибут данных, когда коннектор реально его кладёт;
> нативный-only остаётся только тем частям, которым больше взять неоткуда (`label`/`valueText`
> вообще не кладут нативный `disabled`, выбирать не из чего).

> [!NOTE]
> `itemIndicator` несёт МЕНЬШЕ состояний, чем `item`/`itemText`, — намеренно. Коннектор кладёт
> на него только `data-state` (плюс `hidden`, не адрес вида, то же исключение, что у собственного
> индикатора `select`'а и `accordion`'а) — `highlighted` и `disabled` реальны, но это состояния
> ПУНКТА, на индикатор они никогда не спредятся. Объявить их здесь значило бы адресовать метку,
> которая на узле не появится ни разу.

> [!NOTE]
> Две метки коннектор кладёт, но паспорт их не объявляет — намеренно. `data-value` на `item`
> исключён тем же приёмом, что и у `select`'а: он называет, КАКОЙ это пункт, а не как он выглядит.
> `data-layout` (`"grid" | "list"`, на `content` и `item`) исключён тем же приёмом, что и
> `data-placement`/`data-side` у `select`'а: реальный атрибут, но решает его вид коллекции, которую
> собрал потребитель (`createListCollection` против `createGridCollection`), а не вкус автора
> скина для этого компонента, — сеточная раскладка, когда она есть, структурный факт о данных, не
> вариация. Находка для архитектора, если сеточным листам понадобится своя ось вида, не решение,
> принятое здесь молча.

<h2 id="настройки">🎚️ Настройки</h2>

| настройка     | значения              | по умолчанию | означает                                                     |
| ------------- | ---------------------- | -------------- | ------------------------------------------------------------ |
| `orientation` | `vertical`/`horizontal` | `vertical`     | по какой оси стоят пункты и как их листает клавиатура        |

> [!NOTE]
> `orientation` — реальная настройка из закрытого словаря, та же ось, что уже несёт `accordion`, но
> НЕ достаёт до каждой части: метка приходит на `root`/`content`/`item`/`itemGroup`, но не на
> `label`/`input`/`itemText`/`itemIndicator`/`itemGroupLabel`/`valueText`/`empty` — проверено по
> исходнику, не принято симметричным по аналогии с гармошкой.

> [!NOTE]
> `selectionMode` (`"single" | "multiple" | "extended"`) реален (`ListboxProps`), но не ложится в
> закрытый словарь настроек: имя `multiple` там значит простой булев переключатель (собственная
> настройка `select`'а), а натягивать на него трёхзначный выбор значило бы выдать `extended` либо
> за «вкл», либо за «выкл». Находка для архитектора (записи `SETTINGS` для закрытого ВЫБОРА, не
> флага, пока не существует), не решение, принятое здесь молча. `disabled` исключён тем же приёмом,
> что у `select`'а — уже объявлен состоянием выше.

<h2 id="io">🔌 IO</h2>

<h3 id="io-вход">📥 Вход</h3>

```json
{ "label": "string", "items": [{ "value": "string", "label": "string" }] }
```

<h3 id="io-выход">📤 Выход</h3>

```json
{ "value": ["string"] }
```

Ключи выбранных пунктов как есть — лист не решает, что они значат, так же как кнопка не решает,
что лежит в её `payload`.

<h2 id="сборки">🏗️ Сборки</h2>

<h3 id="сборка-basic">🧱 basic</h3>

Подпись и список пунктов, оба из данных, показывает столько пунктов, сколько пришло.

```
root · bind: items
  label 🏷️ · text: {label}
  content 📃
    item[] · repeat: /items · bind: item
      itemText · text: {label}
      itemIndicator ✓ · icon: "✓"
```

Скелет чист от данных — ни одной буквальной строки, ни `.map()` по локальному массиву: `repeat`
называет только «здесь список, сколько бы пунктов данные ни принесли» (раскладка, не данные),
`item`'s `bind: { item: "" }` — пустой путь значит «весь текущий элемент повтора целиком»
(`packages/skin`, `scopedPath`, тот же приём, что `accordion`'s `action-list` использует для
`payload: ""`) — передаёт `ListboxItem` тот же объект, что лежит в `Listbox`'s `items` по этому
индексу, ровно то, что ждёт проп `item`. Галочка `itemIndicator`'а — буквальный символ
(`{ genus: "icon", value: "✓" }`), тот же приём, что уже использует чекбоксный пункт `menu`'а: это
раскладка, не данные — каждый лист метит выбранный пункт одинаково, ни один датасет не выбирает
для него другой символ построчно.

<h2 id="рецепт">🎨 Рецепт</h2>

Доказательный рецепт (`playground/recipe.ts`) — доказывает, что паспорт МОЖНО одеть целиком
настоящей скин-механикой (`skinGaps` пуст, CSS реально генерируется). В продакшене не участвует.

База держится близко к формам `select`'а на общих частях (`content`'s рамка, `item`'s
hover/highlighted/checked/disabled) — лист читается как открытое навсегда содержимое выпадашки
`select`'а, без триггера. `itemIndicator` прячется, пока не выбран, тем же приёмом, что и у
`select`'а: нативный `hidden`, `display` включается только для `checked` — безусловный `display` в
базе показал бы все галочки сразу.

Две вариации, `comfortable` (умолчание) и `compact` — не цветовая ось, как у кнопки
(`primary`/`quiet`/`danger`): определяющий компромисс листа — плотность, не значимость: сколько
строк влезает до прокрутки, единственное, по чему судят обычный список.

> [!WARNING]
> Выбранный пункт метится ЦВЕТОМ ТЕКСТА, не заливкой всей строки (найдено вживую, 2026-08-30 — во
> взаправдашней композиции сплошная заливка строки читалась как нестилизованная белая плашка).
> Выбранная строка метит себя так же, как ссылка или активная вкладка — собственным цветом, а не
> закраской подложки под собой.

<h2 id="использование">🚀 Использование</h2>

**Ручная сборка** — компонент собирается вручную, JSX-композицией, без схемы и движка. Корень берёт
плоские `items` (не готовую коллекцию) и сам строит из них настоящий `ListCollection` внутри,
мемоизированный — идентичность стабильна между перерисовками, которые `items` не затрагивают.
`items` может прийти `undefined` на границе системы, которую `tsc` не видит насквозь (`bind:
{ items: "/items" }` по пути, которого данные ещё не принесли) — корень тогда строит пустой список,
а не падает: измерено вживую, `createListCollection({ items: undefined })` бросает `TypeError:
options.items is not iterable`.

```tsx
<Listbox items={[{ value: "us", label: "United States" }]}>
  <ListboxLabel>Страна</ListboxLabel>
  <ListboxContent>
    <ListboxItemGroup>
      <ListboxItemGroupLabel>Северная Америка</ListboxItemGroupLabel>
      <ListboxItem item={{ value: "us", label: "United States" }}>
        <ListboxItemText>United States</ListboxItemText>
        <ListboxItemIndicator>✓</ListboxItemIndicator>
      </ListboxItem>
    </ListboxItemGroup>
  </ListboxContent>
  <ListboxValueText placeholder="Ничего не выбрано" />
</Listbox>
```

**Рендер через движок** — та же композиция, но по схеме (сборка `basic`), которую рисует
`RenderTree`.

```tsx
const data = { label: "Страна", items: [{ value: "us", label: "США" }] };
const tree = instanceOf("listbox", {}, "basic", data);

<RenderTree tree={tree} registry={registry} data={data} />;
```

**Множественный выбор.** `selectionMode="multiple"` — клик переключает без модификатора;
`"extended"` — выбор через `Cmd`/`Ctrl`, интерфейс в духе файлового менеджера.

```tsx
<Listbox items={days} selectionMode="multiple">
  <ListboxLabel>Выберите дни</ListboxLabel>
  <ListboxContent>
    <For each={days}>
      {(item) => (
        <ListboxItem item={item}>
          <ListboxItemText>{item.label}</ListboxItemText>
          <ListboxItemIndicator>✓</ListboxItemIndicator>
        </ListboxItem>
      )}
    </For>
  </ListboxContent>
</Listbox>
```

**Фильтрация.** `input` — не часть базового примера Ark, но настоящая, адресованная часть под
сценарий фильтрации: связывается с функцией `filter` из `useListCollection`
(`@ark-ui/solid/collection`), которая сужает `collection.items`, пока потребитель печатает.
`keyboardPriority` решает, чьи клавиши побеждают при конфликте — редактирования текста в поле или
навигации по листу.

```tsx
import { useListCollection } from "@ark-ui/solid/collection";

const { collection, filter } = useListCollection({
  initialItems: frameworks,
  filter: (itemText, filterText) => itemText.toLowerCase().includes(filterText.toLowerCase()),
});

<Listbox items={collection().items}>
  <ListboxLabel>Выберите фреймворк</ListboxLabel>
  <ListboxInput placeholder="Поиск…" onInput={(event) => filter(event.currentTarget.value)} />
  <ListboxContent>
    <For each={collection().items}>
      {(item) => (
        <ListboxItem item={item}>
          <ListboxItemText>{item.label}</ListboxItemText>
        </ListboxItem>
      )}
    </For>
    <ListboxEmpty>Ничего не найдено</ListboxEmpty>
  </ListboxContent>
</Listbox>
```

`empty` монтируется, только пока набор пуст — Ark сам ставит гейт (`<Show when={collection.size
=== 0}>`), кит второго гейта не добавляет; пригождается вместе с полем фильтра, которое может
сузить список до нуля совпадений.

**Композиция в чужую сборку.** У листа нет `selfAssembly` — голая ссылка `{ node: "listbox" }`
откуда-то ещё даёт только корень и ничего внутри: весь составной поддерево (`content`/`item`/
`itemText`/`itemIndicator`, плюс `itemGroup`/`itemGroupLabel` при надобности) авторится руками,
как в собственной `playground/assemblies.ts` этого компонента. Части НЕ-корня чужой сборки
адресуются через точку — `listbox.content`, `listbox.item`, `listbox.itemText`; голый `content` в
адресе ВЛАДЕЮЩЕЙ сборки резолвится в никуда и молча не рисует детей, без ошибки. Живой пример — в
`accordion`'s `action-list`, которая кладёт ровно один `listbox` на раздел:

```
content 📂
  listbox           · bind: items, value
    listbox.content
      listbox.item[] · repeat: items · bind: item · on: click → select
        listbox.itemText
        listbox.itemIndicator
```

Родное событие клика по `item` спокойно уживается со своим `on: click` в чужой сборке — оба летят
с одного и того же клика (собственный `action-list` диспатчит событие `"select"`, несущее весь
пункт как `payload` через пустой путь `path: ""`, пока выбор Ark идёт своим чередом в этом же
клике).

## Доступность

Лист следует паттерну WAI-ARIA [Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/). Явной
таблицы клавиш Ark не публикует, но задокументированное поведение: стрелки вдоль оси `orientation`
двигают подсветку, `Space`/`Enter` выбирает подсвеченный пункт, `typeahead` (по подключению)
прыгает к пункту по вводу текста, а `Cmd`/`Ctrl`+`A` выбирает все пункты разом в режиме
`multiple`/`extended` — если только не выставлен `disallowSelectAll`. `loopFocus` решает, оборачивается
ли навигация с последнего пункта на первый.
