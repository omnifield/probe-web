// Точка 2 замороженной поверхности — СБОРКА (`kb:PROBEWEB-4`).
//
// `vite.config.ts` лежит у потребителя классом `placed-once`: положен один раз и больше
// никогда не обновится. Оставить его содержательным значило бы заморозить версию Vite, набор
// плагинов и настройки сборки — то есть ровно то, что обязано двигаться. Поэтому конфиг
// целиком прячется сюда, а у потребителя остаются три строки: импорт, вызов, `export default`.

import { resolve } from "node:path";

import type { Plugin, UserConfig } from "vite";
import solid from "vite-plugin-solid";

import { trace } from "./trace.js";
import { findWorkspaceSources } from "./workspace-source.js";

/**
 * Дев-часть конфига: соседи по воркспейсу видны исходниками и не пребандлятся.
 *
 * Плагин, а не поля в самом конфиге, по двум причинам. Первая — считать соседей можно только
 * зная корень проекта, а он известен Vite, а не нам: `config.root` потребитель вправе задать
 * сам. Вторая — `apply: "serve"` держит подмену в дев-цикле и не пускает её в сборку: собирать
 * приложение обязано ровно то, что уедет потребителю, иначе гейт сборки перестаёт быть гейтом.
 *
 * @returns плагин Vite, добавляющий алиасы, исключения пребандла и доступ к файлам соседей
 */
function workspaceSourcePlugin(): Plugin {
  return {
    name: "probe-web-build:workspace-source",
    apply: "serve",
    config(config) {
      const done = trace("workspaceSourcePlugin.config");
      const projectRoot = resolve(config.root ?? process.cwd());
      const { names, roots, aliases } = findWorkspaceSources(projectRoot);
      done();

      if (names.length === 0) return undefined;

      return {
        resolve: { alias: aliases },
        // Пребандл соседа бессмыслен и вреден: Vite сложил бы его копию в кэш, и правка
        // исходника перестала бы доезжать до браузера до сброса кэша — то есть вернулась бы
        // ровно та беда, ради которой всё это и делается.
        optimizeDeps: { exclude: names },
        // Исходники соседей лежат ВНЕ корня приложения, и без явного разрешения дев-сервер
        // откажется их отдавать. Разрешаем ровно папки найденных соседей, а не корень
        // репозитория: шире — значит открыть наружу и то, что к приложению отношения не имеет.
        //
        // Корень приложения перечислен ПЕРВЫМ и это не избыточность: заданный список ОТМЕНЯЕТ
        // умолчание Vite, и без этой строки дев-сервер отказывает в собственных файлах
        // приложения — `403` на `/src/main.tsx` (замерено на `apps/reference` 2026-08-19).
        server: { fs: { allow: [projectRoot, ...roots] } },
      } satisfies UserConfig;
    },
  };
}

/**
 * Готовый конфиг Vite для приложения на probe-web.
 *
 * Потребитель не знает ни про solid-плагин, ни про версию Vite: и то, и другое — внутреннее
 * дело зоны `build` и меняется её выпуском, без правки файлов у потребителя.
 *
 * @returns конфиг для `export default` в `vite.config.ts` потребителя
 */
export function defineConfig(): UserConfig {
  const done = trace("defineConfig");

  const config: UserConfig = {
    plugins: [solid(), workspaceSourcePlugin()],
    server: {
      // Слушать все интерфейсы, а не имя `localhost`: оно разрешается в `::1`, и до сервера,
      // поднятого в контейнере, не доходят ни браузер с хоста, ни пульт, который проверяет
      // живость по `127.0.0.1`. Зона показывалась мёртвой, будучи поднятой (разбор — в
      // `products/tables/vite.config.ts`), и лечилось это флагом в каждой команде запуска.
      // Место такой настройки — здесь: это свойство дев-сервера, а не аргумент команды.
      host: true,
    },
  };

  done();
  return config;
}
