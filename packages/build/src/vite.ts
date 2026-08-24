// Точка 2 замороженной поверхности — СБОРКА (`PROBEWEB-4`).
//
// `vite.config.ts` лежит у потребителя классом `placed-once`: положен один раз и больше
// никогда не обновится. Оставить его содержательным значило бы заморозить версию Vite, набор
// плагинов и настройки сборки — то есть ровно то, что обязано двигаться. Поэтому конфиг
// целиком прячется сюда, а у потребителя остаются три строки: импорт, вызов, `export default`.

import { resolve, sep } from "node:path";

import {
  normalizePath,
  type EnvironmentModuleNode,
  type Plugin,
  type UserConfig,
  type ViteDevServer,
} from "vite";
import solid from "vite-plugin-solid";

import { trace } from "./trace.js";
import { findWorkspaceSources, type GeneratedCss } from "./workspace-source.js";

/**
 * Разбор дерева, общий на оба дев-плагина.
 *
 * Считать соседей можно только зная корень проекта, а он появляется в хуке `config`. Значит
 * разбор один, а пользователей у него два, и делить результат приходится состоянием, а не
 * аргументом: второй плагин к тому моменту уже создан.
 */
interface DevState {
  /** CSS-подпути соседей, которые сосед умеет породить сам. */
  generated: GeneratedCss[];
}

/**
 * Дев-часть конфига: соседи по воркспейсу видны исходниками и не пребандлятся.
 *
 * Плагин, а не поля в самом конфиге, по двум причинам. Первая — считать соседей можно только
 * зная корень проекта, а он известен Vite, а не нам: `config.root` потребитель вправе задать
 * сам. Вторая — `apply: "serve"` держит подмену в дев-цикле и не пускает её в сборку: собирать
 * приложение обязано ровно то, что уедет потребителю, иначе гейт сборки перестаёт быть гейтом.
 *
 * @param state общее состояние дев-плагинов — заполняется здесь, читается порождением CSS
 * @returns плагин Vite, добавляющий алиасы, исключения пребандла и доступ к файлам соседей
 */
function workspaceSourcePlugin(state: DevState): Plugin {
  return {
    name: "probe-web-build:workspace-source",
    apply: "serve",
    config(config) {
      const done = trace("workspaceSourcePlugin.config");
      const projectRoot = resolve(config.root ?? process.cwd());
      const { names, roots, aliases, generated } = findWorkspaceSources(projectRoot);
      done();

      // Заполняем ДО раннего возврата: порождение CSS живёт в другом плагине, и пустой список
      // для него такой же законный ответ, как непустой.
      state.generated = generated;

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
 * Лежит ли файл внутри папки.
 *
 * Сравнение по границе сегмента, а не по префиксу строки: иначе `…/style-tools` считался бы
 * содержимым `…/style`, и правка одной зоны сбрасывала бы CSS другой.
 *
 * @param root корень папки
 * @param file путь файла
 * @returns `true`, если файл лежит внутри
 */
function isInside(root: string, file: string): boolean {
  return file === root || file.startsWith(root.endsWith(sep) ? root : root + sep);
}

/**
 * Дев-часть конфига: CSS соседа ПОРОЖДАЕТСЯ в момент запроса, а не читается из его сборки.
 *
 * Предмет. Порождение базового CSS — чистая функция пакета-соседа, вынесенная на его
 * поверхность подпутём `./generate` (`PWEB-20`). Звать её в момент запроса некому: подмену
 * делает дев-сервер, а он здесь. Без этого зацепа приложение видит `dist/css/*.css` прошлой
 * сборки — на свежем клоне его нет вовсе (отказ), а после сборки он тихо устаревает от первой
 * же правки перечня в коде соседа.
 *
 * Сверка с рынком (2026-08-19, приведена соседом в `PWEB-20` и проверена здесь): порождение
 * чистой функцией внутри пакета плюс зацеп плагином дев-сервера — форма UnoCSS и
 * `@tailwindcss/vite`. Своего здесь ровно одно: КАК опознаётся способность соседа.
 *
 * Три решения, каждое со своей причиной:
 *
 * 1. **`enforce: "pre"`.** Перехват обязан случиться до разрешения по `exports`: иначе Vite
 *    уходит за файлом в `dist`, и на свежем клоне разрешение отказывает ещё до нашего `load`.
 * 2. **Id перехваченного модуля — та же цель `exports`**, что и в сборке. Один адрес в обоих
 *    режимах: дев его порождает, сборка читает файлом. Разойтись в адресах значило бы завести
 *    два разных модуля под одним импортом.
 * 3. **Порождатель грузится через сам дев-сервер** (`ssrLoadModule`), а не импортом из `dist`.
 *    Импорт из `dist` вернул бы ровно ту вчерашнюю сборку, ради ухода от которой всё и делается;
 *    загрузка через сервер идёт по ИСХОДНИКАМ соседа и переисполняется после их правки.
 *
 * `apply: "serve"` — сборки это не касается: собирается ровно то, что уедет потребителю.
 *
 * @param state общее состояние дев-плагинов, заполненное разбором дерева
 * @returns плагин Vite, отдающий порождённый CSS
 */
function generatedCssPlugin(state: DevState): Plugin {
  let server: ViteDevServer | undefined;

  return {
    name: "probe-web-build:generated-css",
    apply: "serve",
    enforce: "pre",

    configureServer(current) {
      server = current;
    },

    resolveId(source) {
      return state.generated.find((entry) => entry.specifier === source)?.id;
    },

    async load(id) {
      const entry = state.generated.find((candidate) => candidate.id === id);
      if (!entry || !server) return undefined;

      const done = trace(`generatedCss ${entry.specifier}`);
      // `/@fs/` — штатный способ назвать дев-серверу файл ВНЕ корня приложения. Голый
      // абсолютный путь он разрешает относительно корня проекта, и сосед по нему не найдётся.
      const module = await server.ssrLoadModule(`/@fs/${normalizePath(entry.generator)}`);
      const generate: unknown = module[entry.exportName];
      done();

      // Функции нет — подпуть остаётся файлом на диске: пакет объявил `./generate`, но этот
      // CSS не порождает. Молчаливый возврат отдаёт его обычному разрешению Vite, то есть
      // прежнему поведению, а не роняет приложение из-за чужой раскладки.
      if (typeof generate !== "function") return undefined;

      return String((generate as () => unknown)());
    },

    hotUpdate({ file, modules }) {
      // Правка исходника соседа обязана дойти до глаз БЕЗ пересборки. Порождённый CSS в графе
      // клиента ни на один из этих файлов не ссылается — импорт у него один, и тот из
      // приложения, — поэтому связь достраивается здесь: правка внутри пакета-соседа
      // обесценивает всё, что этот сосед порождает.
      if (this.environment.name !== "client") return undefined;

      const stale: EnvironmentModuleNode[] = [];
      for (const entry of state.generated) {
        if (!isInside(entry.root, file)) continue;

        const module = this.environment.moduleGraph.getModuleById(entry.id);
        if (!module) continue;

        this.environment.moduleGraph.invalidateModule(module);
        stale.push(module);
      }

      // Возвращённый массив ЗАМЕЩАЕТ штатный, а не дополняет его: отдать один свой список
      // значило бы отменить обновление модулей самого файла. Поэтому либо молчим, либо
      // называем оба.
      return stale.length > 0 ? [...modules, ...stale] : undefined;
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

  // Состояние живёт ровно один конфиг: две фабрики, вызванные для двух приложений, не делят
  // между собой ни дерева, ни соседей.
  const state: DevState = { generated: [] };

  const config: UserConfig = {
    plugins: [solid(), workspaceSourcePlugin(state), generatedCssPlugin(state)],
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
