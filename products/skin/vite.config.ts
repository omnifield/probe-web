// Сборка — фабрика из зоны `build` (точка 2 замороженной поверхности, PROBEWEB-4).
// Своей оснастки зона не заводит: стоит НА базе, как и соседи по products/ (PROBEWEB-5).
// Порт дев-сервера задаётся флагом в `scripts.dev` (`--port 5174 --strictPort`), а не здесь:
// это запуск, а не конфиг. `--strictPort` обязателен — без него Vite при занятом порте молча
// берёт соседний, и пульт (`tools/dev-nav`) показывает зону мёртвой, хотя она поднята.
//
// Роутинг (`@web-core/router`, PWEB-173) добавляет плагин файловой маршрутизации
// ВРУЧНУЮ, а не через `defineConfig()`'s `options.plugins` — тот вставляет ПОСЛЕ `solid()`,
// а `@tanstack/router-plugin` обязан стоять ПЕРЕД ним (сверено апстримом, README пакета).
//
// `autoCodeSplitting: false` — НАХОДКА, не вкус (замерено 2026-08-29, заявка architect →
// framework поднята). Дефолт пакета (`true`) ломает его же собственное обещание «приложение
// импортирует ровно @web-core/router, никогда @tanstack/solid-router напрямую»:
// `@tanstack/router-plugin`'s код-сплиттер для `target:"solid"` ЖЁСТКО зашит на пакет
// `@tanstack/solid-router` (`framework-options.js`, не настраивается опцией) и сам впечатывает
// `import { createFileRoute } from '@tanstack/solid-router'` в каждый скомпилированный файл
// маршрута — а у нас там уже стоит свой импорт из обёртки, и получаются два разных `createFileRoute`
// в одном файле, сборка падает. Выключено здесь до решения на уровне пакета `router` (документировать
// требуемое исключение для `src/routes/*` либо не включать сплиттинг по умолчанию).
import { defineConfig } from "@web-core/build/vite";
import { tanstackRouterVitePlugin } from "@web-core/router/vite";

const config = defineConfig();

export default {
  ...config,
  plugins: [tanstackRouterVitePlugin({ autoCodeSplitting: false }), ...(config.plugins ?? [])],
};
