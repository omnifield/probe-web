# ⚙️ web-core Form

🏷️ forms · 🧬 engine · 📦 `@web-core/form`

## 🧭 Навигация

- 🏠 [Главное](#главное)
- 🧩 [Анатомия](#анатомия)
- 🚀 [Использование](#использование)
- ❓ [FAQ](./FAQ.md)

<h2 id="главное">🏠 Главное</h2>

🧭 Движок правки данных web-core поверх `@tanstack/solid-form` — единственная точка резолва
вместо вендора, тем же приёмом, что `@web-core/router` (`@tanstack/solid-router`) и
`@web-core/query` (`@tanstack/solid-query`).

🛠️ Средство, а не решение: `@tanstack/solid-form` даёт headless состояние формы — пути,
dirty/touched, массивы целиком (`pushValue`/`removeValue`/`insertValue`/`replaceValue`/
`swapValues`/`moveValue`) — рендер полей этот пакет не приносит и не будет: конкретные контролы
собираются в зоне-потребителе на `@web-core/ui`.

Схема компонента заходит из `@web-core/io` (там обёрнут Zod) — этот пакет `zod` не видит и не
ставит себе напрямую.

**Статус: только что заведён, содержания ещё нет** (кроме реэкспорта). Что сделано и что дальше —
`ROADMAP.yaml`.

<h2 id="анатомия">🧩 Анатомия</h2>

| Часть | Адрес | Экспортирует |
|---|---|---|
| Рантайм формы | `@web-core/form` | весь `@tanstack/solid-form` (`createForm`, `FieldApi`, …) — пока без добавок |

📦 Внутри пакета: `src/index.ts` — единственный файл в корне `src/`, тонкая поверхность (один
реэкспорт `engine/`). Форма — по образцу `@web-core/router`/`@web-core/query`/`@web-core/store`/
`@web-core/assembly`.

<h2 id="использование">🚀 Использование</h2>

```ts
import { createForm } from "@web-core/form";
```

Дальше — открытый вопрос дизайна (см. ROADMAP: `field-descriptors-bridge`,
`array-ops-integration`, `render-on-web-core-ui`), не готовый рецепт.
