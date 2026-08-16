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
| **есть `style`** | всплывающие панели и стрелки | позиционирование, переменная начала трансформации, цвет стрелки — **зеркало панели потребителя** |

Разбор каждого — в разделах ниже и в доке соответствующего компонента.

## Что наружу

Вход один — `@omnifield/probe-web-ui`. Подпутей нет: пакет ESM с `sideEffects: false`, и
неиспользованный примитив выбрасывается сборщиком потребителя без сегментации.

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
| `Checkbox*` | составной, 7 частей | `Checkbox.*` |
| `Switch*` | составной, 7 частей | `Switch.*` |
| `RadioGroup*` | составной, 10 частей | `RadioGroup.*` |

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
| составной `Checkbox` | `checkbox`, `checkbox-input`, `checkbox-control`, `checkbox-indicator`, `checkbox-label`, `checkbox-description`, `checkbox-error` |
| составной `Switch` | `switch`, `switch-input`, `switch-control`, `switch-thumb`, `switch-label`, `switch-description`, `switch-error` |
| составной `RadioGroup` | `radio-group`, `radio-group-label`, `radio-group-description`, `radio-group-error`, `radio-group-item`, `radio-group-item-input`, `radio-group-item-control`, `radio-group-item-indicator`, `radio-group-item-label`, `radio-group-item-description` |

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
- **Нет сторибука, манифестов и контрактов компонентов.** Живой показ — не зона `ui`.

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
