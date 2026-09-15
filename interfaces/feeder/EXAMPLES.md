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
import { z } from "@web-core/io";

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

## 6. Мод 4 — сведение (`Mapping`) без бэкенда

А — сырые данные, Б — схема потребителя. На каждое поле Б выбираешь путь А, справа сразу видно
`FieldRule[]`+результат:

```tsx
import { createSignal } from "solid-js";
import { Mapping, type MappingChange } from "@web-core/feeder";
import { z } from "@web-core/io";

const a = { full_name: "Ada Lovelace", years: 36, city: "London" };
const b = z.object({ name: z.string(), age: z.number() });

export function MappingDemo() {
  const [change, setChange] = createSignal<MappingChange>();

  return (
    <>
      <Mapping a={a} b={b} onChange={setChange} />
      <pre>{JSON.stringify(change(), null, 2)}</pre>
    </>
  );
}
```

Проверить: список полей Б (`name`, `age`) с селектом путей А (`/full_name`, `/years`, `/city`);
выбор `/full_name` для `name` — `result.row.name` становится `"Ada Lovelace"`; сброс на «— не
сведено —» убирает поле из `result.row`, не оставляет пустую строку.

## 7. Мод 4 на ответе мода 2 — реальный кейс «настроить ручку → накормить компонент»

Ровно та связка, под которую мод 4 заведён: ответ ручки (мод 2) — вариант А, схема какого-то
компонента — вариант Б:

```tsx
import { createSignal } from "solid-js";
import { Mapping, OpenapiEditor, type OpenapiInvocation } from "@web-core/feeder";
import { z } from "@web-core/io";

const targetSchema = z.object({ title: z.string(), done: z.boolean() });

export function OpenapiToMappingDemo() {
  const [response, setResponse] = createSignal<unknown>({});

  return (
    <>
      <h3>1. Дёрнуть ручку — мод 2</h3>
      <OpenapiEditor raw={swagger} onChange={(invocation: OpenapiInvocation) => setResponse(invocation.response.body)} />

      <h3>2. Свести ответ с компонентом — мод 4</h3>
      <Mapping a={response()} b={targetSchema} onChange={(change) => console.log(change.rules, change.result)} />
    </>
  );
}
```

`swagger` — тот же документ, что в кейсе 3. Полезно проверить: пока ручку не дёрнули, `Mapping`
рендерит поля Б без вариантов А (пусто); после ответа — список путей А обновляется сам (`a`
реактивный проп).

## Подключить для живого теста в `apps/skin`

`apps/skin/src/pages/lab/index.tsx` — dev-страница:

```tsx
import { TreeDemo } from "..."; // любой пример выше

export function LabPage() {
  return <TreeDemo />;
}
```
