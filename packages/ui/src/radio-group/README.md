# 🔘 Radio Group

<h2 id="главное">🏠 Главное</h2>

🏷️ inputs · 🧬 component · 📐 regular · 📦 `@web-core/ui`

Классический выбор одного варианта из нескольких кружками 🔘 — используйте вместо `select`, когда
вариантов немного и все они должны быть видны сразу, без раскрытия списка: способ доставки, тариф,
пол. Между пунктами скользит единый указатель выбора, а не переставляется галочка на каждом.

<h2 id="анатомия">🧩 Анатомия</h2>

Скользящий указатель — отдельная часть, а не декорация на выбранном пункте: один общий узел на
весь набор, кит сам измеряет и позиционирует его под текущий выбор. 🧩

```
root
├─ label 🏷️
├─ indicator •
└─ item[] 🔘
   ├─ itemControl ⚪
   └─ itemText
```

| часть            | значение                                                    | принимает внутри              | рисуется                |
| ------------------ | -------------------------------------------------------------- | ---------------------------------- | ---------------------------- |
| ⚪ `root`         | набор целиком — оборачивает подпись, скользящий указатель и каждый пункт | `label`, `indicator`, `item`, любой компонент | `RadioGroup`     |
| 🏷️ `label`       | собственная подпись набора                                    | текст                              | `RadioGroupLabel`        |
| 🔘 `item`        | один пункт выбора — узел `<label>`, клик по нему выбирает его  | `itemControl`, `itemText`          | `RadioGroupItem`         |
| ⚪ `itemControl` | видимый кружок пункта — заполняется, когда пункт выбран        | иконку, любой компонент            | `RadioGroupItemControl`  |
| `itemText`       | видимая подпись пункта                                         | текст                              | `RadioGroupItemText`     |
| • `indicator`    | единый скользящий указатель выбранного пункта — своего графика не несёт | —                          | `RadioGroupIndicator`    |

> [!NOTE]
> Настоящий `<input type="radio">` смонтирован у КАЖДОГО пункта — кладёт его сам `RadioGroupItem`,
> потребителю добавлять его не нужно: своего адреса он не несёт, в карту кита не входит. Это
> `extras` (см. корневой README кита), но, в отличие от чекбокса, отдельный компонент
> `RadioGroupItemHiddenInput` ВСЁ ЖЕ экспортируется наружу — нужен для ручной композиции с
> `asChild` (почему — `FAQ.md`).
>
> `indicator` — не галочка внутри пункта, а ОДИН узел на весь набор (прямой сосед `item`, не его
> потомок): та же механика, что и у скользящего указателя табов (`--left`/`--top`/`--width`/
> `--height`, кит сам измеряет выбранный пункт и позиционирует индикатор поверх него). Подробнее —
> `FAQ.md`.

<h2 id="использование">🚀 Использование</h2>

От ручной композиции до формы, ручной разметки пункта и отключения одного варианта — каждая часть
подключается отдельно. 🔀

**Ручная сборка** — компонент собирается вручную, JSX-композицией, без схемы и движка. Скрытый
`<input>` класть не нужно — каждый `RadioGroupItem` несёт его сам.

```tsx
<RadioGroup defaultValue="standard">
  <RadioGroupLabel>Delivery</RadioGroupLabel>
  <RadioGroupItem value="standard">
    <RadioGroupItemControl />
    <RadioGroupItemText>Standard</RadioGroupItemText>
  </RadioGroupItem>
  <RadioGroupItem value="express">
    <RadioGroupItemControl />
    <RadioGroupItemText>Express</RadioGroupItemText>
  </RadioGroupItem>
  <RadioGroupIndicator />
</RadioGroup>
```

**Рендер через движок** — та же композиция, но по схеме (сборка `basic`), которую рисует
`RenderTree`. Скрытый ввод кладёт сам `RadioGroupItem` — сборке о нём знать не нужно.

```tsx
const data = {
  label: "Delivery",
  items: [
    { value: "standard", label: "Standard" },
    { value: "express", label: "Express" },
  ],
};
const tree = instanceOf("radio-group", {}, "basic", data);

<RenderTree tree={tree} registry={registry} data={data} />;
```

**Ручная композиция с `asChild`.** `RadioGroupItem` по умолчанию рисует `<label>` сам; при
`asChild` разметку даёт потребитель, но скрытый ввод приходится класть руками —
`RadioGroupItemHiddenInput` ради этого и остаётся публичным.

```tsx
import { RadioGroupItemHiddenInput } from "@web-core/ui";

<RadioGroupItem value="express" asChild>
  <label>
    <RadioGroupItemHiddenInput />
    <RadioGroupItemText>
      <RadioGroupItemControl />
      Express
    </RadioGroupItemText>
  </label>
</RadioGroupItem>
```

**Один пункт отключён, остальные доступны.** `disabled`/`invalid` прямо на `RadioGroupItem`
переопределяют это ТОЛЬКО для одного пункта — набор в целом остаётся кликабельным.

```tsx
<RadioGroup defaultValue="standard">
  <RadioGroupItem value="standard">
    <RadioGroupItemControl />
    <RadioGroupItemText>Standard</RadioGroupItemText>
  </RadioGroupItem>
  <RadioGroupItem value="express" disabled>
    <RadioGroupItemControl />
    <RadioGroupItemText>Express</RadioGroupItemText>
  </RadioGroupItem>
</RadioGroup>
```

**Настоящее участие в форме.** `name` делает набор настоящим полем формы — `FormData` подхватывает
выбранное значение как родной `<input type="radio">`.

```tsx
<form onSubmit={handleSubmit}>
  <RadioGroup name="delivery" defaultValue="standard">
    <RadioGroupLabel>Delivery</RadioGroupLabel>
    <RadioGroupItem value="standard">
      <RadioGroupItemControl />
      <RadioGroupItemText>Standard</RadioGroupItemText>
    </RadioGroupItem>
  </RadioGroup>
  <button type="submit">Отправить</button>
</form>
```

<h2 id="настройки">🎚️ Настройки</h2>

Единственная настройка решает, куда выстроены пункты — влияет не только на вид, но и на то, какими
стрелками клавиатура двигает выбор между ними.

| настройка     | значения                | по умолчанию | означает                                                          |
| ------------- | ------------------------ | -------------- | ---------------------------------------------------------------- |
| `orientation` | `vertical`/`horizontal`  | `vertical`     | как расположены пункты — от этого зависит навигация с клавиатуры |

<h2 id="состояния">🎛️ Состояния</h2>

Групповые факты видны на `root`/`label`, состояние каждого пункта отдельно — на `item`/`itemText`/
`itemControl`. 🎯

|      | состояние      | метка                    | где                              | значение                                          |
| ---- | --------------- | -------------------------- | ------------------------------------ | ---------------------------------------------------- |
| 🚫   | disabled        | `[data-disabled]`            | root, label, item, itemText, itemControl, indicator | нельзя выбрать                       |
| ⚠️   | invalid         | `[data-invalid]`             | root, label, item, itemText, itemControl | невалиден по правилам валидации формы            |
| ❗   | required        | `[data-required]`            | root, label                          | выбор обязателен для отправки формы                  |
| ✅   | checked         | `[data-state="checked"]`     | item, itemText, itemControl          | этот пункт выбран                                     |
| ⬜   | unchecked       | `[data-state="unchecked"]`   | item, itemText, itemControl          | этот пункт не выбран                                  |
| 🔒   | readonly        | `[data-readonly]`            | item, itemText, itemControl          | значение видно, выбрать другое нельзя                 |
| 🖱️   | hover           | `[data-hover]`               | item, itemText, itemControl          | указатель наведён на этот пункт                       |
| 👆   | active          | `[data-active]`              | itemControl                          | этот пункт нажат указателем                           |
| 🎯   | focus           | `[data-focus]`               | item, itemText, itemControl          | фокус стоит на скрытом вводе этого пункта             |
| ⌨️   | focus-visible   | `[data-focus-visible]`       | item, itemText, itemControl          | фокус пришёл с клавиатуры                             |

> [!NOTE]
> `root`/`label` несут ГРУППОВЫЕ факты (`disabled`/`invalid`/`required` — набор целиком, или форма
> отвергла его, или он обязателен), `item`/`itemText`/`itemControl` — факты КАЖДОГО пункта
> отдельно. `focus`/`focus-visible` — **атрибуты, не псевдоклассы**: настоящий DOM-фокус лежит на
> скрытом `<input>` каждого пункта, не на видимых узлах, компонент следит сам и
> зеркалит результат данными (та же находка, что у чекбокса). `active` — только на `itemControl`,
> ни `item`, ни `itemText` его не несут. `indicator` несёт только групповой `disabled`, своего
> `data-state` у него нет — один общий узел, не про один пункт.

<h2 id="io">🔌 IO</h2>

Собранному по схеме набору нужны подпись и список пунктов — выбор ведёт скрытый `<input>` каждого
пункта сам, наружу как событие не отдаётся. 📥

<h3 id="io-вход">📥 Вход</h3>

```json
{
  "label": "string",
  "items": [{ "value": "string", "label": "string" }]
}
```

<h3 id="io-выход">📤 Выход</h3>

Набор ничего не диспатчит через сборку — выбор ведёт скрытый `<input>` каждого пункта сам, это не
событие наружу схемы.

<h2 id="сборки">🏗️ Сборки</h2>

Одна сборка — подпись и пункты из данных, ничего изначально не выбрано. 🧱

<h3 id="сборка-basic">🧱 basic</h3>

```
root
  label 🏷️ · text: {label}
  item[] 🔘         · repeat: /items · bind: value
    itemControl ⚪
    itemText          · text: {label}
  indicator •
```

<h2 id="рецепт">🎨 Рецепт</h2>

`indicator` — маленькая точка, центрированная над кружком ВЫБРАННОГО пункта, а не полноразмерная
плашка табов: `--width`/`--height` здесь — размер `itemControl`, точке нужно лишь встать в его
середину (`calc(var(--left) + (var(--width) - 0.5rem) / 2)`), не заполнить его целиком. 🎨

`orientation: "horizontal"` меняет только `root`'s `flexDirection` — сама раскладка пункта не
зависит от оси.

<h2 id="доступность">♿ Доступность</h2>

Набор следует паттерну WAI-ARIA [Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) —
стрелки вдоль оси `orientation` двигают выбор между пунктами, `Tab` заходит в набор и выходит из
него одним прыжком (roving tabindex — фокус стоит только на выбранном пункте). ⌨️
