// Точка 2 замороженной поверхности — СБОРКА (`PROBEWEB-4`).
//
// `vite.config.ts` лежит у потребителя классом `placed-once`: положен один раз и больше
// никогда не обновится. Оставить его содержательным значило бы заморозить версию Vite, набор
// плагинов и настройки сборки — то есть ровно то, что обязано двигаться. Поэтому конфиг
// целиком прячется сюда, а у потребителя остаются три строки: импорт, вызов, `export default`.

import { isAbsolute, resolve, sep } from "node:path";

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
 * Опции, которые редкому потребителю всё же нужно назвать самому.
 *
 * Не про вкус — про то, что вывести неоткуда: `base` меняет физический смысл собранных путей
 * (приложение живёт не в корне origin), `proxy` называет чужой процесс, о котором пресет знать
 * не может. Обычный потребитель не передаёт ничего — см. `defineConfig()` без аргументов у
 * `apps/reference`, `products/skin` и остальных.
 */
export interface DefineConfigOptions {
  readonly base?: string;
  readonly proxy?: NonNullable<UserConfig["server"]>["proxy"];
  /** Extra plugins, appended after the preset's own — a dev-only status/proxy route, say. */
  readonly plugins?: readonly Plugin[];
}

/**
 * Готовый конфиг Vite для приложения на probe-web.
 *
 * Потребитель не знает ни про solid-плагин, ни про версию Vite: и то, и другое — внутреннее
 * дело зоны `build` и меняется её выпуском, без правки файлов у потребителя.
 *
 * @returns конфиг для `export default` в `vite.config.ts` потребителя
 */
export function defineConfig(options: DefineConfigOptions = {}): UserConfig {
  const done = trace("defineConfig");

  // Состояние живёт ровно один конфиг: две фабрики, вызванные для двух приложений, не делят
  // между собой ни дерева, ни соседей.
  const state: DevState = { generated: [] };

  const config: UserConfig = {
    ...(options.base ? { base: options.base } : {}),
    plugins: [solid(), workspaceSourcePlugin(state), generatedCssPlugin(state), ...(options.plugins ?? [])],
    server: {
      // Слушать все интерфейсы, а не имя `localhost`: оно разрешается в `::1`, и до сервера,
      // поднятого в контейнере, не доходят ни браузер с хоста, ни пульт, который проверяет
      // живость по `127.0.0.1`. Зона показывалась мёртвой, будучи поднятой (разбор — в
      // `products/tables/vite.config.ts`), и лечилось это флагом в каждой команде запуска.
      // Место такой настройки — здесь: это свойство дев-сервера, а не аргумент команды.
      host: true,
      ...(options.proxy ? { proxy: options.proxy } : {}),
    },
  };

  done();
  return config;
}

// ЕЩЁ ОДНА РАБОТА ТОГО ЖЕ ПОДПУТИ — сборка БИБЛИОТЕКИ (`ui`, `skin-mech`, `assembly`, …) вместо
// приложения. Раньше каждая такая зона носила свой `scripts/build.mjs` поверх esbuild — почти
// дословный повтор в трёх копиях, который никто не заметил бы разошедшимся, пока `rm shit` не
// снёс все три разом. Держатель один, как и у `defineConfig()` выше: то же место, та же причина
// (`placed-once` у потребителя, содержательная часть — здесь и меняется одним выпуском).
//
// Отдельного пакета под это не заводим: `@vite-config`-пакет одним набором функций под и
// приложение, и библиотеку — рыночная форма (Turborepo, любой монорепо-стартер с общим
// `vite-config`), не изобретение здесь. Прежнее чтение `PROBEWEB-4` («направление
// зависимостей одностороннее, `ui` не вправе зависеть от `build`») было перестраховкой уже
// на первом же примере: одна оснастка на разные цели потребления — это и есть тот самый
// paved road, а не два держателя одного и того же знания.

/** Один вход поставки библиотеки. */
export interface LibraryEntry {
  /** Имя выхода: `dist/<name>.js` (и `dist/<name>.jsx`, когда `solid: true`). */
  readonly name: string;
  /** Путь входа от корня пакета, например `"src/index.ts"`. */
  readonly source: string;
  /**
   * Вход отдаёт JSX и обязан уехать ДВУМЯ ветками: `dist/<name>.jsx` (условие `solid` —
   * непреобразованный JSX, потребитель на Solid применит свою трансформацию сам) и
   * `dist/<name>.js` (`default` — тот же вход, JSX уже разобран `vite-plugin-solid`, для
   * тех, кто про условие `solid` не знает).
   */
  readonly solid?: boolean;
}

/** Опции сборки поставки библиотеки. */
export interface DefineLibraryConfigOptions {
  /** Входы поставки — по одному на каждую цель `exports`, несущую модуль. */
  readonly entries: readonly LibraryEntry[];
}

/** Внешние зависимости бандла: ЛЮБОЙ спецификатор не относительным и не абсолютным путём. */
function externalizeDependencies(id: string): boolean {
  return !id.startsWith(".") && !isAbsolute(id);
}

/**
 * Ветка `solid` для входов, отдающих JSX, — непреобразованный JSX (`dist/<name>.jsx`), рядом с
 * тем, что уже положил Vite веткой `default`.
 *
 * ПОЧЕМУ ЭТО esbuild, А НЕ ЕЩЁ ОДИН `vite build`. Vite 8 транслирует TS/JSX через Oxc/Rolldown,
 * и на день написания (2026-08) `oxc.jsx: "preserve"` в library mode не работает вовсе — падает
 * уже на разборе, "JSX syntax is disabled" (проверено живьём минимальным повтором, до всякой
 * обвязки). esbuild `jsx: "preserve"` — тот же приём, что был здесь годами (`tsup-preset-solid`
 * стоит на нём же), и он единственный, кто сегодня реально это умеет. Это НЕ откат к прежним
 * ручным скриптам: единственный узкий вызов на единственную задачу, которую сам Vite пока не
 * тянет, — а не оркестратор всей поставки.
 *
 * ВЫЗЫВАЕТСЯ ПОСЛЕ Vite (`closeBundle`), а не вместо него: `dist/<name>.js` (ветка `default`)
 * кладёт Vite, эта функция дописывает только `dist/<name>.jsx` рядом.
 *
 * @param root корень пакета (соответствует `process.cwd()` вызывающего `vite build`)
 * @param entries входы, отмеченные `solid: true`
 */
async function buildRawJsxBranch(root: string, entries: readonly LibraryEntry[]): Promise<void> {
  const { build } = await import("esbuild");
  for (const entry of entries) {
    await build({
      entryPoints: [resolve(root, entry.source)],
      bundle: true,
      format: "esm",
      platform: "browser",
      target: "es2023",
      jsx: "preserve",
      // Всё, что не относительный путь, — наружу: та же граница, что и у ветки `default`.
      packages: "external",
      sourcemap: true,
      // Исходники в тарбол не едут (`files` манифеста) — карта обязана нести их в себе.
      sourcesContent: true,
      outfile: resolve(root, "dist", `${entry.name}.jsx`),
    });
  }
}

/**
 * Готовый конфиг Vite для сборки БИБЛИОТЕКИ probe-web (`library mode` — штатный режим Vite, не
 * самодельный):
 *
 * ```jsonc
 * // package.json потребителя
 * "build": "vite build && tsc -p tsconfig.build.json"
 * ```
 *
 * Один проход `vite build` собирает ВСЕ входы веткой `default` (плагин `vite-plugin-solid`
 * включён — JSX разбирается), и в конце сборки (`closeBundle`) довешивает ветку `solid` —
 * непреобразованный JSX — для входов, отмеченных `solid: true` (см. `buildRawJsxBranch`).
 *
 * Внешние зависимости — ЛЮБОЙ спецификатор не относительным путём: чужого в бандл не попадает
 * ни байта, копию `solid-js`/`@ark-ui/solid`/т.п. приносит потребитель. Декларации (`.d.ts`) в
 * этот конфиг не входят — отдельным `tsc`, тем же компилятором, что проверяет код при
 * typecheck: второго источника правды о типах в пакете нет.
 *
 * @param options входы поставки
 * @returns конфиг для `export default` в `vite.config.ts` потребителя
 */
export function defineLibraryConfig(options: DefineLibraryConfigOptions): UserConfig {
  const solidEntries = options.entries.filter((entry) => entry.solid);

  return {
    plugins: [
      solid(),
      solidEntries.length > 0
        ? {
            name: "probe-web-build:library-raw-jsx",
            apply: "build",
            async closeBundle() {
              await buildRawJsxBranch(process.cwd(), solidEntries);
            },
          }
        : undefined,
    ],
    build: {
      target: "es2023",
      sourcemap: true,
      lib: {
        entry: Object.fromEntries(
          options.entries.map((entry) => [entry.name, resolve(process.cwd(), entry.source)]),
        ),
        formats: ["es"],
        fileName: (_format, entryName) => `${entryName}.js`,
      },
      rollupOptions: { external: externalizeDependencies },
    },
  };
}
