# 🌳 Tree View

🏷️ iteration · 🧬 component · 📐 wide · 📦 `@omnifield/probe-web-ui`

## 🧭 Навигация

- 🧩 [Анатомия](#анатомия)
- 🎛️ [Состояния](#состояния)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🚀 [Использование](#использование)

<h2 id="анатомия">🧩 Анатомия</h2>

```
root
└─ item[] 🍃/🌿
   ├─ control ▶️
   │  └─ controlIndicator
   └─ content 📂
```

| часть                 | значение                                                           |
| --------------------- | ------------------------------------------------------------------ |
| 🌳 `root`             | дерево целиком — один узел                                         |
| 🍃🌿 `item`           | один узел повтора — лист или ветка, решает сам компонент по данным |
| ▶️ `control`          | шапка узла — кликабельная и фокусируемая строка                    |
| 🔽 `controlIndicator` | индикатор внутри шапки — раскрытие для ветки, выделение для листа  |
| 📂 `content`          | открытый слот узла — своего вида не несёт                          |

<h2 id="состояния">🎛️ Состояния</h2>

|      | состояние     | метка                  | где                             | значение                                            |
| ---- | ------------- | ---------------------- | ------------------------------- | --------------------------------------------------- |
| 🎯   | focus         | `[data-focus]`         | item, control, controlIndicator | реальный фокус стоит на этом узле                   |
| ✅   | selected      | `[data-selected]`      | item, control, controlIndicator | узел входит в текущее выделение                     |
| 🚫   | disabled      | `[data-disabled]`      | item, control, controlIndicator | узел отключён                                       |
| ⏳   | loading       | `[data-loading]`       | item, control, controlIndicator | узел-ветка подгружает потомков (`loadChildren`)     |
| 🔓🔒 | open / closed | `[data-state]`         | item, control, controlIndicator | ветка раскрыта / закрыта                            |
| ✏️   | renaming      | `[data-renaming]`      | item, control                   | подпись сейчас редактируется (`F2`/`startRenaming`) |
| ☑️   | checked       | `[data-checked]`       | item, control                   | узел отмечен целиком — для дерева с чекбоксами      |
| ➖   | indeterminate | `[data-indeterminate]` | item, control                   | отмечена только часть потомков                      |
| 🖱️   | hover         | `:hover`               | control                         | указатель наведён на строку                         |
| 👆   | active        | `:active`              | control                         | строка нажата указателем                            |

<h2 id="io">🔌 IO</h2>

<h3 id="io-вход">📥 Вход</h3>

```json
{
  "items": [
    {
      "id": "string",
      "label": "string",
      "children": [recursive]
    }
  ]
}
```

<h3 id="io-выход">📤 Выход</h3>

```tsx
const onDispatch = (event: DispatchedEvent) => {
  // Клик по узлу, возвращает все данные кликнотого узла, кроме детей.
  // event.context.payload = { id: "a", label: "Alpha" }
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
  item[] 🍃/🌿          · repeat: /items · bind: весь узел
    control ▶️           · on: click → controlClick
      🏷️ text: {label}
      controlIndicator 🔽
    content 📂
```

<h2 id="использование">🚀 Использование</h2>

**Ручная сборка** — компонент собирается вручную, JSX-композицией, без схемы и движка.

```tsx
<TreeRoot>
  <TreeItem>
    <TreeControl>
      <TreeControlIndicator />
    </TreeControl>
    <TreeContent />
  </TreeItem>
</TreeRoot>
```

**Рендер через движок** — та же композиция, но по схеме (сборка `base`), которую рисует `RenderTree`.

```tsx
const data = { items: [{ id: "a", label: "Alpha" }] };
const tree = instanceOf("tree-view", {}, "base", data);

<RenderTree tree={tree} registry={registry} data={data} />;
```

**Рендер через движок с передачей компонента в нужный слот** — то же дерево движка, но узел
`content` подменён живым компонентом из кода, а не тем, что объявлено в схеме.

```tsx
const data = { items: [{ id: "a", label: "Alpha" }] };
const tree = instanceOf("tree-view", {}, "base", data);

<RenderTree
  tree={tree}
  registry={registry}
  data={data}
  slots={{ "tree-view.content": { render: () => <div>CONTENT</div> } }}
/>;
```
