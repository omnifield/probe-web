# 🎠 Carousel

<h2 id="главное">🏠 Главное</h2>

🏷️ disclosure · 🧬 component · 📐 wide · 📦 `@web-core/ui`

Слайд-шоу с навигацией 🎠 — используйте, чтобы показать несколько карточек, картинок или блоков по
очереди в одном и том же месте: галерея товара, промо-баннеры, витрина отзывов. Листать можно
стрелками, точками-индикаторами или пальцем/мышью, а автопрокрутка с кнопкой паузы включается
одним пропом, когда слайд-шоу должно ехать само.

<h2 id="анатомия">🧩 Анатомия</h2>

Стрелка-индикатор автопрокрутки — отдельная, самостоятельная часть внутри своей кнопки, не
декорация текста: своё содержимое для «идёт» и «на паузе», переключается само. 🧩

```
root
├─ control
│  ├─ prevTrigger ◀️
│  ├─ autoplayTrigger ⏯️
│  │  └─ autoplayIndicator
│  └─ nextTrigger ▶️
├─ itemGroup 🖼️
│  └─ item[]
├─ indicatorGroup ●●●
│  └─ indicator[]
└─ progressText 🔢
```

| часть                | значение                                                                | принимает внутри            | рисуется                    |
| --------------------- | ------------------------------------------------------------------------ | ---------------------------- | ---------------------------- |
| 🎠 `root`             | карусель целиком — область показа, навигация и индикаторы вместе          | `control`, `itemGroup`, `indicatorGroup`, `progressText` | `Carousel`             |
| 🖼️ `itemGroup`        | прокручиваемая область показа, держит все слайды                          | `item`                        | `CarouselItemGroup`         |
| 🎞️ `item`             | один слайд                                                                | текст, любой компонент        | `CarouselItem`               |
| 🎛️ `control`          | оборачивает кнопки вперёд/назад и, если есть, переключатель автопрокрутки | `prevTrigger`, `nextTrigger`, `autoplayTrigger` | `CarouselControl`   |
| ◀️ `prevTrigger`      | прокручивает на страницу назад                                            | текст, иконку                 | `CarouselPrevTrigger`        |
| ▶️ `nextTrigger`      | прокручивает на страницу вперёд                                           | текст, иконку                 | `CarouselNextTrigger`        |
| ●●● `indicatorGroup`  | оборачивает по одному индикатору на слайд                                 | `indicator`                   | `CarouselIndicatorGroup`     |
| ● `indicator`         | одна точка — по клику переходит сразу на свой слайд                       | ничего                        | `CarouselIndicator`          |
| ⏯️ `autoplayTrigger`  | запускает или ставит на паузу автопрокрутку                               | текст, иконку, `autoplayIndicator` | `CarouselAutoplayTrigger` |
| 🔢 `progressText`     | текст со счётчиком страниц                                                | текст                         | `CarouselProgressText`       |
| 🔁 `autoplayIndicator`| своя иконка кнопки автопрокрутки                                          | текст, иконку                 | `CarouselAutoplayIndicator`  |

> [!NOTE]
> Одиннадцать частей, не десять голых слайд+навигация — `progressText`/`autoplayIndicator` дают
> счётчик страниц и собственную картинку кнопки автопрокрутки, обе реально адресуются в паспорте,
> не декоративные добавки поверх основного набора.

<h2 id="использование">🚀 Использование</h2>

От ручной композиции до автопрокрутки с переключателем — каждый сценарий подключается отдельно. 🔀

**Ручная сборка** — компонент собирается вручную, JSX-композицией, без схемы и движка.

```tsx
<Carousel slideCount={items.length}>
  <CarouselControl>
    <CarouselPrevTrigger>‹</CarouselPrevTrigger>
    <CarouselAutoplayTrigger>
      <CarouselAutoplayIndicator fallback="▶">⏸</CarouselAutoplayIndicator>
    </CarouselAutoplayTrigger>
    <CarouselNextTrigger>›</CarouselNextTrigger>
    <CarouselProgressText />
  </CarouselControl>
  <CarouselItemGroup>
    <For each={items}>{(item, index) => <CarouselItem index={index()}>{item}</CarouselItem>}</For>
  </CarouselItemGroup>
  <CarouselIndicatorGroup>
    <For each={items}>{(_item, index) => <CarouselIndicator index={index()} />}</For>
  </CarouselIndicatorGroup>
</Carousel>
```

**Рендер через движок** — та же композиция, но по схеме (сборка `basic`), которую рисует `RenderTree`.

```tsx
const data = { slide1: { label: "Первый" }, slide2: { label: "Второй" }, slide3: { label: "Третий" } };
const tree = instanceOf("carousel", {}, "basic", data);

<RenderTree tree={tree} registry={registry} data={data} />;
```

**Автопрокрутка с переключателем.** `loop` не даёт автопрокрутке остановиться намертво на
последнем слайде.

```tsx
<Carousel slideCount={items.length} autoplay loop>
  ...
</Carousel>
```

**Индикатор только для чтения.** `readOnly` на отдельном `CarouselIndicator` — точка показывает,
какой слайд открыт сейчас, но клик по ней не листает.

```tsx
<CarouselIndicator index={2} readOnly />
```

<h2 id="настройки">🎚️ Настройки</h2>

Единственная настройка решает, по какой оси едут слайды — влияет заодно и на то, в какую сторону
смотрят стрелки навигации.

| настройка      | значения                | по умолчанию | означает                                                                     |
| -------------- | ----------------------- | ------------- | -------------------------------------------------------------------------------- |
| `orientation`  | `horizontal`/`vertical` | `horizontal`  | по какой оси едут слайды — заодно переворачивает, куда смотрят стрелки            |

<h2 id="состояния">🎛️ Состояния</h2>

`disabled` у стрелок навигации — единственное состояние без цикла, и оно честно про сам факт: ехать
дальше некуда, а не «эта функция сейчас недоступна». 🎯

|      | состояние        | метка               | где                                                  | значение                                                   |
| ---- | ------------------ | --------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| 🫳   | dragging          | `[data-dragging]`      | itemGroup                                                | область тащат указателем (только когда включён `allowMouseDrag`) |
| 👁️   | inview            | `[data-inview]`        | item                                                     | этот слайд сейчас виден в области показа (превышен `inViewThreshold`) |
| 🚫   | disabled          | `:disabled`             | prevTrigger, nextTrigger                                 | некуда прокручивать в эту сторону, и карусель не зациклена       |
| 🖱️   | hover             | `:hover`                | prevTrigger, nextTrigger, indicator, autoplayTrigger      | указатель наведён                                               |
| ⌨️   | focus-visible     | `:focus-visible`        | prevTrigger, nextTrigger, indicator, autoplayTrigger      | фокус пришёл с клавиатуры                                       |
| 👆   | active            | `:active`                | prevTrigger, nextTrigger, indicator, autoplayTrigger      | кнопка нажата и удерживается                                    |
| ✅   | current           | `[data-current]`        | indicator                                                | слайд этой точки — тот, что сейчас показан                       |
| 🔒   | readonly          | `[data-readonly]`       | indicator                                                | клик ничего не делает — индикатор только для чтения              |
| ⏺️   | pressed           | `[data-pressed]`        | autoplayTrigger                                          | автопрокрутка идёт — переключатель во включённом состоянии       |

> [!NOTE]
> `disabled` у `prevTrigger`/`nextTrigger` — ТОЛЬКО нативный `:disabled`, без `data-disabled`:
> проверено напрямую. `root`, `control` и `indicatorGroup` своих
> состояний не несут вовсе.

<h2 id="io">🔌 IO</h2>

Собранной по схеме карусели нужны три именованных слайда — не массив (почему — предупреждение
ниже). Переключение страниц ведёт настоящая машина состояний изнутри, наружу как событие не
отдаётся. 📥

<h3 id="io-вход">📥 Вход</h3>

```json
{
  "slide1": { "label": "string" },
  "slide2": { "label": "string" },
  "slide3": { "label": "string" }
}
```

> [!WARNING]
> Не массив `slides[]`, а три именованных поля — это ограничение движка сборки, не вкус:
> `bind`/`value.path` не поддерживают числовой индекс массива (`Paths<T>` в
> `packages/skin/src/passport/assembly/paths.ts` — НИКОГДА числовой сегмент), индексация есть
> только через `repeat`. `repeat` не подходит сюда: он кладёт индекс как `number[]`
> (`indexPathBind`), а настоящему `CarouselItem`/`CarouselIndicator` нужен голый `number` — то, что
> движок сегодня отдать не может. Сборка с фиксированным числом слайдов и именованными полями —
> честный обход, а не постоянная форма контракта.

<h3 id="io-выход">📤 Выход</h3>

Карусель ничего не диспатчит через эту сборку — переключение страниц ведёт настоящая машина
состояний внутри самих `prevTrigger`/`nextTrigger`/`indicator`, не событие наружу.

<h2 id="сборки">🏗️ Сборки</h2>

Одна сборка — три слайда из данных, полная навигация, кнопка автопрокрутки, пустой счётчик страниц
(почему пустой — `FAQ.md`). 🧱

<h3 id="сборка-basic">🧱 basic</h3>

```
root · slideCount: 3
  control
    prevTrigger ◀️ · text: "‹"
    autoplayTrigger ⏯️
      autoplayIndicator 🔁 · fallback: "▶"
        🏷️ text: "⏸"
    nextTrigger ▶️ · text: "›"
  itemGroup 🖼️
    item · index: 0 · 🏷️ text: {slide1.label}
    item · index: 1 · 🏷️ text: {slide2.label}
    item · index: 2 · 🏷️ text: {slide3.label}
  indicatorGroup ●●●
    indicator · index: 0
    indicator · index: 1
    indicator · index: 2
  progressText 🔢
```

<h2 id="рецепт">🎨 Рецепт</h2>

Один вид, без именованных вариантов — только настройка `orientation`. 🎨 `indicator` — плоская
точка без измеряемых переменных: в отличие от собственной скользящей полосы `tabs`'а, `Indicator`
карусели не несёт `--left`/`--top`/`--width`/`--height` — просто текущая/нетекущая, мерить нечего.

<h2 id="доступность">♿ Доступность</h2>

Карусель следует паттерну WAI-ARIA [Carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)
— стандартная разметка слайд-шоу для экранных читалок, без отсебятины кита поверх неё. ⌨️
