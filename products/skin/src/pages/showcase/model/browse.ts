// СОСТОЯНИЕ ПРОСМОТРА — какой компонент выбран и что из него показывать (`PWEB-154`, разнесено
// из `app/app.tsx`, который на 300 строк держал сразу шесть разных забот).
//
// ЧТО ИМЕННО ЗДЕСЬ, А ЧТО НЕТ. Просмотр отвечает на «что мы СЕЙЧАС смотрим» — компонент, вариацию,
// состояние, сборку, настройки поставщика. НАДЕТОЕ (какой скин, какая половина) — отдельная забота
// (`./wearing.ts`): скин один на всю витрину и не зависит от того, какой компонент открыт, а
// просмотр наоборот целиком завязан на выбранный компонент. Разные оси перемен — разные файлы.
//
// СМЕНА КОМПОНЕНТА СБРАСЫВАЕТ ОСИ: вариация, состояние, сборка и настройки одного компонента не
// значат ничего для другого — `collapsible` пуст для кнопки так же, как «раскрыт» пуст для неё же.

import { knownComponents } from "@omnifield/probe-web-assembly";
import { GROUPS, groupOf } from "@omnifield/probe-web-ui/passport";
import { createSignal, untrack } from "solid-js";

import type { DataPreset } from "@omnifield/probe-web-ui/passport";

import { ANY, type Axis } from "../../../entities/catalog/model/cases.js";
import { editorInfoOf } from "../../../entities/catalog/model/providers.js";
import { REGISTRY } from "../../../entities/catalog/model/registry.js";
import { defaultSettings } from "./settings.js";

/** Адреса компонентов, которые витрина знает. Перечень приходит ИЗ РЕЕСТРА, своего нет. */
export const COMPONENTS = knownComponents(REGISTRY);

/**
 * Компоненты по разделам.
 *
 * Раздел объявляет САМ компонент (`group` в срезе редактора — `PWEB-115`/`PWEB-118`, паспорт
 * рантайма его не несёт), а перечень разделов и их подписи живут у формы паспорта. Своего перечня
 * витрина не заводит: назови она разделы сама — их стало бы два, и у следующего пульта третий.
 * Порядок разделов — порядок объявления в перечне, а не наш.
 *
 * Пустые разделы не показываются: раздел без компонентов это обещание, которого никто не давал.
 */
export const BY_GROUP = Object.entries(GROUPS)
  .map(([group, title]) => ({
    group,
    title,
    components: COMPONENTS.filter((component) => {
      const editorInfo = editorInfoOf(component);
      return editorInfo !== undefined && groupOf(editorInfo) === group;
    }),
  }))
  .filter((section) => section.components.length > 0);

/**
 * Состояние просмотра: какой компонент открыт и что из него сейчас видно.
 *
 * Фабрика, а не модуль-синглтон: `App` вызывает её ровно один раз на свой корень, тем же приёмом,
 * что и `createSignal` — состояние принадлежит месту вызова, а не файлу.
 */
export function createBrowseState() {
  const [current, setCurrentSignal] = createSignal(COMPONENTS[0] ?? "");

  // ОСИ ВИТРИНЫ — ДВЕ: вариации развёрнуты, состояние ОБЫЧНОЕ.
  //
  // Части среди них нет (решение user 2026-08-23): смотрящий думает «наведение», а не «наведение
  // корневой части». Часть осталась адресом внутри записи — состояние ставится на тот узел, чья
  // часть его объявила, — но выбирать её человеку незачем.
  //
  // Пришедший смотрит сперва на то, как компонент выглядит, когда с ним ничего не происходит: это
  // и есть его вид, а наведённый и отключённый — отклонения.
  const [variant, setVariant] = createSignal<Axis<string>>(ANY);
  const [state, setState] = createSignal<Axis<string | null>>(null);

  // СБОРКА — какой РАБОЧИЙ ЭКЗЕМПЛЯР компонента показываем, когда их несколько (`instance.ts`).
  // Пустая строка — «не выбирали», тем же приёмом, что и у обычного состояния: первая объявленная
  // сборка не требует явного имени.
  const [assembly, setAssembly] = createSignal<string>("");

  // НАСТРОЙКИ ПОСТАВЩИКА — чем компонент может быть. Начальное положение берётся у паспорта, а не
  // из пустоты: «не названо» и «названо умолчанием» обязаны быть одним положением, иначе список в
  // шапке показывал бы одно, а показ работал бы по другому.
  // Начальное положение снимается ОДИН раз и намеренно вне слежения: дальше настройки меняет
  // человек, а на смену компонента их перезаводит `setCurrent`. Слежение здесь означало бы, что
  // выбор человека затирается при любом чтении текущего компонента.
  const [settings, setSettings] = createSignal<Record<string, unknown>>(
    untrack(() => defaultSettings(current())),
  );

  // ВАРИАНТ ЗАПОЛНЕНИЯ (`PWEB-156`) — какими данными наполнена сборка `filled`, если она есть у
  // компонента. `null` — не выбран, тем же приёмом «не выбирали», что у остальных осей. Отдельная
  // ось от `settings`: настройка меняет, ЧЕМ компонент является (`collapsible`, `multiple`), а
  // заполнение — что он показывает, не трогая устройство ни на волос.
  const [dataPreset, setDataPresetSignal] = createSignal<DataPreset | null>(null);

  /** Смена компонента сбрасывает оси: чужое состояние на нём не значит ничего. */
  const setCurrent = (component: string) => {
    setCurrentSignal(component);
    setVariant(ANY);
    setState(null);
    // Настройки тоже чужие: `collapsible` у гармошки ничего не значит для кнопки, а её умолчания
    // объявляет её собственный паспорт.
    setSettings(defaultSettings(component));
    // Сборка — тоже чужая: имя «workspace» у сетки ничего не значит для кнопки.
    setAssembly("");
    // Заполнение — чужие данные: JSON под аккордеон ничего не значит для чекбокса.
    setDataPreset(null);
  };

  const setSetting = (name: string, value: unknown) =>
    setSettings((previous) => ({ ...previous, [name]: value }));

  /**
   * Выбор заполнения переключает и сборку (`PWEB-156`) — вручную гонять ДВЕ ручки (сперва
   * «сборка: filled» в шапке, потом «данные: …» в панели) ради одного намерения и есть то
   * самое «маленько тут, маленько тут», от которого ушли (постановка user, 2026-08-27):
   * заполнение без `filled`-сборки нечему показывать, и человек не обязан знать об этой
   * внутренней связи, чтобы ею воспользоваться. Ручной выбор сборки в шапке остаётся —
   * `setAssembly` никуда не делась, и человек волен переключиться на `basic` сам.
   */
  const setDataPreset = (preset: DataPreset | null) => {
    setDataPresetSignal(preset);
    setAssembly(preset ? "filled" : "");
  };

  return {
    current,
    variant,
    state,
    assembly,
    settings,
    dataPreset,
    setCurrent,
    setVariant,
    setState,
    setAssembly,
    setSetting,
    setDataPreset,
  };
}

export type BrowseState = ReturnType<typeof createBrowseState>;
