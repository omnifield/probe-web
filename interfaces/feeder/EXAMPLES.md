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

## 3. Мод 2 — редактор (`OpenapiEditor`), группа-схема, реальный вызов

`OpenapiEditor` работает со списком ГРУПП, не с одним документом — у юзера может быть несколько
бэков со сваггером и несколько вообще без него, группы не сливаются в общий список ручек (разбор —
FAQ.md, «Почему `OpenapiEditor` принимает `groups`»). Здесь — одна группа-схема (`SchemaGroup`,
read-only состав, `raw` — сырой текст Swagger 2.0, жёсткое совпадение). Ниже — самодостаточный
документ на паре ручек [jsonplaceholder](https://jsonplaceholder.typicode.com) (публичный
fake-REST, реально отвечает) — «Отправить» по-настоящему сходит в сеть:

```tsx
import { createSignal } from "solid-js";
import { OpenapiEditor, type OpenapiGroup, type OpenapiInvocation } from "@web-core/feeder";

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
  const [groups, setGroups] = createSignal<readonly OpenapiGroup[]>([
    { id: "1", name: "jsonplaceholder", kind: "schema", raw: swagger },
  ]);

  return (
    <OpenapiEditor
      groups={groups()}
      onGroupsChange={setGroups}
      onChange={(invocation: OpenapiInvocation) => console.log(invocation)}
    />
  );
}
```

Полезно проверить: группа подписана именем («jsonplaceholder»), обе ручки в списке (`GET
/todos/{id}`, `POST /todos`), поля `body.title`/`body.completed` у POST рендерятся через ту же
`Node`, что мод 1, `id` у GET — обязательное число. Документ не Swagger 2.0 (`"openapi: 3.0.0"` или
мусор) — виджет должен показать текст ошибки, не упасть молча.

## 4. Мод 2 — группа-юзер (`ManualGroup`), ручка без сваггера

Кейс — бэк вообще без сваггер-документа: ручка заводится вручную, дескриптор (`method`/`url`/
`params`) редактируется той же `Tree`, что и мод 1 (add/remove ручки и параметра — готовая
механика списков, ничего доучивать не нужно). Можно начать с пустой группы и завести ручку прямо
через UI (кнопка «Добавить группу» → «Добавить» в дереве дескриптора), либо сразу дать уже
заполненный дескриптор:

```tsx
import { createSignal } from "solid-js";
import { OpenapiEditor, type OpenapiGroup, type OpenapiInvocation } from "@web-core/feeder";

export function OpenapiManualGroupDemo() {
  const [groups, setGroups] = createSignal<readonly OpenapiGroup[]>([
    {
      id: "1",
      name: "Бэк без свагера",
      kind: "manual",
      endpoints: [{ method: "GET", url: "https://jsonplaceholder.typicode.com/todos/{id}", params: [{ name: "id", type: "number", required: true }] }],
    },
  ]);

  return (
    <OpenapiEditor
      groups={groups()}
      onGroupsChange={setGroups}
      onChange={(invocation: OpenapiInvocation) => console.log(invocation)}
    />
  );
}
```

Полезно проверить: карточка ручки появляется сразу (дескриптор уже заполнен), поле `id` — число,
«Отправить» реально сходит в сеть; отдельно — с пустой группой (`endpoints: []`) нажать «Добавить»
в дереве и убедиться, что в `groups` (через `onGroupsChange`) появился пустой дескриптор
`{ method: "GET", url: "", params: [] }`.

## 5. Мод 2 — компактный вид (`OpenapiList`)

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

## 6. Мод 2 — полный флоу: настроил в редакторе → сохранил → дёрнул на витрине

Реальный сценарий, под который заведены оба вида: `OpenapiEditor` отдаёт `{ endpoint, value,
response }` на каждый вызов, в ЛЮБОЙ группе — `{ endpoint, value }` из этого и есть готовый айтем
`OpenapiList`.

```tsx
import { createSignal } from "solid-js";
import { OpenapiEditor, OpenapiList, type OpenapiGroup, type OpenapiInvocation, type OpenapiListItem } from "@web-core/feeder";

export function OpenapiRoundTripDemo() {
  const [groups, setGroups] = createSignal<readonly OpenapiGroup[]>([]); // юзер сам заведёт группы через UI
  const [saved, setSaved] = createSignal<OpenapiListItem[]>([]);

  function onInvocation(invocation: OpenapiInvocation) {
    setSaved((prev) => [...prev, { endpoint: invocation.endpoint, value: invocation.value }]);
  }

  return (
    <>
      <h3>Редактор</h3>
      <OpenapiEditor groups={groups()} onGroupsChange={setGroups} onChange={onInvocation} />

      <h3>Витрина (то, что уже дёргали хотя бы раз)</h3>
      <OpenapiList items={saved()} onChange={(invocation) => console.log(invocation.response)} />
    </>
  );
}
```

Сохранение `saved`/`groups` между перезагрузками/экранами (localStorage/стор/бэкенд) — забота
потребителя, у feeder этого нет — движок только держит форму `{ endpoint, value }` и сам список
групп на время сессии.

## 7. Мод 4 — сведение (`Mapping`) без бэкенда

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

## 8. Мод 4 на ответе мода 2 — реальный кейс «настроить ручку → накормить компонент»

Ровно та связка, под которую мод 4 заведён: ответ ручки (мод 2, любая группа) — вариант А, схема
какого-то компонента — вариант Б:

```tsx
import { createSignal } from "solid-js";
import { Mapping, OpenapiEditor, type OpenapiGroup, type OpenapiInvocation } from "@web-core/feeder";
import { z } from "@web-core/io";

const targetSchema = z.object({ title: z.string(), done: z.boolean() });

export function OpenapiToMappingDemo() {
  const [groups, setGroups] = createSignal<readonly OpenapiGroup[]>([{ id: "1", name: "todos", kind: "schema", raw: swagger }]);
  const [response, setResponse] = createSignal<unknown>({});

  return (
    <>
      <h3>1. Дёрнуть ручку — мод 2</h3>
      <OpenapiEditor
        groups={groups()}
        onGroupsChange={setGroups}
        onChange={(invocation: OpenapiInvocation) => setResponse(invocation.response.body)}
      />

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
