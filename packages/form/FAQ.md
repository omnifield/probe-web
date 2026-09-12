# ❓ FAQ

Короткие ответы на конкретные вопросы, которые уже возникали по этому пакету. Не общая
документация (она в [`README.md`](./README.md)) и не план (он в [`ROADMAP.yaml`](./ROADMAP.yaml))
— только факты, каждый проверен либо чтением исходников, либо прямым прогоном.

Пакет только что заведён — вопросов, разобранных прогоном, пока не было. Первые пункты появятся
вместе с работой по ROADMAP.

---

## Выбор движка

### Почему `@tanstack/solid-form`, а не `react-jsonschema-form`/`JSONForms`/`Formily`/`Formisch`?

**Коротко: стек — Solid, не React; `@tanstack/solid-form` уже в семье (рядом `@tanstack/solid-
router`, `@tanstack/solid-query`), schema-agnostic через Standard Schema — Zod заходит без
конвертации, headless — рендер свой (`@web-core/ui`), полный набор операций над массивами
(`insert/remove/move/swap`) закрывает то, чего не хватало в ручном `ListField`.**

`react-jsonschema-form`/`JSONForms`/`Formily` — React/Vue/Angular, для Solid своих версий
сравнимого уровня нет. `Formisch` (headless, Solid-нативный, от автора Valibot) рассматривался,
но завязан на Valibot как источник валидации/типов — в репозитории `zod` (через `@web-core/io`),
заводить второй стек валидации ради одного движка форм признано лишним. `jsfe` (web component,
работает с Solid через custom element) на момент разбора (2026-09-12) сам себя маркирует
"not for production" и не поддерживает `oneOf`/`anyOf`/conditionals.
