# 📐 tsconfig

📦 `@omnifield/probe-web-build/tsconfig`

Базовая настройка TypeScript для фронтенд-приложений probe-web. `tsconfig.json` потребителя
едет классом `placed-once` — кладут один раз и больше не трогают, — поэтому в нём остаются
только `extends` и `include`, а содержание живёт здесь и меняется выпуском зоны.

```jsonc
// tsconfig.json потребителя
{
  "extends": "@omnifield/probe-web-build/tsconfig",
  "include": ["src", "vite.config.ts"]
}
```

<h2 id="зачем">🎯 Зачем прятать содержимое</h2>

Всё, что окажется у потребителя в файле, застынет у него навсегда. Ближайший пример, ради
которого это и сделано: Solid 2.0 уносит JSX-типы из `solid-js` в `@solidjs/web` и требует
сменить `jsxImportSource` (фонд `solidJS/sources/solid-2.0-migration.md`, сверено 2026-08-08).
`jsxImportSource` живёт именно в этом файле — смена доезжает до всех потребителей одной строкой
здесь, а не правкой замороженного файла в каждом продукте.

<h2 id="состав">🧩 Состав</h2>

| поле | значение |
| ---- | -------- |
| `jsx: "preserve"` | трансформ делает Vite, не `tsc` |
| `jsxImportSource: "solid-js"` | см. «Зачем прятать содержимое» |
| `lib: ["ESNext", "DOM", "DOM.Iterable"]` | браузерная среда |
| `types: ["vite/client"]` | типы `import.meta.env` и `.css`/asset-импортов |
| `moduleResolution: "bundler"` | резолв как у Vite/esbuild, не `node`/`nodeNext` |

Строгие проверки (`strict`, `noUnusedLocals`, `verbatimModuleSyntax` и т.д.) общие с серверным
профилем (`/tsconfig-node`, см. тему `node/`) — вынесены во внутренний `src/shared/tsconfig.json`,
чтобы не дублировать список и не дать двум профилям разойтись молча.
