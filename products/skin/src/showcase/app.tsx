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
import { makeSkinSwitch, type SkinMode, type SkinWorn } from "@omnifield/probe-web-runtime";
import { GROUPS, groupOf, passportOf } from "@omnifield/probe-web-ui/passport";
import {
  createResource,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

import {
  assembleOutfit,
  EMPTY_HINT,
  listOutfits,
  SERVICE_HINT,
  SKIN_SOURCE,
  type StoreRecord,
} from "../skins/index.js";
import {
  ANY,
  casesOf,
  statesOfComponent,
  type Axis,
  type ShowcaseCase,
} from "./cases.js";
import { REGISTRY } from "./registry.js";

/**
 * Обычное состояние в списке выбора — ПУСТЫМ значением.
 *
 * Пустое взято нарочно: именем состояния оно быть не может ни у одного паспорта, а значит выбор
 * «обычное» не столкнётся с состоянием, которое кто-то так назовёт.
 */
const PLAIN = "";

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
function Case(props: { item: ShowcaseCase }) {
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

  // ОПИСАНИЕ СВЕРХУ, КОМПОНЕНТ НИЖЕ (решение user 2026-08-23): человек сперва читает, на что
  // смотрит, и уже потом смотрит. Обратный порядок заставлял угадывать, что за карточка перед
  // ним, и искать подпись под ней.
  return (
    <figure class="case" classList={{ "case--wide": wide() }}>
      <figcaption class="case__caption">
        <b class="case__title">{props.item.title}</b>

        <Show when={props.item.at.state !== null}>
          <span class="case__state">{props.item.at.state}</span>
        </Show>

      </figcaption>

      <div class="case__stage" ref={stage}>
        <RenderTree tree={props.item.tree} registry={REGISTRY} />
      </div>
    </figure>
  );
}

/**
 * ОСИ — фильтр, а не раскладка.
 *
 * Ось в положении «все» разворачивается в поток случаев, названная — фиксируется. Так один и тот
 * же показ годится компоненту любого размера: что разворачивать, решает человек.
 *
 * У состояния положений ТРИ: обычное · все · названное. Обычное — не «фильтр не задан», а сам
 * вид компонента, когда с ним ничего не происходит; всё прочее показывает отклонения от него.
 *
 * ЧАСТИ ЗДЕСЬ НЕТ (решение user 2026-08-23). Смотрящий думает «наведение», а не «наведение
 * корневой части»: часть — адрес внутри записи, и на витрине она была лишним выбором, который
 * приходилось сделать, прежде чем добраться до нужного.
 *
 * Состояния собираются по ВСЕМ частям и склеиваются по имени: «раскрыт» у гармошки объявлен на
 * трёх частях сразу, но для смотрящего это одно состояние компонента.
 */
function Axes(props: {
  component: string;
  variants: readonly string[];
  variant: Axis<string>;
  state: Axis<string | null>;
  onVariant: (variant: Axis<string>) => void;
  onState: (state: Axis<string | null>) => void;
}) {
  return (
    <div class="axes">
      <label class="axes__field">
        <span class="axes__label">вариация</span>
        <select
          class="axes__select"
          value={props.variant}
          disabled={props.variants.length === 0}
          onChange={(event) => props.onVariant(event.currentTarget.value)}
        >
          <option value={ANY}>все</option>
          <For each={props.variants}>{(name) => <option value={name}>{name}</option>}</For>
        </select>
      </label>

      <label class="axes__field">
        <span class="axes__label">состояние</span>
        <select
          class="axes__select"
          value={props.state ?? PLAIN}
          onChange={(event) =>
            props.onState(event.currentTarget.value === PLAIN ? null : event.currentTarget.value)
          }
        >
          {/* ОБЫЧНОЕ первым и выбранным: с него начинают смотреть, остальное — отклонения от
              него. «Все» стоит рядом и остаётся одним движением руки. */}
          <option value={PLAIN}>обычное</option>
          <option value={ANY}>все</option>
          <For each={statesOfComponent(props.component)}>
            {(state) => <option value={state.name}>{state.name}</option>}
          </For>
        </select>
      </label>
    </div>
  );
}

/**
 * СТРАНИЦА КОМПОНЕНТА — показ, и только он.
 *
 * Витрина существует, чтобы СМОТРЕТЬ: полистать компоненты, переключить скин, показать человеку,
 * который оценивает вид, а не устройство. Поэтому здесь нет ни долга одевания, ни перечня частей
 * с состояниями, ни паспортных фактов — всё это техничка, и живёт она отдельно (решение user
 * 2026-08-21).
 *
 * Убрано не «потому что мешает», а потому что смешение двух предметов портит оба: заказчик,
 * которому показывают вид, спотыкается о долг и род компонента, а одевающий ищет техничку среди
 * картинок.
 *
 * Выбор ВИДА — витрина или форма — стоит в хедере, а не здесь: страница показывает то, что ей
 * велели, и не решает, показывать ли себя.
 */
function ComponentPage(props: {
  component: string;
  variants: readonly string[];
  variant: Axis<string>;
  state: Axis<string | null>;
}) {
  // Часть не называется: на витрине её нет, и состояние ставится на ту часть, которая его
  // объявила, — это знает сборка случая, а не показ.
  const cases = () =>
    casesOf(props.component, {
      variant: props.variant,
      state: props.state,
      variants: props.variants,
    });

  return (
    <article class="page">
      <Show when={props.variants.length === 0}>
        <p class="page__empty">
          Скин не надет — показан голый кит. Это рабочее состояние продукта, а не поломка витрины:
          наденьте скин справа вверху.
        </p>
      </Show>

      <div class="cases">
        <For each={cases()}>{(item) => <Case item={item} />}</For>
      </div>
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
  component: string;
  variants: readonly string[];
  variant: Axis<string>;
  state: Axis<string | null>;
  worn: string | null;
  records: readonly StoreRecord[] | undefined;
  failure: unknown;
  mode: SkinMode;
  onVariant: (variant: Axis<string>) => void;
  onState: (state: Axis<string | null>) => void;
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
      {/* Слева — про ОДИН компонент: как его зовут и что из него показать. */}
      <div class="head__subject">
        <b class="head__component">{props.component}</b>

        <Axes
          component={props.component}
          variants={props.variants}
          variant={props.variant}
          state={props.state}
          onVariant={props.onVariant}
          onState={props.onState}
        />
      </div>

      {/* Справа — про ВСЮ витрину: чем одето, в каком режиме, и куда перейти.
          РЕЖИМ ПОКАЗЫВАЕТСЯ ТОЛЬКО ПРИ НАДЕТОМ СКИНЕ. Светлая и тёмная половины — это половины
          СКИНА: цвет принадлежит одежде, а не тому, на что её надевают. Нет скина — переключать
          нечего, и кнопки режима были бы обещанием вида там, где вида нет.
          Что режим при этом всё равно меняет вид голого кита — вопрос основания, поднятый к
          архитектору: набор значений держит собственную тёмную пару и одевает приложение без
          скина. Мы этого не прячем и не обходим — мы просто не предлагаем человеку ручку,
          которой у витрины нет предмета. */}
      <div class="head__controls">
        <Show when={trouble()}>{(said) => <p class="head__trouble">{said()}</p>}</Show>

        <Show when={props.worn !== null}>
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
        </Show>

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

  /** Смена компонента сбрасывает оси: чужое состояние на нём не значит ничего. */
  const setCurrent = (component: string) => {
    setCurrentSignal(component);
    setVariant(ANY);
    setState(null);
  };
  // НАДЕТОЕ — это имя И половина вместе: половина принадлежит скину, а не документу, и второй
  // ручки под неё не существует. Нет скина — нет и половины.
  const [worn, setWorn] = createSignal<SkinWorn | null>(null);

  /** Сменить половину — значит надеть тот же скин в другой половине. Другого пути нет. */
  const setMode = (mode: SkinMode) => {
    const current = worn();

    if (current === null) return;

    void SKIN.wear(current.name, { mode }).then(setWorn);
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
          component={current()}
          variants={variants()}
          variant={variant()}
          state={state()}
          worn={worn()?.name ?? null}
          mode={worn()?.mode ?? "light"}
          records={records()}
          failure={records.error}
          onVariant={setVariant}
          onState={setState}
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
                variant={variant()}
                state={state()}
              />
            )}
          </Show>
        </main>
      </div>
    </div>
  );
}
