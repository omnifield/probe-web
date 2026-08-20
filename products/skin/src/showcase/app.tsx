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

import { knownComponents, RenderTree } from "@omnifield/probe-web-assembly";
import { makeSkinSwitch } from "@omnifield/probe-web-runtime";
import { passportOf } from "@omnifield/probe-web-ui/passport";
import { createResource, createSignal, For, onMount, Show } from "solid-js";

import {
  listSkins,
  readSkin,
  EMPTY_HINT,
  SERVICE_HINT,
  SKIN_SOURCE,
  type SkinRecord,
} from "../skins/index.js";
import { CASES, variantCases, type ShowcaseCase } from "./cases.js";
import { REGISTRY } from "./registry.js";

/** Адреса компонентов, которые витрина знает. Перечень приходит ИЗ РЕЕСТРА, своего нет. */
const COMPONENTS = knownComponents(REGISTRY);

/** Переключатель скинов. Владеет своим листом стилей и опознанием на корне. */
const SKIN = makeSkinSwitch(SKIN_SOURCE);

/**
 * Один случай: подпись, пояснение и сам компонент, нарисованный МЕХАНИКОЙ.
 *
 * Отрисовка — тот же `RenderTree`, которым рисует потребитель. Второго способа превратить
 * дерево в вид не существует, и именно поэтому витрина отвечает за то, что увидит человек.
 */
function Case(props: { item: ShowcaseCase }) {
  return (
    <figure class="case">
      <div class="case__stage">
        <RenderTree tree={props.item.tree} registry={REGISTRY} />
      </div>
      <figcaption class="case__caption">
        <b class="case__title">{props.item.title}</b>
        <span class="case__note">{props.item.note}</span>
      </figcaption>
    </figure>
  );
}

/** Части компонента — из анатомии, а не из нашего представления о нём. */
function Parts(props: { component: string }) {
  const passport = () => passportOf(props.component);

  return (
    <Show when={passport()}>
      {(found) => (
        <ul class="parts">
          <For each={found().parts}>
            {(part) => (
              <li class="parts__item">
                <code class="parts__name">{part.name}</code>
                <span class="parts__means">{part.means}</span>
                <span class="parts__states">
                  {part.states.map((state) => state.name).join(" · ")}
                </span>
              </li>
            )}
          </For>
        </ul>
      )}
    </Show>
  );
}

/** Страница компонента: что он объявил о себе и как держится в случаях. */
function ComponentPage(props: { component: string; variants: readonly string[] }) {
  const cases = () => CASES[props.component] ?? [];

  return (
    <article class="page">
      <header class="page__head">
        <h1 class="page__title">{props.component}</h1>
        <p class="page__lead">
          Части и состояния — из паспорта компонента. Вариации — из надетого скина. Случаи собраны
          из образца и нарисованы механикой сборки.
        </p>
      </header>

      <section class="page__section">
        <h2 class="page__subtitle">Части и состояния</h2>
        <Parts component={props.component} />
      </section>

      <section class="page__section">
        <h2 class="page__subtitle">Вариации</h2>
        <Show
          when={props.variants.length > 0}
          fallback={
            <p class="page__empty">
              Скин не надет — имён вариаций нет. Они принадлежат скину, а не компоненту.
            </p>
          }
        >
          <div class="cases">
            <For each={variantCases(props.component, props.variants)}>
              {(item) => <Case item={item} />}
            </For>
          </div>
        </Show>
      </section>

      <section class="page__section">
        <h2 class="page__subtitle">Случаи</h2>
        <div class="cases">
          <For each={cases()}>{(item) => <Case item={item} />}</For>
        </div>
      </section>
    </article>
  );
}

/**
 * Выбор скина: что надето, чем заменить, чем снять.
 *
 * Снятие — отдельная кнопка, а не «пустой» пункт перечня: голый кит это законное рабочее
 * состояние продукта, и обращаться с ним как с отсутствием выбора значило бы прятать его.
 *
 * ТРИ СОСТОЯНИЯ ХРАНИЛИЩА говорятся врозь, потому что лечатся разным: перечень есть · служба
 * пуста (засеять) · службы нет (поднять, адрес назван). Слепи их в одно «ничего нет» — человек
 * пойдёт чинить не то, а пустой список прочтёт как «скинов не существует».
 */
function SkinChoice(props: {
  worn: string | null;
  records: readonly SkinRecord[] | undefined;
  failure: unknown;
  onWear: (name: string) => void;
  onTakeOff: () => void;
}) {
  return (
    <div class="skins">
      <b class="skins__title">Скин</b>

      <For each={props.records ?? []}>
        {(record) => (
          <button
            class="skins__item"
            type="button"
            aria-pressed={record.name === props.worn}
            onClick={() => props.onWear(record.name)}
          >
            {record.label}
          </button>
        )}
      </For>

      <Show when={props.records && props.records.length > 0}>
        <button
          class="skins__item skins__item--off"
          type="button"
          aria-pressed={props.worn === null}
          onClick={() => props.onTakeOff()}
        >
          снять
        </button>
      </Show>

      <p class="skins__state">
        <Show
          when={props.failure}
          fallback={
            <Show
              when={props.records && props.records.length > 0}
              fallback={
                <>
                  Служба отвечает, но скинов в ней нет:
                  <code class="skins__cmd">{EMPTY_HINT}</code>
                </>
              }
            >
              <Show
                when={props.worn}
                fallback="Скин снят — кит показан голым. Рабочее состояние продукта, а не поломка витрины."
              >
                {(name) => `Надет «${name()}». Снимите — останется голый кит: это проверка, а не поломка.`}
              </Show>
            </Show>
          }
        >
          {(failure) => (
            <>
              {String((failure() as Error).message)}
              <code class="skins__cmd">{SERVICE_HINT}</code>
            </>
          )}
        </Show>
      </p>
    </div>
  );
}

export function App() {
  const [current, setCurrent] = createSignal(COMPONENTS[0] ?? "");
  const [worn, setWorn] = createSignal<string | null>(null);

  // Перечень — из СЛУЖБЫ. Запасного списка нет: витрина без службы показывает голый кит и
  // называет причину с адресом, а не подсовывает встроенное под видом хранимого.
  const [records] = createResource(() => listSkins());

  // ЗАПИСЬ надетого скина — тоже из службы: имена вариаций живут в ней, и взять их больше
  // неоткуда. Паспорт их не знает, витрина не придумывает.
  const [wornSkin] = createResource(worn, async (name: string) => {
    const record = (await listSkins()).find((item) => item.name === name);
    return record === undefined ? undefined : readSkin(record.id);
  });

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

        const [first] = await SKIN.names();
        if (first !== undefined) setWorn(await SKIN.wear(first, { remember: false }));
      } catch (cause) {
        console.debug("скин не надет на первом заходе", cause);
      }
    })();
  });

  const wear = (name: string) => {
    void SKIN.wear(name).then(setWorn);
  };

  const takeOff = () => {
    SKIN.takeOff();
    setWorn(SKIN.worn());
  };

  return (
    <div class="shell">
      <aside class="rail">
        <div class="rail__head">
          <b class="rail__title">Витрина</b>
          <span class="rail__note">перечень — из реестра паспортов</span>
        </div>
        <nav class="rail__list">
          <For each={COMPONENTS}>
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
        </nav>
        <SkinChoice
          worn={worn()}
          records={records()}
          failure={records.error}
          onWear={wear}
          onTakeOff={takeOff}
        />
      </aside>

      <main class="main">
        <Show when={current()} fallback={<p class="empty">В реестре нет ни одного компонента.</p>}>
          {(component) => <ComponentPage component={component()} variants={variants()} />}
        </Show>
      </main>
    </div>
  );
}
