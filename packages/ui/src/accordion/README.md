# 🪗 Accordion

🏷️ disclosure · 🧬 component · 📐 regular · 📦 `@omnifield/probe-web-ui`

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
└─ item[]
   ├─ control ▶️
   │  └─ controlIndicator 🔽
   └─ content 📂
```

| часть                 | значение                                              | принимает внутри                  | рисуется                    |
| --------------------- | ----------------------------------------------------- | --------------------------------- | --------------------------- |
| 🪗 `root`             | весь набор разделов — один узел, оборачивающий каждый | только `item`                     | `Accordion`                 |
| 📁 `item`             | один раздел — кнопка вместе со своим содержимым       | `control`, `content`              | `AccordionItem`             |
| ▶️ `control`          | кнопка раздела — раскрывает и закрывает его           | текст, иконку, `controlIndicator` | `AccordionControl`          |
| 🔽 `controlIndicator` | индикатор раскрытия — стрелку кладёт потребитель      | текст, иконку, любой компонент    | `AccordionControlIndicator` |
| 📂 `content`          | содержимое раздела — область, которая раскрывается    | текст, иконку, любой компонент    | `AccordionContent`          |

<h2 id="состояния">🎛️ Состояния</h2>

|      | состояние     | метка                                                | где                                      | значение                                                                |
| ---- | ------------- | ---------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| 🔓🔒 | open / closed | `[data-state]` · у content может отсутствовать       | item, control, controlIndicator, content | раздел раскрыт / закрыт                                                 |
| 🚫   | disabled      | `[data-disabled]` · у control это `:disabled` кнопки | item, control, controlIndicator, content | раздел отключён — на `control` это НАСТОЯЩИЙ атрибут кнопки, не `data-` |
| 🎯   | focus         | `[data-focus]`                                       | item, control, controlIndicator, content | фокус стоит на кнопке раздела                                           |
| 🖱️   | hover         | `:hover`                                             | control                                  | указатель наведён на кнопку                                             |
| ⌨️   | focus-visible | `:focus-visible`                                     | control                                  | фокус пришёл с клавиатуры — при клике мышью это было бы шумом           |
| 👆   | active        | `:active`                                            | control                                  | кнопка нажата и удерживается                                            |

<h2 id="настройки">🎚️ Настройки</h2>

| настройка     | значения                | по умолчанию | означает                                                                            |
| ------------- | ----------------------- | ------------ | ----------------------------------------------------------------------------------- |
| `orientation` | `vertical`/`horizontal` | `vertical`   | как расположены разделы — от этого зависит навигация с клавиатуры и aria            |
| `multiple`    | вкл/выкл                | выкл         | можно ли держать раскрытыми сразу несколько разделов                                |
| `collapsible` | вкл/выкл                | выкл         | можно ли закрыть последний раскрытый раздел (не нужно, если `multiple` уже включён) |

<h2 id="io">🔌 IO</h2>

<h3 id="io-вход">📥 Вход</h3>

```json
{
  "sections": [
    {
      "id": "string",
      "title": "string",
      "items": [{ "value": "string", "label": "string" }],
      "activeValues": ["string"]
    }
  ]
}
```

<h3 id="io-выход">📤 Выход</h3>

```tsx
const onDispatch = (event: DispatchedEvent) => {
  // Клик по кнопке раздела, возвращает данные раздела целиком, кроме вложенных items.
  // event.context.payload = { id: "a", title: "Alpha" }
};

<RenderTree
  tree={tree}
  registry={registry}
  data={data}
  dispatch={onDispatch}
/>;
```

<h2 id="сборки">🏗️ Сборки</h2>

<h3 id="сборка-base">🧱 base</h3>

```
root
  item[]              · repeat: /sections · bind: value
    control ▶️         · on: click → triggerClick
      🏷️ text: {title}
      controlIndicator 🔽
    content 📂         · bind: variant
```

<h3 id="сборка-action-list">🧱 action-list</h3>

```
root
  item[]              · repeat: /sections · bind: value
    control ▶️         · on: click → triggerClick
      🏷️ text: {title}
      controlIndicator 🔽
    content 📂
      listbox           · bind: items, value
        listbox.content
          listbox.item[] · repeat: items · bind: item · on: click → select
            listbox.itemText
              🏷️ text: {label}
            listbox.itemIndicator
              🎨 icon: "✓"
```

<h2 id="рецепт">🎨 Рецепт</h2>

Доказательный рецепт (`playground/recipe.ts`) — доказывает, что паспорт МОЖНО одеть целиком
настоящей скин-механикой (`skinGaps` пуст, CSS реально генерируется). В продакшене не участвует.
Своих вариантов нет — рецепт не несёт оси `data-variant`, только настройку `orientation`.

> [!WARNING]
> Раскрытие `content` — не гарантированная отметка: если раздел раскрыт БЕЗ анимации, `data-state="open"`
> на content может не прийти вовсе. Для ВИДА это не проблема — правило смотрит на состояние `item`
> через `ancestors`, не на сам `content`. Для АНИМАЦИИ это единственный сигнал: отметка приходит
> ровно тогда, когда переход реально проигрывается.

Раскрытие анимируется по измеренному размеру, не по `auto`:

```
expand:   height 0 → var(--height)
collapse: height var(--height) → 0
```

Для горизонтальной гармошки — та же пара по ширине (`expand-sideways`/`collapse-sideways`),
включается настройкой `orientation`, а не отдельным вариантом.

<h2 id="использование">🚀 Использование</h2>

**Ручная сборка** — компонент собирается вручную, JSX-композицией, без схемы и движка.

```tsx
<Accordion>
  <AccordionItem value="shipping">
    <h3>
      <AccordionControl>
        Shipping
        <AccordionControlIndicator>▾</AccordionControlIndicator>
      </AccordionControl>
    </h3>
    <AccordionContent>Courier and pickup</AccordionContent>
  </AccordionItem>
</Accordion>
```

**Рендер через движок** — та же композиция, но по схеме (сборка `base`), которую рисует `RenderTree`.

```tsx
const data = { sections: [{ id: "shipping", title: "Shipping" }] };
const tree = instanceOf("accordion", {}, "base", data);

<RenderTree tree={tree} registry={registry} data={data} />;
```

**Рендер через движок с передачей компонента в нужный слот** — то же дерево движка, но узел
`content` подменён живым компонентом из кода, а не тем, что объявлено в схеме.

```tsx
const data = { sections: [{ id: "shipping", title: "Shipping" }] };
const tree = instanceOf("accordion", {}, "base", data);

<RenderTree
  tree={tree}
  registry={registry}
  data={data}
  slots={{ "accordion.content": { render: () => <div>CONTENT</div> } }}
/>;
```
