# 📱 Drawer

🏷️ overlays · 🧬 component · 📐 regular · 📦 `@omnifield/probe-web-ui`

## 🧭 Навигация

- 🧩 [Анатомия](#анатомия)
- 🎛️ [Состояния](#состояния)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- 🚀 [Использование](#использование)

<h2 id="анатомия">🧩 Анатомия</h2>

```
positioner
└─ content
   ├─ grabber
   │  └─ grabberIndicator
   ├─ title
   ├─ description
   └─ closeTrigger
```

`trigger`/`backdrop`/`swipeArea` — реальные соседи `positioner` в разметке, не его предки и не
потомки. Это не переименованный диалог — отдельный пакет со своим движком и жестовым коннектором:
свайп/перетаскивание/точки привязки диалогу неизвестны вовсе.

| часть              | значение                                                    | принимает внутри | рисуется                  |
| -------------------- | -------------------------------------------------------------- | ------------------ | ---------------------------- |
| 🔘 `trigger`        | открывает шторку                                              | текст, иконку       | `DrawerTrigger`             |
| ⬛ `backdrop`       | затемнённая подложка — тускнеет вместе со свайпом              | ничего              | `DrawerBackdrop`            |
| 🎯 `positioner`     | закрепляет содержимое за краем, откуда шторка выезжает          | `content`           | `DrawerPositioner`           |
| 📱 `content`        | собственная панель шторки                                     | `grabber`, `title`, `description`, `closeTrigger`, любой компонент | `DrawerContent` |
| ✋ `grabber`         | ручка — нажатие запускает свайп-закрытие                       | `grabberIndicator`  | `DrawerGrabber`              |
| ▬ `grabberIndicator`| видимая полоска внутри ручки — своей графики не несёт           | ничего              | `DrawerGrabberIndicator`     |
| 🏷️ `title`          | заголовок                                                     | текст               | `DrawerTitle`                |
| 📝 `description`    | описание                                                      | текст               | `DrawerDescription`          |
| ✕ `closeTrigger`    | закрывает шторку                                              | текст, иконку       | `DrawerCloseTrigger`         |
| 👆 `swipeArea`      | невидимая зона у края — свайпом открывает ЗАКРЫТУЮ шторку       | ничего              | `DrawerSwipeArea`            |

> [!NOTE]
> Частей десять, но нет части `root` — сам `Drawer` рисует не DOM-узел, а чистый контекст, тем же
> приёмом, что диалог и поповер. Паспорт называет своим номинальным корнем `positioner`.

<h2 id="состояния">🎛️ Состояния</h2>

|      | состояние                | метка                              | где                                   | значение                                             |
| ---- | -------------------------- | ------------------------------------- | ---------------------------------------- | --------------------------------------------------------- |
| 🔓🔒 | open / closed              | `[data-state]`                         | positioner, content, trigger, backdrop, swipeArea | шторка открыта / закрыта                        |
| ↕️   | up / down / left / right   | `[data-swipe-direction]`               | positioner, content, swipeArea            | с какого края шторка выезжает и куда закрывается           |
| 🫳   | swiping                    | `[data-swiping]`                       | content, backdrop, swipeArea              | прямо сейчас идёт перетаскивание или открывающий свайп      |
| ✊   | dragging                   | `[data-dragging]`                      | content                                   | именно перетаскивание (не доводка после отпускания)         |
| 📏   | expanded                   | `[data-expanded]`                      | content                                   | шторка в полностью раскрытой точке привязки                |
| 🗂️   | nested-drawer-open         | `[data-nested-drawer-open]`            | content                                   | открыта шторка, вложенная поверх этой                       |
| 🗂️   | nested-drawer-swiping      | `[data-nested-drawer-swiping]`         | content                                   | вложенную поверх этой шторку сейчас тащат                   |
| 🎯   | current                    | `[data-current]`                       | trigger                                   | в шторке с несколькими триггерами — тот, что её открыл       |
| 🖱️   | hover                      | `:hover`                               | trigger, grabber, closeTrigger            | указатель наведён                                          |
| ⌨️   | focus-visible              | `:focus-visible`                       | trigger, closeTrigger                     | фокус пришёл с клавиатуры                                  |
| 👆   | active                     | `:active`                              | trigger, grabber, closeTrigger            | нажат указателем                                           |
| 🚫   | disabled                   | `[data-disabled]`                      | swipeArea                                 | открытие свайпом отключено                                 |

`grabber` — настоящий интерактивный `<div>` без `data-*`-метки: `:hover`/`:active` работают, как у
любого элемента под указателем, но `tabIndex` ему никогда не ставится — с клавиатуры недостижим,
`:focus-visible` для него не объявлен. `grabberIndicator`/`title`/`description` своих состояний не
несут.

Самая богатая переменная-поверхность в ките — одиннадцать переменных на `content`:

| переменная                        | значение                                                              |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `--drawer-translate`                | текущее смещение выезда — то же значение, что `--drawer-translate-y`         |
| `--drawer-translate-x`/`-y`          | текущее смещение выезда/перетаскивания по своей оси                        |
| `--drawer-snap-point-offset-x`/`-y`  | смещение активной точки привязки по своей оси                              |
| `--drawer-swipe-movement-x`/`-y`     | насколько далеко сдвинулся текущий свайп по своей оси                      |
| `--drawer-swipe-strength`            | насколько свайп близок к порогу закрытия, доля от 0 до 1                    |
| `--nested-drawers`                   | сколько шторок вложено поверх этой                                         |
| `--drawer-height`                    | измеренная высота содержимого                                              |
| `--drawer-frontmost-height`          | измеренная высота самой верхней шторки в стопке                            |

`backdrop` несёт ещё две — `--drawer-swipe-progress` (насколько далеко свайп уже раскрыл шторку) и
свою копию `--drawer-swipe-strength`: коннектор пишет их на `backdrop` отдельно от `content`, не
каскадом с него.

<h2 id="io">🔌 IO</h2>

<h3 id="io-вход">📥 Вход</h3>

```json
{ "title": "string", "description": "string" }
```

<h3 id="io-выход">📤 Выход</h3>

Шторка ничего не диспатчит через сборку — открытие/закрытие/свайп ведёт настоящая машина
состояний сама, не событие наружу схемы.

<h2 id="сборки">🏗️ Сборки</h2>

<h3 id="сборка-basic">🧱 basic</h3>

```
positioner 🎯 · providerProps: defaultOpen
  content 📱
    grabber ✋
      grabberIndicator ▬
    title 🏷️ · text: {title}
    description 📝 · text: {description}
    closeTrigger ✕ · text: "✕"
```

> [!NOTE]
> Сборка показывает только «плавающую половину» — `trigger`/`backdrop`/`swipeArea` в это дерево
> структурно не попадают, тот же приём, что у диалога и поповера. `providerProps: { defaultOpen:
> true }` раскрывает панель без реального клика.

<h2 id="рецепт">🎨 Рецепт</h2>

Доказательный рецепт (`playground/recipe.ts`) — доказывает, что паспорт МОЖНО одеть целиком
настоящей скин-механикой (`skinGaps` пуст, CSS реально генерируется). В продакшене не участвует.

`content` двигает сам себя по `--drawer-translate-x`/`-y` (`translate3d`) — кит меряет и пишет эти
переменные, скин их только читает. Скруглён только угол, обращённый во вьюпорт: у шторки снизу
(`down`) — верхние углы, слева (`left`) — правые, и так далее по `data-swipe-direction`. Ручка
(`grabberIndicator`) по умолчанию горизонтальная полоска — для шторки сверху/снизу; для `left`/
`right` разворачивается в вертикальную через `ancestors` на состояние `content`'а, не свою
собственную (у `grabberIndicator` направление в паспорте не объявлено — оно чужое, `content`'а).

<h2 id="использование">🚀 Использование</h2>

**Ручная сборка** — компонент собирается вручную, JSX-композицией, без схемы и движка.

```tsx
<Drawer>
  <DrawerTrigger>Открыть</DrawerTrigger>
  <DrawerBackdrop />
  <DrawerPositioner>
    <DrawerContent>
      <DrawerGrabber>
        <DrawerGrabberIndicator />
      </DrawerGrabber>
      <DrawerTitle>Заголовок</DrawerTitle>
      <DrawerDescription>Описание</DrawerDescription>
      <DrawerCloseTrigger>✕</DrawerCloseTrigger>
    </DrawerContent>
  </DrawerPositioner>
  <DrawerSwipeArea />
</Drawer>
```

**Рендер через движок** — та же композиция плавающей половины, но по схеме (сборка `basic`),
которую рисует `RenderTree`. Реестр должен знать про `provider: Drawer` для этого компонента.

```tsx
const data = { title: "Настройки", description: "Настройте параметры аккаунта." };
const tree = instanceOf("drawer", {}, "basic", data);

<RenderTree tree={tree} registry={registry} data={data} />;
```

**Выезд сбоку.** `swipeDirection` задаёт край — `"start"`/`"end"` переводятся в физическую
сторону по направлению текста.

```tsx
<Drawer swipeDirection="end">
  <DrawerTrigger>Открыть справа</DrawerTrigger>
  <DrawerBackdrop />
  <DrawerPositioner>
    <DrawerContent>
      <DrawerTitle>Правая шторка</DrawerTitle>
      <DrawerCloseTrigger>✕</DrawerCloseTrigger>
    </DrawerContent>
  </DrawerPositioner>
</Drawer>
```

**Точки привязки, перетаскивание за ручку.**

```tsx
<Drawer snapPoints={[0.25, 0.5, 1]} defaultSnapPoint={0.5}>
  <DrawerTrigger>Открыть</DrawerTrigger>
  <DrawerBackdrop />
  <DrawerPositioner>
    <DrawerContent>
      <DrawerGrabber>
        <DrawerGrabberIndicator />
      </DrawerGrabber>
      <DrawerTitle>Шторка с точками привязки</DrawerTitle>
      <DrawerCloseTrigger>✕</DrawerCloseTrigger>
    </DrawerContent>
  </DrawerPositioner>
</Drawer>
```

**Немодальная, с зоной для повторного открытия свайпом.**

```tsx
<Drawer modal={false}>
  <DrawerTrigger>Открыть</DrawerTrigger>
  <DrawerPositioner>
    <DrawerContent>
      <DrawerTitle>Немодальная шторка</DrawerTitle>
      <DrawerCloseTrigger>✕</DrawerCloseTrigger>
    </DrawerContent>
  </DrawerPositioner>
  <DrawerSwipeArea />
</Drawer>
```
