# 🖱️ Scroll Area

🏷️ other · 🧬 component · 📐 regular · 📦 `@omnifield/probe-web-ui`

## 🧭 Навигация

- 🧩 [Анатомия](#анатомия)
- 🎛️ [Состояния](#состояния)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- 🚀 [Использование](#использование)

<h2 id="анатомия">🧩 Анатомия</h2>

```
root
├─ viewport
│  └─ content
├─ scrollbar[×2] ▬
│  └─ thumb[×2] ▭
└─ corner ◻
```

| часть          | значение                                                                        | принимает внутри                    | рисуется                 |
| ---------------- | ------------------------------------------------------------------------------------ | ----------------------------------------- | ------------------------- |
| 🖱️ `root`       | область прокрутки целиком — задаёт видимое окно и измеряет четыре переменные, которые читают её собственные `scrollbar`/`thumb`/`corner` | `viewport`, `scrollbar`, `corner` | `ScrollArea`       |
| `viewport`      | окно обрезки — нативный `overflow: auto`, настоящие события прокрутки                | `content`                                  | `ScrollAreaViewport` |
| `content`       | само прокручиваемое содержимое — подстраивается под то, что в него положил потребитель | текст, любой компонент                   | `ScrollAreaContent`  |
| ▬ `scrollbar`   | собственный трек одной оси                                                           | `thumb`                                    | `ScrollAreaScrollbar` |
| ▭ `thumb`       | собственный бегунок одной оси                                                        | —                                           | `ScrollAreaThumb`    |
| ◻ `corner`      | квадрат, где иначе пересеклись бы два ползунка                                       | —                                           | `ScrollAreaCorner`   |

> [!NOTE]
> Анатомия НЕ объявляется здесь — приезжает готовой, тем же приёмом, что и у каждого Zag-компонента
> кита. Физически живёт в `@zag-js/scroll-area/anatomy`; собственная `scrollAreaAnatomy` пакета Ark —
> ТОТ ЖЕ объект, реэкспортированный прямо из `@zag-js/scroll-area` (проверено в собранном чанке —
> `scroll-area.anatomy.ts` делает буквально `export { anatomy } from "@zag-js/scroll-area"`, без
> `.extendWith(...)`, в отличие от карусели/поля).

> [!NOTE]
> Шесть частей, но `scrollbar`/`thumb` — КАЖДАЯ рисуется ДВАЖДЫ в двухосевой композиции (по одному
> разу на `orientation="vertical"|"horizontal"`) — та же форма «одна часть, несколько настоящих
> узлов», что уже несёт `trigger` у `tabs` (по одному на вкладку), не пробел в анатомии.

<h2 id="состояния">🎛️ Состояния</h2>

|      | часть                                   | состояние     | метка                       | значение                                                    |
| ---- | ------------------------------------------ | --------------- | ------------------------------ | ---------------------------------------------------------------- |
| ↔️   | root, viewport, content, scrollbar, corner | overflow-x      | `[data-overflow-x]`            | содержимое переполняет по горизонтали — может существовать горизонтальный ползунок |
| ↕️   | root, viewport, content, scrollbar, corner | overflow-y      | `[data-overflow-y]`            | содержимое переполняет по вертикали — может существовать вертикальный ползунок |
| ⬆️   | viewport                                   | at-top          | `[data-at-top]`                | прокручено до самого верха                                        |
| ⬇️   | viewport                                   | at-bottom       | `[data-at-bottom]`             | прокручено до самого низа                                         |
| ⬅️   | viewport                                   | at-left         | `[data-at-left]`               | прокручено до самого левого края                                  |
| ➡️   | viewport                                   | at-right        | `[data-at-right]`              | прокручено до самого правого края                                 |
| ⬍    | scrollbar, thumb                           | vertical        | `[data-orientation="vertical"]`| этот узел — вертикальный экземпляр                                |
| ⬌    | scrollbar, thumb                           | horizontal      | `[data-orientation="horizontal"]` | этот узел — горизонтальный экземпляр                          |
| 🖱️   | scrollbar, thumb, corner                   | hover           | `[data-hover]`                 | указатель где-то рядом с собственными элементами управления прокруткой прямо сейчас |
| 👆   | scrollbar, thumb                           | dragging        | `[data-dragging]`              | бегунок сейчас тащат                                              |
| 🔄   | scrollbar                                  | scrolling       | `[data-scrolling]`             | прокрутка по этой оси происходит прямо сейчас                     |
| ◻   | corner                                     | hidden          | `[data-state="hidden"]`        | скрыт скином — прокрутка только по одной оси, заполнять нечего    |
| ◼   | corner                                     | visible         | `[data-state="visible"]`       | показан скином — прокрутка по обеим осям, квадрат угла нужен      |

> [!NOTE]
> `hover`/`dragging` — ОДНО служебное значение сразу на трёх частях, не отдельное «наведён именно
> на этот узел». `getScrollbarProps`/`getThumbProps`/`getCornerProps` спредят один и тот же
> `context.get("hovering")`/`state.matches("dragging")` — общий факт «указатель где-то рядом с
> собственными элементами прокрутки прямо сейчас», не буквальный per-node `:hover`. Правило скина,
> завязанное на `hover` у `scrollbar`, может сработать, пока указатель стоит над `thumb`, — это не
> баг марки, а то, что коннектор реально вычисляет; не замена настоящему `:hover`, как у чекбокса
> собственный JS-трекнутый hover.

> [!NOTE]
> `overflow-x`/`overflow-y` достают до ПЯТИ частей, `thumb` — единственное исключение. `root`/
> `viewport`/`content`/`scrollbar`/`corner` несут `data-overflow-x`/`data-overflow-y` (проверено на
> каждом `getXxxProps`); `getThumbProps` ни разу их не ставит — проверено как отсутствие, не
> принято по аналогии с остальными четырьмя.

> [!NOTE]
> `corner`'s `data-state` — МЕТКА, не автоматическое скрытие. `hiddenState.cornerHidden ? "hidden" :
> "visible"` — значение `data-state`, никогда нативный атрибут `hidden`; скин должен САМ подействовать
> на неё, чтобы угол реально исчез, когда прокрутка только по одной оси — кит не прячет непрошено.

<h2 id="io">🔌 IO</h2>

<h3 id="io-вход">📥 Вход</h3>

```json
{ "content": "string" }
```

<h3 id="io-выход">📤 Выход</h3>

Область прокрутки ничего не диспатчит через сборку — прокрутка ведёт настоящий `overflow: auto` на
`viewport`, это не событие наружу схемы.

<h2 id="сборки">🏗️ Сборки</h2>

<h3 id="сборка-basic">🧱 basic</h3>

```
root
  viewport
    content            · text: {content}
  scrollbar[vertical] ▬
    thumb[vertical] ▭
  corner ◻
```

`content` несёт текст из данных (`bind: /content`) — область прокрутки без настоящего переполнения
ничего не доказывает, поэтому текст должен быть достаточно длинным, чтобы реально не влезать в
фиксированную высоту, которую задаёт рецепт. `orientation` на `scrollbar`/`thumb` — статическая
структурная раскладка (сколько осей и какая), не данные: тот же довод, что у `orientation` вкладок
`tabs`'а — какие оси показывать решает автор сборки, не что-то, что приходит построчно из данных.

<h2 id="рецепт">🎨 Рецепт</h2>

Доказательный рецепт (`playground/recipe.ts`) — доказывает, что паспорт МОЖНО одеть целиком
настоящей скин-механикой (`skinGaps` пуст, CSS реально генерируется). В продакшене не участвует.

Классическая сетка ползунков: `viewport` в левом верхнем углу, вертикальный `scrollbar` в правом
верхнем, горизонтальный `scrollbar` в левом нижнем, `corner` в правом нижнем — `root` держит саму
сетку (`display: grid`), остальные части просто занимают свою ячейку. `root` получает
ФИКСИРОВАННУЮ высоту, чтобы длинный текст доказательной сборки реально переполнял её — на пустом
боксе прокручивать нечего.

<h2 id="использование">🚀 Использование</h2>

**Ручная сборка** — компонент собирается вручную, JSX-композицией, без схемы и движка.
`ScrollAreaScrollbar`/`ScrollAreaThumb` рисуются по разу на каждую нужную ось.

```tsx
<ScrollArea>
  <ScrollAreaViewport>
    <ScrollAreaContent>Длинный текст…</ScrollAreaContent>
  </ScrollAreaViewport>
  <ScrollAreaScrollbar orientation="vertical">
    <ScrollAreaThumb orientation="vertical" />
  </ScrollAreaScrollbar>
  <ScrollAreaScrollbar orientation="horizontal">
    <ScrollAreaThumb orientation="horizontal" />
  </ScrollAreaScrollbar>
  <ScrollAreaCorner />
</ScrollArea>
```

**Рендер через движок** — та же композиция, но по схеме (сборка `basic`), которую рисует
`RenderTree`.

```tsx
const data = { content: "Длинный текст, который реально переполняет фиксированную высоту…" };
const tree = instanceOf("scroll-area", {}, "basic", data);

<RenderTree tree={tree} registry={registry} data={data} />;
```

**Только одна ось.** Одноосевая прокрутка не несёт `corner` вовсе — он существует только затем,
чтобы заполнить угол, где встречаются ДВЕ полосы.

```tsx
<ScrollArea>
  <ScrollAreaViewport>
    <ScrollAreaContent>Длинный текст…</ScrollAreaContent>
  </ScrollAreaViewport>
  <ScrollAreaScrollbar orientation="vertical">
    <ScrollAreaThumb orientation="vertical" />
  </ScrollAreaScrollbar>
</ScrollArea>
```
