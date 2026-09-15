# 🧪 Примеры — как работать с `@web-core/feeder`

Рабочий код для локального теста, не канон. Архитектура и решения — [`README.md`](./README.md) /
[`FAQ.md`](./FAQ.md), план — [`ROADMAP.yaml`](./ROADMAP.yaml). Здесь — то, что можно скопировать и
сразу погонять.

## 1. Мод 1 — дерево без бэкенда

Самый быстрый способ увидеть `Tree` живьём — свой стейт, без сети. `Tree` полностью
контролируемый: схема и значение приходят снаружи, движок сам ничего не хранит.

```tsx
import { createSignal } from "solid-js";
import { Tree } from "@web-core/feeder";
import { z } from "@web-core/io";

const schema = z.object({
  name: z.string(),
  active: z.boolean(),
  variant: z.enum(["solid", "outline"]),
});

export function TreeDemo() {
  const [value, setValue] = createSignal<unknown>({});

  return (
    <>
      <Tree schema={schema} value={value()} onChange={setValue} />
      <pre>{JSON.stringify(value(), null, 2)}</pre>
    </>
  );
}
```

Хватит проверить рендер трёх видов листа (`ScalarInput`/`BooleanInput`/`EnumInput`) и запись по
пути — `<pre>` внизу должен обновляться на каждую правку.

## 2. Мод 1 — список (add/remove)

Та же `Tree`, но со схемой, у которой есть `list`-поле — проверить «Добавить»/«Убрать» и то, что
элементы не путаются местами при удалении из середины:

```tsx
const schema = z.object({
  tags: z.array(z.object({ value: z.string(), label: z.string() })),
});

export function TreeListDemo() {
  const [value, setValue] = createSignal<unknown>({ tags: [] });
  return <Tree schema={schema} value={value()} onChange={setValue} />;
}
```

## 3. Мод 2 — редактор (`OpenapiEditor`), реальный вызов

Нужен сырой текст Swagger 2.0 (жёсткое совпадение — другой формат/версия отклоняется). Ниже —
самодостаточный документ на паре ручек [jsonplaceholder](https://jsonplaceholder.typicode.com)
(публичный fake-REST, реально отвечает) — «Отправить» по-настоящему сходит в сеть:

```tsx
import { OpenapiEditor, type OpenapiInvocation } from "@web-core/feeder";

const swagger = JSON.stringify({
  swagger: "2.0",
  host: "jsonplaceholder.typicode.com",
  schemes: ["https"],
  paths: {
    "/todos/{id}": {
      get: {
        tags: ["todos"],
        parameters: [{ name: "id", in: "path", required: true, type: "integer" }],
        responses: { "200": { description: "ok" } },
      },
    },
    "/todos": {
      post: {
        tags: ["todos"],
        parameters: [{ in: "body", name: "body", required: true, schema: { $ref: "#/definitions/Todo" } }],
        responses: { "201": { description: "created" } },
      },
    },
  },
  definitions: {
    Todo: {
      type: "object",
      required: ["title"],
      properties: { title: { type: "string" }, completed: { type: "boolean" } },
    },
  },
});

export function OpenapiEditorDemo() {
  return <OpenapiEditor raw={swagger} onChange={(invocation: OpenapiInvocation) => console.log(invocation)} />;
}
```

Полезно проверить: обе ручки в списке (`GET /todos/{id}`, `POST /todos`), поля `body.title`/
`body.completed` у POST рендерятся через ту же `Node`, что мод 1, `id` у GET — обязательное число.
Документ не Swagger 2.0 (`"openapi: 3.0.0"` или мусор) — виджет должен показать текст ошибки, не
упасть молча.

## 4. Мод 2 — компактный вид (`OpenapiList`)

Никакого UI редактирования полей — только список уже настроенных ручек и «Вызвать» на каждую:

```tsx
import { OpenapiList, type OpenapiListItem } from "@web-core/feeder";

const items: OpenapiListItem[] = [
  {
    endpoint: { method: "GET", url: "https://jsonplaceholder.typicode.com/todos/{id}", schema: z.object({}) },
    value: { id: 1 },
  },
];

export function OpenapiListDemo() {
  return <OpenapiList items={items} onChange={(invocation) => console.log(invocation.response)} />;
}
```

## 5. Мод 2 — полный флоу: настроил в редакторе → сохранил → дёрнул на витрине

Реальный сценарий, под который заведены оба вида: `OpenapiEditor` отдаёт `{ endpoint, value,
response }` на каждый вызов — `{ endpoint, value }` из этого и есть готовый айтем `OpenapiList`.

```tsx
import { createSignal } from "solid-js";
import { OpenapiEditor, OpenapiList, type OpenapiInvocation, type OpenapiListItem } from "@web-core/feeder";

export function OpenapiRoundTripDemo() {
  const [raw, setRaw] = createSignal(""); // сюда — текст свагера (paste/загрузка файла)
  const [saved, setSaved] = createSignal<OpenapiListItem[]>([]);

  function onInvocation(invocation: OpenapiInvocation) {
    setSaved((prev) => [...prev, { endpoint: invocation.endpoint, value: invocation.value }]);
  }

  return (
    <>
      <h3>Редактор</h3>
      <OpenapiEditor raw={raw()} onChange={onInvocation} />

      <h3>Витрина (то, что уже дёргали хотя бы раз)</h3>
      <OpenapiList items={saved()} onChange={(invocation) => console.log(invocation.response)} />
    </>
  );
}
```

Сохранение `saved` между перезагрузками/экранами (localStorage/стор/бэкенд) — забота потребителя,
у feeder этого нет — движок только держит форму `{ endpoint, value }`.

## Подключить для живого теста в `apps/skin`

`apps/skin/src/pages/lab/index.tsx` — dev-страница:

```tsx
import { TreeDemo } from "..."; // любой пример выше

export function LabPage() {
  return <TreeDemo />;
}
```
