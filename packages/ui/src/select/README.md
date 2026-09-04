# 🔽 Select

<h2 id="главное">🏠 Главное</h2>

🏷️ inputs · 🧬 component · 📐 regular · 📦 `@web-core/ui`

Выбор одного или нескольких значений из списка 🔽 — выпадающим списком, а не радио-кнопками или
чекбоксами: список открывается по клику, живёт поверх остального содержимого страницы и
закрывается сам после выбора (если выбор одиночный).

<h2 id="анатомия">🧩 Анатомия</h2>

Список открывается поверх страницы, не сдвигая её содержимое — та же плавающая механика, что у
всплывающих подсказок и поповеров. Пункты можно показывать плоским списком или сгруппированными
под общей подписью.

```
root
├─ label 🏷️
├─ control
│  ├─ trigger
│  │  └─ valueText
│  ├─ clearTrigger ✕
│  └─ indicator
└─ positioner
   └─ content 📃
      ├─ list
      ├─ itemGroup 📁
      │  ├─ itemGroupLabel 🏷️
      │  └─ item[]
      │     ├─ itemText
      │     └─ itemIndicator ✓
      └─ item[] (напрямую, без группы)
```

| часть              | значение                                                                 | принимает внутри                                  | рисуется                     |
| ------------------- | -------------------------------------------------------------------------| --------------------------------------------------- | ----------------------------- |
| 🔽 `root`           | селект целиком — подпись, контрол и плавающий список вместе              | `label`, `control`, `positioner`                    | `Select`                      |
| 🏷️ `label`          | собственная подпись селекта                                              | текст                                                | `SelectLabel`                 |
| `control`           | оборачивает триггер и его индикаторы — видимая рамка, в которой сидит триггер | `trigger`, `clearTrigger`, `indicator`         | `SelectControl`               |
| `trigger`           | кнопка, открывающая и закрывающая список                                 | `valueText`                                          | `SelectTrigger`               |
| `valueText`         | показывает выбранное значение(я), либо плейсхолдер, если ничего не выбрано | —                                                  | `SelectValueText`             |
| ✕ `clearTrigger`    | кнопка, сбрасывающая текущий выбор                                       | текст, иконка                                        | `SelectClearTrigger`          |
| `indicator`         | индикатор открыт/закрыт — стрелку кладёт потребитель                     | текст, иконка                                        | `SelectIndicator`             |
| `positioner`        | позиционирует плавающий список относительно триггера                     | `content`                                            | `SelectPositioner`            |
| 📃 `content`        | сам плавающий список — здесь живут пункты, сгруппированные или нет       | `list`, `itemGroup`, `item`                          | `SelectContent`               |
| `list`              | внутренняя область списка внутри `content` — необязательная альтернатива вложению пунктов прямо в него | `itemGroup`, `item`          | `SelectList`                  |
| 📁 `itemGroup`      | группирует связанные пункты под одной подписью                           | `itemGroupLabel`, `item`                             | `SelectItemGroup`             |
| 🏷️ `itemGroupLabel` | подпись группы пунктов                                                   | текст                                                | `SelectItemGroupLabel`        |
| `item`              | один выбираемый пункт                                                    | `itemText`, `itemIndicator`                          | `SelectItem`                  |
| `itemText`          | видимая подпись пункта                                                   | текст                                                | `SelectItemText`              |
| ✓ `itemIndicator`   | указатель выбранного пункта — галочку кладёт потребитель                 | текст, иконка                                        | `SelectItemIndicator`         |

`hiddenSelect` (нативный `<select>` для форм и autofill) рисуется, но у него нет адреса в
паспорте — рисовать его снаружи схемы, ключа в паспортной карте кита для него нет.

> [!NOTE]
> `positioner` порталится в `document.body` (`Portal` из `solid-js/web`) — без этого более поздний,
> ничем с ним не связанный сосед где-то ещё на реальной странице молча перехватывал каждый клик,
> найдено вживую на практике. Единственный компонент-файл этого набора с комментарием в коде — сам
> факт нетривиален, сохранён как есть.

<h2 id="использование">🚀 Использование</h2>

От одиночного выбора до групп пунктов и множественного выбора — каждая часть подключается
отдельно. 🔀

**Ручная сборка** — компонент собирается вручную, JSX-композицией, без схемы и движка. Корень берёт
плоские `items` (не готовую коллекцию) и сам строит из них настоящий `ListCollection` внутри,
мемоизированный — тот же приём, что и у `listbox`'а.

```tsx
<Select items={[{ value: "us", label: "United States" }]}>
  <SelectLabel>Страна</SelectLabel>
  <SelectControl>
    <SelectTrigger>
      <SelectValueText placeholder="Выберите страну" />
    </SelectTrigger>
    <SelectClearTrigger>✕</SelectClearTrigger>
    <SelectIndicator>▾</SelectIndicator>
  </SelectControl>
  <SelectPositioner>
    <SelectContent>
      <SelectItem item={{ value: "us", label: "United States" }}>
        <SelectItemText>United States</SelectItemText>
        <SelectItemIndicator>✓</SelectItemIndicator>
      </SelectItem>
    </SelectContent>
  </SelectPositioner>
</Select>
```

**Рендер через движок** — та же композиция, но по схеме (сборка `basic`), которую рисует
`RenderTree`.

```tsx
const data = {
  label: "Страна",
  placeholder: "Выберите страну",
  items: [{ value: "us", label: "США" }],
};
const tree = instanceOf("select", {}, "basic", data);

<RenderTree tree={tree} registry={registry} data={data} />;
```

**Группы пунктов.**

```tsx
<SelectContent>
  <SelectItemGroup>
    <SelectItemGroupLabel>Северная Америка</SelectItemGroupLabel>
    <SelectItem item={{ value: "us", label: "United States" }}>
      <SelectItemText>United States</SelectItemText>
      <SelectItemIndicator>✓</SelectItemIndicator>
    </SelectItem>
  </SelectItemGroup>
</SelectContent>
```

**Множественный выбор.** `multiple` — клик добавляет пункт к выбору, не заменяет его; `valueText`
показывает выбранные значения через запятую.

```tsx
<Select items={days} multiple>
  <SelectLabel>Выберите дни</SelectLabel>
  <SelectControl>
    <SelectTrigger>
      <SelectValueText placeholder="Ничего не выбрано" />
    </SelectTrigger>
  </SelectControl>
  <SelectPositioner>
    <SelectContent>
      <For each={days}>
        {(item) => (
          <SelectItem item={item}>
            <SelectItemText>{item.label}</SelectItemText>
            <SelectItemIndicator>✓</SelectItemIndicator>
          </SelectItem>
        )}
      </For>
    </SelectContent>
  </SelectPositioner>
</Select>
```

<h2 id="состояния">🎛️ Состояния</h2>

Открыт/закрыт — про список целиком, отражается сразу на нескольких частях снаружи него. Пункты
внутри знают только своё — выбран ли именно этот пункт и подсвечен ли он клавиатурой или
указателем прямо сейчас, независимо от того, что происходит с остальными.

|      | часть                             | состояние        | метка                            | значение                                                    |
| ---- | ----------------------------------- | ------------------ | ----------------------------------- | -------------------------------------------------------------- |
| ❌   | root                                 | invalid            | `[data-invalid]`                    | селект невалиден по правилам валидации формы                   |
| 🔒   | root                                 | readonly           | `[data-readonly]`                   | значение видно, выбрать другое нельзя                           |
| 🚫   | label, valueText                     | disabled           | `[data-disabled]`                   | селект отключён                                                 |
| ❌   | label, valueText                     | invalid            | `[data-invalid]`                    | селект невалиден по правилам валидации формы                   |
| 🔒   | label                                 | readonly           | `[data-readonly]`                   | значение видно, выбрать другое нельзя                           |
| ❗   | label                                 | required           | `[data-required]`                   | выбор обязателен для отправки формы                            |
| 🔓   | control, trigger, indicator          | open               | `[data-state="open"]`               | список открыт                                                   |
| 🔐   | control, trigger, indicator          | closed             | `[data-state="closed"]`             | список закрыт                                                   |
| 🎯   | control, valueText                   | focus               | `[data-focus]`                      | фокус на триггере, зеркалится сюда — сам `control` фокус принять не может |
| 🚫   | control, trigger, indicator          | disabled           | `[data-disabled]`                   | селект отключён                                                 |
| ❌   | control, trigger, indicator          | invalid            | `[data-invalid]`                    | селект невалиден по правилам валидации формы                   |
| 🔒   | trigger, indicator                   | readonly           | `[data-readonly]`                   | значение видно, выбрать другое нельзя                           |
| ⬜   | trigger                              | placeholder        | `[data-placeholder-shown]`          | значение ещё не выбрано — показан текст плейсхолдера            |
| 👆   | trigger, clearTrigger                | hover              | `:hover`                            | указатель наведён                                                |
| ⌨️   | trigger, clearTrigger                | focus-visible      | `:focus-visible`                    | фокус пришёл с клавиатуры — нужна обводка; при клике мышью это шум |
| 👇   | trigger, clearTrigger                | active             | `:active`                           | элемент нажат и удерживается                                    |
| ❌   | clearTrigger                         | invalid            | `[data-invalid]`                    | селект невалиден по правилам валидации формы                   |
| 🚫   | clearTrigger                         | disabled           | `:disabled`                         | кнопка отключена — клик ничего не делает                        |
| 🔓   | content                              | open               | `[data-state="open"]`               | список открыт                                                   |
| 🔐   | content                              | closed             | `[data-state="closed"]`             | список закрыт                                                   |
| 🚫   | itemGroup                            | disabled           | `[data-disabled]`                   | селект отключён                                                 |
| ✅   | item, itemText                       | checked            | `[data-state="checked"]`            | пункт выбран                                                     |
| ⬜   | item, itemText                       | unchecked          | `[data-state="unchecked"]`          | пункт не выбран                                                  |
| 🎯   | item, itemText                       | highlighted        | `[data-highlighted]`                | пункт подсвечен — клавиатура или указатель перешли на него, но ещё не выбрали |
| 🚫   | item, itemText                       | disabled           | `[data-disabled]`                   | пункт нельзя выбрать                                             |
| ✅   | itemIndicator                        | checked            | `[data-state="checked"]`            | пункт выбран                                                     |
| ⬜   | itemIndicator                        | unchecked          | `[data-state="unchecked"]`          | пункт не выбран                                                  |

`positioner`, `list`, `itemGroupLabel` состояний не несут вовсе.

> [!NOTE]
> `disabled` на `clearTrigger` — выбор в пользу нативного атрибута (`:disabled`), не атрибута
> данных: коннектор кладёт настоящий `disabled` на эту кнопку, `data-disabled` нет. Остальным
> состояниям селекта, где коннектор кладёт атрибут данных (`control`, `trigger`, `indicator`,
> `itemGroup`, `item`, `itemText`), объявлен именно он — паспорт следует тому, что реально положено
> на узел, а не подгоняет форму под соседей.

> [!NOTE]
> `open`/`closed` на `content` — БЕЗУСЛОВНОЕ `data-state`, в отличие от `accordion`'s содержимого,
> которое несёт `[hidden]` вместо `data-state` в закрытом состоянии. У селекта коннектор кладёт
> `data-state="open"|"closed"` на `content` всегда, независимо от того, смонтирован ли узел, — не
> находка-отклонение, реальное структурное отличие между двумя компонентами, проверено по
> коннектору `@zag-js/select`.

> [!NOTE]
> `focus` на `control`/`valueText` — зеркальное состояние. Фокус физически стоит на `trigger`
> (единственный реально фокусируемый узел в этой ветке), но коннектор дублирует `data-focus` на
> `control` и `valueText` тоже — тот же приём зеркалирования состояния, что уже применён на других
> компонентах этого набора, где визуально родственные части должны реагировать на фокус ребёнка
> вместе.

<h2 id="настройки">🎚️ Настройки</h2>

Единственная настройка решает, ведёт ли себя список как обычный одиночный выбор (список
закрывается сразу после клика) или как множественный (клик добавляет пункт к выбору, список
остаётся открытым).

| настройка  | значения | по умолчанию | означает                                    |
| ---------- | -------- | ------------- | -------------------------------------------- |
| `multiple` | флаг     | `false`       | можно ли выбрать сразу несколько пунктов      |

<h2 id="io">🔌 IO</h2>

Собранному по схеме селекту нужны подпись, необязательный текст плейсхолдера и список пунктов —
каждый со своим ключом и подписью.

<h3 id="io-вход">📥 Вход</h3>

```json
{
  "label": "string",
  "placeholder": "string?",
  "items": [{ "value": "string", "label": "string" }]
}
```

<h3 id="io-выход">📤 Выход</h3>

```json
{ "value": ["string"] }
```

Ключи выбранных пунктов как есть — селект не решает, что они значат, только сообщает, что выбрали.

<h2 id="сборки">🏗️ Сборки</h2>

Одна сборка — подпись, кнопка-триггер с текстом значения и список пунктов, всё из данных.

<h3 id="сборка-basic">🧱 basic</h3>

```
root · bind: items
  label 🏷️ · text: {label}
  control
    trigger
      valueText · bind: placeholder
    indicator
  positioner
    content 📃
      item[] · repeat: /items · bind: item · on: click → select
        itemText · text: {label}
        itemIndicator ✓
```

`repeat: { path: "/items" }` на `item` называет только раскладку — «здесь список, сколько бы
пунктов данные ни принесли», не количество; `bind: { item: "" }` пустым путём передаёт весь текущий
элемент повтора целиком (`scopedPath`, тот же приём, что у `listbox`'s `basic`). Клик по пункту
диспатчит `"select"` с всем пунктом как `payload` (снова пустой путь) — тот же путь, что слушает
`item-list.tsx` компонента.

<h2 id="рецепт">🎨 Рецепт</h2>

`valueText` использует `ancestors` — реагирует на состояние `placeholder` СВОЕГО РОДИТЕЛЯ,
`trigger`, а не собственное: пока выбор не сделан, текст плейсхолдера красится приглушённым тоном
через ту же цепочку.

`content` не задаёт `display` в закрытом состоянии — как и у `listbox`, не хочет спорить с
собственным механизмом скрытия, который коннектор уже решает через `[hidden]`; `itemIndicator`
следует тому же правилу для своего `unchecked`, используя `pointerEvents: "none"` вместо `display`.

> [!WARNING]
> `itemIndicator`'s `color` изначально был поставлен заливочным токеном (`--accent-9`) на свойство
> `color` — `step-purpose-mismatch`, `skinGaps` не пропустил бы, но `checkSkin` поймал раньше: шаги
> 1–10 не несут гарантии контраста, `color` должен брать чернильный класс (`--accent-11`).

<h2 id="доступность">♿ Доступность</h2>

Селект следует паттерну WAI-ARIA [Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)
(как выпадающий комбо-бокс). Стрелки вверх/вниз двигают подсветку и открывают список, если он
закрыт; `Space`/`Enter` выбирает подсвеченный пункт и закрывает список (кроме `multiple`, где он
остаётся открыт); `Escape` закрывает без выбора; `typeahead` прыгает к пункту по вводу текста.
`loopFocus` решает, оборачивается ли навигация с последнего пункта на первый. ⌨️
