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

import { knownComponents, RenderTree, type EditOverlayProps } from "@omnifield/probe-web-assembly";
// `readSkin` из механики приложения читает КОРЕНЬ (что надето и в каком режиме), а одноимённая
// функция хранилища читает ЗАПИСЬ. Предметы разные, имена совпали — развожу их псевдонимом, а не
// переименованием чужого.
import {
  applySkin,
  makeSkinSwitch,
  readSkin as readRoot,
  type SkinMode,
} from "@omnifield/probe-web-runtime";
import { GROUPS, groupOf, PASSPORTS, passportOf } from "@omnifield/probe-web-ui/passport";
import {
  type Component,
  createResource,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

import {
  listSkins,
  readSkin,
  EMPTY_HINT,
  SERVICE_HINT,
  SKIN_SOURCE,
  type SkinRecord,
} from "../skins/index.js";
import { skinGaps, type SkinGap } from "@omnifield/probe-web-skin/model";

import {
  addressOfPart,
  casesOf,
  partsOf,
  rootPartOf,
  statesOfPart,
  type ShowcaseCase,
} from "./cases.js";
import { REGISTRY } from "./registry.js";

/** Адреса компонентов, которые витрина знает. Перечень приходит ИЗ РЕЕСТРА, своего нет. */
const COMPONENTS = knownComponents(REGISTRY);

/**
 * Компоненты по разделам.
 *
 * Раздел объявляет САМ компонент (`group` в паспорте), а перечень разделов и их подписи живут у
 * формы паспорта. Своего перечня витрина не заводит: назови она разделы сама — их стало бы два,
 * и у следующего пульта третий. Порядок разделов — порядок объявления в перечне, а не наш.
 *
 * Пустые разделы не показываются: раздел без компонентов это обещание, которого никто не давал.
 */
const BY_GROUP = Object.entries(GROUPS)
  .map(([group, title]) => ({
    group,
    title,
    components: COMPONENTS.filter((component) => {
      const passport = passportOf(component);
      return passport !== undefined && groupOf(passport) === group;
    }),
  }))
  .filter((section) => section.components.length > 0);

/** Переключатель скинов. Владеет своим листом стилей и опознанием на корне. */
const SKIN = makeSkinSwitch(SKIN_SOURCE);

/** Порог, за которым карточка перестаёт делить строку с соседями. */
const WIDE_AT = 380;

/**
 * КАРТОЧКА СЛУЧАЯ — компонент в условии, нарисованный МЕХАНИКОЙ.
 *
 * Отрисовка — тот же `RenderTree`, которым рисует потребитель. Второго способа превратить дерево
 * в вид не существует, и именно поэтому витрина отвечает за то, что увидит человек.
 *
 * ШИРИНУ КАРТОЧКА РЕШАЕТ САМА, измерением. Ни паспорт, ни наш список «крупных компонентов» этого
 * не решают: паспорт про вид не говорит, а список устарел бы на первом же новом компоненте.
 * Содержимое шире порога — карточка занимает всю строку, и кнопка с диалогом живут в одном
 * потоке, не подгоняя его друг под друга.
 */
function Case(props: { item: ShowcaseCase; overlay?: Component<EditOverlayProps> }) {
  const [wide, setWide] = createSignal(false);
  let stage!: HTMLDivElement;

  onMount(() => {
    const measure = () => setWide(stage.scrollWidth > WIDE_AT);

    measure();

    // Среда без наблюдателя размеров (jsdom в пробах) меряет один раз и живёт дальше: ширина
    // карточки — украшение показа, и ронять из-за неё весь показ нечестно.
    if (typeof ResizeObserver !== "function") return;

    // Пересчитываем на смену скина и шрифтов: одетый компонент шире голого, и «широкий» — это
    // свойство того, что показано сейчас, а не того, что показали в первый кадр.
    const watcher = new ResizeObserver(measure);
    watcher.observe(stage);
    onCleanup(() => watcher.disconnect());
  });

  return (
    <figure class="case" classList={{ "case--wide": wide() }}>
      <div class="case__stage" ref={stage}>
        <RenderTree tree={props.item.tree} registry={REGISTRY} editOverlay={props.overlay} />
      </div>
      <figcaption class="case__caption">
        <b class="case__title" classList={{ "case__title--axis": props.item.origin === "axis" }}>
          {props.item.title}
        </b>
        <span class="case__note">{props.item.note}</span>
      </figcaption>
    </figure>
  );
}

/**
 * Подсветка выбранной части — слотом украшения МЕХАНИКИ, а не своей обёрткой.
 *
 * Слот ортогонален отрисовке: не задан — путь прежний, ни одного лишнего узла в разметке. Тот же
 * слот будет рисовать выделение в редакторе, поэтому и берём его, а не рисуем рамку сами.
 */
function highlight(address: string): Component<EditOverlayProps> {
  return (props) => (
    <Show when={props.node.type === address}>
      <span class="pick" />
    </Show>
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

/**
 * ОСИ — фильтр, а не раскладка.
 *
 * Ось в положении «все» разворачивается в поток случаев, названная — фиксируется. Так один и тот
 * же показ годится компоненту любого размера: что разворачивать, решает человек.
 *
 * Часть «всех» не имеет намеренно: состояние всегда чьё-то, и «состояние вообще» — не адрес.
 * Перечень состояний следует за выбранной частью: словарь у каждой части свой.
 */
function Axes(props: {
  component: string;
  variants: readonly string[];
  part: string;
  variant: string | null;
  state: string | null;
  onPart: (part: string) => void;
  onVariant: (variant: string | null) => void;
  onState: (state: string | null) => void;
}) {
  return (
    <div class="axes">
      <label class="axes__field">
        <span class="axes__label">часть</span>
        <select
          class="axes__select"
          value={props.part}
          onChange={(event) => props.onPart(event.currentTarget.value)}
        >
          <For each={partsOf(props.component)}>
            {(part) => <option value={part}>{part}</option>}
          </For>
        </select>
      </label>

      <label class="axes__field">
        <span class="axes__label">вариация</span>
        <select
          class="axes__select"
          value={props.variant ?? ""}
          disabled={props.variants.length === 0}
          onChange={(event) =>
            props.onVariant(event.currentTarget.value === "" ? null : event.currentTarget.value)
          }
        >
          <option value="">все</option>
          <For each={props.variants}>{(name) => <option value={name}>{name}</option>}</For>
        </select>
      </label>

      <label class="axes__field">
        <span class="axes__label">состояние</span>
        <select
          class="axes__select"
          value={props.state ?? ""}
          onChange={(event) =>
            props.onState(event.currentTarget.value === "" ? null : event.currentTarget.value)
          }
        >
          <option value="">все</option>
          <For each={statesOfPart(props.component, props.part)}>
            {(state) => <option value={state.name}>{state.name}</option>}
          </For>
        </select>
      </label>
    </div>
  );
}

/** Страница компонента: что он объявил о себе, чего не одето и как держится в случаях. */
function ComponentPage(props: {
  component: string;
  variants: readonly string[];
  gaps: readonly SkinGap[];
  part: string;
  variant: string | null;
  state: string | null;
  onPart: (part: string) => void;
  onVariant: (variant: string | null) => void;
  onState: (state: string | null) => void;
}) {
  const cases = () =>
    casesOf(props.component, {
      part: props.part,
      variant: props.variant,
      state: props.state,
      variants: props.variants,
    });

  return (
    <article class="page">
      <header class="page__head">
        <h1 class="page__title">{props.component}</h1>
        <p class="page__facts">
          <Show when={passportOf(props.component)}>
            {(passport) => (
              <>
                <span class="page__fact">раздел: {GROUPS[groupOf(passport())]}</span>
                <span class="page__fact">род: {passport().genus}</span>
                <span class="page__fact">поставщик: {passport().package}</span>
              </>
            )}
          </Show>
        </p>
      </header>

      <Axes
        component={props.component}
        variants={props.variants}
        part={props.part}
        variant={props.variant}
        state={props.state}
        onPart={props.onPart}
        onVariant={props.onVariant}
        onState={props.onState}
      />

      <Show when={props.variants.length === 0}>
        <p class="page__empty">
          Вариаций нет — скин не надет: имена принадлежат скину, и называть их за него витрина не
          вправе. Случаи ниже показывают голый кит.
        </p>
      </Show>

      <section class="page__section">
        <div class="cases">
          <For each={cases()}>
            {(item) => <Case item={item} overlay={highlight(addressOfPart(props.component, props.part))} />}
          </For>
        </div>
      </section>

      <section class="page__section">
        <h2 class="page__subtitle">Долг одевания</h2>
        <Show
          when={props.gaps.length > 0}
          fallback={
            <p class="page__empty">
              Всё объявленное одето: ни одной части и ни одного состояния без правила.
            </p>
          }
        >
          <ul class="gaps">
            <For each={props.gaps}>
              {(gap) => (
                <li class="gaps__item">
                  <code class="gaps__kind">{gap.kind}</code>
                  <span class="gaps__means">{gap.means}</span>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </section>

      <section class="page__section">
        <h2 class="page__subtitle">Части и состояния</h2>
        <Parts component={props.component} />
      </section>
    </article>
  );
}

/**
 * ХЕДЕР: что надето и в каком режиме.
 *
 * Оба выбора здесь, а не на странице компонента, по одной причине: **они общие на всю витрину**.
 * Скин один на всё, режим один на всё; стой они на странице кнопки, показалось бы, что одеваешь
 * кнопку, а одевается всё.
 *
 * СКИН — списком выбора, а не рядом кнопок: скинов станет много, и ряд кнопок расползётся по
 * ширине, отбирая место у самого показа. «Снят» — первый пункт списка и полноправный выбор:
 * голый кит это рабочее состояние продукта, а не отсутствие выбора.
 *
 * ТРИ СОСТОЯНИЯ ХРАНИЛИЩА говорятся врозь, потому что лечатся разным: перечень есть · служба
 * отвечает, но пуста · службы нет. Слепи их в одно «ничего нет» — человек пойдёт чинить не то, а
 * пустой список прочтёт как «скинов не существует».
 *
 * Элементы здесь НАТИВНЫЕ. Витрина — инструмент, и ждать, пока появится скин, чтобы её саму
 * можно было использовать, она не вправе: одевать кита ею же и означает работать без скина.
 */
function Head(props: {
  worn: string | null;
  records: readonly SkinRecord[] | undefined;
  failure: unknown;
  mode: SkinMode;
  onWear: (name: string) => void;
  onTakeOff: () => void;
  onMode: (mode: SkinMode) => void;
}) {
  const choose = (value: string) => {
    if (value === "") props.onTakeOff();
    else props.onWear(value);
  };

  const trouble = (): string | null => {
    if (props.failure !== undefined) {
      return `${String((props.failure as Error).message)} · ${SERVICE_HINT}`;
    }

    return (props.records?.length ?? 0) === 0 ? `Скинов в службе нет · ${EMPTY_HINT}` : null;
  };

  return (
    <header class="head">
      {/* Слева — только то, что требует внимания. В обычном состоянии здесь пусто: что надето,
          и так написано в списке справа, а вторая надпись про то же — шум, который перестают
          читать, и вместе с ним перестают читать настоящую беду. */}
      <Show when={trouble()}>{(said) => <p class="head__trouble">{said()}</p>}</Show>

      <div class="head__controls">
        <div class="modes" role="group" aria-label="Режим">
          <For each={["light", "dark"] as const}>
            {(value) => (
              <button
                class="modes__item"
                type="button"
                aria-pressed={props.mode === value}
                onClick={() => props.onMode(value)}
              >
                {value === "light" ? "светлый" : "тёмный"}
              </button>
            )}
          </For>
        </div>

        <select
          class="head__select"
          aria-label="Скин"
          value={props.worn ?? ""}
          disabled={props.failure !== undefined || (props.records?.length ?? 0) === 0}
          onChange={(event) => choose(event.currentTarget.value)}
        >
          <option value="">без скина</option>
          <For each={props.records ?? []}>
            {(record) => <option value={record.name}>{record.label}</option>}
          </For>
        </select>
      </div>
    </header>
  );
}

export function App() {
  const [current, setCurrentSignal] = createSignal(COMPONENTS[0] ?? "");

  // ОСИ. Часть по умолчанию корневая, остальные оси развёрнуты: одевающий приходит смотреть, что
  // одето, а не искать, где это включается.
  const [part, setPart] = createSignal(rootPartOf(COMPONENTS[0] ?? ""));
  const [variant, setVariant] = createSignal<string | null>(null);
  const [state, setState] = createSignal<string | null>(null);

  /** Смена компонента сбрасывает оси: чужая часть и чужое состояние на нём не значат ничего. */
  const setCurrent = (component: string) => {
    setCurrentSignal(component);
    setPart(rootPartOf(component));
    setVariant(null);
    setState(null);
  };

  /** Смена части сбрасывает состояние: словарь состояний у каждой части свой. */
  const choosePart = (value: string) => {
    setPart(value);
    setState(null);
  };
  const [worn, setWorn] = createSignal<string | null>(null);

  // РЕЖИМ переключается механикой приложения, а не классом в разметке: пара для тёмного —
  // ответственность скина, и проверять её надо тем же путём, которым режим меняет потребитель.
  const [mode, setModeSignal] = createSignal<SkinMode>(readRoot().mode);

  const setMode = (value: SkinMode) => {
    applySkin({ mode: value });
    setModeSignal(readRoot().mode);
  };

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

  /**
   * ДОЛГ ОДЕВАНИЯ показанного компонента — считает МЕХАНИКА, а не витрина.
   *
   * Свой подсчёт здесь стал бы вторым ответом на один вопрос: у редактора появился бы третий, и
   * разошлись бы они в тот день, когда показали бы разное про один скин.
   */
  const gaps = (): readonly SkinGap[] => {
    const skin = wornSkin();

    return skin === undefined
      ? []
      : skinGaps(skin, Object.values(PASSPORTS)).filter((gap) => gap.component === current());
  };

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
          worn={worn()}
          records={records()}
          failure={records.error}
          mode={mode()}
          onWear={wear}
          onTakeOff={takeOff}
          onMode={setMode}
        />

        <main class="main">
          <Show when={current()} fallback={<p class="empty">В реестре нет ни одного компонента.</p>}>
            {(component) => (
              <ComponentPage
                component={component()}
                variants={variants()}
                gaps={gaps()}
                part={part()}
                variant={variant()}
                state={state()}
                onPart={choosePart}
                onVariant={setVariant}
                onState={setState}
              />
            )}
          </Show>
        </main>
      </div>
    </div>
  );
}
