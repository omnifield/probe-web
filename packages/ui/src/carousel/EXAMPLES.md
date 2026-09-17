# 🧪 Примеры — как работать с `Carousel`

Рабочий код для локального теста, не канон. Анатомия и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

## 1. Ручная сборка — базовая карусель

Самый простой путь: JSX-композиция, без схемы и движка. Три карточки, стрелки и точки.

```tsx
import { For } from "solid-js";
import {
  Carousel,
  CarouselControl,
  CarouselPrevTrigger,
  CarouselNextTrigger,
  CarouselItemGroup,
  CarouselItem,
  CarouselIndicatorGroup,
  CarouselIndicator,
} from "@web-core/ui";

const slides = ["Первый слайд", "Второй слайд", "Третий слайд"];

export function BasicCarouselDemo() {
  return (
    <Carousel slideCount={slides.length}>
      <CarouselControl>
        <CarouselPrevTrigger>‹</CarouselPrevTrigger>
        <CarouselNextTrigger>›</CarouselNextTrigger>
      </CarouselControl>
      <CarouselItemGroup>
        <For each={slides}>{(slide, index) => <CarouselItem index={index()}>{slide}</CarouselItem>}</For>
      </CarouselItemGroup>
      <CarouselIndicatorGroup>
        <For each={slides}>{(_slide, index) => <CarouselIndicator index={index()} />}</For>
      </CarouselIndicatorGroup>
    </Carousel>
  );
}
```

Полезно проверить: клик по стрелке/точке листает слайд, `prevTrigger` получает `:disabled`, когда
дальше некуда (без `loop`).

## 2. Автопрокрутка с переключателем паузы

`autoplay` + `loop` (иначе автопрокрутка намертво остановится на последнем слайде). Кнопка сама
меняет иконку по состоянию — `CarouselAutoplayIndicator` переключается между `fallback` и своим
содержимым.

```tsx
import { For } from "solid-js";
import {
  Carousel,
  CarouselControl,
  CarouselPrevTrigger,
  CarouselNextTrigger,
  CarouselAutoplayTrigger,
  CarouselAutoplayIndicator,
  CarouselItemGroup,
  CarouselItem,
} from "@web-core/ui";

const slides = ["Первый слайд", "Второй слайд", "Третий слайд"];

export function AutoplayCarouselDemo() {
  return (
    <Carousel slideCount={slides.length} autoplay loop>
      <CarouselControl>
        <CarouselPrevTrigger>‹</CarouselPrevTrigger>
        <CarouselAutoplayTrigger>
          <CarouselAutoplayIndicator fallback="▶">⏸</CarouselAutoplayIndicator>
        </CarouselAutoplayTrigger>
        <CarouselNextTrigger>›</CarouselNextTrigger>
      </CarouselControl>
      <CarouselItemGroup>
        <For each={slides}>{(slide, index) => <CarouselItem index={index()}>{slide}</CarouselItem>}</For>
      </CarouselItemGroup>
    </Carousel>
  );
}
```

Полезно проверить: слайды едут сами каждые 4с (дефолт), клик по ⏯ ставит на паузу и меняет
иконку на ▶, `[data-pressed]` на кнопке отражает состояние.

## 3. Несколько слайдов на странице + свой прогресс-текст

`slidesPerPage`/`spacing` — витрина, где видно сразу два слайда. Число точек в этом режиме считается
не по слайдам, а по страницам (`pageSnapPoints`) — достать их можно только через
`useCarouselContext()`, поэтому здесь уже нужен хук, а не голые пропы. Заодно решаем то, что в
[`FAQ.md`](./FAQ.md) названо честным пробелом — `progressText` сам текст не формирует, теперь есть
`api.getProgressText()`, чтобы его туда положить.

```tsx
import { For } from "solid-js";
import {
  Carousel,
  CarouselControl,
  CarouselPrevTrigger,
  CarouselNextTrigger,
  CarouselItemGroup,
  CarouselItem,
  CarouselIndicatorGroup,
  CarouselIndicator,
  CarouselProgressText,
  useCarouselContext,
} from "@web-core/ui";

const slides = Array.from({ length: 6 }, (_unused, index) => `Слайд ${index + 1}`);

function PageIndicators() {
  const api = useCarouselContext();
  return (
    <CarouselIndicatorGroup>
      <For each={api().pageSnapPoints}>{(_point, index) => <CarouselIndicator index={index()} />}</For>
    </CarouselIndicatorGroup>
  );
}

function LiveProgressText() {
  const api = useCarouselContext();
  return <CarouselProgressText>{api().getProgressText()}</CarouselProgressText>;
}

export function SlidesPerPageDemo() {
  return (
    <Carousel slideCount={slides.length} slidesPerPage={2} spacing="16px">
      <CarouselControl>
        <CarouselPrevTrigger>‹</CarouselPrevTrigger>
        <LiveProgressText />
        <CarouselNextTrigger>›</CarouselNextTrigger>
      </CarouselControl>
      <CarouselItemGroup>
        <For each={slides}>{(slide, index) => <CarouselItem index={index()}>{slide}</CarouselItem>}</For>
      </CarouselItemGroup>
      <PageIndicators />
    </Carousel>
  );
}
```

Полезно проверить: точек ровно `slides.length / slidesPerPage`, не по одной на слайд, и
`CarouselProgressText` показывает живой «2 из 3», а не пусто.

## 4. Вертикальная ориентация

`orientation="vertical"` — та же композиция, стрелки сами разворачиваются вверх/вниз.

```tsx
import { For } from "solid-js";
import {
  Carousel,
  CarouselControl,
  CarouselPrevTrigger,
  CarouselNextTrigger,
  CarouselItemGroup,
  CarouselItem,
} from "@web-core/ui";

const slides = ["Первый слайд", "Второй слайд", "Третий слайд"];

export function VerticalCarouselDemo() {
  return (
    <Carousel slideCount={slides.length} orientation="vertical">
      <CarouselItemGroup style={{ height: "12rem" }}>
        <For each={slides}>{(slide, index) => <CarouselItem index={index()}>{slide}</CarouselItem>}</For>
      </CarouselItemGroup>
      <CarouselControl>
        <CarouselPrevTrigger>▲</CarouselPrevTrigger>
        <CarouselNextTrigger>▼</CarouselNextTrigger>
      </CarouselControl>
    </Carousel>
  );
}
```

Полезно проверить: `[data-orientation="vertical"]` на всех частях, скролл идёт по Y, а не по X.

## 5. Индикатор только для чтения

`readOnly` на отдельной точке — показывает текущий слайд, но клик по ней не листает. Удобно, когда
навигация уже есть где-то ещё (стрелки, свайп), а точки — просто статус.

```tsx
<CarouselIndicator index={2} readOnly />
```

Полезно проверить: у этой точки `[data-readonly]`, клик по ней не двигает `itemGroup`, а по соседним
— двигает как обычно.

## 6. Внешнее управление — `useCarousel` + `CarouselRootProvider`

Машину заводит сам потребитель и держит её состояние снаружи дерева — кнопки-стрелки могут стоять
физически где угодно, не только внутри `CarouselControl`.

```tsx
import { For } from "solid-js";
import { CarouselRootProvider, CarouselItemGroup, CarouselItem, useCarousel } from "@web-core/ui";

const slides = ["Первый слайд", "Второй слайд", "Третий слайд"];

export function ExternalControlDemo() {
  const carousel = useCarousel({ slideCount: slides.length });

  return (
    <div>
      <button onClick={() => carousel().scrollPrev()} disabled={!carousel().canScrollPrev}>
        ‹ снаружи
      </button>
      <button onClick={() => carousel().scrollNext()} disabled={!carousel().canScrollNext}>
        снаружи ›
      </button>

      <CarouselRootProvider value={carousel}>
        <CarouselItemGroup>
          <For each={slides}>{(slide, index) => <CarouselItem index={index()}>{slide}</CarouselItem>}</For>
        </CarouselItemGroup>
      </CarouselRootProvider>
    </div>
  );
}
```

Полезно проверить: кнопки снаружи `CarouselRootProvider` реально листают, `disabled` считается тем
же `canScrollPrev`/`canScrollNext`, что и у штатного `CarouselPrevTrigger`.

## 7. Вложенная карусель — один пульт сверху рулит активной внутренней

Повод, из-за которого появились `useCarousel`/`CarouselRootProvider`: внешняя карусель карточек,
у каждой карточки своя внутренняя галерея. Один пульт наверху не едет вместе с карточкой (он вне
`itemGroup` внешней карусели) и всегда управляет именно той внутренней каруселью, что сейчас видна
— не своей собственной.

```tsx
import { createMemo, For } from "solid-js";
import {
  CarouselItemGroup,
  CarouselItem,
  CarouselRootProvider,
  useCarousel,
  type UseCarouselReturn,
} from "@web-core/ui";

const cards = [
  { title: "Карточка A", gallery: ["A · фото 1", "A · фото 2", "A · фото 3"] },
  { title: "Карточка B", gallery: ["B · фото 1", "B · фото 2"] },
  { title: "Карточка C", gallery: ["C · фото 1", "C · фото 2", "C · фото 3", "C · фото 4"] },
];

function InnerGallery(props: { gallery: string[]; onReady: (api: UseCarouselReturn) => void }) {
  const inner = useCarousel({ slideCount: props.gallery.length });
  props.onReady(inner);

  return (
    <CarouselRootProvider value={inner}>
      <CarouselItemGroup>
        <For each={props.gallery}>{(photo, index) => <CarouselItem index={index()}>{photo}</CarouselItem>}</For>
      </CarouselItemGroup>
    </CarouselRootProvider>
  );
}

export function NestedCarouselDemo() {
  const outer = useCarousel({ slideCount: cards.length });
  const innerApis: UseCarouselReturn[] = [];

  const activeInner = createMemo(() => innerApis[outer().page]);

  return (
    <div>
      <div style={{ position: "sticky", top: "0" }}>
        <button onClick={() => activeInner()?.().scrollPrev()}>‹ фото</button>
        <button onClick={() => activeInner()?.().scrollNext()}>фото ›</button>
      </div>

      <CarouselRootProvider value={outer}>
        <CarouselItemGroup>
          <For each={cards}>
            {(card, index) => (
              <CarouselItem index={index()}>
                <p>{card.title}</p>
                <InnerGallery gallery={card.gallery} onReady={(api) => (innerApis[index()] = api)} />
              </CarouselItem>
            )}
          </For>
        </CarouselItemGroup>
      </CarouselRootProvider>
    </div>
  );
}
```

Полезно проверить: листаешь карточки внешней каруселью (свайпом/своим контролом, если добавишь) —
кнопки `‹ фото`/`фото ›` наверху ВСЕГДА двигают фото именно той карточки, что сейчас видна, а сами
никогда не едут вместе с карточками, потому что стоят вне `itemGroup` внешней карусели.

## 8. Перекрёстная карусель — одна карусель, две оси, четыре кнопки

Одна матрица (строки × ячейки), одна текущая позиция, один пульт ▲▼◀▶ снаружи — снаружи это должно
читаться как одна карусель. Но сама машина Ark/Zag всегда едет только по одной оси за раз
(`orientation` — это направление ОДНОГО экземпляра, не двух сразу), поэтому под капотом это
вертикальная карусель СТРОК, где каждая строка сама по себе — горизонтальная карусель ЯЧЕЕК. `▲/▼`
дёргают внешнюю (строку), `◀/▶` дёргают внутреннюю той строки, что сейчас видна — тот же приём
routing'а «активного» инстанса, что и в примере 7, только теперь оба направления собраны в один
общий пульт, а не два отдельных виджета рядом.

Индикаторы читают то же самое: точки строк живут при `rows`-провайдере, сбоку от `itemGroup` строк
(`display: flex-direction: column`, поэтому справа, не снизу), точки ячеек — свои у каждой строки,
внутри её собственного `RootProvider`, под её `itemGroup`. А «название в контрол» — просто чтение
`page` нужного api и подстановка в данные: `matrix[rows().page]` для строки, тот же приём на уровень
глубже для ячейки. Реактивность бесплатная — `page` это сигнал внутри `api`, `createMemo` сам
пересчитается.

```tsx
import { createMemo, For } from "solid-js";
import {
  CarouselItemGroup,
  CarouselItem,
  CarouselIndicatorGroup,
  CarouselIndicator,
  CarouselRootProvider,
  useCarousel,
  type UseCarouselReturn,
} from "@web-core/ui";

type Cell = { name: string; content: string };
type Row = { name: string; cells: Cell[] };

const matrix: Row[] = [
  {
    name: "Строка A",
    cells: [
      { name: "A1", content: "Контент A1" },
      { name: "A2", content: "Контент A2" },
      { name: "A3", content: "Контент A3" },
    ],
  },
  {
    name: "Строка B",
    cells: [
      { name: "B1", content: "Контент B1" },
      { name: "B2", content: "Контент B2" },
    ],
  },
  {
    name: "Строка C",
    cells: [
      { name: "C1", content: "Контент C1" },
      { name: "C2", content: "Контент C2" },
      { name: "C3", content: "Контент C3" },
      { name: "C4", content: "Контент C4" },
    ],
  },
];

function RowCarousel(props: { cells: Cell[]; onReady: (api: UseCarouselReturn) => void }) {
  const cells = useCarousel({ slideCount: props.cells.length });
  props.onReady(cells);

  return (
    <CarouselRootProvider value={cells}>
      <CarouselItemGroup>
        <For each={props.cells}>{(cell, index) => <CarouselItem index={index()}>{cell.content}</CarouselItem>}</For>
      </CarouselItemGroup>
      {/* индикаторы ячеек — снизу горизонтальной карусели */}
      <CarouselIndicatorGroup style={{ display: "flex", "margin-top": "4px" }}>
        <For each={props.cells}>{(_cell, index) => <CarouselIndicator index={index()} />}</For>
      </CarouselIndicatorGroup>
    </CarouselRootProvider>
  );
}

export function CrossCarouselDemo() {
  const rows = useCarousel({ slideCount: matrix.length, orientation: "vertical" });
  const rowApis: UseCarouselReturn[] = [];

  const activeRow = createMemo(() => rowApis[rows().page]);
  const activeRowName = createMemo(() => matrix[rows().page].name);
  const activeCellName = createMemo(() => {
    const cellsApi = activeRow();
    return cellsApi ? matrix[rows().page].cells[cellsApi().page]?.name : undefined;
  });

  return (
    <div>
      <div>
        <button onClick={() => rows().scrollPrev()} disabled={!rows().canScrollPrev}>
          ▲
        </button>
        <button onClick={() => rows().scrollNext()} disabled={!rows().canScrollNext}>
          ▼
        </button>
        <strong>{activeRowName()}</strong>

        <button onClick={() => activeRow()?.().scrollPrev()} disabled={!activeRow()?.().canScrollPrev}>
          ◀
        </button>
        <button onClick={() => activeRow()?.().scrollNext()} disabled={!activeRow()?.().canScrollNext}>
          ▶
        </button>
        <strong>{activeCellName()}</strong>
      </div>

      <div style={{ display: "flex" }}>
        <CarouselRootProvider value={rows}>
          <CarouselItemGroup style={{ height: "3rem" }}>
            <For each={matrix}>
              {(row, index) => (
                <CarouselItem index={index()}>
                  <RowCarousel cells={row.cells} onReady={(api) => (rowApis[index()] = api)} />
                </CarouselItem>
              )}
            </For>
          </CarouselItemGroup>
          {/* индикаторы строк — сбоку справа от вертикальной карусели */}
          <CarouselIndicatorGroup style={{ display: "flex", "flex-direction": "column", "margin-left": "8px" }}>
            <For each={matrix}>{(_row, index) => <CarouselIndicator index={index()} />}</For>
          </CarouselIndicatorGroup>
        </CarouselRootProvider>
      </div>
    </div>
  );
}
```

Полезно проверить: `▲/▼` переключают строку (A/B/C), `◀/▶` двигают ячейку внутри ТЕКУЩЕЙ строки —
переключился на строку B и жмёшь `◀/▶`, едут B1/B2, а не A. Вернулся на A — своя позиция внутри
строки A сохранилась (каждая строка помнит свою ячейку, это её собственный `useCarousel()`, он не
пересоздаётся при уходе строки из виду). `<strong>` рядом с `▲▼` и рядом с `◀▶` всегда показывает имя
ИМЕННО текущей строки/ячейки, даже если кликать не по кнопкам, а по точкам-индикаторам — оба читают
один и тот же `page`. Точки строк — столбиком справа от строк, точки ячеек — строкой под содержимым
каждой строки, обычные `CarouselIndicator`, клик по ним листает так же, как клик по стрелкам.

## 9. Рендер через движок

Та же композиция, что в примере 1, но собранная по схеме (сборка `basic`) и нарисованная
`RenderTree`, а не руками. Полный рабочий пример с настоящим `Registry` — `test/carousel.test.tsx`
(там же фейки для `IntersectionObserver`/`ResizeObserver`, без них слайды не переключаются в jsdom,
см. `FAQ.md`). Форма схемы:

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { instanceOf } from "@web-core/skin/editor";

const data = { slide1: { label: "Первый" }, slide2: { label: "Второй" }, slide3: { label: "Третий" } };
const tree = instanceOf("carousel", {}, "basic", data);

<RenderTree tree={tree} registry={registry} data={data} />;
```

`registry` здесь — не заглушка, а настоящий `Registry` со всеми компонентами, которые могут
встретиться в дереве; собирать его вручную под один компонент нет смысла — берите готовый из
`apps/skin` (`RenderTree`/`registry` уже подключены там для витрины/плейграунда).

## Подключить для живого теста в `apps/skin`

`apps/skin/src/pages/lab/index.tsx` — dev-страница:

```tsx
import { NestedCarouselDemo } from "..."; // любой пример выше

export function LabPage() {
  return <NestedCarouselDemo />;
}
```
