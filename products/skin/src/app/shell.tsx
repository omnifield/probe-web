// КАРКАС ПРИЛОЖЕНИЯ — ПЯТЬ ЦЕЛЬНЫХ ЭКРАНОВ ПО ПЯТИ СЛОТАМ, ОБЫЧНЫМ JSX (`PWEB-161`, решение user
// 2026-08-27, отменяет прежнюю версию файла).
//
// ## Почему не через `RenderTree`/`PassportAssembly`, как случаи галереи
//
// `RenderTree` зарабатывает свою сложность там, где дерево ДОЛЖНО быть данными: галерея порождает
// из одной сборки десятки случаев (вариация × состояние), редактор должен уметь дерево прочитать
// и переставить местами. Это работа над АНАТОМИЕЙ ОДНОГО компонента — из чего собран `accordion`,
// какие у него части.
//
// `Rail`/`Head`/`ComponentPage`/`SettingsPanel`/`EventConsole` — не части анатомии `Workspace`,
// которые нужно варьировать. Это пять целых, готовых продуктовых экранов, и их ровно пять, раз
// навсегда, руками автора. Прежняя версия этого файла (220 строк: `createRegistry`, `extras`,
// пять обёрток-компонентов без единого прока, `baseAssemblyOf`) прогоняла раскладку ПЯТИ ГОТОВЫХ
// ВЕЩЕЙ через тот же движок, что генерит вариации анатомии одной, — чужая задача чужим
// инструментом, отсюда и объём. `Workspace` — как раз для прямой раскладки целых компонентов по
// именованным слотам (пример в его собственном `components/index.tsx`), и это НЕ то же самое
// нарушение, от которого ушли раньше («сборка идёт из скина, а не пишется в апп»): там речь шла о
// подмене движка СБОРКИ АНАТОМИИ ручной вёрсткой, здесь анатомии нет вовсе — есть обычная
// композиция экранов, та же, какой стоит любое Solid-приложение.
//
// Витрина по-прежнему показывает `workspace` в галерее той же сеткой и тем же нарядом — сборки
// `basic`/`no-rightbar` кита (`packages/ui/src/workspace/playground/assemblies.ts`) доказывают
// раскладку плейсхолдерным текстом, тем же приёмом, что у любого другого компонента кита: вид
// совпадает, потому что компонент и наряд те же, а не потому, что дерево одно и то же.

import { Workspace, WorkspaceHeader, WorkspaceMain, WorkspaceRightbar, WorkspaceSidebar } from "@omnifield/probe-web-ui";

import { assembliesOf } from "../entities/catalog/model/cases.js";
import { editorInfoOf } from "../entities/catalog/model/providers.js";
import type { BrowseState } from "../pages/showcase/model/browse.js";
import { BY_GROUP } from "../pages/showcase/model/browse.js";
import type { ConsoleState } from "../pages/showcase/model/console.js";
import type { WearingState } from "../pages/showcase/model/wearing.js";
import { ComponentPage } from "../pages/showcase/ui/component-page.jsx";
import { EventConsole } from "../pages/showcase/ui/event-console.jsx";
import { Head } from "../pages/showcase/ui/head.jsx";
import { SettingsPanel } from "../pages/showcase/ui/settings-panel.jsx";
import { Rail } from "./rail.jsx";

/** Каркас целиком — пять слотов `Workspace`, каждый со своим готовым продуктовым экраном. */
export function Shell(props: {
  browse: BrowseState;
  wearing: WearingState;
  consoleState: ConsoleState;
  variants: () => readonly string[];
}) {
  const { browse, wearing, consoleState, variants } = props;

  return (
    // `100dvh` — реальная высота вьюпорта, дело ПРИЛОЖЕНИЯ, не рецепта: сколько весит вьюпорт
    // знает только оно (тем же доводом, что у `Grid`, `packages/ui/src/grid/playground/
    // recipe.ts`) — рецепт `Workspace` своей высоты не задаёт вовсе.
    <Workspace style={{ "block-size": "100dvh" }}>
      <WorkspaceSidebar>
        <Rail sections={BY_GROUP} current={browse.current()} onSelect={browse.setCurrent} />
      </WorkspaceSidebar>

      <WorkspaceHeader>
        <Head
          component={browse.current()}
          variants={variants()}
          variant={browse.variant()}
          state={browse.state()}
          assemblies={assembliesOf(browse.current())}
          assembly={browse.assembly()}
          worn={wearing.worn()?.name ?? null}
          mode={wearing.worn()?.mode ?? "light"}
          records={wearing.records()}
          failure={wearing.records.error}
          refusal={wearing.refusal()}
          onVariant={browse.setVariant}
          onState={browse.setState}
          onAssembly={browse.setAssembly}
          onWear={wearing.wear}
          onTakeOff={wearing.takeOff}
          onMode={wearing.setMode}
        />
      </WorkspaceHeader>

      <WorkspaceMain>
        <ComponentPage
          component={browse.current()}
          variants={variants()}
          variant={browse.variant()}
          state={browse.state()}
          settings={browse.settings()}
          assembly={browse.assembly()}
          dataPreset={browse.dataPreset()}
          // Одна точка входа для событий любого показанного дерева (`PWEB-157`) — клик по разделу
          // аккордеона, по чему угодно с объявленным `on`, летит сюда.
          dispatch={consoleState.log}
        />
      </WorkspaceMain>

      <WorkspaceRightbar>
        <SettingsPanel
          component={browse.current()}
          settings={browse.settings()}
          onSetting={browse.setSetting}
          // Заготовленные варианты заполнения — поставляет кит (`editorInfoOf(...).dataPresets`,
          // `PWEB-156`), не продукт: витрина читает объявленное, как и у `assemblies`/`settings`.
          dataPresets={editorInfoOf(browse.current())?.dataPresets ?? []}
          dataPreset={browse.dataPreset()}
          onDataPreset={browse.setDataPreset}
        />
        <EventConsole console={consoleState} />
      </WorkspaceRightbar>
    </Workspace>
  );
}
