// ВИТРИНА — раскладка. Что показывается, откуда берётся и как называется.
//
// ДВЕ КОЛОНКИ (`PWEB-31`, первая волна):
//
//   ┌──────────────┬────────────────────────────────────┐
//   │ компоненты   │ страница компонента                │
//   │ и выбор      │ части, вариации, случаи — сеткой   │
//   │ скина        │                                    │
//   └──────────────┴────────────────────────────────────┘
//
// Третьей колонки — панели правки — здесь НЕТ: витрина показывает, редактор правит, и это
// разные вещи (страница «Устройство продукта»). Так же разложено у Storybook: перечень, холст и
// панели — разные области, а выбор темы живёт вообще не там, где правка.
//
// ВЫБОР СКИНА — в колонке перечня, а не на странице компонента: скин один на всю витрину, и
// принадлежит он не кнопке. Тронешь его на странице кнопки — покажется, что одеваешь кнопку, а
// одевается всё.
//
// НАДЕВАНИЕ ЗОВЁТСЯ, А НЕ ПОВТОРЯЕТСЯ. Лист стилей, атрибут на корне и память выбора — механика
// приложения (`runtime`). Своей вставки стилей в зоне нет: вторая реализация того же разошлась
// бы с первой ровно тогда, когда одна из них научится чему-то новому.
//
// ## Этот файл держит ТОЛЬКО раскладку и состояние витрины целиком
//
// Каждая область — отдельный компонент в своём файле: `head.tsx` (шапка: скин, режим, оси),
// `component-page.tsx` (показ случаев), `settings-panel.tsx` (чем компонент может быть),
// `case.tsx` (одна карточка). Здесь — что их всех связывает: какой компонент выбран, что надето,
// куда идёт правка.

import { knownComponents } from "@omnifield/probe-web-assembly";
import { makeSkinSwitch, type SkinMode, type SkinWorn } from "@omnifield/probe-web-runtime";
import { editorInfoOf, GROUPS, groupOf } from "@omnifield/probe-web-ui/passport";
import { createResource, createSignal, For, onMount, Show, untrack } from "solid-js";

import { assembleOutfit, listOutfits, SKIN_SOURCE } from "../skins/index.js";
import { ANY, defaultSettings, type Axis } from "./cases.js";
import { ComponentPage } from "./component-page.jsx";
import { Head } from "./head.jsx";
import { reasonOf } from "./reason.js";
import { REGISTRY } from "./registry.js";
import { SettingsPanel } from "./settings-panel.jsx";

/** Адреса компонентов, которые витрина знает. Перечень приходит ИЗ РЕЕСТРА, своего нет. */
const COMPONENTS = knownComponents(REGISTRY);

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
const BY_GROUP = Object.entries(GROUPS)
  .map(([group, title]) => ({
    group,
    title,
    components: COMPONENTS.filter((component) => {
      const editorInfo = editorInfoOf(component);
      return editorInfo !== undefined && groupOf(editorInfo) === group;
    }),
  }))
  .filter((section) => section.components.length > 0);

/** Переключатель скинов. Владеет своим листом стилей и опознанием на корне. */
const SKIN = makeSkinSwitch(SKIN_SOURCE);

export function App() {
  const [current, setCurrentSignal] = createSignal(COMPONENTS[0] ?? "");

  // ОСИ ВИТРИНЫ — ДВЕ: вариации развёрнуты, состояние ОБЫЧНОЕ.
  //
  // Части среди них нет (решение user 2026-08-23): смотрящий думает «наведение», а не «наведение
  // корневой части». Часть осталась адресом внутри записи — состояние ставится на тот узел, чья
  // часть его объявила, — но выбирать её человеку незачем.
  //
  // Пришедший смотрит сперва на то, как компонент выглядит, когда с ним ничего не происходит:
  // это и есть его вид, а наведённый и отключённый — отклонения.
  const [variant, setVariant] = createSignal<Axis<string>>(ANY);
  const [state, setState] = createSignal<Axis<string | null>>(null);

  // НАСТРОЙКИ ПОСТАВЩИКА — чем компонент может быть. Начальное положение берётся у паспорта, а не
  // из пустоты: «не названо» и «названо умолчанием» обязаны быть одним положением, иначе список в
  // шапке показывал бы одно, а показ работал бы по другому.
  // Начальное положение снимается ОДИН раз и намеренно вне слежения: дальше настройки меняет
  // человек, а на смену компонента их перезаводит `setCurrent`. Слежение здесь означало бы, что
  // выбор человека затирается при любом чтении текущего компонента.
  const [settings, setSettings] = createSignal<Record<string, unknown>>(
    untrack(() => defaultSettings(current())),
  );

  /** Смена компонента сбрасывает оси: чужое состояние на нём не значит ничего. */
  const setCurrent = (component: string) => {
    setCurrentSignal(component);
    setVariant(ANY);
    setState(null);
    // Настройки тоже чужие: `collapsible` у гармошки ничего не значит для кнопки, а её умолчания
    // объявляет её собственный паспорт.
    setSettings(defaultSettings(component));
  };

  const setSetting = (name: string, value: unknown) =>
    setSettings((previous) => ({ ...previous, [name]: value }));
  // НАДЕТОЕ — это имя И половина вместе: половина принадлежит скину, а не документу, и второй
  // ручки под неё не существует. Нет скина — нет и половины.
  const [worn, setWorn] = createSignal<SkinWorn | null>(null);

  /**
   * Ставит надетое по ответу механики, а отказ гасит с НАЗВАННОЙ причиной.
   *
   * Отказ показанное не рушит: механика полусостояний не оставляет — пока текста нет, на корне и
   * в листе стоит прежнее, — и витрине после отказа менять нечего. А вот оставить сам отказ
   * незакрытым нельзя: необработанное отклонение человеку не говорит ничего и валит прогон проб
   * целиком, хотя на странице всё законно.
   */
  // ОТКАЗ НАДЕВАНИЯ — состояние витрины, а не строка в отладчике. Сборка отвергает наряд целиком:
  // запись, пережившая компонент, перестаёт собираться вся, — и молчащая витрина оставила бы
  // человека с голым китом и без причины, при живой службе и полном списке скинов.
  const [refusal, setRefusal] = createSignal<string | null>(null);

  const wearing = (attempt: Promise<SkinWorn | null>): void => {
    void attempt
      .then((next) => {
        setRefusal(null);
        setWorn(next);
      })
      .catch((cause: unknown) => {
        console.debug("скин не надет", cause);
        setRefusal(reasonOf(cause));
      });
  };

  /** Сменить половину — значит надеть тот же скин в другой половине. Другого пути нет. */
  const setMode = (mode: SkinMode) => {
    const current = worn();

    if (current === null) return;

    wearing(SKIN.wear(current.name, { mode }));
  };

  // Перечень НАРЯДОВ — из СЛУЖБЫ. Части по отдельности не надеваются, поэтому в списке стоят
  // наряды: палитру и формы человек видит в редакторе, а не здесь.
  const [records] = createResource(() => listOutfits());

  // СОБРАННЫЙ ВИД надетого наряда — из тех же частей, которыми его одела механика. Имена
  // вариаций живут в форме, и взять их больше неоткуда: паспорт их не знает, витрина не
  // придумывает.
  const [wornSkin] = createResource(
    () => worn()?.name,
    async (name: string) => (await assembleOutfit(name)).skin,
  );

  /** Имена вариаций надетого скина для показанного компонента. Нет скина — называть нечего. */
  const variants = (): readonly string[] =>
    Object.keys(wornSkin()?.recipes[current()]?.variants ?? {});

  // Первый заход: восстанавливаем запомненный выбор, а если его нет — надеваем первый скин
  // службы и НЕ запоминаем. Витрина существует, чтобы смотреть на одетое, но чужое умолчание
  // выбором человека не является, и памятью оно не становится.
  //
  // Службы нет — не надеваем ничего и не падаем: остаётся голый кит, причина названа рядом.
  onMount(() => {
    void (async () => {
      try {
        const restored = await SKIN.restore();
        if (restored !== null) {
          setWorn(restored);
          return;
        }

        // Механика за человека не придумывает: не вспомнилось — не надето. Витрина же существует
        // ради показа, поэтому первый скин надевает САМА и НЕ запоминает: чужое умолчание
        // выбором человека не является.
        const [first] = await SKIN.names();
        if (first !== undefined) setWorn(await SKIN.wear(first, { remember: false }));
      } catch (cause) {
        // Первый заход — тот самый случай, когда молчание дороже всего: человек ничего не выбирал
        // и не узнал бы даже, что выбранное когда-то надевалось.
        console.debug("скин не надет на первом заходе", cause);
        setRefusal(reasonOf(cause));
      }
    })();
  });

  const wear = (name: string) => {
    wearing(SKIN.wear(name));
  };

  const takeOff = () => {
    SKIN.takeOff();
    setWorn(SKIN.worn());
  };

  return (
    <div class="shell">
      {/* Сайдбар — во всю высоту: перечень это опора работы, и обрезать его хедером значит
          отнимать у него строки ради полосы, которая нужна реже. Хедер стоит НАД ПОКАЗОМ и
          управляет тем, что в показе видно. */}
      <aside class="rail">
        <div class="rail__head">
          <b class="rail__title">Витрина</b>
          <span class="rail__note">перечень — из реестра паспортов</span>
        </div>

        <nav class="rail__list">
          <For each={BY_GROUP}>
            {(section) => (
              <>
                <b class="rail__group">{section.title}</b>
                <For each={section.components}>
                  {(component) => (
                    <button
                      class="rail__item"
                      type="button"
                      aria-current={component === current() ? "true" : undefined}
                      onClick={() => setCurrent(component)}
                    >
                      {component}
                    </button>
                  )}
                </For>
              </>
            )}
          </For>
        </nav>
      </aside>

      {/* Правая половина: хедер и показ. Прокрутка своя у каждой из двух областей — перечень
          длинный сам по себе, показ длиннее вдвое, и общий скролл уводил бы перечень наверх
          ровно тогда, когда по нему надо переключиться. */}
      <div class="stack">
        <Head
          component={current()}
          variants={variants()}
          variant={variant()}
          state={state()}
          worn={worn()?.name ?? null}
          mode={worn()?.mode ?? "light"}
          records={records()}
          failure={records.error}
          refusal={refusal()}
          onVariant={setVariant}
          onState={setState}
          onWear={wear}
          onTakeOff={takeOff}
          onMode={setMode}
        />

        {/* Показ и свойства — РЯДОМ, а не друг под другом: правка настройки должна быть видна на
            том же экране, без прокрутки к панели и обратно. */}
        <div class="content">
          <main class="main">
            <Show when={current()} fallback={<p class="empty">В реестре нет ни одного компонента.</p>}>
              {(component) => (
                <ComponentPage
                  component={component()}
                  variants={variants()}
                  variant={variant()}
                  state={state()}
                  settings={settings()}
                />
              )}
            </Show>
          </main>

          <Show when={current()}>
            {(component) => (
              <SettingsPanel component={component()} settings={settings()} onSetting={setSetting} />
            )}
          </Show>
        </div>
      </div>
    </div>
  );
}
