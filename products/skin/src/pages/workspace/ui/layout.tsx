// СТРАНИЦА-ЛАЙАУТ ВОРКСПЕЙСА — ПЯТЬ ЦЕЛЬНЫХ ЭКРАНОВ ПО ПЯТИ СЛОТАМ, ОБЫЧНЫМ JSX (`PWEB-161`,
// решение user 2026-08-27, отменяет прежнюю версию файла; `PWEB-162` — переезд из `app/shell.tsx`
// сюда, `app/` держит только верхние уровни приложения, лайауты и рельсы — дело `pages/`).
//
// `main` внутри `Workspace` — то, что при живом роутере станет `<Outlet/>` под конкретный маршрут
// (сейчас единственный «маршрут» — показ витрины, выбор которого держит `browse.current()`);
// роутинг подключает другая сессия на уровне фреймворка, здесь заранее только форма папок.
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

import { assembliesOf } from "../../../entities/catalog/model/cases.js";
import { editorInfoOf } from "../../../entities/catalog/model/providers.js";
import type { BrowseState } from "../../showcase/model/browse.js";
import { BY_GROUP } from "../../showcase/model/browse.js";
import type { ConsoleState } from "../../showcase/model/console.js";
import type { WearingState } from "../../showcase/model/wearing.js";
import { ComponentPage } from "../../showcase/ui/component-page.jsx";
import { EventConsole } from "../../showcase/ui/event-console.jsx";
import { Head } from "../../showcase/ui/head.jsx";
import { Rail } from "../../showcase/ui/rail.jsx";
import { SettingsPanel } from "../../showcase/ui/settings-panel.jsx";

/** Лайаут воркспейса целиком — пять слотов `Workspace`, каждый со своим готовым продуктовым экраном. */
export function WorkspaceLayout(props: {
  browse: BrowseState;
  wearing: WearingState;
  consoleState: ConsoleState;
  variants: () => readonly string[];
}) {
  return (
    // `100dvh` — реальная высота вьюпорта, дело ПРИЛОЖЕНИЯ, не рецепта: сколько весит вьюпорт
    // знает только оно (тем же доводом, что у `Grid`, `packages/ui/src/grid/playground/
    // recipe.ts`) — рецепт `Workspace` своей высоты не задаёт вовсе.
    <Workspace style={{ "block-size": "100dvh" }}>
      <WorkspaceSidebar>
        <Rail sections={BY_GROUP} current={props.browse.current()} onSelect={props.browse.setCurrent} />
      </WorkspaceSidebar>

      <WorkspaceHeader>
        <Head
          component={props.browse.current()}
          variants={props.variants()}
          variant={props.browse.variant()}
          state={props.browse.state()}
          assemblies={assembliesOf(props.browse.current())}
          assembly={props.browse.assembly()}
          worn={props.wearing.worn()?.name ?? null}
          mode={props.wearing.worn()?.mode ?? "light"}
          records={props.wearing.records()}
          failure={props.wearing.records.error}
          refusal={props.wearing.refusal()}
          onVariant={props.browse.setVariant}
          onState={props.browse.setState}
          onAssembly={props.browse.setAssembly}
          onWear={props.wearing.wear}
          onTakeOff={props.wearing.takeOff}
          onMode={props.wearing.setMode}
        />
      </WorkspaceHeader>

      <WorkspaceMain>
        <ComponentPage
          component={props.browse.current()}
          variants={props.variants()}
          variant={props.browse.variant()}
          state={props.browse.state()}
          settings={props.browse.settings()}
          assembly={props.browse.assembly()}
          dataPreset={props.browse.dataPreset()}
          // Одна точка входа для событий любого показанного дерева (`PWEB-157`) — клик по разделу
          // аккордеона, по чему угодно с объявленным `on`, летит сюда.
          dispatch={props.consoleState.log}
        />
      </WorkspaceMain>

      <WorkspaceRightbar>
        <SettingsPanel
          component={props.browse.current()}
          settings={props.browse.settings()}
          onSetting={props.browse.setSetting}
          // Заготовленные варианты заполнения — поставляет кит (`editorInfoOf(...).dataPresets`,
          // `PWEB-156`), не продукт: витрина читает объявленное, как и у `assemblies`/`settings`.
          dataPresets={editorInfoOf(props.browse.current())?.dataPresets ?? []}
          dataPreset={props.browse.dataPreset()}
          onDataPreset={props.browse.setDataPreset}
        />
        <EventConsole console={props.consoleState} />
      </WorkspaceRightbar>
    </Workspace>
  );
}
