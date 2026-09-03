// РЕЕСТР МЕХАНИКИ СБОРКИ + ИНСТАНЦИРОВАНИЕ ДЛЯ СВОЕГО КИТА (`PWEB-220`) — тем же приёмом, что
// `createComponentInfo`/`kitComponentProvider` (`PWEB-217`–`219`): продукт зовёт готовое, не
// собирает `Registry`/`instanceOf` заново на каждый следующий заход.
//
// Найдено user при разборе `products/skin/src/entities/component/model/registry.ts`+`instance.ts`
// (пересобраны без `providers.ts` на этой же волне): «если для RenderTree нужны instance и
// registry, получается что это базовый флоу, а не индивидуально для скин-витрины» — оба файла
// продукта делали ровно то же самое: `readable(component)` (паспорт+карта частей+срез редактора
// → `ReadableComponent`, которого просит `Registry`) и `instanceOf(...)` (сборка по имени/первая,
// материализация, запасной путь — образец из анатомии). Продуктовое там было ровно одно — КАКОЙ
// кит, остальное — механика.
//
// ПОЧЕМУ ОТДЕЛЬНЫЙ ФАЙЛ, А НЕ РЯДОМ С `component-info.ts`. `component-info.ts` держит инвариант
// «ноль Solid, ноль браузера» — по нему уже сегодня ходят порождение CSS, проверка дерева и
// хранилище, и код там прямо предупреждает: затащи в него компоненты — сломаются все трое (см.
// шапку `./kit.js`). `Registry`/`instanceOf` требуют РЕАЛЬНУЮ карту частей (`KIT[component].
// parts` — настоящие Solid-компоненты), не только паспорт, поэтому этот файл — Solid-ветка,
// как корневой `index.ts` (`solid: true` в `vite.config.ts`), а не подпуть-данные вроде
// `./passport`/`./io`/`./component-info`.
//
// DI И МЕРДЖ — ТЕ ЖЕ, ЧТО У `component-info.ts`. `ComponentProvider` там уже несёт необязательное
// четвёртое поле `kitOf` ровно для этого файла (сам `component-info.ts` его не читает и не
// требует); `mergeComponentProviders` уже маршрутизирует и его. Второй файл собирать своё
// слияние не должен — коллизия имени компонента одна и та же проблема что для паспорта, что для
// карты частей.

import {
  createRegistry,
  isContent,
  sketchOf,
  updateNode,
  type AssemblyTree,
  type ReadableComponent,
  type ReadablePart,
  type Registry,
  type SelfAssembly,
} from "@omnifield/probe-web-assembly";

import { admits, baseAssemblyOf } from "./passport.js";
import { kitComponentProvider, type ComponentProvider } from "./component-info.js";
import type { KitComponent } from "./kit-form.js";
import { KIT } from "./kit.js";

/** То, что `kitComponentRenderer` реально требует от поставщика — `kitOf` здесь ОБЯЗАТЕЛЕН. */
export interface ComponentRendererProvider extends ComponentProvider {
  readonly kitOf: (component: string) => KitComponent | undefined;
}

let kitRendererProvider: ComponentRendererProvider | undefined;

/**
 * Поставщик этого кита, ГОТОВЫЙ для реестра механики сборки — тот же {@link kitComponentProvider},
 * плюс `kitOf`, читающий реальную карту частей (`./kit.js`).
 */
function ownKitRendererProvider(): ComponentRendererProvider {
  if (kitRendererProvider === undefined) {
    kitRendererProvider = { ...kitComponentProvider(), kitOf: (component) => KIT[component] };
  }

  return kitRendererProvider;
}

function readable(component: string, provider: ComponentRendererProvider): ReadableComponent {
  const kit = provider.kitOf(component);
  if (kit === undefined) {
    throw new Error(`компонент «${component}» не объявлен в ките — карту частей взять неоткуда`);
  }

  const editorInfo = provider.editorInfoOf(component);
  if (editorInfo === undefined) {
    throw new Error(`компонент «${component}» без среза редактора — род и допуск объявить нечем`);
  }

  return {
    passport: {
      component: kit.passport.component,
      genus: editorInfo.genus,
      anatomy: kit.passport.anatomy,
      root: kit.passport.root,
      parts: kit.passport.parts.map(
        (part): ReadablePart => ({
          name: part.name,
          accepts: editorInfo.parts[part.name]?.accepts,
        }),
      ),
      selfAssembly: kit.passport.selfAssembly as SelfAssembly | undefined,
    },
    parts: kit.parts,
    ...(kit.provider ? { provider: kit.provider } : {}),
  };
}

/** Готовые `registry`/`instanceOf` для механики сборки — по умолчанию поверх СВОЕГО кита. */
export interface ComponentRenderer {
  readonly registry: Registry;
  /**
   * Экземпляр компонента: сборка по имени (или первая объявленная), материализованная
   * (`baseAssemblyOf`); нет ни одной сборки — запасной путь, образец из анатомии (`sketchOf`).
   */
  instanceOf(
    component: string,
    rootProps: Readonly<Record<string, unknown>>,
    assemblyName?: string,
    data?: unknown,
  ): AssemblyTree;
}

/**
 * Заводит `Registry` + `instanceOf` поверх названного поставщика — не назван, берётся у
 * {@link ownKitRendererProvider} (свой кит). Второй поставщик — {@link mergeComponentProviders}
 * (`component-info.ts`), результатом сюда: форма (`kitOf` плюс три поля `ComponentProvider`) та
 * же, слияние ничего не знает про рендеринг и не обязано.
 */
export function kitComponentRenderer(provider: ComponentRendererProvider = ownKitRendererProvider()): ComponentRenderer {
  const registry = createRegistry({
    components: Object.fromEntries(provider.components.map((name) => [name, readable(name, provider)])),
    admits,
  });

  function instanceOf(
    component: string,
    rootProps: Readonly<Record<string, unknown>>,
    assemblyName?: string,
    data?: unknown,
  ): AssemblyTree {
    const passport = provider.passportOf(component);
    const assemblies = provider.editorInfoOf(component)?.assemblies ?? [];
    const assembly =
      (assemblyName !== undefined ? assemblies.find((item) => item.name === assemblyName) : undefined) ??
      assemblies[0];
    const base = passport && assembly ? baseAssemblyOf(passport, assembly, undefined, data) : undefined;
    const sketch = base ?? sketchOf(registry, component);

    if (!sketch) {
      throw new Error(`компонента «${component}» нет в реестре — экземпляр собрать не из чего`);
    }

    const root = sketch.components.root;
    const before = (sketch as AssemblyTree).components.nodes[root];

    const onRoot = updateNode(sketch as AssemblyTree, root, {
      props: { ...(!before || isContent(before) ? {} : before.props), ...rootProps },
    });

    if (!onRoot.ok) throw new Error(`экземпляр отвергнут механикой — ${onRoot.means}`);

    return onRoot.tree;
  }

  return { registry, instanceOf };
}
