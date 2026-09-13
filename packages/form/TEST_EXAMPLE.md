# Сквозной пример — ориентир к ROADMAP.yaml

Иллюстрация, не API-контракт: показывает картину целиком на одном воображаемом модуле
«Регистрация» — оба механизма пакета сразу (валидность + производное UI-состояние), кто что
пишет и куда это утекает. Конкретные имена функций/полей — черновые, предмет реализации и
cross-zone ТЗ (см. ссылки на id пунктов `ROADMAP.yaml` по тексту).

Модуль: email/пароль/подтверждение пароля + чекбокс «получать рассылку», который открывает блок
с настройками рассылки.

## 1. Контент модуля — пишет автор модуля, НЕ пакет `@web-core/form`

Ни `@web-core/assembly`, ни `@web-core/skin`, ни `@web-core/form` не видят здесь ни строки —
email/пароль/рассылка это домен КОНКРЕТНОГО модуля (`engine-vs-content-ownership`). Физически
сегодня это код зоны, которая строит модуль (по образцу `apps/skin/.../input/schema.ts`), после
переезда на БД — то же место, куда едет JSON всего дерева модуля.

```ts
// registration/schema.ts
import { z } from "@web-core/io";

export const registrationSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirm: z.string(),
    subscribeNewsletter: z.boolean(),
    newsletterFrequency: z.enum(["daily", "weekly"]),
  })
  .superRefine((data, ctx) => {
    if (data.confirm !== data.password) {
      ctx.addIssue({ code: "custom", path: ["confirm"], message: "не совпадает" });
    }
  });
```

```ts
// registration/tree.ts
import type { AssemblyTree } from "@web-core/assembly";

export const registrationTree: AssemblyTree = {
  components: {
    root: "form",
    nodes: {
      form: { id: "form", type: "form", parentId: null,
        children: ["email", "password", "confirm", "subscribe", "newsletterBlock", "submit"] },

      email:    { id: "email", type: "field", parentId: "form", children: [], bind: { value: "/email" } },
      password: { id: "password", type: "field", parentId: "form", children: [], bind: { value: "/password" } },
      confirm:  { id: "confirm", type: "field", parentId: "form", children: [], bind: { value: "/confirm" } },

      subscribe: { id: "subscribe", type: "checkbox", parentId: "form", children: [],
        bind: { checked: "/subscribeNewsletter" } },

      // Производное UI-состояние (node-level-rule-for-derived-state) — `rule` в `meta`,
      // `packages/assembly` этого поля не знает и трогать его не пришлось. Условие — JsonLogic
      // (json-logic-dependency, предложено architect'у брать сейчас, не откладывать —
      // condition-language-narrowed рассмотрен и отклонён, см. ROADMAP.yaml).
      newsletterBlock: {
        id: "newsletterBlock", type: "surface", parentId: "form", children: ["frequency"],
        meta: {
          rule: {
            effect: "HIDE",
            vars: { subscribed: "/subscribeNewsletter" },
            when: { "==": [{ var: "subscribed" }, false] },
          },
        },
      },
      frequency: { id: "frequency", type: "field", parentId: "newsletterBlock", children: [],
        bind: { value: "/newsletterFrequency" } },

      submit: { id: "submit", type: "button", parentId: "form", children: [] },
    },
  },
};
```

## 2. Механика — то, что реально строит `@web-core/form` (`validator-layer-projection`, `node-rule-evaluation`)

Framework-agnostic, `@web-core/assembly`/Solid не видят домена, только форму (путь/схема/данные).

```ts
// packages/form/src/engine/validate.ts
export function growValidatorLayer(
  tree: AssemblyTree,
  schema: z.ZodType,
  data: unknown,
): Record<string /* путь */, readonly StandardSchemaIssue[]> {
  const boundPaths = collectBoundPaths(tree); // bind + content value.path, тот же обход, что рендер
  const result = schema["~standard"].validate(data); // ОДИН вызов на схему целиком —
  const issues = "issues" in result ? (result.issues ?? []) : []; // не по листьям (см. `single-schema-no-separate-layer`)

  const byPath: Record<string, StandardSchemaIssue[]> = {};
  for (const issue of issues) {
    const path = "/" + (issue.path ?? []).join("/");
    if (boundPaths.has(path)) (byPath[path] ??= []).push(issue);
  }
  return byPath;
}
```

```ts
// packages/form/src/engine/rules.ts
import jsonLogic from "json-logic-js"; // предложенная зависимость — брать сейчас, решает architect, json-logic-dependency
import { resolveDataBinding } from "@web-core/assembly";

export interface NodeRule {
  readonly effect: "SHOW" | "HIDE" | "ENABLE" | "DISABLE";
  readonly vars: Readonly<Record<string, string>>;
  readonly when: unknown; // JsonLogic-правило
}

export interface RuleEffect {
  readonly hidden?: boolean;
  readonly disabled?: boolean;
}

export function evaluateRule(rule: NodeRule, data: unknown): RuleEffect {
  const vars = Object.fromEntries(
    Object.entries(rule.vars).map(([name, path]) => [name, resolveDataBinding(data, path)]),
  );
  const matched = Boolean(jsonLogic.apply(rule.when, vars));

  return {
    hidden: rule.effect === "HIDE" ? matched : rule.effect === "SHOW" ? !matched : undefined,
    disabled: rule.effect === "DISABLE" ? matched : rule.effect === "ENABLE" ? !matched : undefined,
  };
}
```

## 3. Solid-обвязка — зеркало `packages/skin/src/solid/` (`solid-adapter-mirrors-skin`, `solid-connection-and-provider`)

```tsx
// packages/form/src/solid/connection.ts
export function createValidationConnection(tree: AssemblyTree, schema: z.ZodType, data: Accessor<unknown>) {
  const issuesByPath = createMemo(() => growValidatorLayer(tree, schema, data()));

  // `tree` и `data` идут в контекст КАК ЕСТЬ, не только производный `issuesByPath` —
  // без исходных данных node-rule-evaluation внутри провайдера нечем вызывать
  // (component-identity-via-node-id, найдено при проверке этого самого места).
  return { tree, data, issuesByPath }; // параллель SkinConnection.componentData
}
```

```tsx
// packages/form/src/solid/provider.tsx — параллель SkinProvider/useComponentSkin/useComponentSkinData/useOutfitData
const ValidationContext = createContext<ReturnType<typeof createValidationConnection>>();

export function ValidationProvider(props: { tree: AssemblyTree; schema: z.ZodType; data: Accessor<unknown> } & ParentProps) {
  const connection = createValidationConnection(props.tree, props.schema, props.data);
  return <ValidationContext.Provider value={connection}>{props.children}</ValidationContext.Provider>;
}

export function useValidation() { /* ~ useSkin() */ }

export function useIssuesAt(path: string) { /* ~ useComponentSkinData(component) */ }

// Не отдельный вызов — сворачивается ВНУТРЬ useKitLife (kit-life-validation-fold-in)
export function useComponentValidation(passport: ComponentPassport, props: object) {
  const value = useContext(ValidationContext);
  if (!value) return () => undefined;

  return createMemo(() => {
    // component-identity-via-node-id: `props.bind` компоненту НЕ доезжает (resolveBind резолвит
    // его в готовое значение до рендера, packages/assembly/src/render/props.ts:14-25) — свой путь
    // узнаём через id узла (`"data-node"` доезжает как обычный проп, render-node.tsx:33-37),
    // ищем этот узел в дереве, которое провайдер и так держит целиком, и берём `bind` ОТТУДА.
    //
    // ЕДИНСТВЕННЫЙ ключ bind, не жёстко `.value` — Checkbox (@ark-ui/solid) бинжен как
    // `{checked: path}`, не `{value: path}`; жёсткий `.value` для него всегда undefined, узел
    // никогда не получил бы issues (найдено architect'ом при проверке, см. ROADMAP.yaml).
    // Несколько ключей в bind — неоднозначно, какой из них "своё значение": не гадаем.
    const nodeId = (props as Record<string, unknown>)["data-node"] as string | undefined;
    const node = nodeId ? value.tree.components.nodes[nodeId] : undefined;
    const ownBindPaths = node && "bind" in node && node.bind ? Object.values(node.bind) : [];
    const path = ownBindPaths.length === 1 ? ownBindPaths[0] : undefined;
    const issues = path ? value.issuesByPath()[path] : undefined;

    // `meta`, в отличие от `bind`, доезжает до компонента как есть (render-node.tsx:86,98,113) —
    // второго лукапа через дерево для `rule` не нужно.
    const rule = (props as { meta?: { rule?: NodeRule } }).meta?.rule;
    const effect = rule ? evaluateRule(rule, value.data()) : {};

    return {
      invalid: (issues?.length ?? 0) > 0,
      errorText: issues?.[0]?.message,
      ...effect,
    };
  });
}

// ~ useOutfitData() — агрегат по ВСЕМУ дереву, не по пути. Отвечает на «кто скажет кнопке не нажиматься».
export function useFormValid() {
  const value = useContext(ValidationContext);
  return createMemo(() => Object.values(value?.issuesByPath() ?? {}).every((list) => list.length === 0));
}
```

## 4. Потребление — сборка модуля целиком

```tsx
<SkinProvider source={skinSource}>
  <ValidationProvider tree={registrationTree} schema={registrationSchema} data={data}>
    <RenderTree registry={registry} tree={registrationTree} data={data()} />
  </ValidationProvider>
</SkinProvider>
```

`assembly`/`RenderTree` про валидацию не знает ничего — рисует дерево по `registry`, как и всегда.
Каждый кит-компонент сам решает, что показать, читая СВОЮ ось через `useKitLife`
(`kit-life-validation-fold-in`):

```tsx
// packages/ui/src/field/components/root.tsx — правка ui-зоны, для картины (field-invalid-errortext-wiring)
export function Field(props: FieldProps) {
  const validation = useKitLife(passport, props); // теперь не void — акцессор
  return <ArkRoot {...dropAddress(props)} invalid={validation()?.invalid} errorText={validation()?.errorText} />;
}
```

```tsx
// packages/ui/src/surface/components/root.tsx — та же ось, другой эффект (node-level-rule-for-derived-state)
export function Surface(props: SurfaceProps) {
  const validation = useKitLife(passport, props);
  return (
    <Show when={!validation()?.hidden}>
      <ArkBox {...dropAddress(props)}>{props.children}</ArkBox>
    </Show>
  );
}
```

```tsx
// кнопка submit — не по своему пути (у неё его нет), а по агрегату всего дерева
function SubmitButton() {
  const canSubmit = useFormValid();
  return <Button disabled={!canSubmit()}>Зарегистрироваться</Button>;
}
```

## Что происходит на практике

- Пользователь вводит `confirm`, не совпадающий с `password` → `growValidatorLayer` видит issue
  от `.superRefine` на пути `/confirm` (тот же вызов, что и для простого `email.email()`, ничего
  специального) → `Field` красный, `submit` задизейблен (`useFormValid()` — false).
- Пользователь снимает чекбокс «рассылка» → `data()` меняется → `createMemo` в `connection.ts`
  пересчитывается → `Surface` вокруг `frequency` получает `hidden: true` → блок пропадает вместе
  с полем внутри (снятое поле не участвует в `boundPaths` этого прогона — не мешает `submit`).
- Всё пересчитывается обычной Solid-реактивностью, без ручных подписок — тот же приём, что уже
  работает у скина.
