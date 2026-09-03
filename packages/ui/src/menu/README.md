# 📋 Menu

🏷️ overlays · 🧬 component · 📐 compact · 📦 `@omnifield/probe-web-ui`

## 🧭 Навигация

- 🧩 [Анатомия](#анатомия)
- 🎛️ [Состояния](#состояния)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- 🚀 [Использование](#использование)

<h2 id="анатомия">🧩 Анатомия</h2>

```
(trigger 🔘 / contextTrigger)
positioner
└─ content 📋
   ├─ arrow ▲
   │  └─ arrowTip
   ├─ itemGroup 📁
   │  ├─ itemGroupLabel 🏷️
   │  └─ item[]
   │     ├─ itemIndicator ✓
   │     └─ itemText
   ├─ item[] (напрямую, без группы)
   └─ separator ─
```

| часть              | значение                                                                | принимает внутри                        | рисуется                    |
| ------------------- | ---------------------------------------------------------------------- | -------------------------------------------- | -------------------------------- |
| 🔘 `trigger`       | открывает меню                                                         | текст, иконка                                 | `MenuTrigger`            |
| `triggerItem`      | собственный триггер подменю, отрисованный как пункт родительского меню | текст, иконка                                 | `MenuTriggerItem`        |
| `contextTrigger`   | оборачивает элемент так, что правый клик открывает меню у указателя     | текст, любой компонент                        | `MenuContextTrigger`     |
| `positioner`       | позиционирует `content` относительно триггера — чистая обёртка          | `content`                                     | `MenuPositioner`         |
| 📋 `content`       | плавающая панель — держит настоящий фокус клавиатуры разом за все пункты | `arrow`, `item`, `itemGroup`, `separator`   | `MenuContent`            |
| ▲ `arrow`          | оборачивает `arrowTip` — кит сам ставит позицию                        | `arrowTip`                                    | `MenuArrow`              |
| `arrowTip`         | видимый треугольник внутри `arrow`                                     | —                                              | `MenuArrowTip`           |
| `indicator`        | небольшая метка на `trigger` о том, открыто ли меню                     | —                                              | `MenuIndicator`          |
| ─ `separator`      | визуальный/смысловой разделитель между группами пунктов                 | —                                              | `MenuSeparator`          |
| 📁 `itemGroup`     | оборачивает подписанную группу пунктов                                  | `itemGroupLabel`, `item`                       | `MenuItemGroup`          |
| 🏷️ `itemGroupLabel`| собственный заголовок группы                                            | текст                                          | `MenuItemGroupLabel`     |
| `item`             | одно действие — обычное, либо в форме чекбокса/радио                     | `itemIndicator`, `itemText`, текст, иконка       | `MenuItem`               |
| ✓ `itemIndicator`  | слот галочки/точки внутри чекбоксного/радио-пункта                       | иконка                                         | `MenuItemIndicator`      |
| `itemText`         | собственная подпись пункта                                              | текст                                          | `MenuItemText`           |

> [!NOTE]
> Корня как узла нет вовсе — `Menu` не рендерит DOM (та же ситуация, что у `Dialog`/`Popover`/
> `Drawer`), `trigger`/`contextTrigger` — настоящие DOM-соседи `positioner`, а не его предки или
> потомки. Паспорт называет корнем именно `positioner` — заместитель, не недосмотр.

> [!NOTE]
> `MenuCheckboxItem`/`MenuRadioItem`/`MenuRadioItemGroup` — три отдельных настоящих компонента (со
> своими `checked`/`value`/`onCheckedChange`), но НОВЫХ частей анатомии они не заводят: рисуются
> адресами `item`/`itemGroup`, различаются меткой `data-type` (`"checkbox"`/`"radio"`), не
> собственной частью. Карта кита их поэтому не содержит отдельными записями — `item`/`itemGroup`
> уже названы один раз, вторая запись под ту же координату не сказала бы ничего нового.

> [!NOTE]
> `item` несёт ТРИ формы одним адресом — обычную, чекбоксную и радио. Обычный `MenuItem` кладёт
> только `disabled`/`highlighted`. `MenuCheckboxItem`/`MenuRadioItem` сначала спредят те же самые
> два атрибута, потом добавляют поверх `data-type` и `data-state` — реальные метки, но присутствуют
> ТОЛЬКО у опционных пунктов, та же форма «иногда отсутствует, не всегда `false`», что уже несут
> собственные view-специфичные метки датапикера. `itemIndicator`/`itemText` отражают те же самые
> `checked`/`unchecked`/`disabled`/`highlighted`, но `data-type` не несут вовсе — эта метка
> появляется только на `item`.

<h2 id="состояния">🎛️ Состояния</h2>

|      | часть                                            | состояние       | метка                       | значение                                                    |
| ---- | -------------------------------------------------- | ---------------- | ------------------------------ | ----------------------------------------------------------------- |
| 👁️   | content, indicator, trigger, triggerItem, contextTrigger | open       | `[data-state="open"]`          | меню показано                                                    |
| 🙈   | content, indicator, trigger, triggerItem, contextTrigger | closed     | `[data-state="closed"]`        | меню скрыто                                                      |
| 📍   | trigger, contextTrigger                             | current         | `[data-current]`               | это тот триггер, что открыл меню (только меню с несколькими триггерами) |
| 🖱️   | trigger                                            | hover           | `:hover`                        | указатель наведён на кнопку                                       |
| ⌨️   | trigger                                            | focus-visible   | `:focus-visible`                | фокус пришёл с клавиатуры                                         |
| 👆   | trigger                                            | active          | `:active`                       | кнопка нажата и удерживается                                      |
| 🚫   | triggerItem, item, itemIndicator, itemText          | disabled        | `[data-disabled]`               | пункт (и подменю, которое он открывает) нельзя выбрать             |
| 🎯   | triggerItem, item, itemIndicator, itemText          | highlighted     | `[data-highlighted]`            | текущая цель клавиатуры/указателя — виртуальный факт               |
| ✅   | item, itemIndicator, itemText                       | checked         | `[data-state="checked"]`        | чекбоксный/радио-пункт отмечен                                     |
| ⬜   | item, itemIndicator, itemText                       | unchecked       | `[data-state="unchecked"]`      | чекбоксный/радио-пункт не отмечен                                  |
| 🔘   | item                                                | radio           | `[data-type="radio"]`           | это радио-пункт — один из взаимоисключающего набора                |
| ☑️   | item                                                | checkbox        | `[data-type="checkbox"]`        | это чекбоксный пункт — переключается независимо                    |

`arrow`/`arrowTip`/`positioner`/`separator`/`itemGroup`/`itemGroupLabel` состояний не несут вовсе.

> [!NOTE]
> Пункты никогда не фокусируемы по отдельности — определяющий факт, а не недосмотр. Коннектор
> ставит `tabIndex: 0` и `aria-activedescendant` на сам `content`, ни один `item`/`itemIndicator`/
> `itemText`/`triggerItem` собственного `tabIndex` не получает нигде. «Текущий пункт» — виртуальный
> факт (`data-highlighted`), не настоящий DOM-фокус. Поэтому ни `:focus-visible`, ни `:hover` не
> объявлены ни на одной части семейства пункта: `onPointerMove`/`onPointerLeave` на `item` сами
> вычисляют `data-highlighted` (тот же приём слежки через JS вместо нативного псевдокласса, что уже
> стоит на корне/контроле/индикаторе чекбокса) — нативный `:hover` был бы либо избыточен с
> `data-highlighted`, либо прямо неверен (подсветку можно поставить и клавиатурой, без указателя
> над пунктом вовсе). `:active`/`data-active` тоже нет — коннектор нигде не отслеживает нажатое
> состояние ни для одной части, проверено как отсутствие, не как упущение.

> [!NOTE]
> `triggerItem` — собственный триггер ПОДМЕНЮ, несущий факты сразу ДВУХ меню. Он сливает
> `disabled`/`highlighted` РОДИТЕЛЬСКОГО меню (этот узел — один из пунктов родителя) с
> `open`/`closed` ДОЧЕРНЕГО подменю (это тот триггер, что его открывает). Рисуется как обычный
> `<div>`, не настоящей `<button>` — но раз пункты в принципе не фокусируемы по отдельности, это не
> стоит ему ни одного псевдокласса: они не были бы объявлены и на кнопочной версии.

<h2 id="io">🔌 IO</h2>

У меню нет входа/выхода — состав пунктов и текст на них структурные, не данные: меню собирается
руками (JSX-композицией или сборкой), а не заполняется по JSON-схеме, та же категория, что у
диалога/поповера.

<h2 id="сборки">🏗️ Сборки</h2>

<h3 id="сборка-basic">🧱 basic</h3>

Плавающее меню само по себе: подписанная группа, разделитель, отмеченный пункт.

```
positioner
  content 📋
    arrow ▲
      arrowTip
    itemGroup 📁
      itemGroupLabel 🏷️ · text: "Файл"
      item · value: "rename" · text: "Переименовать"
      item · value: "delete" · text: "Удалить"
    separator ─
    item · value: "notify"
      itemIndicator ✓ · icon: "✓"
      itemText · text: "Уведомления"
```

Дерево может отрисовать только обычный `MenuItem` (`components/index.ts`'s карта держит один
компонент на адрес; `MenuCheckboxItem`/`MenuRadioItem` делят координату `item`, но по имени
недоступны из сборки отдельно) — последний пункт кладёт `itemIndicator`+`itemText` только ради
структуры/CSS, настоящих меток `checked`/`data-type`, которые нёс бы подлинный `MenuCheckboxItem`,
он не несёт — та же граница «демо доказывает структуру, не каждую рантайм-метку», что уже принята
для непроверенного `outside-range` карусели.

`providerProps: { defaultOpen: true }` — монтирование `positioner` нуждается в невидимом контексте
`Menu` вокруг себя (провайдер кита, `components/index.ts`); `defaultOpen` делает плавающую половину
видимой без настоящего клика по `trigger`, которого эта сборка не содержит вовсе.

<h2 id="рецепт">🎨 Рецепт</h2>

Доказательный рецепт (`playground/recipe.ts`) — доказывает, что паспорт МОЖНО одеть целиком
настоящей скин-механикой (`skinGaps` пуст, CSS реально генерируется). В продакшене не участвует.

> [!NOTE]
> `highlighted` несёт тот вид, который в другом месте нёс бы hover/focus-visible — пункты не
> фокусируемы по отдельности, `data-highlighted` единственный виртуальный факт «текущий пункт», и
> отдельных правил hover/focus-visible ни на одной части семейства пункта нет.

`positioner`'s четыре переменные (`--reference-width`/`-height`, `--available-width`/`-height`) —
тот же механизм попапа, что у поповера/селекта/датапикера (`@zag-js/popper`, тот же
`getPlacementStyles`).

<h2 id="использование">🚀 Использование</h2>

**Ручная сборка** — компонент собирается вручную, JSX-композицией, без схемы и движка.

```tsx
<Menu>
  <MenuTrigger>
    Файл
    <MenuIndicator>▾</MenuIndicator>
  </MenuTrigger>
  <MenuPositioner>
    <MenuContent>
      <MenuArrow>
        <MenuArrowTip />
      </MenuArrow>
      <MenuItemGroup>
        <MenuItemGroupLabel>Действия</MenuItemGroupLabel>
        <MenuItem value="rename">Переименовать</MenuItem>
      </MenuItemGroup>
      <MenuSeparator />
      <MenuItem value="notify">
        <MenuItemIndicator>✓</MenuItemIndicator>
        <MenuItemText>Уведомления</MenuItemText>
      </MenuItem>
    </MenuContent>
  </MenuPositioner>
</Menu>
```

**Рендер через движок** — та же композиция, но по схеме (сборка `basic`), которую рисует
`RenderTree`.

```tsx
const tree = instanceOf("menu", { defaultOpen: true }, "basic", {});

<RenderTree tree={tree} registry={registry} data={{}} />;
```

**Чекбоксные пункты.**

```tsx
import { createSignal } from "solid-js";
import { MenuCheckboxItem } from "@omnifield/probe-web-ui";

const [showToolbar, setShowToolbar] = createSignal(true);

<Menu>
  <MenuTrigger>Вид</MenuTrigger>
  <MenuPositioner>
    <MenuContent>
      <MenuCheckboxItem value="toolbar" checked={showToolbar()} onCheckedChange={setShowToolbar}>
        <MenuItemIndicator>✓</MenuItemIndicator>
        <MenuItemText>Показывать панель инструментов</MenuItemText>
      </MenuCheckboxItem>
    </MenuContent>
  </MenuPositioner>
</Menu>
```

**Радио-пункты.**

```tsx
import { createSignal } from "solid-js";
import { MenuRadioItemGroup, MenuRadioItem } from "@omnifield/probe-web-ui";

const [sortBy, setSortBy] = createSignal("date");

<Menu>
  <MenuTrigger>Сортировка</MenuTrigger>
  <MenuPositioner>
    <MenuContent>
      <MenuRadioItemGroup value={sortBy()} onValueChange={(details) => setSortBy(details.value)}>
        <MenuItemGroupLabel>Сортировать по</MenuItemGroupLabel>
        <MenuRadioItem value="name">
          <MenuItemIndicator>✓</MenuItemIndicator>
          <MenuItemText>Имени</MenuItemText>
        </MenuRadioItem>
        <MenuRadioItem value="date">
          <MenuItemIndicator>✓</MenuItemIndicator>
          <MenuItemText>Дате изменения</MenuItemText>
        </MenuRadioItem>
      </MenuRadioItemGroup>
    </MenuContent>
  </MenuPositioner>
</Menu>
```

**Контекстное меню.**

```tsx
import { MenuContextTrigger } from "@omnifield/probe-web-ui";

<Menu>
  <MenuContextTrigger>Кликните правой кнопкой здесь</MenuContextTrigger>
  <MenuPositioner>
    <MenuContent>
      <MenuItem value="cut">Вырезать</MenuItem>
      <MenuItem value="copy">Копировать</MenuItem>
      <MenuItem value="paste">Вставить</MenuItem>
    </MenuContent>
  </MenuPositioner>
</Menu>
```

**Подменю.** Вложенный `Menu` открывается `MenuTriggerItem` вместо `MenuTrigger`; `content`
получает `data-nested`/`data-has-nested`, когда меню стоят стопкой.

```tsx
import { MenuTriggerItem } from "@omnifield/probe-web-ui";

<Menu>
  <MenuTrigger>Файл</MenuTrigger>
  <MenuPositioner>
    <MenuContent>
      <MenuItem value="new">Новый файл</MenuItem>
      <Menu>
        <MenuTriggerItem>Поделиться</MenuTriggerItem>
        <MenuPositioner>
          <MenuContent>
            <MenuItem value="email">По почте</MenuItem>
            <MenuItem value="message">Сообщением</MenuItem>
          </MenuContent>
        </MenuPositioner>
      </Menu>
    </MenuContent>
  </MenuPositioner>
</Menu>
```

**Один пункт — три способа открыть.** `trigger` (клик), `contextTrigger` (оборачивает элемент так,
что правый клик — или ~700 мс долгое нажатие на тач/пере — открывает меню у указателя), либо
собственный `triggerItem` подменю. `typeahead` включён по умолчанию — прыгает к пункту по вводу
текста; `valueText` на пункте переопределяет, что сверяет typeahead, когда отрисованный текст не
годится в качестве цели сравнения. Несколько триггеров на одно меню — `value` триггера называет,
какой именно открыл общее меню, и только он несёт `data-current`; меню перепозиционируется к тому
триггеру, что был активирован.

> [!WARNING]
> Свой `id` на `item` ломает внутренний поиск — Ark сам генерирует id пунктов для собственной
> книги учёта `getElementById`; проп `id`, переданный вручную, перебивает это и ломает механизм —
> не ставить.

> [!WARNING]
> Ссылки рендерятся через `asChild` на самом пункте, а не вложенным `<a>` внутри него — иначе
> ссылка не получит собственных ARIA-атрибутов и клавиатурной обработки пункта.

Кит нигде не использует `Portal` — в отличие от собственных примеров Ark, который портирует каждый
`Positioner`, ни один компонент этого кита `Portal` не реэкспортирует и не требует.

## Доступность

Меню следует паттерну WAI-ARIA [Menu/Menu bar](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/).

| Клавиша | Действие |
|---|---|
| `Space` / `Enter` | Активирует/выбирает подсвеченный пункт |
| `ArrowDown` / `ArrowUp` | Подсвечивает следующий / предыдущий пункт |
| `ArrowRight` / `ArrowLeft` | На триггере — открывает или закрывает подменю (направление зависит от направления письма) |
| `Esc` | Закрывает меню и переносит фокус на триггер |
