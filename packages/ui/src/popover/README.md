# 💬 Popover

<h2 id="главное">🏠 Главное</h2>

🏷️ overlays · 🧬 component · 📐 compact · 📦 `@web-core/ui`

Плавающая панель у элемента 💬 — используйте, чтобы показать подробности, форму или меню рядом с
кнопкой или полем, не уводя пользователя со страницы и не перекрывая её целиком, как модальное
окно. По умолчанию немодальный — страница вокруг остаётся живой, клик снаружи или `Escape` просто
закрывают панель; строгий, блокирующий вариант включается одним пропом, когда это действительно
нужно.

<h2 id="анатомия">🧩 Анатомия</h2>

Панель держится на контексте, не на одном корневом узле — оттого у неё нет части `root`: `control`
и `anchor` живут рядом в разметке, как равноправные соседи, а не предки `positioner`. 🧩

```
(control 🔘 / anchor ⚓)
positioner 🎯
├─ arrow ▲
│  └─ arrowTip
└─ content 💬
   ├─ title 🏷️
   ├─ description 📝
   └─ closeTrigger ✕
```

`control`/`anchor` — реальные соседи `positioner` в разметке, не его предки и не потомки.

| часть                  | значение                                                                  | принимает внутри                               | рисуется                    |
| ----------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------- | -------------------------------- |
| 🔘 `control`           | открывает и закрывает поповер                                                | текст, иконку, `controlIndicator`                     | `PopoverControl`           |
| 🔽 `controlIndicator`  | метка на контроле о том, открыт ли поповер — иконку кладёт потребитель        | текст, иконку, любой компонент                        | `PopoverControlIndicator`  |
| ⚓ `anchor`             | необязательная точка отсчёта — поповер позиционируется по ней вместо контрола | любой компонент                                       | `PopoverAnchor`            |
| 🎯 `positioner`        | позиционирует содержимое относительно контрола (или якоря) — чистая обёртка   | `arrow`, `content`                                    | `PopoverPositioner`        |
| ▲ `arrow`              | оборачивает `arrowTip` — кит сам ставит позицию                              | `arrowTip`                                            | `PopoverArrow`             |
| `arrowTip`             | видимый треугольник внутри `arrow`                                           | —                                                      | `PopoverArrowTip`          |
| 💬 `content`           | собственная плавающая панель поповера                                        | `title`, `description`, `closeTrigger`, любой компонент | `PopoverContent`         |
| 🏷️ `title`             | заголовок поповера                                                          | текст                                                  | `PopoverTitle`             |
| 📝 `description`       | описание поповера                                                           | текст                                                  | `PopoverDescription`       |
| ✕ `closeTrigger`       | закрывает поповер                                                           | текст, иконку                                          | `PopoverCloseTrigger`      |

> [!NOTE]
> Частей десять, но нет части `root` — сам `Popover` рисует не DOM-узел, а чистый контекст. Паспорт
> называет своим номинальным корнем `positioner` — часть, которая реально держит то, чем поповер
> визуально является (`arrow` и `content` со всем содержимым внутри). У `positioner` в `accepts`
> нет `control`/`anchor` — они настоящие соседи по разметке, а не потомки; собрать их в одно дерево
> схема не может. Подробнее — `FAQ.md`.

> [!NOTE]
> `control`/`controlIndicator` — та же общая форма «кликабельная штука с индикатором», что и у
> `accordion`/`tree-view` (`shared/data/anatomy.ts`'s `parts.controlSet`): родные заговские имена
> (`trigger`/`indicator`) срезаны и заведены заново под общий кит-овый адрес, обёртки по-прежнему
> рисуют настоящий `PopoverTrigger`/`PopoverIndicator` изнутри — переименован только адрес
> (`data-part`), не поведение.

<h2 id="использование">🚀 Использование</h2>

От ручной композиции до отдельной точки отсчёта, модального режима и общей панели на несколько
контролов — каждый сценарий подключается отдельно. 🔀

**Ручная сборка** — компонент собирается вручную, JSX-композицией, без схемы и движка.

```tsx
<Popover>
  <PopoverControl>
    Click Me
    <PopoverControlIndicator>▾</PopoverControlIndicator>
  </PopoverControl>
  <PopoverPositioner>
    <PopoverArrow>
      <PopoverArrowTip />
    </PopoverArrow>
    <PopoverContent>
      <PopoverTitle>Favorite Frameworks</PopoverTitle>
      <PopoverDescription>Manage and organize your favorite web frameworks.</PopoverDescription>
      <PopoverCloseTrigger>✕</PopoverCloseTrigger>
    </PopoverContent>
  </PopoverPositioner>
</Popover>
```

**Рендер через движок** — та же композиция плавающей половины, но по схеме (сборка `basic`),
которую рисует `RenderTree`. Реестр должен знать про `provider: Popover` для этого компонента —
без контекста вокруг `positioner` он падает при попытке его прочитать.

```tsx
const data = { title: "Favorite Frameworks", description: "Manage and organize your favorite web frameworks." };
const tree = instanceOf("popover", {}, "basic", data);

<RenderTree tree={tree} registry={registry} data={data} />;
```

**Точка отсчёта отдельно от контрола.** `anchor` позиционирует панель относительно другого
элемента, а не самого контрола.

```tsx
import { PopoverAnchor } from "@web-core/ui";

<Popover>
  <div>
    <PopoverControl>Click Me</PopoverControl>
    <PopoverAnchor>
      <input placeholder="Type here..." />
    </PopoverAnchor>
  </div>
  <PopoverPositioner>
    <PopoverContent>
      <PopoverTitle>Title</PopoverTitle>
      <PopoverDescription>Positioned against the input, not the control.</PopoverDescription>
    </PopoverContent>
  </PopoverPositioner>
</Popover>
```

**Модальный поповер.** `modal` (по умолчанию `false`) включает захват фокуса, блокировку скролла,
отключение взаимодействия со страницей вокруг и скрытие остального контента от скринридера — та же
семантика, что у диалога.

```tsx
<Popover modal>
  <PopoverControl>Click Me</PopoverControl>
  <PopoverPositioner>
    <PopoverContent>
      <PopoverCloseTrigger>✕</PopoverCloseTrigger>
      <PopoverTitle>Confirm Action</PopoverTitle>
      <PopoverDescription>Focus is trapped inside until dismissed.</PopoverDescription>
    </PopoverContent>
  </PopoverPositioner>
</Popover>
```

**Общий поповер на несколько контролов.** `value` у контрола различает, какой из них открыл общий
поповер — тот же приём, что у `drawer`.

```tsx
<Popover onTriggerValueChange={(details) => setActiveItemId(details.value)}>
  <For each={items}>{(item) => <PopoverControl value={item.id}>{item.label}</PopoverControl>}</For>
  <PopoverPositioner>
    <PopoverContent>
      <PopoverTitle>{activeItem()?.label}</PopoverTitle>
      <PopoverDescription>{activeItem()?.detail}</PopoverDescription>
    </PopoverContent>
  </PopoverPositioner>
</Popover>
```

**Ограничение размера панели вьюпортом.** `--available-height`/`--available-width` у `positioner`
— измеренное место до края вьюпорта, читается напрямую в CSS.

```tsx
<PopoverContent style={{ "max-height": "calc(var(--available-height) - 100px)" }}>
  {/* длинный контент */}
</PopoverContent>
```

Кит нигде не рендерит настоящий `Portal` — в отличие от собственных примеров компонента-
первоисточника, ни один компонент этого кита `Portal` не реэкспортирует и не требует (почему это
не противоречит `portalled: true` по умолчанию — `FAQ.md`).

<h2 id="состояния">🎛️ Состояния</h2>

Открыт/закрыт — про поповер целиком, отражается сразу на нескольких частях снаружи `content`.
`current` знает только контрол — какой из нескольких открыл общую панель. 🎯

|      | состояние      | метка              | где                              | значение                                                       |
| ---- | --------------- | -------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| 🔓🔒 | open / closed   | `[data-state]`        | control, controlIndicator, content  | поповер открыт / закрыт                                            |
| 🎯   | current         | `[data-current]`      | control                             | это тот контрол, что открыл поповер (только с несколькими триггерами) |
| 🖱️   | hover           | `:hover`              | control, closeTrigger               | указатель наведён                                                   |
| ⌨️   | focus-visible   | `:focus-visible`      | control, closeTrigger               | фокус пришёл с клавиатуры                                           |
| 👆   | active          | `:active`             | control, closeTrigger               | нажат указателем                                                     |

`positioner`/`anchor`/`arrow`/`arrowTip`/`title`/`description` своих состояний не несут — точка
отсчёта, чистая раскладка и текст.

`positioner` несёт четыре измеренные переменные — размер контрола (или якоря), относительно
которого позиционируется панель, и место, оставшееся до края вьюпорта:

| переменная             | значение                                                             |
| ------------------------ | --------------------------------------------------------------------- |
| `--reference-width`     | измеренная ширина контрола (или якоря), относительно которого позиционируется поповер |
| `--reference-height`    | измеренная высота контрола (или якоря), относительно которого позиционируется поповер |
| `--available-width`     | место, оставшееся до края области просмотра                          |
| `--available-height`    | место, оставшееся до края области просмотра                          |

<h2 id="io">🔌 IO</h2>

Собранной по схеме панели нужны только заголовок и описание — открытие/закрытие ведёт настоящая
машина состояний Ark сама, наружу как событие не отдаётся. 📥

<h3 id="io-вход">📥 Вход</h3>

```json
{ "title": "string", "description": "string" }
```

<h3 id="io-выход">📤 Выход</h3>

Поповер ничего не диспатчит через сборку — открытие/закрытие ведёт настоящая машина состояний Ark
сама, не событие наружу схемы.

<h2 id="сборки">🏗️ Сборки</h2>

Одна сборка — только «плавающая половина» панели, уже открытая для просмотра: контрол и якорь
снаружи неё сборке не нужны, их подключает тот, кто использует компонент. 🧱

<h3 id="сборка-basic">🧱 basic</h3>

```
positioner 🎯 · providerProps: defaultOpen
  arrow ▲
    arrowTip
  content 💬
    title 🏷️ · text: {title}
    description 📝 · text: {description}
    closeTrigger ✕ · text: "✕"
```

> [!NOTE]
> Сборка показывает только «плавающую половину» — `control`/`anchor` в это дерево структурно не
> попадают (см. предупреждение в разделе «Анатомия»), рабочий клик собирается или рендерится
> отдельно, рядом. `providerProps: { defaultOpen: true }` раскрывает панель без реального клика —
> движку сборки нужен контекст `Popover` вокруг `positioner`, тот же приём `RenderTree`, что даёт
> диалогу/меню state снаружи их собственного DOM-узла.

<h2 id="рецепт">🎨 Рецепт</h2>

`arrow`/`arrowTip` — коннектор пишет INLINE `arrow`'s ширину/высоту из `var(--arrow-size)`,
`arrowTip`'s фон из `var(--arrow-background)`, но сами переменные нигде не имеют значения по
умолчанию — рецепт их ОПРЕДЕЛЯЕТ, а не переопределяет инлайн-стиль. 🎨 `--arrow-background` равен
фону `content`, чтобы кончик стрелки читался как часть панели, а не отдельная фигура. `anchor`
получает `display: contents` — прозрачная точка отсчёта не должна добавлять свой бокс в раскладку
потребителя.

Открытие/закрытие `content` анимируется именованными кадрами (`popover-in`/`popover-out`) на
`--motion-fast` — легче, чем `dialog-in`/`dialog-out` диалога на `--motion-normal`: поповер —
более лёгкий, не модальный по умолчанию родственник диалога.

<h2 id="доступность">♿ Доступность</h2>

Поповер следует паттерну «плавающая панель с управлением фокусом», той же семье, что и диалог. ⌨️

| Клавиша            | Действие                                                                       |
| ------------------- | --------------------------------------------------------------------------------- |
| `Space` / `Enter`  | Открывает/закрывает поповер, когда фокус на контроле                            |
| `Tab`               | Переносит фокус на следующий фокусируемый элемент внутри `content`; после последнего — дальше за контрол |
| `Shift + Tab`       | Переносит фокус на предыдущий фокусируемый элемент внутри `content`, либо назад на контрол |
| `Esc`               | Закрывает поповер и переносит фокус на контрол                                   |
