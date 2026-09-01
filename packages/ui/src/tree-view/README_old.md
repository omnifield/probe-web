# Tree View

**Group:** — · **Genus:** component · **Footprint:** wide

## Anatomy

| part              | meaning                                                                                                                                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| root              | дерево целиком — один узел, оборачивающий подпись и сам список                                                                                                                                                                                                                                   |
| label             | подпись дерева — заголовок над списком                                                                                                                                                                                                                                                           |
| tree              | список узлов верхнего уровня — `role="tree"`; вложенные листья и ветки строятся рекурсивно                                                                                                                                                                                                       |
| item              | один лист — конечный узел без потомков; кликабельная и фокусируемая строка (roving tabindex)                                                                                                                                                                                                     |
| itemText          | подпись листа                                                                                                                                                                                                                                                                                    |
| itemIndicator     | отметка выделения листа — кит прячет её атрибутом `hidden`, пока лист не выделен; графику кладёт потребитель                                                                                                                                                                                     |
| branch            | одна ветка — узел с потомками, вложенными в `branchContent`                                                                                                                                                                                                                                      |
| branchControl     | кликабельная и фокусируемая строка ветки — настоящий фокус живёт здесь (roving tabindex), не на `branch`                                                                                                                                                                                         |
| branchText        | подпись ветки                                                                                                                                                                                                                                                                                    |
| branchIndicator   | индикатор раскрытия — обычно стрелка, которую скин поворачивает по `data-state`; графику кладёт потребитель                                                                                                                                                                                      |
| branchTrigger     | отдельная кнопка переключения раскрытия — `role="button"` на `<div>`; клавиатурный фокус на неё никогда не приходит, он остаётся на `branchControl`. Нативный `disabled` здесь отражает не отключённость ветки, а именно `loading` — сама отключённость приходит своим атрибутом `data-disabled` |
| branchContent     | контейнер потомков ветки — виден только пока она раскрыта; при закрытии скрывается целиком атрибутом `hidden`, без измеренной высоты и без анимации (в отличие от аккордеона — у этой части нет `--height`)                                                                                      |
| branchIndentGuide | вертикальная направляющая линия на глубине узла — чисто структурный элемент, своей графики не несёт                                                                                                                                                                                              |
| nodeCheckbox      | чекбокс узла — работает и на листе, и на ветке; кликабелен, но сам никогда не получает клавиатурный фокус (фокус всегда остаётся на строке)                                                                                                                                                      |
| nodeRenameInput   | настоящее поле ввода переименования — показывается только пока узел в режиме переименования (`F2` или `startRenaming`)                                                                                                                                                                           |

## States

| part              | state         | mark                         | meaning                                                                                                           |
| ----------------- | ------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| root              | —             | —                            | —                                                                                                                 |
| label             | —             | —                            | —                                                                                                                 |
| tree              | —             | —                            | —                                                                                                                 |
| item              | focus         | [data-focus]                 | реальный фокус клавиатуры/мыши стоит на этом листе                                                                |
| item              | selected      | [data-selected]              | лист входит в текущее выделение                                                                                   |
| item              | disabled      | [data-disabled]              | лист отключён — клик по нему не выделяет и не переключает                                                         |
| item              | renaming      | [data-renaming]              | подпись листа сейчас редактируется (`F2` или `startRenaming`)                                                     |
| item              | checked       | [data-checked]               | лист отмечен целиком — для дерева с чекбоксами                                                                    |
| item              | indeterminate | [data-indeterminate]         | отмечена только часть — у листа своих потомков нет, но отметку можно задать извне тем же атрибутом, что и у ветки |
| itemText          | disabled      | [data-disabled]              | лист отключён                                                                                                     |
| itemText          | selected      | [data-selected]              | лист выделен                                                                                                      |
| itemText          | focus         | [data-focus]                 | фокус стоит на этом листе                                                                                         |
| itemIndicator     | disabled      | [data-disabled]              | лист отключён                                                                                                     |
| itemIndicator     | selected      | [data-selected]              | лист выделен                                                                                                      |
| itemIndicator     | focus         | [data-focus]                 | фокус стоит на этом листе                                                                                         |
| branch            | selected      | [data-selected]              | ветка входит в текущее выделение                                                                                  |
| branch            | disabled      | [data-disabled]              | ветка отключена — раскрыть, выделить или отметить её нельзя                                                       |
| branch            | loading       | [data-loading]               | ветка подгружает своих потомков (`loadChildren`)                                                                  |
| branch            | open          | [data-state="open"]          | ветка раскрыта — её содержимое видно                                                                              |
| branch            | closed        | [data-state="closed"]        | ветка закрыта — узел содержимого остаётся в разметке, но скрыт атрибутом `hidden`                                 |
| branchControl     | open          | [data-state="open"]          | ветка раскрыта — её содержимое видно                                                                              |
| branchControl     | closed        | [data-state="closed"]        | ветка закрыта — узел содержимого остаётся в разметке, но скрыт атрибутом `hidden`                                 |
| branchControl     | disabled      | [data-disabled]              | ветка отключена                                                                                                   |
| branchControl     | selected      | [data-selected]              | ветка входит в текущее выделение                                                                                  |
| branchControl     | focus         | [data-focus]                 | реальный фокус стоит на этой строке                                                                               |
| branchControl     | renaming      | [data-renaming]              | подпись ветки сейчас редактируется (`F2` или `startRenaming`)                                                     |
| branchControl     | checked       | [data-checked]               | ветка отмечена целиком — для дерева с чекбоксами                                                                  |
| branchControl     | indeterminate | [data-indeterminate]         | отмечена только часть потомков ветки                                                                              |
| branchControl     | loading       | [data-loading]               | ветка подгружает своих потомков                                                                                   |
| branchControl     | hover         | :hover                       | указатель наведён на строку                                                                                       |
| branchControl     | active        | :active                      | строка нажата указателем                                                                                          |
| branchText        | open          | [data-state="open"]          | ветка раскрыта — её содержимое видно                                                                              |
| branchText        | closed        | [data-state="closed"]        | ветка закрыта — узел содержимого остаётся в разметке, но скрыт атрибутом `hidden`                                 |
| branchText        | disabled      | [data-disabled]              | ветка отключена                                                                                                   |
| branchText        | loading       | [data-loading]               | ветка подгружает своих потомков                                                                                   |
| branchIndicator   | open          | [data-state="open"]          | ветка раскрыта — её содержимое видно                                                                              |
| branchIndicator   | closed        | [data-state="closed"]        | ветка закрыта — узел содержимого остаётся в разметке, но скрыт атрибутом `hidden`                                 |
| branchIndicator   | disabled      | [data-disabled]              | ветка отключена                                                                                                   |
| branchIndicator   | selected      | [data-selected]              | ветка входит в текущее выделение                                                                                  |
| branchIndicator   | focus         | [data-focus]                 | реальный фокус стоит на строке ветки                                                                              |
| branchIndicator   | loading       | [data-loading]               | ветка подгружает своих потомков                                                                                   |
| branchTrigger     | open          | [data-state="open"]          | ветка раскрыта — её содержимое видно                                                                              |
| branchTrigger     | closed        | [data-state="closed"]        | ветка закрыта — узел содержимого остаётся в разметке, но скрыт атрибутом `hidden`                                 |
| branchTrigger     | disabled      | [data-disabled]              | ветка отключена — клик по этой кнопке не раскрывает и не закрывает её                                             |
| branchTrigger     | loading       | [data-loading]               | ветка подгружает своих потомков; нативный `disabled` кнопки в этот момент тоже включён                            |
| branchTrigger     | hover         | :hover                       | указатель наведён на строку                                                                                       |
| branchTrigger     | active        | :active                      | строка нажата указателем                                                                                          |
| branchContent     | open          | [data-state="open"]          | ветка раскрыта — её содержимое видно                                                                              |
| branchContent     | closed        | [data-state="closed"]        | ветка закрыта — узел содержимого остаётся в разметке, но скрыт атрибутом `hidden`                                 |
| branchIndentGuide | —             | —                            | —                                                                                                                 |
| nodeCheckbox      | checked       | [data-state="checked"]       | узел отмечен целиком                                                                                              |
| nodeCheckbox      | unchecked     | [data-state="unchecked"]     | узел не отмечен                                                                                                   |
| nodeCheckbox      | indeterminate | [data-state="indeterminate"] | отмечена только часть потомков узла                                                                               |
| nodeCheckbox      | disabled      | [data-disabled]              | узел отключён                                                                                                     |
| nodeCheckbox      | hover         | :hover                       | указатель наведён на строку                                                                                       |
| nodeCheckbox      | active        | :active                      | строка нажата указателем                                                                                          |
| nodeRenameInput   | —             | —                            | —                                                                                                                 |

## Settings

| setting | meaning | default | mark |
| ------- | ------- | ------- | ---- |

## CSS Variables

| part   | variable  | set by | meaning                                                    |
| ------ | --------- | ------ | ---------------------------------------------------------- |
| item   | `--depth` | kit    | глубина вложенности листа — от неё считается отступ строки |
| branch | `--depth` | kit    | глубина вложенности ветки — от неё считается отступ строки |

## Notes

<!-- user:start -->

Постановка user, 2026-09-01 — анатомия выше устарела (сгенерирована до перехода), актуальный
словарь пяти частей описан здесь до следующей генерации:

**Пять частей, не семнадцать.** `root` / `item` / `control` / `controlIndicator` / `content` —
это всё, что видит автор сборки. Ark различает лист и ветку СВОИМИ раздельными наборами частей
(`item`/`itemText`/`itemIndicator` против `branch`/`branchControl`/…/`branchContent`) — в нашей
анатомии этого различия нет: `item` один на оба случая.

**Кто решает, лист это или ветка — сам компонент, не схема.** `item` смотрит на `node.children` в
своих данных и решает, что рисовать — настоящий Ark'овский `Item` или настоящий `Branch`. Это
обычная развилка внутри функции компонента, не требует ничего от движка сборки (движок берёт
компоненты и схему и рисует, что происходит внутри функции компонента — его не касается).

**`control`/`controlIndicator`/`content` — наши, не Ark'овские, и НЕ айтем-специфичные.**
Добавлены через `entity/anatomy.ts`'s `extendWith(...)` (тот же построитель анатомии, каким Ark
строит родные части — адрес получается настоящим, `partSelector`/рецепты его видят как обычную
часть, без особых случаев). Имена без префикса `item` нарочно (постановка user, 2026-09-01):
«контрол и контент это стандартно, неважно внутри айтема он или нет» — кликабельная
шапка+индикатор и открытый слот-контент — это словарь для ЛЮБОГО компонента кита, не только для
итерируемых. Сами строки-имена — `shared/data/anatomy.ts`'s `parts.controlSet`/`parts.content`,
не набраны в `entity/anatomy.ts` руками: когда аккордеон перейдёт на этот же набор, он подставит
тот же словарь. `control` группирует подпись и индикатор (зеркалит `branchControl` для ветки, но
своего клика может и не решать, если рисуется как лист — там всё уже решает `item`). `content` —
открытый слот, содержимое решает потребитель, своего вида не несёт.

**Как `control`/`controlIndicator`/`content` узнают, лист они сейчас рисуют или ветку.**
Ничего своего заводить не пришлось: `@ark-ui/solid/tree-view` уже экспортирует
`useTreeViewNodeContext()` — хук, отдающий `NodeState` текущего узла (того, что подставил ближайший
`TreeViewNodeProvider` сверху), и в нём уже есть `isBranch: boolean`. Общий паттерн для похожих
случаев в будущем: (1) проверить, не отдаёт ли нужный факт уже сам вендор через свой контекст, (2)
если нет — маленький свой `createContext` рядом с компонентом, родитель оборачивает
`{props.children}`, дети читают `useContext` (родителю нечем передать проп СВОИМ детям от схемы
напрямую — они рисуются движком одним общим циклом, `packages/assembly/src/render.tsx`'s
`contentOf()`, разбор в `packages/ui/README.md`), (3) правка движка — только если ни то, ни
другое не годится.

**`playground/recipe.ts` пересобран под пять частей** (был на семнадцати). Важное отличие от
старой версии: `content` рисуется то простым `<div>` (лист), то `ArkBranchContent` (ветка) —
а видимость ветки Ark переключает нативным `[hidden]`. Безусловный `display` в базовом рецепте
проиграл бы `[hidden]` по специфичности (два атрибута `[data-scope][data-part]` бьют один
`[hidden]`) — та же ловушка, что уже чинили для `branchContent` до перехода. Паспорт сейчас не
объявляет `open`/`closed` у `content` (`states: []`), так что явного стейта-исключения завести
нельзя — `display` там вообще не тронут, часть просто ничего не решает про раскладку своего
содержимого. Та же логика для `controlIndicator`: она одна на вращающуюся стрелку ветки (всегда
видна) и прячущуюся галочку листа (нативный `hidden`, пока не `selected`) — `display` положен
только внутри состояний `open`/`closed`/`selected`, не в базе.

**Словарь `label` — тоже общий, не набирается руками в каждом `entity/io.ts`.**
`shared/data/fields.ts`'s `fields.labeled` — фрагмент формы `{ label: z.string() }`, подставляется
через spread (`z.object({ id: z.string(), ...fields.labeled, children: ... })`), не копия строки
`label: z.string()` в каждом компоненте по отдельности. `accordion`/`button`/`listbox`/`select` уже
называют это поле `label` по факту (не сговариваясь) — этот файл первый, где это стало настоящим
общим кодом, а не просто одинаковой привычкой.

`item` в новом паспорте несёт весь список состояний сразу за лист И ветку (`focus`/`selected`/
`disabled`/`renaming`/`checked`/`indeterminate`/`loading`/`open`/`closed`) — старое разделение
`item`/`branch` этого не требовало, ветка сама решала часть своей `look`. Сейчас `item` — общая
обёртка на оба случая, и `skinGaps` требует адреса на КАЖДОЕ объявленное состояние, поэтому у неё
теперь есть свой (пусть скромный) слой: акцентная кромка на `selected`/`checked`/`indeterminate`,
отступ на `open`/`closed` — то, что раньше жило только на `branch`.

<!-- user:end -->
