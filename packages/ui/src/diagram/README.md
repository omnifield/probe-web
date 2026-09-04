# 📊 Diagram

🏷️ other · 🧬 component · 📐 wide · 📦 `@omnifield/probe-web-ui`

Второй по-настоящему СВОЙ составной компонент кита (после `table`) — Ark UI диаграмм не даёт вовсе,
ни готовых, ни headless. Вся анатомия объявлена нами; движок под расчётами — отдельные модули
`d3` (не монолитная charting-библиотека), тот же приём «берём движок, компоненты свои», что у
`table` с `@tanstack/solid-table`.

> [!NOTE]
> Декартовы (линия/область/столбцы/точки) и радиальные (пирог/радар/спидометр) диаграммы — ОДИН
> компонент кита снаружи (`diagram`, один паспорт, одна анатомия), не два раздельных, как
> `table`/`grid`. Разница `table`/`grid` — в ПОВЕДЕНИИ (сортировка/фильтры vs голая раскладка),
> у диаграмм контракт один и тот же: «дай данные + шкалу — нарисую форму». Разнообразие
> (line/bar/pie/radar/…) выражается СБОРКАМИ (`playground/assemblies/`), не отдельными
> компонентами. Подробности решения — `ROADMAP.yaml`, `log: diagram-is-one-component`.
>
> Механики при этом не смешиваются на уровне ФАЙЛОВ: `components/cartesian/*` (движок
> `d3-scale`+`d3-shape`'s декартовы генераторы) и `components/radial/*` (`d3-shape`'s полярные
> arc/pie), обе папки просто перечисляются в одной карте `defineKitComponent(passport, {...})`.
> `root` общий для обеих семей.

> [!TIP]
> Перед тем как трогать движок — прочитай [`FAQ.md`](./FAQ.md): туда идут конкретные грабли этого
> компонента, тем же способом, каким `table/FAQ.md` собрал грабли `@tanstack/solid-table`.

## 🧭 Навигация

- 🧩 [Анатомия](#анатомия)
- 🎛️ [Состояния](#состояния)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- 🚀 [Использование](#использование)

<h2 id="анатомия">🧩 Анатомия</h2>

```
root
├─ axis[]
├─ grid[]
├─ line[]
├─ area[]
├─ bar[]
└─ point[]
```

| часть      | значение                                                              | принимает внутри | рисуется      |
| ---------- | ---------------------------------------------------------------------- | ------------------ | --------------- |
| 🗂️ `root` | диаграмма целиком — голый `<svg>`, размер задаётся `width`/`height`   | `axis`, `grid`, `line`, `area`, `bar`, `point`, дальше — другие серии (`ROADMAP.yaml`) | `DiagramRoot` |
| `axis`    | одна ось — линия домена + тики + подписи вдоль `scale`                | —                   | `DiagramAxis` |
| `grid`    | фоновые направляющие линии, продолженные от тиков той же `scale`, что и `axis`, через всю область построения | — | `DiagramGrid` |
| `line`    | одна серия — ломаная по значениям одного набора данных                | —                   | `DiagramLine` |
| `area`    | та же серия, но с заливкой от значения до базовой линии `yScale`      | —                   | `DiagramArea` |
| `bar`     | одна серия — прямоугольник на каждую категорию, ширина/положение от `ScaleBand` | —          | `DiagramBar` |
| `point`   | одна серия — точка на каждую пару значений, без соединяющей линии     | —                   | `DiagramPoint` |

> [!NOTE]
> `bar` — ЕДИНСТВЕННАЯ серия пока, что использует категориальную `ScaleBand` (не `ScaleLinear`,
> как `line`/`area`/`axis`/`grid`). `axis`/`grid` умеют только `ScaleLinear` (обе зовут
> `scale.ticks(...)`, которого у `ScaleBand` нет) — подписанной категориальной оси кит пока не
> строит вовсе, честный названный пробел (`ROADMAP.yaml`, `FAQ.md`). Сборка `bar` рисует только
> `y`-сетку/ось — подписей по `x` нет.

> [!NOTE]
> `line`/`area`/`bar`/`point` состояний не несут — ни ховера, ни выделения (те приедут вместе с
> `tooltip`/`legend-toggle`, `ROADMAP.yaml`). Данные и обе шкалы — явные пропы (`data`, `xScale`,
> `yScale`, `x`/`y`-аксессоры), тот же принцип «scale не читается из контекста», что у `axis`/
> `grid`. Аксессоры (`x`/`y`) достают СЫРОЕ значение из точки данных — сам компонент считает,
> куда это ляжет в пикселях.
>
> `line`/`area` считают путь через `d3-shape`'s генератор (`xScale(x(datum))` внутри `.x(...)`).
> `bar`/`point` генератора не используют вовсе — чистая арифметика: `bar` один `<g data-part="bar">`
> на серию, много `<rect>` внутри (позиция/ширина от `ScaleBand`'s `bandwidth()`); `point` та же
> форма, много `<circle>` внутри, радиус — необязательный проп `radius` (по умолчанию `3`).
>
> `area`'s базовая линия — `yScale.range()[0]` (нижний край диапазона y-шкалы), не отдельный
> проп: для обычного «график с заливкой до нуля» этого достаточно, стек (несколько `area` друг на
> друга, каждая со своей базовой линией) — предмет отдельной, ещё не построенной фичи
> (`stacked-series`, `ROADMAP.yaml`), не изобретается здесь заранее. `line` рисует
> `fill="none"`/`stroke="currentColor"`, `area`/`bar`/`point` — наоборот, `fill="currentColor"`
> (`stroke="none"` у area): разные визуальные роли одного и того же семейства серий.

> [!NOTE]
> `grid` — ОТДЕЛЬНАЯ часть от `axis`, не его подмножество, хотя обе части читают одну и ту же
> `scale` и один и тот же набор тиков. Разные обязанности: `axis` подписывает значения и рисует
> линию домена у своего края, `grid` продолжает тики через всю область построения фоном — то же
> разделение, что `table` проводит между `headerCell`/`headerSortTrigger` (носитель vs
> нарисованное поведение), просто здесь обе части декоративные, без интерактивности ни у одной.

> [!NOTE]
> `axis` — ОДНА часть на обе ориентации (`x`/`y`), не две разные части. Один `root` рутинно несёт
> ОБЕ оси сразу (x снизу, y слева), каждая со своим, независимым направлением — та же категория
> состояния, что `nodeCheckbox` у tree-view (метка, которую несёт САМА часть, не whole-component
> `settings`). `orientation` — обязательный проп `DiagramAxis`, не опциональный: осей без
> ориентации не бывает.

> [!NOTE]
> `scale` — ВСЕГДА явный проп, никогда не читается из контекста. Единственный архитектурный
> принцип, взятый у visx (Airbnb) дословно: тот, кто собирает график, считает шкалу ОДИН раз
> (`scaleLinear().domain(...).range(...)`) и передаёт её каждой части, которой она нужна. `root`
> не считает и не хранит шкалу сам — обычный контейнер, не носитель состояния.
>
> `scale` — НЕОБЯЗАТЕЛЬНЫЙ проп `DiagramAxis`, и не ради удобства реального потребителя: у
> превьюера сборок (`packages/assembly/src/render.tsx`) нет способа передать функцию через
> декларативное дерево, а голый эскиз анатомии (без объявленной сборки) не называет пропов вовсе.
> Без `scale` часть рисует свой настоящий адрес (`<g data-part="axis">`), пустой внутри — не падает.

<h2 id="состояния">🎛️ Состояния</h2>

|    | часть | состояние | метка | значение |
| -- | ----- | --------- | ----- | -------- |
| ↔️ | axis, grid | x | `[data-orientation="x"]` | тики вдоль горизонтали — нижняя ось / вертикальные линии сетки |
| ↕️ | axis, grid | y | `[data-orientation="y"]` | тики вдоль вертикали — левая ось / горизонтальные линии сетки |

`root` состояний не несёт — чистый контейнер.

<h2 id="сборки">🏗️ Сборки</h2>

<h3 id="сборка-basic">🧱 basic</h3>

```
root · props: width, height
├─ grid · props: scale (x), orientation="x", from, to
├─ grid · props: scale (y), orientation="y", from, to
├─ axis · props: scale (x), orientation="x", offset
└─ axis · props: scale (y), orientation="y", offset
```

Голая система координат — одна ось x (снизу), одна ось y (слева), фоновая сетка под ними, без
единой серии. Настоящие `d3-scale`'s `scaleLinear`, не заглушки — тики, подписи и линии сетки
реальные. Сетка рисуется ПЕРВОЙ (позади осей) — порядок в дереве сборки решает порядок в DOM.

<h3 id="сборка-line">📈 line</h3>

```
root · props: width, height
├─ grid · props: scale (x), orientation="x", from, to
├─ grid · props: scale (y), orientation="y", from, to
├─ line · props: data, xScale, yScale, x, y
├─ axis · props: scale (x), orientation="x", offset
└─ axis · props: scale (y), orientation="y", offset
```

Первый реально показываемый график — температура по дням недели, одна серия поверх сетки, под
осями (`line` рисуется до `axis`, чтобы линия домена оси оставалась поверх серии на краю).

<h3 id="сборка-area">🟩 area</h3>

```
root · props: width, height
├─ grid · props: scale (x), orientation="x", from, to
├─ grid · props: scale (y), orientation="y", from, to
├─ area · props: data, xScale, yScale, x, y
├─ axis · props: scale (x), orientation="x", offset
└─ axis · props: scale (y), orientation="y", offset
```

Тот же принцип, что `line`, но заливка — посетители по дням недели.

<h3 id="сборка-bar">📊 bar</h3>

```
root · props: width, height
├─ grid · props: scale (y), orientation="y", from, to
├─ bar · props: data, xScale (ScaleBand), yScale, x, y
└─ axis · props: scale (y), orientation="y", offset
```

Выручка по кварталам — категориальная `x` (`ScaleBand`), без подписей категорий (см. `[!NOTE]` в
разделе «Анатомия» — категориальную ось строить пока нечем).

<h3 id="сборка-point">🔵 point</h3>

```
root · props: width, height
├─ grid · props: scale (x), orientation="x", from, to
├─ grid · props: scale (y), orientation="y", from, to
├─ point · props: data, xScale, yScale, x, y
├─ axis · props: scale (x), orientation="x", offset
└─ axis · props: scale (y), orientation="y", offset
```

Рассеяние — результат теста по часам подготовки, без соединяющей линии.

<h2 id="рецепт">🎨 Рецепт</h2>

Доказательный рецепт (`playground/recipe.ts`) — проверен `recipe.test.tsx`, `skinGaps` пуст,
`checkSkin` чист, CSS реально генерируется. В продакшене не участвует.

<h2 id="использование">🚀 Использование</h2>

```tsx
import { scaleLinear } from "d3-scale";

const x = scaleLinear().domain([0, 100]).range([40, 320]);
const y = scaleLinear().domain([0, 50]).range([210, 10]);

<DiagramRoot width={360} height={240}>
  <DiagramGrid scale={x} orientation="x" from={10} to={210} />
  <DiagramGrid scale={y} orientation="y" from={40} to={320} />
  <DiagramAxis scale={x} orientation="x" offset={210} />
  <DiagramAxis scale={y} orientation="y" offset={40} />
</DiagramRoot>;
```

`grid`'s `from`/`to` — край диапазона ДРУГОЙ (перпендикулярной) шкалы, не своей собственной: x-сетка
(вертикальные линии) тянется по всей высоте — диапазону y-шкалы, и наоборот.

Первая настоящая серия — линия:

```tsx
const data = [
  { day: 0, temperature: 12 },
  { day: 1, temperature: 15 },
  { day: 2, temperature: 14 },
];

<DiagramRoot width={360} height={240}>
  <DiagramLine data={data} xScale={x} yScale={y} x={(d) => d.day} y={(d) => d.temperature} />
  <DiagramAxis scale={x} orientation="x" offset={210} />
  <DiagramAxis scale={y} orientation="y" offset={40} />
</DiagramRoot>;
```

Вторая серия — та же линия, но с заливкой:

```tsx
<DiagramArea data={data} xScale={x} yScale={y} x={(d) => d.day} y={(d) => d.temperature} />
```

Столбцы — другая (категориальная) `xScale`:

```tsx
import { scaleBand } from "d3-scale";

const quarters = [
  { quarter: "Q1", revenue: 120 },
  { quarter: "Q2", revenue: 190 },
];
const category = scaleBand<string>().domain(["Q1", "Q2"]).range([40, 320]).padding(0.2);

<DiagramBar data={quarters} xScale={category} yScale={y} x={(d) => d.quarter} y={(d) => d.revenue} />;
```

Точки/scatter — тот же принцип, что `line`, без соединения между точками, необязательный `radius`
(по умолчанию `3`):

```tsx
<DiagramPoint data={data} xScale={x} yScale={y} x={(d) => d.day} y={(d) => d.temperature} radius={4} />
```

Веха `cartesian-series` этим закрыта целиком. Радиальные серии (пирог/радар/спидометр, веха
`radial`) пока не построены (`ROADMAP.yaml`).
