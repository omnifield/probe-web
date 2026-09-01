# 🌳 Tree View

🏷️ iteration · 🧬 component · 📐 wide · 📦 `@omnifield/probe-web-ui`

## 🧭 Навигация

- 🧩 [Анатомия](#анатомия)
- 🚀 [Использование](#использование)

## 🧩 Анатомия

```
root
└─ item[] 🍃/🌿
   ├─ control ▶️
   │  └─ controlIndicator
   └─ content 📂
```

## 🚀 Использование

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
