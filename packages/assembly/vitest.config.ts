import solid from "vite-plugin-solid";
import { defineConfig } from "vitest/config";

// Два проекта, потому что пробы зоны живут в разных мирах и одним конфигом не покрываются:
//
//   • dom   — отрисовка: дерево монтируется в НАСТОЯЩИЙ документ и проверяется по узлам.
//     Нужны JSDOM, JSX-трансформ и условия разрешения `development`/`browser` — без них
//     `solid-js/web` отдаёт СЕРВЕРНУЮ сборку и `render()` падает «Client-only API called on
//     the server side» (та же развилка и то же решение у зон `ui` и `runtime`);
//   • model — модель, правила и правки: ни документа, ни JSX там нет вовсе, и поднимать под
//     них браузерное окружение значило бы проверять не то, чем эта половина является. Она
//     обязана работать там, где документа нет, — подпуть `./model` ровно об этом.
//
// Пресет `@omnifield/probe-web-build/vitest` сюда НЕ подключается: направление зависимостей
// между зонами одностороннее (`kb:PROBEWEB-4`), а пресет и не для собственных проб пакета —
// он для ПОТРЕБИТЕЛЯ.
export default defineConfig({
  test: {
    projects: [
      {
        plugins: [solid()],
        resolve: { conditions: ["development", "browser"] },
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["test/*.test.tsx"],
        },
      },
      {
        test: {
          name: "model",
          environment: "node",
          include: ["test/*.test.ts"],
        },
      },
    ],
  },
});
