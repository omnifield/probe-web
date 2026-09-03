# 🔘 Radio Group

🏷️ inputs · 🧬 component · 📐 regular · 📦 `@omnifield/probe-web-ui`

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
> `RadioGroupItemHiddenInput` ВСЁ ЖЕ экспортируется наружу — Ark's собственная дока по `asChild`
> прямо требует вручную положить его внутрь своей `<label>`-разметки при ручной композиции, тот
> случай, которого у чекбокса не нашлось.
>
> `indicator` — не галочка внутри пункта, а ОДИН узел на весь набор (прямой сосед `item`, не его
> потомок): та же механика, что и у скользящего указателя табов (`--left`/`--top`/`--width`/
> `--height`, кит сам измеряет выбранный пункт и позиционирует индикатор поверх него).

<h2 id="состояния">🎛️ Состояния</h2>

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
> скрытом `<input>` каждого пункта, не на видимых узлах, Zag следит сам и зеркалит результат данными
> (та же находка, что у чекбокса). `active` — только на `itemControl`, ни `item`, ни `itemText` его
> не несут. `indicator` несёт только групповой `disabled`, своего `data-state` у него нет — один
> общий узел, не про один пункт.

<h2 id="настройки">🎚️ Настройки</h2>

| настройка     | значения                | по умолчанию | означает                                                          |
| ------------- | ------------------------ | -------------- | ---------------------------------------------------------------- |
| `orientation` | `vertical`/`horizontal`  | `vertical`     | как расположены пункты — от этого зависит навигация с клавиатуры |

<h2 id="io">🔌 IO</h2>

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

Доказательный рецепт (`playground/recipe.ts`) — доказывает, что паспорт МОЖНО одеть целиком
настоящей скин-механикой (`skinGaps` пуст, CSS реально генерируется). В продакшене не участвует.

`indicator` — маленькая точка, центрированная над кружком ВЫБРАННОГО пункта, а не полноразмерная
плашка табов: `--width`/`--height` здесь — размер `itemControl`, точке нужно лишь встать в его
середину (`calc(var(--left) + (var(--width) - 0.5rem) / 2)`), не заполнить его целиком.

Одиннадцать состояний на шести частях означают много слотов — большинство визуально нейтральны, но
`skinGaps` требует адресовать все явно (пустое правило не засчитывается): нейтральные случаи
оформлены безобидными, но настоящими правилами (например, `item`'s `checked`/`unchecked` — тот же
`cursor: "pointer"`, что уже в базе, просто явно), тем же приёмом, что уже применён у чекбокса.

`orientation: "horizontal"` меняет только `root`'s `flexDirection` — сама раскладка пункта не
зависит от оси.

<h2 id="использование">🚀 Использование</h2>

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
import { RadioGroupItemHiddenInput } from "@omnifield/probe-web-ui";

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
