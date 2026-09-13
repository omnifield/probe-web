# ⚙️ web-core Form

🏷️ forms · 🧬 engine · 📦 `@web-core/form`

## 🧭 Навигация

- 🏠 [Главное](#главное)
- 🧩 [Анатомия](#анатомия)
- 🚀 [Использование](#использование)
- ❓ [FAQ](./FAQ.md)

<h2 id="главное">🏠 Главное</h2>

🧭 Проекция дерево×io-схема→валидность — вторая нога той же механики, что `@web-core/assembly`:
assembly даёт дерево+байндинг+реестр и рисует чужой компонент, `@web-core/form` даёт то же
дерево+байндинг+io-схему и производит чужую валидность/UI-состояние. Не форма из инпутов и
чекбоксов — параллельное дерево ВАЛИДАЦИИ поверх того, что уже собрано и уже рисуется.

🛠️ Средство, а не решение: результат — `путь → issues` и `nodeId → {hidden, disabled}`, что с
этим делать (подсветить узел, заблокировать кнопку) решает потребитель. Пакет не рисует ничего
никогда и не владеет состоянием формы (ни dirty/touched, ни array-ops) — это стейтлес-проекция,
снимок `data` на входе.

Схема сборки заходит из `@web-core/io` (там обёрнут Zod) — этот пакет `zod` не видит и не ставит
себе напрямую. Производное UI-состояние (hide/disable по значению другого узла) — отдельный
механизм, `rule` на узле assembly-дерева, условие — JsonLogic (`json-logic-js`).

**Статус: механика (engine + solid-обвязка) реализована, cross-zone ось на `useKitLife`/паспорте
ещё не заведена** (см. `ROADMAP.yaml`, категория «Cross-zone»). Сквозной пример использования —
`TEST_EXAMPLE.md`.

<h2 id="анатомия">🧩 Анатомия</h2>

| Часть | Адрес | Экспортирует |
|---|---|---|
| Ядро (framework-agnostic) | `@web-core/form` | `growValidatorLayer`, `evaluateRule`, `ValidationIssue`, `NodeRule`, `RuleEffect` |
| Solid-обвязка | `@web-core/form/solid` | `ValidationProvider`, `useValidation`, `useIssuesAt`, `useComponentValidation`, `useFormValid`, `ValidationConnection` |

📦 Внутри пакета: `src/index.ts` (тонкий реэкспорт `engine/`), `src/engine/` (`validate.ts` —
`growValidatorLayer`, `rules.ts` — `evaluateRule`, ноль Solid), `src/solid/` (`connection.ts` —
`createValidationConnection`, `provider.tsx` — контекст+хуки) — та же трёхслойная структура, что
`@web-core/skin` (`wear/` → `solid/connection.ts` → `solid/provider.tsx`).

<h2 id="использование">🚀 Использование</h2>

```ts
import { growValidatorLayer } from "@web-core/form";

const issuesByPath = growValidatorLayer(tree, schema, data);
```

```tsx
import { ValidationProvider, useFormValid } from "@web-core/form/solid";

<ValidationProvider tree={tree} schema={schema} data={data}>
  <RenderTree registry={registry} tree={tree} data={data()} />
</ValidationProvider>
```

Полный сквозной пример (валидность через `superRefine` + производное состояние через `rule`,
до реального использования в `Field`/`Surface`/кнопке submit) — `TEST_EXAMPLE.md`.
