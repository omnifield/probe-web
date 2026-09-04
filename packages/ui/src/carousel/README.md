# 🎠 Carousel

🏷️ disclosure · 🧬 component · 📐 wide · 📦 `@web-core/ui`

## 🧭 Навигация

- 🧩 [Анатомия](#анатомия)
- 🎛️ [Состояния](#состояния)
- 🎚️ [Настройки](#настройки)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- 🚀 [Использование](#использование)

<h2 id="анатомия">🧩 Анатомия</h2>

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
> Анатомия не из «сырого» `@zag-js/carousel/anatomy` (десять частей) — она оттуда, где реально
> живут Solid-компоненты кита, `@ark-ui/solid/anatomy`: там та же анатомия расширена ещё двумя
> частями (`progressText`, `autoplayIndicator`), которые Ark добавил сверх Zag. Взять «сырую»
> версию значило бы молча потерять два узла, которые кит на самом деле адресует.

<h2 id="состояния">🎛️ Состояния</h2>

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
> проверено по `carousel.connect.mjs`. `root`, `control` и `indicatorGroup` своих состояний не
> несут вовсе.

<h2 id="настройки">🎚️ Настройки</h2>

| настройка      | значения                | по умолчанию | означает                                                                     |
| -------------- | ----------------------- | ------------- | -------------------------------------------------------------------------------- |
| `orientation`  | `horizontal`/`vertical` | `horizontal`  | по какой оси едут слайды — заодно переворачивает, куда смотрят стрелки            |

<h2 id="io">🔌 IO</h2>

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

Доказательный рецепт (`playground/recipe.ts`) — доказывает, что паспорт МОЖНО одеть целиком
настоящей скин-механикой (`skinGaps` пуст, CSS реально генерируется). В продакшене не участвует.
Один вид, без именованных вариантов — только настройка `orientation`.

`indicator` — плоская точка без измеряемых переменных: в отличие от `tabs`'а собственной
скользящей полосы, `Indicator` у карусели не несёт `--left`/`--top`/`--width`/`--height` в
документации поставщика — просто текущая/нетекущая, мерить нечего.

<h2 id="использование">🚀 Использование</h2>

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
