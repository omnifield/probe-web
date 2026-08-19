# @omnifield/probe-web-ui

Примитивы локации `probe-web` поверх [`@kobalte/core`](https://kobalte.dev): **1-to-1 DOM**,
**проброс `ref`**, **свои обработчики насквозь**, **ноль презентационных стилей**.

Контракт зон целиком — `kb:PROBEWEB-4`; эта страница его не заменяет, а пересказывает со
стороны пакета. Зависит от `solid-js` и `@kobalte/core`, больше ни от чего.

## Четыре принципа — и что каждый значит на практике

Это норма kobalte (`CONTRIBUTING.md`, «Vision → Principles»), а не наш вкус. Взяты дословно,
потому что вместе они и составляют «открытый компонент».

| принцип | как выражен здесь | чем подтверждён |
|---|---|---|
| **1-to-1** — один компонент рендерит один DOM-узел | у каждого примитива тест считает `children` контейнера | `test/<примитив>.test.tsx` |
| **`ref` доезжает** до нужного узла | спред пропсов не трогает `ref` | `test/contract.test.tsx` |
| **обработчики композируемы** | обработчик потребителя приходит прямо в компонент | `test/contract.test.tsx` |
| **ноль стилей** | атрибутов `class` и `style` на узле не появляется само | `test/contract.test.tsx` |

Отступление от принципа допустимо только с явным обоснованием в доке компонента. Все, что есть
в зоне, названы, и все привезены `@kobalte/core`, а не нами:

| отступление | где | почему не снимается |
|---|---|---|
| **не 1-to-1** | всплывающая панель (`*-content`) | координаты пишутся в отдельный узел-позиционер |
| **не 1-to-1** | стрелка (`*-arrow`) | внутри вектор, иначе её не повернуть за панелью |
| **есть `style`** | спрятанные вводы (`checkbox-input`, `switch-input`, `radio-group-item-input`) | механика доступности: ввод остаётся ради фокуса и формы, но не виден |
| **есть `style`** | числовой ввод (`number-field-input`) | `touch-action: none` — иначе жест прокрутки менял бы значение |
| **не 1-to-1** | скрытый `<select>` поиска (`combobox-hidden-select`) | обёртка и технический ввод — обход особенностей Safari и Firefox |
| **есть `style`** | всплывающие панели и стрелки | позиционирование, переменная начала трансформации, цвет стрелки — **зеркало панели потребителя** |
| **есть `style`** | подложка области и дорожка ползунка цвета (`color-area-background`, `color-slider-track`) | градиенты СЧИТАНЫ из значения: показывать надо те цвета, между которыми выбирают, а знает их только примитив |
| **есть `style`** | бегунки цветовых (`color-area-thumb`, `color-slider-thumb`) | координаты плюс `--kb-color-current` — переменная, **которой оформление и красит бегунок** |

Разбор каждого — в разделах ниже и в доке соответствующего компонента.

## Что наружу

Примитивы едут одним входом — `@omnifield/probe-web-ui`: пакет ESM с `sideEffects: false`, и
неиспользованный примитив выбрасывается сборщиком потребителя без сегментации по подпутям.

Подпуть у зоны ровно один и не для примитивов — `@omnifield/probe-web-ui/passport` (раздел
«Паспорт компонента» ниже). Он отдаёт ДАННЫЕ, и его читателю — механике скина, редактору,
чужому инструменту — не нужны ни JSX, ни Solid, ни `@kobalte/core`.

| примитив | узел | на чём стоит |
|---|---|---|
| `Slot` | из `as`, по умолчанию `div` | `Polymorphic` |
| `Button` | `button` | `Button.Root` |
| `Toggle` | `button[aria-pressed]` | `ToggleButton.Root` |
| `Separator` | `hr` | `Separator.Root` |
| `Spinner` | `span[role=status]` | нативный элемент |
| `Field` | `div` + контекст | `TextField.Root` |
| `Label` | `label` | `TextField.Label` |
| `Input` | `input` | `TextField.Input` |
| `Textarea` | `textarea` | `TextField.TextArea` |
| `FieldDescription` | `div` | `TextField.Description` |
| `FieldError` | `div` | `TextField.ErrorMessage` |
| `Select*` | составной, 10 частей | `Select.*` |
| `Popover*` | составной, 9 частей | `Popover.*` |
| `DropdownMenu*` | составной, 19 частей | `DropdownMenu.*` |
| `Dialog*` | составной, 8 частей | `Dialog.*` |
| `Tabs*` | составной, 5 частей | `Tabs.*` |
| `Tooltip*` | составной, 5 частей | `Tooltip.*` |
| `Combobox*` | составной, 18 частей | `Combobox.*` |
| `NumberField*` | составной, 8 частей | `NumberField.*` |
| `ContextMenu*` | составной, 19 частей | `ContextMenu.*` |
| `Menubar*` | составной, 20 частей | `Menubar.*` |
| `NavigationMenu*` | составной, 21 часть | `NavigationMenu.*` |
| `Accordion*` | составной, 5 частей | `Accordion.*` |
| `Collapsible*` | составной, 3 части | `Collapsible.*` |
| `AlertDialog*` | составной, 8 частей | `AlertDialog.*` |
| `Pagination*` | составной, 6 частей | `Pagination.*` |
| `Breadcrumbs*` | составной, 3 части | `Breadcrumbs.*` |
| `Image*` | составной, 3 части | `Image.*` |
| `Link` | `a` | `Link.Root` |
| `Slider*` | составной, 9 частей | `Slider.*` |
| `Progress*` | составной, 5 частей | `Progress.*` |
| `Skeleton` | `div`-обёртка | `Skeleton.Root` |
| `Toast*` | составной, 8 частей + `toaster` | `Toast.*` |
| `SegmentedControl*` | составной, 11 частей | `SegmentedControl.*` |
| `ToggleGroup*` | составной, 2 части | `ToggleGroup.*` |
| `Checkbox*` | составной, 7 частей | `Checkbox.*` |
| `Switch*` | составной, 7 частей | `Switch.*` |
| `RadioGroup*` | составной, 10 частей | `RadioGroup.*` |
| `ColorField*` | составной, 5 частей | `ColorField.*` |
| `ColorArea*` | составной, 8 частей | `ColorArea.*` |
| `ColorSlider*` | составной, 8 частей | `ColorSlider.*` |
| `parseColor`, `Color` | узла не рендерит | `@kobalte/core/colors` — реэкспорт |

## Стилизация: зацепка `data-slot`

Стилей по умолчанию нет — значит оформление приезжает СНАРУЖИ, и ему нужна точка опоры,
которая не зависит от наших внутренностей. Каждый примитив ставит `data-slot` со своим
именем:

```css
[data-slot="button"] { padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); }
[data-slot="button"][data-disabled] { opacity: 0.5; }
[data-slot="toggle"][data-pressed] { background: var(--color-accent); }
```

Зацепка — **дефолт, а не печать**: `data-slot` стоит до спреда пропсов, поэтому потребитель
перебивает её своей. Проп `class` доезжает до узла как есть, без примеси.

### Читать через `~=`: зацепок на узле может быть НЕСКОЛЬКО

`data-slot` — **список имён через пробел**, а не одно имя (`kb:PROBEWEB-4`, решение architect
2026-08-17). Правильный селектор:

```css
[data-slot~="button"] { … }   /* верно: сработает и на «button», и на «button dialog-trigger» */
[data-slot="button"]  { … }   /* неверно: пропустит композицию */
```

Список появляется при композиции: `<DialogTrigger as={Button}>` рендерит ОДИН узел, и на нём
живут обе зацепки — `button dialog-trigger`. Раньше выживала только одна, и оформлению
приходилось повторять правила кнопки в каждом файле, где кнопка бывает триггером.

**Право потребителя не тронуто:** явный `data-slot` по-прежнему перебивает ВСЁ, включая список.
Это и есть возможность взять кит без чужого оформления, и она держится пробой
(`test/slot-chain.test.tsx`), а не обещанием.

**Как это устроено внутри и где предел.** Внешний примитив отдаёт свои зацепки внутреннему не
атрибутом, а внутренним пропом, и только тем компонентам, которые умеют его снять, — у тегов и
у чужих компонентов он бы утёк в разметку атрибутом. Отсюда предел: **чужая обёртка посередине
разрывает цепочку** (`<TooltipTrigger as={(p) => <DialogTrigger as={Button} {...p} />}>` даст
одну зацепку, а не три). Предел назван пробой, а не спрятан.

Участвуют девять примитивов — те, где композиция реальна: `Button`, `Toggle`, `Link` и триггеры
окна, окна-предупреждения, панели, подсказки, выпадающего меню и раскрывашки.

Оформление удобно собирать `cn` / `createStyle` из `@omnifield/probe-web-style` — но зона
`ui` их **не зовёт**: любой класс по умолчанию был бы стилем по умолчанию. Почему так и что
из этого следует — раздел «Что НЕ делает пакет».

### Обязательство: имена слотов не меняются без мажора

Это не описание текущего состояния, а **обещание потребителю** (`kb:PROBEWEB-4`, решение —
`kb:PROBEWEB-12`, пункт 7):

> **Имя `data-slot` из перечня ниже не переименовывается и не удаляется между выпусками без
> мажорного поднятия версии.** Добавление НОВОГО имени мажора не требует — оно не ломает тех,
> кто цеплялся за прежние, и уезжает минором.

Обещание даётся осознанно и стоит денег: поверхность зацепок есть у многих китов, а
обязательства по ней не даёт никто (разбор рынка — `canons/ui-skin`). Мы его даём, потому что
на этих именах стоит целая зона оформлений (`kb:PROBEWEB-11`), и без обещания она держится на
честном слове.

Числа слотов здесь нет намеренно: оно устаревает при каждом добавлении примитива, а обещание
— нет. Контракт — сам перечень, а не его длина (решение architect 2026-08-16).

| примитив | слоты |
|---|---|
| `Button` | `button` |
| `Toggle` | `toggle` |
| `Separator` | `separator` |
| `Spinner` | `spinner` |
| семейство поля | `field`, `label`, `input`, `textarea`, `field-description`, `field-error` |
| составной `Select` | `select`, `select-trigger`, `select-value`, `select-icon`, `select-content`, `select-listbox`, `select-item`, `select-item-label`, `select-item-indicator` |
| составной `Popover` | `popover-trigger`, `popover-anchor`, `popover-content`, `popover-arrow`, `popover-title`, `popover-description`, `popover-close` |
| составной `Tooltip` | `tooltip-trigger`, `tooltip-content`, `tooltip-arrow` |
| составной `DropdownMenu` | `dropdown-menu-trigger`, `dropdown-menu-icon`, `dropdown-menu-content`, `dropdown-menu-arrow`, `dropdown-menu-item`, `dropdown-menu-item-label`, `dropdown-menu-item-description`, `dropdown-menu-item-indicator`, `dropdown-menu-checkbox-item`, `dropdown-menu-radio-group`, `dropdown-menu-radio-item`, `dropdown-menu-group`, `dropdown-menu-group-label`, `dropdown-menu-separator`, `dropdown-menu-sub-trigger`, `dropdown-menu-sub-content` |
| составной `Dialog` | `dialog-trigger`, `dialog-overlay`, `dialog-content`, `dialog-title`, `dialog-description`, `dialog-close` |
| составной `Tabs` | `tabs`, `tabs-list`, `tabs-trigger`, `tabs-indicator`, `tabs-content` |
| составной `Combobox` | `combobox`, `combobox-label`, `combobox-control`, `combobox-input`, `combobox-trigger`, `combobox-icon`, `combobox-hidden-select`, `combobox-content`, `combobox-arrow`, `combobox-listbox`, `combobox-item`, `combobox-item-label`, `combobox-item-description`, `combobox-item-indicator`, `combobox-section`, `combobox-description`, `combobox-error` |
| составной `NumberField` | `number-field`, `number-field-label`, `number-field-input`, `number-field-hidden-input`, `number-field-increment`, `number-field-decrement`, `number-field-description`, `number-field-error` |
| составной `ContextMenu` | `context-menu-trigger`, `-content`, `-arrow`, `-item`, `-item-label`, `-item-description`, `-item-indicator`, `-checkbox-item`, `-radio-group`, `-radio-item`, `-group`, `-group-label`, `-separator`, `-sub-trigger`, `-sub-content`, `-icon` |
| составной `Menubar` | `menubar`, `menubar-trigger`, `-content`, `-arrow`, `-item`, `-item-label`, `-item-description`, `-item-indicator`, `-checkbox-item`, `-radio-group`, `-radio-item`, `-group`, `-group-label`, `-separator`, `-sub-trigger`, `-sub-content`, `-icon` |
| составной `NavigationMenu` | `navigation-menu`, `navigation-menu-viewport`, `-trigger`, `-content`, `-arrow`, `-item`, `-item-label`, `-item-description`, `-item-indicator`, `-checkbox-item`, `-radio-group`, `-radio-item`, `-group`, `-group-label`, `-separator`, `-sub-trigger`, `-sub-content`, `-icon` |
| составной `Accordion` | `accordion`, `accordion-item`, `accordion-header`, `accordion-trigger`, `accordion-content` |
| составной `Collapsible` | `collapsible`, `collapsible-trigger`, `collapsible-content` |
| составной `AlertDialog` | `alert-dialog-trigger`, `alert-dialog-overlay`, `alert-dialog-content`, `alert-dialog-title`, `alert-dialog-description`, `alert-dialog-close` |
| составной `Pagination` | `pagination`, `pagination-item`, `pagination-ellipsis`, `pagination-previous`, `pagination-next` |
| составной `Breadcrumbs` | `breadcrumbs`, `breadcrumbs-list`, `breadcrumbs-item`, `breadcrumbs-link`, `breadcrumbs-separator` |
| составной `Image` | `image`, `image-img`, `image-fallback` |
| `Link` | `link` |
| составной `Slider` | `slider`, `slider-label`, `slider-value-label`, `slider-track`, `slider-fill`, `slider-thumb`, `slider-input`, `slider-description`, `slider-error` |
| составной `Progress` | `progress`, `progress-label`, `progress-value-label`, `progress-track`, `progress-fill` |
| `Skeleton` | `skeleton` |
| составной `Toast` | `toast-region`, `toast-list`, `toast`, `toast-title`, `toast-description`, `toast-close`, `toast-progress-track`, `toast-progress-fill` |
| составной `SegmentedControl` | `segmented-control`, `segmented-control-label`, `segmented-control-track`, `segmented-control-indicator`, `segmented-control-item`, `segmented-control-item-input`, `segmented-control-item-control`, `segmented-control-item-indicator`, `segmented-control-item-label`, `segmented-control-item-description`, `segmented-control-description`, `segmented-control-error` |
| составной `ToggleGroup` | `toggle-group`, `toggle-group-item` |
| составной `Checkbox` | `checkbox`, `checkbox-input`, `checkbox-control`, `checkbox-indicator`, `checkbox-label`, `checkbox-description`, `checkbox-error` |
| составной `Switch` | `switch`, `switch-input`, `switch-control`, `switch-thumb`, `switch-label`, `switch-description`, `switch-error` |
| составной `RadioGroup` | `radio-group`, `radio-group-label`, `radio-group-description`, `radio-group-error`, `radio-group-item`, `radio-group-item-input`, `radio-group-item-control`, `radio-group-item-indicator`, `radio-group-item-label`, `radio-group-item-description` |
| составной `ColorField` | `color-field`, `color-field-label`, `color-field-input`, `color-field-description`, `color-field-error` |
| составной `ColorArea` | `color-area`, `color-area-label`, `color-area-background`, `color-area-thumb`, `color-area-hidden-input-x`, `color-area-hidden-input-y`, `color-area-description`, `color-area-error` |
| составной `ColorSlider` | `color-slider`, `color-slider-label`, `color-slider-value-label`, `color-slider-track`, `color-slider-thumb`, `color-slider-input`, `color-slider-description`, `color-slider-error` |

`Slot` зацепки не ставит **намеренно**: своего имени у него нет, семантику узла задаёт
потребитель через `as`. Обещать за него нечего — и это часть того же обязательства.

**Зацепок `popover`, `tooltip`, `dropdown-menu` и `dialog` не существует, и это тоже намеренно:** их корни узла не
рендерят, а зацепка обязана быть НА узле. Панель ловится по `popover-content`, кнопка — по
`popover-trigger`. То же у порталов и у `DropdownMenuSub`: они переносят содержимое или заводят
контекст, но своего узла не приводят.

Перечень стережёт проба, а не только эта страница: `test/slot-list.ts` держит имена явным
списком, выписанным руками, а `test/slots.test.tsx` сверяет его с фактом **с двух сторон** —
каждое обещанное имя обязано появиться в живом документе, и каждая зацепка из исходников
обязана быть в списке. Исчезнувший или переименованный слот роняет прогон здесь, а не у
потребителя после выпуска; новый слот роняет его до тех пор, пока не внесён в перечень.

## Паспорт компонента: `@omnifield/probe-web-ui/passport`

**Паспорт — то, что компонент объявляет о себе ДАННЫМИ**, чтобы его можно было одеть скином и
показать в редакторе (задача `tasker:PWEB-2`). Зацепка `data-slot` отвечает на вопрос «за что
цепляться», паспорт — на вопросы «какие части, состояния и намерения у компонента ЕСТЬ»: скин
адресуется не селектором, а координатами `часть · вариант · состояние`, и селектор порождает
механика. Нет паспорта — скину нечего перечислять, редактору нечего предложить, а проверке
«правило адресует несуществующее» не с чем сверяться.

```ts
import { passportOf } from "@omnifield/probe-web-ui/passport";

const кнопка = passportOf("button");
кнопка?.parts.map((часть) => часть.name);                        // ["button"]
кнопка?.parts[0].states.map((состояние) => состояние.name);      // hover, focus-visible, …
кнопка?.variants.map((вариант) => вариант.name);                 // primary, secondary, danger
```

Форма (`ComponentPassport`): **части** (имя = зацепка `data-slot`, назначение, правила
вложенности, пускает ли часть содержимое потребителя), **состояния** каждой части и
**варианты** — именованные намерения. Каждое состояние и каждый вариант объявлены вместе с
тем, **чем они выражены в разметке** (атрибут или псевдокласс): договориться об этом со скином
и редактором больше негде.

Что объявляет кнопка:

| состояние | чем выражено | кто ставит |
|---|---|---|
| `hover` | `:hover` | браузер |
| `focus-visible` | `:focus-visible` | браузер |
| `active` | `:active` | браузер |
| `disabled` | `data-disabled` | сам примитив |
| `busy` | `aria-busy="true"` | потребитель — занятая кнопка собирается из готового |

| вариант | намерение |
|---|---|
| `primary` | основное действие экрана |
| `secondary` | второстепенное действие рядом с основным |
| `danger` | действие, которое трудно или нельзя отменить |

**Варианты объявляет компонент, а не скин.** Имя намерения попадает в разметку потребителя
(`<Button data-variant="danger">`), и принадлежи перечень скину — смена скина ломала бы
разметку: вариант мог бы просто исчезнуть. Кит атрибут не трогает и пропускает насквозь, а
чисто визуальные имена (контур, призрак, мягкий) вариантами НЕ являются — это уже решение о
виде, и живут они внутри скина.

### Как стережётся

Паспорт выписан **руками**, а не снят с исходников: снятый перечень подтверждал бы сам себя —
переименование части проехало бы вместе с правкой, а сломался бы вид у потребителя. Цена
ручного перечня — тихое расхождение с кодом, и ловится оно проверкой в обе стороны
(`test/passport.test.tsx`): каждая объявленная часть обязана появиться в документе, каждая
зацепка исходника обязана быть в паспорте, каждая часть обязана быть **обещанным** именем из
`test/slot-list.ts`. Отдельно проверяются состояния (объявленный атрибут реально приезжает на
узел, объявленный псевдокласс — настоящий, а не слово) и варианты (атрибут потребителя
доезжает до узла).

Гейт поставки — в `test/surface.test.ts`: паспорт читается **исполнением** из чистой установки
тарбола, тем же импортом, каким его прочтут скин и редактор, и бандл подпути не тянет за собой
ни Solid, ни `@kobalte/core`.

### Форма — одна на всех поставщиков

Паспорт это **форма поставки, а не свойство кита**: продуктовый пакет со своей таблицей
объявляет себя теми же типами и попадает в редактор на общих правах — отсюда поле `package`,
по которому читатель узнаёт поставщика, не зная заранее ни одного имени пакета. Сегодня типы
формы живут здесь, потому что первый паспорт выписан здесь; понадобится ли им нейтральный дом,
чтобы поставщик компонентов не зависел от кита, — решение architect, а не зоны `ui`.

Паспорт есть пока у одной кнопки, и это не пробел: механика обкатывается на ней целиком, а
остальные компоненты получают паспорт **по одному** отдельными задачами (`tasker:PWEB-7`).
Компонент без паспорта отдаёт `undefined` — честно, а не пустой заглушкой, которая выглядела бы
как объявленный контракт.

## Быстрый пример

```tsx
import { Button, Field, FieldError, Input, Label, Spinner } from "@omnifield/probe-web-ui";

<Field value={mail()} onChange={setMail} validationState={valid() ? "valid" : "invalid"}>
  <Label>Почта</Label>
  <Input type="email" />
  <FieldError>Не похоже на адрес</FieldError>
</Field>

<Button onClick={send} disabled={sending()} aria-busy={sending() ? "true" : undefined}>
  {sending() ? <Spinner aria-label="Отправляем" /> : "Отправить"}
</Button>
```

## Семейство поля: части требуют `Field` вокруг

`Label`, `Input`, `Textarea`, `FieldDescription` и `FieldError` читают контекст `Field` и вне
его **бросают ошибку**. Цена названа, а не спрятана: на этом контексте держатся связка
`for`↔`id`, `aria-describedby`, `aria-invalid`, `required` и `disabled` — без него подпись не
связана с вводом ничем.

Нужна автономная подпись без поля — это нативный `<label>`. Второго компонента с тем же
именем и другим поведением в пакете нет намеренно.

## Составной `Select`

Правило 1-to-1 составной компонент не нарушает: узлов много, но каждая ЧАСТЬ рендерит ровно
один — `SelectTrigger` это `button`, `SelectContent` это `div`, `SelectListbox` это `ul`,
`SelectItem` это `li`. Нарушением был бы обратный ход: один `<Select options={…} />`,
рисующий всю конструкцию сам.

```tsx
<Select<string>
  options={cities}
  placeholder="Город"
  value={city()}
  onChange={setCity}
  itemComponent={(p) => (
    <SelectItem item={p.item}>
      <SelectItemLabel>{p.item.rawValue}</SelectItemLabel>
      <SelectItemIndicator>✓</SelectItemIndicator>
    </SelectItem>
  )}
>
  <SelectTrigger>
    <SelectValue<string>>{(s) => s.selectedOption()}</SelectValue>
    <SelectIcon>▾</SelectIcon>
  </SelectTrigger>
  <SelectPortal>
    <SelectContent>
      <SelectListbox />
    </SelectContent>
  </SelectPortal>
</Select>
```

### Позиционирование панели — опции на КОРНЕ, а не на `SelectContent`

Частый промах при одевании: зазор между кнопкой и панелью задают отступом в CSS. Так делать
не надо — отступ и позиционировщик будут спорить за одну и ту же величину, а координаты в
стиль позиционера каждый кадр пишет floating-ui.

Опции проброшены насквозь, как и все остальные пропсы, и стоят они на **корне** `Select` —
так их разложил `@kobalte/core`: позицию считает корень, панель принимает готовый результат.

```tsx
<Select gutter={12} placement="top-start" shift={8} flip="bottom" sameWidth={false} …>
```

По умолчанию `gutter: 8` и `sameWidth: true` — значения kobalte, мы их не переопределяем.

### Названное отступление от 1-to-1

`SelectContent` приводит в документ **два** узла: внешний позиционер
(`[data-popper-positioner]`) и панель внутри него. Плавающая панель обязана лежать в потоке
позиционирования floating-ui, а слить позиционер с панелью нельзя — `transform` анимации и
`transform` позиционирования оказались бы на одном узле и затирали бы друг друга. Узел
приносит сам `@kobalte/core`. Отступление держится явным тестом, а не только этим абзацем.

## Всплывающее: `Popover` и `Tooltip`

```tsx
<Popover placement="bottom-start" gutter={8}>
  <PopoverTrigger>Настройки</PopoverTrigger>
  <PopoverPortal>
    <PopoverContent>
      <PopoverArrow />
      <PopoverTitle>Вид таблицы</PopoverTitle>
      <PopoverDescription>Порядок и видимость колонок</PopoverDescription>
      <PopoverClose>Готово</PopoverClose>
    </PopoverContent>
  </PopoverPortal>
</Popover>

<Tooltip openDelay={300} placement="top">
  <TooltipTrigger as={Button}>Сохранить</TooltipTrigger>
  <TooltipPortal>
    <TooltipContent>
      <TooltipArrow />
      Ctrl+S
    </TooltipContent>
  </TooltipPortal>
</Tooltip>
```

- **Опции позиционировщика — на корне**, как и у `Select`: `placement`, `gutter`, `shift`,
  `flip`. Задержки подсказки (`openDelay`, `closeDelay`) — там же.
- **`Tooltip` не заменяет `Popover`.** В подсказке нет фокуса, и содержимое, до которого нужно
  дотянуться (ссылка, кнопка), окажется недостижимым. Интерактивное — это `Popover`.
- **`TooltipTrigger as={Button}` не добавляет узла**: поведение надевается на существующую
  кнопку, а не оборачивает её.
- **`PopoverAnchor` нужен**, только когда панель встаёт не у кнопки: строка таблицы, точка на
  карте. Без него зацепкой служит сам `PopoverTrigger`, и лишнего узла не появляется.

## Меню действий: `DropdownMenu`

Девятнадцать частей — самое разложенное семейство зоны, и сокращать нечего: меню это не список
строк, а набор РАЗНЫХ сущностей. У каждой своя роль, и одним правилом их не одеть.

```tsx
<DropdownMenu placement="bottom-end" gutter={4}>
  <DropdownMenuTrigger>
    Ещё <DropdownMenuIcon>▾</DropdownMenuIcon>
  </DropdownMenuTrigger>
  <DropdownMenuPortal>
    <DropdownMenuContent>
      <DropdownMenuGroup>
        <DropdownMenuGroupLabel>Правка</DropdownMenuGroupLabel>
        <DropdownMenuItem onSelect={rename}>
          <DropdownMenuItemLabel>Переименовать</DropdownMenuItemLabel>
          <DropdownMenuItemDescription>F2</DropdownMenuItemDescription>
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuSeparator />
      <DropdownMenuCheckboxItem checked={hidden()} onChange={setHidden}>
        Показывать скрытые
        <DropdownMenuItemIndicator>✓</DropdownMenuItemIndicator>
      </DropdownMenuCheckboxItem>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Ещё действия</DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>…</DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </DropdownMenuContent>
  </DropdownMenuPortal>
</DropdownMenu>
```

| роль в разметке | зацепка |
|---|---|
| обычный пункт (`role=menuitem`) | `dropdown-menu-item` |
| пункт-флажок (`role=menuitemcheckbox`) | `dropdown-menu-checkbox-item` |
| пункт-переключатель (`role=menuitemradio`) | `dropdown-menu-radio-item` |
| пункт, открывающий подменю | `dropdown-menu-sub-trigger` |

Четыре РАЗНЫЕ зацепки там, где на вид «просто строка меню», — это не дробление ради дробления:
у открывашки подменю есть стрелка вбок и состояние раскрытости, у флажка — отметка, у обычного
пункта нет ни того ни другого.

- **Действие приходит в `onSelect`, а не в `onClick`:** kobalte зовёт его и по клику, и по
  `Enter`/`Space`, и сам закрывает меню. Закрытие приходит СЛЕДУЮЩЕЙ задачей — обработчику
  потребителя дают отработать до того, как узлы уедут из документа.
- **`dropdown-menu-separator` — своя зацепка, а не общий `separator`.** Разделитель в меню и
  разделитель на странице оформляются по-разному; одно имя на двоих означало бы, что одно из
  оформлений придётся отменять переопределением.
- **Модальное меню приносит в панель сторожевые узлы фокуса** (`span[data-focus-trap]`). Они
  без зацепок и не наши — не удивляйся лишним детям у `dropdown-menu-content`.

### Что приезжает со стилем — и почему это не «одетый кит»

Всплывающие части несут инлайновый `style` от `@kobalte/core`. Это **механика, а не вид**, и
разбирать её приходится потому, что выглядит она как нарушение «ноль стилей»:

| узел | что на нём | зачем |
|---|---|---|
| позиционер (`data-popper-positioner`) | координаты | их каждый кадр пишет floating-ui |
| `*-content` | `position`, `pointer-events`, `--kb-*-transform-origin` | по переменной потребитель пишет анимацию появления |
| `*-arrow` | позиция, размер, `fill`, `stroke` | **`fill` и `stroke` СЧИТАНЫ с самой панели** |

Последняя строка — главная: цвет стрелке задаёт не кит, а оформление потребителя. Покрасил
панель — стрелка пошла следом. Это держится тестом (`test/popover.test.tsx`), а не абзацем.

Стрелка при этом **не 1-to-1**: внутри `<svg>` с контурами, иначе её не повернуть вслед за
фактическим положением панели. Отступление названо здесь, как того требует контракт зоны.

## Четыре меню, и почему их четыре

Части у них одинаковые — пункты, группы, подменю, разделители, — а различия в том, ЧЕМ
открывают и как ведут себя дальше. Одинаковые части при разном поведении оформляются
по-разному, поэтому у каждого меню свои имена зацепок.

| | открывается | особенность |
|---|---|---|
| `DropdownMenu` | нажатием на кнопку | кнопка уже стоит в разметке |
| `ContextMenu` | ПРАВЫМ кликом | зацепка — ОБЛАСТЬ (строка, ячейка), и она видна; позиция от указателя, поэтому `placement` и `gutter` не работают |
| `Menubar` | нажатием на заголовок в строке | открыто одно — наведение переключает соседнее без клика; лишняя часть `MenubarMenu` (узла не рендерит) |
| `NavigationMenu` | нажатием на раздел | панель ОДНА и переезжает в окно-приёмник `navigation-menu-viewport`; разметка списком: корень `<ul>`, пункт `<a>` |

Три независимых `DropdownMenu` в ряд не заменяют `Menubar`: они не переключаются наведением и
не ходят стрелками между заголовками. Это поведение, а не вид.

## Раскрывашки, предупреждение, страницы, мелочи навигации

**`Accordion` и `Collapsible` — два примитива, а не один с пропом.** У набора есть заголовок
`<h3>` вокруг кнопки (без него раскрывашка выпадает из оглавления страницы — скринридер строит
его по заголовкам), правило «сколько открыто разом» и навигация стрелками. У одиночной
раскрывашки ничего этого нет и быть не должно.

Закрытый раздел из документа **удаляется**, как и панель вкладок. Высоту kobalte отдаёт
переменной `--kb-accordion-content-height` — анимацию пишет оформление, кит её не привозит.

**`AlertDialog` — не `Dialog` с другим именем.** Роль `alertdialog` (техника объявляет такое
окно настойчивее) и клик мимо окна НЕ закрывает: решение нельзя отменить промахом. Оба
различия в поведении, а не в виде, поэтому пропами `Dialog` их не подменить.

Кнопку ПОДТВЕРЖДЕНИЯ кит не привозит — она делает работу потребителя и остаётся обычным
`Button` с его обработчиком.

**`Pagination` считает раскладку номеров сам** из правила (`count`, `siblingCount`,
`showFirst` / `showLast`), включая многоточия — они тоже узлы со своей зацепкой. Текущая
страница помечена `data-current`, крайние кнопки отключаются примитивом.

**У крошек список и пункт — тоже НАШИ части** (`breadcrumbs-list`, `breadcrumbs-item`): kobalte
рендерит только `<nav>`. Без них оформлению приходилось цепляться за прямого ребёнка корня и за
тег `li` — то есть за структуру, которую зона вправе поменять молча.

**А вот у страниц зацепки на список НЕТ и не будет:** `<ul>` рендерит корень kobalte, `<li>` —
сама часть, наружу они не выведены. Оформлению остаётся `[data-slot="pagination"] > ul`, и это
безопасно ровно потому, что структура **закреплена пробой** (`test/navigation.test.tsx`):
сменится она в `@kobalte/core` — покраснеет наш прогон, а не вёрстка у потребителя.

**Три мелочи существуют не ради вида, а ради состояния, которого нет у нативного элемента:**
у `<a>` не бывает `disabled` (`Link` снимает адрес и объявляет состояние, оставаясь `<a>`), у
`<img>` нет «ещё гружусь» (`Image` показывает `image-fallback`, пока браузер не загрузил
картинку), а хлебные крошки — объявленная навигация с текущей страницей (`current` снимает
адрес и ставит `aria-current`), а не список ссылок.

## Показ состояния: `Slider`, `Progress`, `Skeleton`, `Toast`

**`Slider` — дорожка, заливка и бегунок тремя частями.** Свести их в один узел нельзя: заливка
меняет длину, бегунок ездит, дорожка стоит. **Диапазон — это два `SliderThumb` внутри одного
корня**, поэтому фильтр «от и до» собирается без второго примитива. Внутри бегунка живёт
настоящий `input[type=range]` — он несёт фокус и клавиатуру.

Положение бегунка и длину заливки kobalte пишет инлайновым стилем: их знает только он.
`aria-valuemax` у бегунка — граница ВСЕГО ползунка, а не соседнего бегунка.

**`Progress` — это не `Spinner`.** Первый говорит «сделано столько-то», второй — «идёт
работа». Доля неизвестна — это `indeterminate`, а НЕ ноль процентов: разные утверждения, и
читаются они по-разному. Долю kobalte отдаёт переменной `--kb-progress-fill-width`, а не
шириной — оформление вправе выразить её чем угодно.

**`Skeleton` оборачивает содержимое, а не заменяет его размером из головы.** Мерцания по
умолчанию нет: анимация это вид, и пишет её оформление по `[data-slot="skeleton"][data-visible]`.

**`Toast` — единственный примитив зоны, который зовут кодом.** Две половины: `ToastRegion` +
`ToastList` ставятся один раз в скелете, а `toaster.show(…)` вызывается в момент события.
`toaster` отдан наружу как есть — своей обёртки нет, иначе появился бы второй источник правды
о том, что сейчас на экране.

`toast-progress-track` и `-fill` — это таймер ЖИЗНИ уведомления, а не полоса выполнения задачи.

## Два ряда кнопок, которые нельзя путать

| | `SegmentedControl` | `ToggleGroup` |
|---|---|---|
| что это | выбор одного из нескольких | набор нажатых кнопок |
| роль | `radiogroup` + настоящие `radio` | `group` + `button[aria-pressed]` |
| форма | значение уезжает | не уезжает |
| сколько активных | ровно одно | любое (`multiple`) |

Подменить одно другим — соврать вспомогательной технике: выбор и нажатие она читает
по-разному. То же различие, что между `Switch` и `Toggle`, только для ряда.

**`SegmentedControlTrack` — единственная часть семейства, которой у kobalte нет.** Полоску он
двигает трансформацией, считая `offsetLeft` выбранного варианта, а отсчёт идёт от ближайшего
позиционированного предка. Такой части kobalte не даёт — обёртку вокруг вариантов он оставляет
потребителю, и оформление, написанное сразу для всех, не может её ни назвать, ни позиционировать.
Корень на эту роль не годится: в него входит подпись группы, и полоска уезжает вниз ровно на её
высоту. Своего поведения и вида у дорожки нет — это точка опоры, и только.

## Поиск по списку и число: `Combobox`, `NumberField`

**`Combobox` — не «`Select` с полем ввода».** У списка кнопка, здесь настоящий `<input>`, в
который печатают. Отсюда части, которых у `Select` нет: `combobox-control` (рамка вокруг ввода
и кнопки — она обязана реагировать на фокус ВНУТРИ себя) и `combobox-hidden-select` (форма
отправляет выбранное значение, а не текст запроса).

**Фильтрация встроена, и это надо знать заранее.** `@kobalte/core` фильтрует сам —
`defaultFilter: "contains"` поверх `Intl.Collator` с `sensitivity: "base"`: без учёта регистра
и диакритики, по правилам локали, на кириллице тоже. Потребитель, который начнёт фильтровать
`options` сам по `onInputChange`, получит ДВОЙНУЮ фильтрацию. Нужен свой поиск — либо
`defaultFilter` своей функцией, либо считать `options` снаружи, зная про встроенный.

`combobox-hidden-select` — **названное отступление от 1-to-1**: зацепка стоит на `<select>`, но
kobalte заворачивает его в скрытую обёртку и кладёт рядом технический `<input>`. Оба узла —
обход особенностей Safari (автозаполнение не работает при `display: none`) и Firefox. Стиль
поэтому на обёртке, а не на зацепке; оформлению здесь делать нечего.

**`NumberField` существует, потому что `<input type="number">` не стилизуется.** Стрелки
браузера заменены обычными `<button>`, значение считает kobalte, формат разбирает
`Intl.NumberFormat` (`formatOptions`). Вводов два и оба настоящие: видимый показывает формат
(«1 234,50»), скрытый уносит в форму сырое `1234.5`.

Имена `number-field-increment` и `-decrement` — без слова `trigger`: действие уже названо, а
лишнее слово в зацепке ничего не различает (та же причина, что у `popover-close`).

**На границе `minValue` кнопка НЕ отключается**, и обработчик всё равно зовётся — значением
границы, а не запретным. Оформление, рисующее «упёрлись», должно смотреть на значение, а не на
`disabled`.

## Ввод цвета: `ColorField`, `ColorArea`, `ColorSlider`

Три примитива, а не один «пикер»: собранный пикер — это уже вид, а вид зона `ui` не привозит.
Что из чего собрать, решает оформление; шестая часть kobalte (`ColorSwatch`, `ColorWheel`,
`ColorChannelField`) сюда НЕ портирована — потребителя у неё сегодня нет, а поверхность растёт
по фактическому спросу, а не впрок.

```tsx
// Ввод строкой — этого одного хватает, чтобы задать акцент пресета.
<ColorField value={accent()} onChange={setAccent}>
  <ColorFieldLabel>Акцент</ColorFieldLabel>
  <ColorFieldInput />
</ColorField>

// Подбор мышью: квадрат «насыщенность × яркость» и ползунок тона рядом.
<ColorArea value={color()} onChange={setColor} xChannel="saturation" yChannel="brightness">
  <ColorAreaBackground>
    <ColorAreaThumb>
      <ColorAreaHiddenInputX />
      <ColorAreaHiddenInputY />
    </ColorAreaThumb>
  </ColorAreaBackground>
</ColorArea>

<ColorSlider channel="hue" value={color()} onChange={setColor}>
  <ColorSliderTrack>
    <ColorSliderThumb>
      <ColorSliderInput />
    </ColorSliderThumb>
  </ColorSliderTrack>
</ColorSlider>
```

### Значение: у поля строка, у двух остальных объект цвета

| | значение | чем собрать |
|---|---|---|
| `ColorField` | строка `#RRGGBB` | ничем — обычный сигнал потребителя |
| `ColorArea`, `ColorSlider` | объект `Color` | `parseColor("#2f6fed")` — **из этого же пакета** |

Разделение не наше, а `@kobalte/core`, и порт его не сглаживает: своя обёртка над цветовой
моделью стала бы вторым источником правды о том, что такое цвет.

А вот **средство собрать значение зона отдаёт сама** — `parseColor` и тип `Color` приезжают из
`@omnifield/probe-web-ui`, вторая зависимость потребителю не нужна:

```tsx
import { type Color, ColorSlider, parseColor } from "@omnifield/probe-web-ui";
```

Причина в том, что тип `Color` **уже стоит в наших публичных пропах** (`value`, `defaultValue`,
`onChange` у `ColorArea` и `ColorSlider`) — то есть он часть поверхности кита независимо от
реэкспорта, а собрать такое значение было нечем. Поверхность, которой нельзя пользоваться, не
поверхность; требовать объявить `@kobalte/core` ради одного примитива значило бы сделать кит
одним из ДВУХ мест, за которые держатся, а опираться на транзитивную установку нельзя — строгий
менеджер её не разрешит (`kb:PROBEWEB-17`). Решение и правило шире случая — `kb:PROBEWEB-4`,
поправка 2026-08-18.

**Цена названа прямо: мажор `@kobalte/core` по типу `Color` становится НАШИМ ломающим
изменением.** Это уже так — через пропсы примитивов; реэкспорт лишь делает связь видимой вместо
скрытой, а видимую связь можно посчитать при выпуске.

Наружу идут ровно два имени, а не вся библиотека цвета: `normalizeColor`, `getColorChannels` и
`normalizeHue` остаются у kobalte — потребителя у них сегодня нет.

Поле цвета всего этого не требует вовсе: `ColorField` работает со строкой от начала до конца, и
«свой бренд одним значением» вводится, не зная про цветовые модели.

### Мост «хекс → канал»: `#2f6fed` это RGB, и тона в нём НЕТ

Ловушка ровно на шве между полем и двумя остальными, поэтому названа отдельно:
`parseColor("#2f6fed")` даёт цвет **в RGB**, а `channel="hue"` живёт в HSL/HSB. Без перевода
`@kobalte/core` бросает `Unknown color channel: hue` — на РЕНДЕРЕ, а не при разборе строки.

Мостов два, и оба целиком внутри нашей поверхности:

```tsx
<ColorSlider channel="hue" colorSpace="hsl" value={parseColor("#2f6fed")} />   // перевести примитив
<ColorSlider channel="hue" value={parseColor("#2f6fed").toFormat("hsl")} />    // перевести значение
```

`toFormat` — метод типа `Color`, то есть тоже наша поверхность. Оба пути дают один и тот же тон,
и это проба (`test/colors.test.tsx`), а не обещание: расхождение означало бы, что потребителю
приходится выбирать правильный.

### Что `ColorField` делает за потребителя

Три вещи, которые иначе пришлось бы писать в каждом месте, где вводят цвет:

- **посторонние знаки не попадают в поле** — разрешён `#` и до шести цифр `0-9a-f`; «зелёный»
  просто не наберётся, а не подсветится ошибкой после;
- **на уходе фокуса значение приводится к `#RRGGBB`** — «f00» становится `#FF0000`. Буквы
  ПРОПИСНЫЕ (так пишет `@kobalte/core`): сравнивая значения строкой, регистр учитывать нельзя;
- **неразобранное откатывается к прежнему**, а не остаётся в поле мусором.

Формат ровно один — HEX. `rgb(…)` и `hsl(…)` в поле не набираются, и порт этого не расширяет.

### Названное отступление: цвет приезжает инлайновым стилем

На подложке области и на дорожке ползунка `@kobalte/core` пишет `background` из градиентов, на
бегунках — координаты и переменную `--kb-color-current`. Выглядит как нарушение «ноль стилей»,
но это **само значение примитива**: показать надо те цвета, между которыми выбирают, а знает их
только он — у ползунка тона это радуга, у ползунка насыщенности градиент зависит от текущего
тона. Отдать такое оформлению нечем.

Стиль потребителя при этом **сливается** с нашим, а не затирается: размер, скругление и рамка
пишутся как обычно. Держится это пробой (`test/color-area.test.tsx`,
`test/color-slider.test.tsx`), а не абзацем.

Красить бегунок оформление тоже может, не разбирая цветовые модели:
`[data-slot~="color-slider-thumb"] { background: var(--kb-color-current); }`.

### Три разницы с обычным `Slider`

- **Границы и шаг берутся из КАНАЛА**, а не из пропсов: у тона 0…360, у прозрачности 0…1.
  `minValue` / `maxValue` / `step` здесь не приняты — ошибись потребитель, ползунок молча врал
  бы на краях.
- **Заливки (`slider-fill`) нет и не будет**: «пройденной части» у цветового канала не бывает,
  дорожка значима на всём протяжении.
- **`aria-valuetext` несёт НАЗВАНИЕ цвета**, а не число: «240» само по себе не сообщает ничего.

Проп `channel` у `ColorSlider` **обязателен** — без него неизвестно, что ползунок меняет.
Несуществующая пара «пространство + канал» это ошибка на рендере, а не молчаливый ноль.

## Модальное окно и вкладки

`Dialog` — не «большой `Popover`», и разница не в размере:

| | `Popover` | `Dialog` |
|---|---|---|
| место | относительно зацепки, считает floating-ui | задаёт CSS потребителя |
| позиционер | есть (отступление от 1-to-1) | **нет** — 1-to-1 не нарушено |
| страница под ним | продолжает работать | заперта: фокус внутри, прокрутка остановлена |
| подложка | нет | `dialog-overlay`, отдельным узлом |

Подложка — часть, а не псевдоэлемент окна: у неё своё состояние появления, свой переход и свой
клик «мимо окна». Затемнения по умолчанию у неё нет — без правил CSS она невидима, и это
осознанно: кит остаётся безголовым и здесь.

Служебный стиль у окна и подложки ровно один — `pointer-events: auto`: страница под окном
объявлена недоступной для указателя, а они обязаны остаться нажимаемыми.

**`Tabs` — единственный составной этой волны, у которого зацепка есть и у КОРНЯ:** вкладки не
всплывают и никуда не переносятся, это кусок страницы.

- **Неактивная панель размонтирована, а не спрятана.** Для оформления это важно: её нельзя ни
  анимировать, ни измерить, потому что её нет. Нужно сохранить состояние внутри или сделать
  переход — `forceMount` на панели.
- **`tabs-indicator` несёт измеренные размеры активной вкладки** — их считает kobalte; цвет,
  толщину и скорость перехода пишет оформление. Полоска необязательна: активность видна по
  `[data-selected]` на самой вкладке.
- **`activationMode`** — не косметика: `automatic` переключает вкладку сразу при переходе
  стрелками, `manual` ждёт `Enter`. Для тяжёлого содержимого верно второе.

## Флажок, переключатель, группа: почему частей много

`Checkbox`, `Switch` и `RadioGroup` разложены на части ровно как `Select` и семейство поля.
Причина одна и практическая: **флажок нельзя одеть, не разобрав**. Нативный
`<input type="checkbox">` не стилизуется, поэтому рынок везде делает одно и то же — настоящий
ввод прячут (он несёт фокус, форму и доступность), а рисуют СОСЕДНИЙ узел.

```tsx
<Checkbox checked={agreed()} onChange={setAgreed}>
  <CheckboxInput />
  <CheckboxControl>
    <CheckboxIndicator>✓</CheckboxIndicator>
  </CheckboxControl>
  <CheckboxLabel>Согласен</CheckboxLabel>
</Checkbox>

<Switch checked={dark()} onChange={setDark}>
  <SwitchInput />
  <SwitchControl>
    <SwitchThumb />
  </SwitchControl>
  <SwitchLabel>Тёмная тема</SwitchLabel>
</Switch>

<RadioGroup value={size()} onChange={setSize}>
  <RadioGroupLabel>Размер</RadioGroupLabel>
  <For each={["S", "M", "L"]}>
    {(value) => (
      <RadioGroupItem value={value}>
        <RadioGroupItemInput />
        <RadioGroupItemControl>
          <RadioGroupItemIndicator />
        </RadioGroupItemControl>
        <RadioGroupItemLabel>{value}</RadioGroupItemLabel>
      </RadioGroupItem>
    )}
  </For>
</RadioGroup>
```

Части обёрнуты **все**: полусоставной примитив одеть нельзя — у него оказалась бы одета рамка
и гола отметка. Как и у поля, части читают контекст корня и вне него бросают ошибку.

Три разницы, которые стоит знать заранее:

- **`Switch` — это поле, `Toggle` — кнопка.** У переключателя есть `name`, значение и
  состояние ошибки, он уезжает в форму; `Toggle` (`button[aria-pressed]`) — действие. Выглядят
  похоже, но подменять одно другим значит платить доступностью.
- **Отметка появляется, бегунок ездит.** `CheckboxIndicator` и `RadioGroupItemIndicator`
  рендерятся ТОЛЬКО в выбранном состоянии (нужен узел всегда — `forceMount` насквозь), а
  `SwitchThumb` есть всегда: ему нужен переход между положениями.
- **`RadioGroupLabel` — это `span`, а не `label`.** Подпись группы относится ко всем вариантам
  сразу и уезжает в `aria-labelledby`; `for` связал бы её с одним.

### Названное отступление: спрятанный ввод несёт стиль

Единственное место, где на узел приезжает `style` не от потребителя, — `checkbox-input`,
`switch-input` и `radio-group-item-input`. Стиль ставит сам `@kobalte/core`
(`visuallyHiddenStyles`), и это **не оформление, а механика доступности**: настоящий ввод
обязан остаться в документе ради фокуса, формы и скринридера, но не должен быть виден.

Отдавать это правило потребителю нельзя: не написав его, он получил бы двойной флажок — свой
нарисованный и родной браузерный. Стиль потребителя при этом не затирается, а сливается с
нашим, и это держится тестом, а не обещанием (`test/checkbox.test.tsx`).

## Что НЕ делает пакет — и почему

Каждый пункт — снятая механика оракула `capsuleTech`, а не пробел.

- **Не привозит стили.** В оракуле `Spinner` вёз `animate-spin rounded-full border-2 …`,
  `Button` — шесть вариантов Tailwind-классов. Такой пакет требует Tailwind и конкретную тему,
  то есть стилизуемым не является. Здесь оформление пишет потребитель.
- **Не перехватывает пропсы.** В оракуле кит ходил через `UiProxy`, перехватывавший пропсы у
  всех компонентов сразу: отсюда шесть хардкоженных событий, невозможность типизировать и
  расширение только правкой ядра. Здесь пропсы идут насквозь.
- **Нет пропа `loading` у кнопки.** `<Button disabled aria-busy="true"><Spinner /></Button>`
  собирается из готового; проп заморозил бы в поверхности решение прятать содержимое.
- **Нет `data-filled` у ввода.** В оракуле примитив держал свой сигнал и подменял
  пользовательский `onInput`, чтобы его обновлять, — обработчик потребителя переставал быть
  первым. Пустоту поля видно и без нас: `:placeholder-shown`.
- **Нет пропа `decorative` у разделителя.** Роль ставится насквозь: `<Separator role="none" />`.
- **Нет иконок.** `SelectIcon` и `SelectItemIndicator` — пустые места под то, что положит
  потребитель. Зависимость на набор иконок сделала бы наш выбор обязательным для всех.
- **Нет сторибука и живого показа.** Витрина — не зона `ui`. А вот паспорт компонента зона
  отдаёт данными и намеренно (`tasker:PWEB-2`): это не показ, а объявление частей, состояний и
  намерений, без которого скин не может работать в рамках контракта компонента.

## Трейсы

Инструментовка выключена по умолчанию и наружу не экспортируется. Включается глобальным
флагом — тогда каждый примитив пишет парные строки жизни узла:

```ts
globalThis.__PROBE_WEB_UI_TRACE__ = true;
// [probe-web-ui] ui.button mount — cl-3
// [probe-web-ui] ui.button dispose — cl-3, жил 41.20ms
```

Общий идентификатор пары показывает, какой именно экземпляр не умер или инстанцировался
дважды. Пока флаг не выставлен — мгновенный возврат до единой аллокации.

## Поставка

```json
"exports": { ".": {
  "solid":   "./dist/index.jsx",
  "types":   "./dist/index.d.ts",
  "default": "./dist/index.js"
} }
```

Зона `ui` — единственная в продукте, которая отдаёт JSX, и потому единственная с условием
`solid`. Потребитель на Solid обязан применить СВОЮ трансформацию: она компиляторная, и уже
разобранный код под цель (браузер, SSR, гидратация) не подстроить. Ветка `default` нужна
тем, кто про условие не знает.

Форма взята с рынка, а не придумана: ровно такие три ветки в том же порядке отдают
`@kobalte/core@0.13.12` и `@corvu/resizable@0.2.5` (сверено 2026-08-08). Условие
`development` не заводим сознательно — его сочетание с `solid` названо миной в
`tsup-preset-solid`.

`solid-js` и `@kobalte/core` стоят в `peerDependencies`: две копии Solid в дереве ломают
реактивность, две копии kobalte рассыпают связку `Field` с его частями. Обычных зависимостей
у пакета нет.

**Одно следствие для выпусков:** зона реэкспортирует `parseColor` и тип `Color`, поэтому мажор
`@kobalte/core` по этому типу — наше ломающее изменение. Связь существует и без реэкспорта (тип
стоит в пропсах цветовых примитивов), но теперь она видна и её можно посчитать. Разбор —
в разделе про ввод цвета.

## Сборка и проверки

```bash
pnpm build      # обе ветки JS (esbuild) + декларации (tsc)
pnpm typecheck  # tsc --noEmit по src, test и оснастке
pnpm lint       # пресет @omnifield/probe-web-lint — канон Solid машиной
pnpm test       # сборка, затем оба прогона vitest: dom и surface
```

Прогонов два, потому что тесты живут в разных мирах: `dom` рендерит примитивы в JSDOM,
`surface` поднимает настоящий `pnpm pack` и читает тарбол. **Тест каждого примитива — render
в документ**, а не сверка структуры модуля: в оракуле недоведённая миграция
structural→render была главным гэпом кита, и полгода отчёт утверждал несуществующий блокер.
