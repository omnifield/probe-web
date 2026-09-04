# 🎚️ Segment Group

<h2 id="главное">🏠 Главное</h2>

🏷️ inputs · 🧬 component · 📐 compact · 📦 `@web-core/ui`

Переключатель между несколькими вариантами 🎚️, где выбран всегда ровно один — используйте вместо
обычных радио-кнопок, когда вариантов немного и они умещаются в один компактный ряд или столбец:
вид сортировки, единицы измерения, переключение между «Список»/«Плитка». Между вариантами скользит
единая пилюля-указатель, а не переставляется галочка на каждом — тот же принцип, что у сегментного
контрола в мобильных интерфейсах.

<h2 id="анатомия">🧩 Анатомия</h2>

Скользящая пилюля — отдельная часть, а не декорация на выбранном сегменте: один общий узел на весь
набор, кит сам измеряет и позиционирует её под текущий выбор. 🧩

```
root
├─ label 🏷️
├─ indicator ▬
└─ item[] 🎚️
   ├─ itemControl ▭
   └─ itemText
```

| часть            | значение                                                          | принимает внутри                              | рисуется                       |
| ------------------ | -------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------- |
| 🎚️ `root`         | переключатель целиком — оборачивает подпись, скользящую пилюлю и каждый сегмент | `label`, `item`, `indicator`          | `SegmentGroup`           |
| 🏷️ `label`        | собственная подпись набора — описывает весь набор, не один сегмент  | текст                                                | `SegmentGroupLabel`      |
| 🎚️ `item`         | один сегмент — кликабельная область целиком, клик в любом месте выбирает его | `itemControl`, `itemText`             | `SegmentGroupItem`       |
| ▭ `itemControl`   | видимая поверхность сегмента — то, под что подстраивается размер скользящей пилюли | —                                     | `SegmentGroupItemControl` |
| `itemText`        | видимая подпись сегмента                                             | текст                                                | `SegmentGroupItemText`   |
| ▬ `indicator`     | единая скользящая пилюля выбранного сегмента — кит сам измеряет и позиционирует её, своего графика не несёт | — | `SegmentGroupIndicator`  |

> [!NOTE]
> НЕ отдельная машина — это машина набора радио-кнопок (`@zag-js/radio-group`), переименованная.
> Собственная `@ark-ui/solid`'s `segment-group.anatomy.ts` буквально делает `import { anatomy }
> from "@zag-js/radio-group"; anatomy.rename("segment-group")` (проверено в собранном чанке), и на
> уровень глубже: `use-segment-group.ts` берёт `* as segmentGroup from "@zag-js/radio-group"` и
> вызывает ЕГО СОБСТВЕННЫЕ `machine`/`connect` напрямую. Отдельного пакета `@zag-js/segment-group`
> не существует вовсе (проверено — отсутствует в `node_modules`). `.rename(...)` меняет только
> значение `data-scope`, который кладёт `.build()` (`"radio-group"` → `"segment-group"`), набор
> частей остаётся ровно тем же — шестью, идентичным `radio-group`'у. Подробнее — `FAQ.md`.
>
> Настоящее исключение из общего правила «анатомия всегда напрямую из `@zag-js/<x>/anatomy`»
> (третье после карусели и поля) — здесь она берётся из ЧУЖОГО пакета и переименовывается, а не
> из своего собственного.

> [!NOTE]
> Каждый `item` несёт своё собственное скрытое `<input type="radio">` сам, тем же приёмом, что и
> `radio-group`'s собственный `item` — `hiddenInput` не тянет данные из сборки, только контекст,
> который уже поднял тот же `item`, поэтому в карту кита не входит и своего адреса в паспорте не
> несёт. `SegmentGroupItemHiddenInput` при этом остаётся экспортированным отдельно — нужен при
> ручной композиции с `asChild` (почему — `FAQ.md`).

<h2 id="использование">🚀 Использование</h2>

От ручной композиции до формы, ручной разметки сегмента и отключения одного варианта — каждая
часть подключается отдельно. 🔀

**Ручная сборка** — компонент собирается вручную, JSX-композицией, без схемы и движка. Скрытый
`<input>` класть не нужно — каждый `SegmentGroupItem` несёт его сам.

```tsx
<SegmentGroup defaultValue="list">
  <SegmentGroupLabel>Вид</SegmentGroupLabel>
  <SegmentGroupIndicator />
  <SegmentGroupItem value="list">
    <SegmentGroupItemControl />
    <SegmentGroupItemText>Список</SegmentGroupItemText>
  </SegmentGroupItem>
  <SegmentGroupItem value="grid">
    <SegmentGroupItemControl />
    <SegmentGroupItemText>Плитка</SegmentGroupItemText>
  </SegmentGroupItem>
</SegmentGroup>
```

**Рендер через движок** — та же композиция, но по схеме (сборка `basic`), которую рисует
`RenderTree`. Скрытый ввод кладёт сам `SegmentGroupItem` — сборке о нём знать не нужно.

```tsx
const data = {
  label: "Вид",
  items: [
    { value: "list", label: "Список" },
    { value: "grid", label: "Плитка" },
    { value: "board", label: "Доска" },
  ],
};
const tree = instanceOf("segment-group", {}, "basic", data);

<RenderTree tree={tree} registry={registry} data={data} />;
```

**Ручная композиция с `asChild`.** `SegmentGroupItem` по умолчанию рисует `<label>` сам; при
`asChild` разметку даёт потребитель, но скрытый ввод приходится класть руками —
`SegmentGroupItemHiddenInput` ради этого и остаётся публичным.

```tsx
import { SegmentGroupItemHiddenInput } from "@web-core/ui";

<SegmentGroupItem value="grid" asChild>
  <label>
    <SegmentGroupItemHiddenInput />
    <SegmentGroupItemText>
      <SegmentGroupItemControl />
      Плитка
    </SegmentGroupItemText>
  </label>
</SegmentGroupItem>
```

**Один сегмент отключён, остальные доступны.** `disabled`/`invalid` прямо на `SegmentGroupItem`
переопределяют это ТОЛЬКО для одного сегмента — набор в целом остаётся кликабельным.

```tsx
<SegmentGroup defaultValue="list">
  <SegmentGroupItem value="list">
    <SegmentGroupItemControl />
    <SegmentGroupItemText>Список</SegmentGroupItemText>
  </SegmentGroupItem>
  <SegmentGroupItem value="grid" disabled>
    <SegmentGroupItemControl />
    <SegmentGroupItemText>Плитка</SegmentGroupItemText>
  </SegmentGroupItem>
</SegmentGroup>
```

**Настоящее участие в форме.** `name` делает набор настоящим полем формы — `FormData` подхватывает
выбранное значение как родной `<input type="radio">`.

```tsx
<form onSubmit={handleSubmit}>
  <SegmentGroup name="view" defaultValue="list">
    <SegmentGroupLabel>Вид</SegmentGroupLabel>
    <SegmentGroupIndicator />
    <SegmentGroupItem value="list">
      <SegmentGroupItemControl />
      <SegmentGroupItemText>Список</SegmentGroupItemText>
    </SegmentGroupItem>
  </SegmentGroup>
  <button type="submit">Отправить</button>
</form>
```

<h2 id="настройки">🎚️ Настройки</h2>

Единственная настройка решает, куда выстроены сегменты — влияет не только на вид, но и на то,
какими стрелками клавиатура двигает выбор между ними.

| настройка     | значения                | по умолчанию | означает                                                          |
| ------------- | ------------------------ | -------------- | ------------------------------------------------------------------ |
| `orientation` | `vertical`/`horizontal`  | `vertical`     | как расположены сегменты — от этого зависит навигация с клавиатуры |

<h2 id="состояния">🎛️ Состояния</h2>

Групповые факты (`disabled`/`invalid`/`required`) видны на `root`/`label`, состояние каждого
сегмента отдельно — на `item`/`itemText`/`itemControl`. 🎯

|      | состояние      | метка                    | где                              | значение                                          |
| ---- | --------------- | -------------------------- | ------------------------------------ | ---------------------------------------------------- |
| 🚫   | disabled        | `[data-disabled]`            | root, label, item, itemText, itemControl, indicator | нельзя выбрать                       |
| ⚠️   | invalid         | `[data-invalid]`             | root, label, item, itemText, itemControl | невалиден по правилам валидации формы            |
| ❗   | required        | `[data-required]`            | root, label                          | выбор обязателен для отправки формы                  |
| ✅   | checked         | `[data-state="checked"]`     | item, itemText, itemControl          | этот сегмент выбран                                   |
| ⬜   | unchecked       | `[data-state="unchecked"]`   | item, itemText, itemControl          | этот сегмент не выбран                                |
| 🔒   | readonly        | `[data-readonly]`            | item, itemText, itemControl          | значение видно, выбрать другое нельзя                 |
| 🖱️   | hover           | `[data-hover]`               | item, itemText, itemControl          | указатель наведён на этот сегмент                     |
| 👆   | active          | `[data-active]`              | itemControl                          | этот сегмент нажат указателем                         |
| 🎯   | focus           | `[data-focus]`               | item, itemText, itemControl          | фокус стоит на скрытом вводе этого сегмента           |
| ⌨️   | focus-visible   | `[data-focus-visible]`       | item, itemText, itemControl          | фокус пришёл с клавиатуры                             |

`indicator` несёт только групповой `disabled`, своего `data-state` у него нет — один общий узел на
весь набор, не про один сегмент.

> [!NOTE]
> Каждая метка выше — собственная метка `radio-group`'а, не переоткрыта отдельно (почему —
> `FAQ.md`). `focus`/`focus-visible` — атрибуты, не псевдоклассы: настоящий DOM-фокус лежит на
> скрытом `<input>` каждого сегмента, компонент-первоисточник зеркалит результат данными. `active`
> — только на `itemControl`.

<h2 id="io">🔌 IO</h2>

Собранному по схеме набору нужны подпись и список сегментов — выбор ведёт скрытый `<input>` каждого
сегмента сам, наружу как событие не отдаётся. 📥

<h3 id="io-вход">📥 Вход</h3>

```json
{
  "label": "string",
  "items": [{ "value": "string", "label": "string" }]
}
```

<h3 id="io-выход">📤 Выход</h3>

Набор ничего не диспатчит через сборку — выбор ведёт скрытый `<input>` каждого сегмента сам, это
не событие наружу схемы (тот же приём, что и у `radio-group`).

<h2 id="сборки">🏗️ Сборки</h2>

Одна сборка — подпись и сегменты из данных, ничего изначально не выбрано. 🧱

<h3 id="сборка-basic">🧱 basic</h3>

```
root
  label 🏷️ · text: {label}
  indicator ▬
  item[] 🎚️        · repeat: /items · bind: value
    itemControl ▭
    itemText          · text: {label}
```

> [!NOTE]
> `indicator` стоит ПЕРЕД `item`ами в дереве — не порядок ради порядка. Более поздние соседи в DOM
> перекрывают более ранних; сегменты должны сидеть визуально ПОВЕРХ скользящей пилюли по одному
> лишь порядку в разметке, без `z-index`. Тот же порядок несёт собственный пример использования
> компонента-первоисточника.

<h2 id="рецепт">🎨 Рецепт</h2>

Та же машина, что у `radio-group`, но НАМЕРЕННО другой внешний вид: трек со скользящей пилюлью
(визуальная семья `toggle-group`'а), а не ряд отдельных кружков. 🎨 `indicator` заполняет
измеренный бокс ВЫБРАННОГО сегмента целиком (`--left`/`--top`/`--width`/`--height`) — в отличие от
маленькой центрированной точки `radio-group`'а, здесь пилюля и есть весь фон сегмента, тот же приём
«индикатор как поверхность выбора», что уже использует вариант `pills` у `tabs`.

`orientation: "vertical"` меняет `root`'s `flexDirection`/`alignItems` — раскладка самого сегмента
от оси не зависит.

<h2 id="доступность">♿ Доступность</h2>

Переключатель следует паттерну WAI-ARIA [Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
— та же машина, тот же паттерн. ⌨️ Стрелки вдоль оси `orientation` двигают выбор между сегментами,
`Tab` заходит в набор и выходит из него одним прыжком (roving tabindex — фокус стоит только на
выбранном сегменте).
