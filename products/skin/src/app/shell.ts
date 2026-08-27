// КАРКАС ПРИЛОЖЕНИЯ — СОБРАН, А НЕ СВЁРСТАН (`PWEB-151`).
//
// Тем же движком, которым рисуются случаи в галерее (`../pages/showcase/ui/case.tsx`) и которым
// чинились обе инженерные дыры этой сессии (`extras`/`PWEB-152`, провайдер/`PWEB-153`): дерево
// объявляют данными (`PassportAssembly`), `baseAssemblyOf` разворачивает его в плоскую карту,
// `RenderTree` рисует. Второго способа получить разметку из объявления в этой кодовой базе нет —
// и раз RenderTree уже собирает компонент из под-компонентов, module из компонентов и т.д. по
// всему киту, у каркаса приложения нет причины быть исключением: ПАЖИНА — тоже сборка, просто
// уровень выше (страница из модулей, а не часть из под-частей).
//
// ## Рельсы, шапка, показ и панель свойств — EXTRAS рабочей области, не её родная анатомия
//
// `Workspace` (`packages/ui/src/workspace`) знает только ПЯТЬ пустых слотов — кит не имеет права
// знать имя «Rail» или «SettingsPanel», это бизнес-модули ПРОДУКТА, а зависимость кита на продукт
// невозможна структурно. Ровно для этого случая — «настоящий, живой компонент без адреса
// анатомии» — и был построен механизм `extras` (`PWEB-152`): чем разрешалась радиогруппа со своим
// скрытым `<input>`, тем же самым разрешается рабочая область со своим Rail. Разница только в
// том, КТО поставляет карту extras — там кит сам (`components/kit.ts`), здесь продукт (ниже).
//
// ## Extras — поверх БАЗОВОГО реестра, а не внутри него (`entities/catalog`)
//
// `entities/catalog/model/registry.ts` остаётся ЧИСТЫМ от продукта — он знает только кит, и это
// не случайность, а граница FSD: сущности не имеют права знать о своих же страницах и приложении,
// иначе обратная стрелка зависимости сделала бы «сущность» просто другим именем для «app».
// Добавка extras для `workspace` — дело ЭТОГО слоя (`app`), который единственный волен видеть и
// сущности, и страницы, и себя самого.

import { createRegistry, type AssemblyTree } from "@omnifield/probe-web-assembly";
import { baseAssemblyOf, type PassportAssembly } from "@omnifield/probe-web-skin/editor";
import { admits } from "@omnifield/probe-web-ui/passport";

import { assembliesOf } from "../entities/catalog/model/cases.js";
import { editorInfoOf, passportOf } from "../entities/catalog/model/providers.js";
import { REGISTRY } from "../entities/catalog/model/registry.js";
import type { BrowseState } from "../pages/showcase/model/browse.js";
import { BY_GROUP } from "../pages/showcase/model/browse.js";
import type { ConsoleState } from "../pages/showcase/model/console.js";
import type { WearingState } from "../pages/showcase/model/wearing.js";
import { ComponentPage } from "../pages/showcase/ui/component-page.jsx";
import { EventConsole } from "../pages/showcase/ui/event-console.jsx";
import { Head } from "../pages/showcase/ui/head.jsx";
import { SettingsPanel } from "../pages/showcase/ui/settings-panel.jsx";
import { Rail } from "./rail.jsx";

const WORKSPACE = "workspace";

/**
 * Реестр каркаса: базовый реестр витрины (кит целиком) плюс продуктовые extras у `workspace`.
 *
 * Собирается ОДИН раз на модуль, а не на каждый рендер: сама карта не меняется никогда — меняются
 * только пропы, которые несёт дерево, а реестр про пропы ничего не знает.
 */
const workspaceEntry = REGISTRY.components[WORKSPACE];
if (!workspaceEntry) throw new Error(`каркасу нечем рисовать — компонента «${WORKSPACE}» нет в реестре`);

const SHELL_REGISTRY = createRegistry({
  components: {
    ...REGISTRY.components,
    [WORKSPACE]: {
      ...workspaceEntry,
      extras: {
        ...workspaceEntry.extras,
        rail: Rail,
        head: Head,
        componentPage: ComponentPage,
        settingsPanel: SettingsPanel,
        eventConsole: EventConsole,
      },
    },
  },
  admits,
});

export { SHELL_REGISTRY };

/**
 * Дерево каркаса — рельсы, шапка, показ и панель свойств по своим слотам.
 *
 * Вызывается КАЖДЫЙ раз, когда что-то в состоянии меняется (`app.tsx` держит вызов в реактивном
 * выражении JSX, не в `createMemo` — оба приёма равнозначны для Solid, см. `case.tsx`, где то же
 * самое). Пропы — обычные значения И функции сразу: узел живёт в TypeScript, а не в JSON службы
 * пресетов, — граница сериализации проходит только там, где дерево реально уезжает по сети
 * (`../entities/outfit/api/store.ts`), а собственно каркас никогда не покидает бандл приложения.
 */
export function shellTree(
  browse: BrowseState,
  wearing: WearingState,
  consoleState: ConsoleState,
  variants: () => readonly string[],
): AssemblyTree {
  const passport = passportOf(WORKSPACE);
  if (!passport) throw new Error(`каркасу нечем рисовать — паспорта «${WORKSPACE}» нет в ките`);

  const assembly: PassportAssembly = {
    name: "shell",
    means: "каркас приложения: рельсы, шапка, показ, панель свойств",
    tree: {
      part: "root",
      // `100dvh` — ОДНА строка на всё приложение, не рецепт: сколько весит вьюпорт знает только
      // он, а не скин рабочей области (та своей высоты не задаёт вовсе — тем же доводом, что и у
      // сетки, «число колонок — вид», `packages/ui/src/grid/playground/recipe.ts`).
      props: { style: { "block-size": "100dvh" } },
      children: [
        {
          part: "sidebar",
          children: [
            {
              extra: "rail",
              props: { sections: BY_GROUP, current: browse.current(), onSelect: browse.setCurrent },
            },
          ],
        },
        {
          part: "header",
          children: [
            {
              extra: "head",
              props: {
                component: browse.current(),
                variants: variants(),
                variant: browse.variant(),
                state: browse.state(),
                assemblies: assembliesOf(browse.current()),
                assembly: browse.assembly(),
                worn: wearing.worn()?.name ?? null,
                mode: wearing.worn()?.mode ?? "light",
                records: wearing.records(),
                failure: wearing.records.error,
                refusal: wearing.refusal(),
                onVariant: browse.setVariant,
                onState: browse.setState,
                onAssembly: browse.setAssembly,
                onWear: wearing.wear,
                onTakeOff: wearing.takeOff,
                onMode: wearing.setMode,
              },
            },
          ],
        },
        {
          part: "main",
          children: browse.current()
            ? [
                {
                  extra: "componentPage",
                  props: {
                    component: browse.current(),
                    variants: variants(),
                    variant: browse.variant(),
                    state: browse.state(),
                    settings: browse.settings(),
                    assembly: browse.assembly(),
                    dataPreset: browse.dataPreset(),
                    // Одна точка входа для событий любого показанного дерева (`PWEB-157`) —
                    // клик по разделу аккордеона, по чему угодно с объявленным `on`, летит сюда.
                    dispatch: consoleState.log,
                  },
                },
              ]
            : [{ genus: "text", value: "В реестре нет ни одного компонента." }],
        },
        {
          part: "rightbar",
          children: [
            {
              extra: "settingsPanel",
              props: {
                component: browse.current(),
                settings: browse.settings(),
                onSetting: browse.setSetting,
                // Заготовленные варианты заполнения — поставляет кит (`editorInfoOf(...).dataPresets`,
                // `PWEB-156`), не продукт: витрина читает объявленное, как и у `assemblies`/`settings`.
                dataPresets: editorInfoOf(browse.current())?.dataPresets ?? [],
                dataPreset: browse.dataPreset(),
                onDataPreset: browse.setDataPreset,
              },
            },
            { extra: "eventConsole", props: { console: consoleState } },
          ],
        },
      ],
    },
  };

  return baseAssemblyOf(passport, assembly, WORKSPACE);
}
