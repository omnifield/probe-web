# Tree View

**Group:** — · **Genus:** component · **Footprint:** wide

## Anatomy

| part | meaning |
|---|---|
| root | дерево целиком — один узел, оборачивающий подпись и сам список |
| label | подпись дерева — заголовок над списком |
| tree | список узлов верхнего уровня — `role="tree"`; вложенные листья и ветки строятся рекурсивно |
| item | один лист — конечный узел без потомков; кликабельная и фокусируемая строка (roving tabindex) |
| itemText | подпись листа |
| itemIndicator | отметка выделения листа — кит прячет её атрибутом `hidden`, пока лист не выделен; графику кладёт потребитель |
| branch | одна ветка — узел с потомками, вложенными в `branchContent` |
| branchControl | кликабельная и фокусируемая строка ветки — настоящий фокус живёт здесь (roving tabindex), не на `branch` |
| branchText | подпись ветки |
| branchIndicator | индикатор раскрытия — обычно стрелка, которую скин поворачивает по `data-state`; графику кладёт потребитель |
| branchTrigger | отдельная кнопка переключения раскрытия — `role="button"` на `<div>`; клавиатурный фокус на неё никогда не приходит, он остаётся на `branchControl`. Нативный `disabled` здесь отражает не отключённость ветки, а именно `loading` — сама отключённость приходит своим атрибутом `data-disabled` |
| branchContent | контейнер потомков ветки — виден только пока она раскрыта; при закрытии скрывается целиком атрибутом `hidden`, без измеренной высоты и без анимации (в отличие от аккордеона — у этой части нет `--height`) |
| branchIndentGuide | вертикальная направляющая линия на глубине узла — чисто структурный элемент, своей графики не несёт |
| nodeCheckbox | чекбокс узла — работает и на листе, и на ветке; кликабелен, но сам никогда не получает клавиатурный фокус (фокус всегда остаётся на строке) |
| nodeRenameInput | настоящее поле ввода переименования — показывается только пока узел в режиме переименования (`F2` или `startRenaming`) |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | — | — | — |
| label | — | — | — |
| tree | — | — | — |
| item | focus | [data-focus] | реальный фокус клавиатуры/мыши стоит на этом листе |
| item | selected | [data-selected] | лист входит в текущее выделение |
| item | disabled | [data-disabled] | лист отключён — клик по нему не выделяет и не переключает |
| item | renaming | [data-renaming] | подпись листа сейчас редактируется (`F2` или `startRenaming`) |
| item | checked | [data-checked] | лист отмечен целиком — для дерева с чекбоксами |
| item | indeterminate | [data-indeterminate] | отмечена только часть — у листа своих потомков нет, но отметку можно задать извне тем же атрибутом, что и у ветки |
| itemText | disabled | [data-disabled] | лист отключён |
| itemText | selected | [data-selected] | лист выделен |
| itemText | focus | [data-focus] | фокус стоит на этом листе |
| itemIndicator | disabled | [data-disabled] | лист отключён |
| itemIndicator | selected | [data-selected] | лист выделен |
| itemIndicator | focus | [data-focus] | фокус стоит на этом листе |
| branch | selected | [data-selected] | ветка входит в текущее выделение |
| branch | disabled | [data-disabled] | ветка отключена — раскрыть, выделить или отметить её нельзя |
| branch | loading | [data-loading] | ветка подгружает своих потомков (`loadChildren`) |
| branch | open | [data-state="open"] | ветка раскрыта — её содержимое видно |
| branch | closed | [data-state="closed"] | ветка закрыта — узел содержимого остаётся в разметке, но скрыт атрибутом `hidden` |
| branchControl | open | [data-state="open"] | ветка раскрыта — её содержимое видно |
| branchControl | closed | [data-state="closed"] | ветка закрыта — узел содержимого остаётся в разметке, но скрыт атрибутом `hidden` |
| branchControl | disabled | [data-disabled] | ветка отключена |
| branchControl | selected | [data-selected] | ветка входит в текущее выделение |
| branchControl | focus | [data-focus] | реальный фокус стоит на этой строке |
| branchControl | renaming | [data-renaming] | подпись ветки сейчас редактируется (`F2` или `startRenaming`) |
| branchControl | checked | [data-checked] | ветка отмечена целиком — для дерева с чекбоксами |
| branchControl | indeterminate | [data-indeterminate] | отмечена только часть потомков ветки |
| branchControl | loading | [data-loading] | ветка подгружает своих потомков |
| branchControl | hover | :hover | указатель наведён на строку |
| branchControl | active | :active | строка нажата указателем |
| branchText | open | [data-state="open"] | ветка раскрыта — её содержимое видно |
| branchText | closed | [data-state="closed"] | ветка закрыта — узел содержимого остаётся в разметке, но скрыт атрибутом `hidden` |
| branchText | disabled | [data-disabled] | ветка отключена |
| branchText | loading | [data-loading] | ветка подгружает своих потомков |
| branchIndicator | open | [data-state="open"] | ветка раскрыта — её содержимое видно |
| branchIndicator | closed | [data-state="closed"] | ветка закрыта — узел содержимого остаётся в разметке, но скрыт атрибутом `hidden` |
| branchIndicator | disabled | [data-disabled] | ветка отключена |
| branchIndicator | selected | [data-selected] | ветка входит в текущее выделение |
| branchIndicator | focus | [data-focus] | реальный фокус стоит на строке ветки |
| branchIndicator | loading | [data-loading] | ветка подгружает своих потомков |
| branchTrigger | open | [data-state="open"] | ветка раскрыта — её содержимое видно |
| branchTrigger | closed | [data-state="closed"] | ветка закрыта — узел содержимого остаётся в разметке, но скрыт атрибутом `hidden` |
| branchTrigger | disabled | [data-disabled] | ветка отключена — клик по этой кнопке не раскрывает и не закрывает её |
| branchTrigger | loading | [data-loading] | ветка подгружает своих потомков; нативный `disabled` кнопки в этот момент тоже включён |
| branchTrigger | hover | :hover | указатель наведён на строку |
| branchTrigger | active | :active | строка нажата указателем |
| branchContent | open | [data-state="open"] | ветка раскрыта — её содержимое видно |
| branchContent | closed | [data-state="closed"] | ветка закрыта — узел содержимого остаётся в разметке, но скрыт атрибутом `hidden` |
| branchIndentGuide | — | — | — |
| nodeCheckbox | checked | [data-state="checked"] | узел отмечен целиком |
| nodeCheckbox | unchecked | [data-state="unchecked"] | узел не отмечен |
| nodeCheckbox | indeterminate | [data-state="indeterminate"] | отмечена только часть потомков узла |
| nodeCheckbox | disabled | [data-disabled] | узел отключён |
| nodeCheckbox | hover | :hover | указатель наведён на строку |
| nodeCheckbox | active | :active | строка нажата указателем |
| nodeRenameInput | — | — | — |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|

## CSS Variables

| part | variable | set by | meaning |
|---|---|---|---|
| item | `--depth` | kit | глубина вложенности листа — от неё считается отступ строки |
| branch | `--depth` | kit | глубина вложенности ветки — от неё считается отступ строки |

## Notes

<!-- user:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- user:end -->
