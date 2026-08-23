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
import { skinGaps } from "@omnifield/probe-web-skin";
import type { Form } from "@omnifield/probe-web-skin/model";
import { GROUPS, groupOf, PASSPORTS, passportOf } from "@omnifield/probe-web-ui/passport";
import {
  createEffect,
  createResource,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

import { EditScreen } from "../editor/screen.jsx";
import {
  assembleOutfit,
  type Draft,
  DRAFT_NAME,
  draftLook,
  EMPTY_HINT,
  hold,
  KINDS,
  listOutfits,
  readOutfit,
  readParts,
  replace,
  SERVICE_HINT,
  SKIN_SOURCE,
  type StoreRecord,
} from "../skins/index.js";
import {
  ANY,
  casesOf,
  partsOf,
  rootPartOf,
  statesOfPart,
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

/** Что делают с компонентом: смотрят или правят его форму. */
export type View = "showcase" | "form";

/** Переходы страницы компонента. Перечень здесь, потому что он про УСТРОЙСТВО пульта. */
const VIEWS: readonly { id: View; title: string }[] = [
  { id: "showcase", title: "витрина" },
  { id: "form", title: "форма" },
];

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

  return (
    <figure class="case" classList={{ "case--wide": wide() }}>
      <div class="case__stage" ref={stage}>
        <RenderTree tree={props.item.tree} registry={REGISTRY} />
      </div>
      <figcaption class="case__caption">
        <b class="case__title">
          {props.item.title}
        </b>
        <Show when={props.item.note !== ""}>
          <span class="case__note">{props.item.note}</span>
        </Show>
      </figcaption>
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
 * Часть «всех» не имеет намеренно: состояние всегда чьё-то, и «состояние вообще» — не адрес.
 * Перечень состояний следует за выбранной частью: словарь у каждой части свой.
 */
function Axes(props: {
  component: string;
  variants: readonly string[];
  part: string;
  variant: Axis<string>;
  state: Axis<string | null>;
  onPart: (part: string) => void;
  onVariant: (variant: Axis<string>) => void;
  onState: (state: Axis<string | null>) => void;
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
          <For each={statesOfPart(props.component, props.part)}>
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
  part: string;
  variant: Axis<string>;
  state: Axis<string | null>;
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
  part: string;
  variant: Axis<string>;
  state: Axis<string | null>;
  view: View;
  worn: string | null;
  records: readonly StoreRecord[] | undefined;
  failure: unknown;
  mode: SkinMode;
  onPart: (part: string) => void;
  onVariant: (variant: Axis<string>) => void;
  onState: (state: Axis<string | null>) => void;
  onView: (view: View) => void;
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
          part={props.part}
          variant={props.variant}
          state={props.state}
          onPart={props.onPart}
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

        <nav class="views" aria-label="Что делаем с компонентом">
          <For each={VIEWS}>
            {(view) => (
              <button
                class="views__item"
                type="button"
                aria-pressed={props.view === view.id}
                onClick={() => props.onView(view.id)}
              >
                {view.title}
              </button>
            )}
          </For>
        </nav>
      </div>
    </header>
  );
}

export function App() {
  const [current, setCurrentSignal] = createSignal(COMPONENTS[0] ?? "");

  // ОСИ. Часть по умолчанию корневая, вариации развёрнуты, состояние — ОБЫЧНОЕ.
  //
  // Пришедший на витрину смотрит сперва на то, как компонент выглядит, когда с ним ничего не
  // происходит: это и есть его вид, а наведённый и отключённый — отклонения. Развернув обе оси
  // сразу, мы показывали бы произведение, в котором обычный вид приходится выискивать.
  const [part, setPart] = createSignal(rootPartOf(COMPONENTS[0] ?? ""));
  const [variant, setVariant] = createSignal<Axis<string>>(ANY);
  const [state, setState] = createSignal<Axis<string | null>>(null);
  const [view, setView] = createSignal<View>("showcase");

  /** Смена компонента сбрасывает оси: чужая часть и чужое состояние на нём не значат ничего. */
  const setCurrent = (component: string) => {
    setCurrentSignal(component);
    setPart(rootPartOf(component));
    setVariant(ANY);
    setState(null);
  };

  /** Смена части сбрасывает состояние: словарь состояний у каждой части свой. */
  const choosePart = (value: string) => {
    setPart(value);
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
  const [records, { refetch: refetchRecords }] = createResource(() => listOutfits());

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

  // ЧЕРНОВИК ФОРМЫ. Живёт здесь, а не в редакторе, по той же причине, по которой там же живёт
  // надетое: показ одевается черновиком, и вторая правда о том, что сейчас правится, развела бы
  // правку и показ.
  const [draft, setDraftSignal] = createSignal<Draft | null>(null);
  const [saving, setSaving] = createSignal(false);
  const [trouble, setTrouble] = createSignal<unknown>(null);

  /** Долг одевания черновика — тот же отчёт механики, что видит витрина у сохранённого. */
  const [gaps, { refetch: recount }] = createResource(
    () => (draft() === null ? undefined : true),
    async () => skinGaps((await draftLook()).skin, Object.values(PASSPORTS)),
  );

  /**
   * Кладёт черновик и НАДЕВАЕТ его: правка видна тем же путём, каким видно сохранённое.
   *
   * Наряд приходит аргументом, а не читается отсюда: правка возвращается из службы асинхронно, и
   * надетое к тому моменту могло смениться. Взяв его в момент действия человека, мы возвращаем
   * показ туда, откуда человек ушёл, а не туда, где он оказался.
   */
  const setDraft = (черновик: Draft | null, надето: string | undefined) => {
    setDraftSignal(черновик);
    hold(черновик, надето);

    if (черновик === null) {
      if (надето !== undefined) void SKIN.wear(надето, { remember: false }).then(setWorn);
      return;
    }

    void SKIN.wear(DRAFT_NAME, { remember: false })
      .then(() => {
        setTrouble(null);
        void recount();
      })
      .catch(setTrouble);
  };

  /**
   * Открывает форму компонента на правку.
   *
   * Формы у компонента может не быть вовсе — это обычное начало работы, а не поломка: человек
   * одевает то, чего никто не одевал. Пустая форма заводится с именем от наряда и компонента,
   * потому что имя записи должно быть узнаваемым в службе, а не случайным.
   */
  const openForm = async (component: string, надето: string | undefined) => {
    if (надето === undefined) {
      setDraft(null, надето);
      return;
    }

    try {
      const [{ forms, palettes }, наряд] = await Promise.all([readParts(), readOutfit(надето)]);
      const своя = forms.find((форма) => форма.component === component);
      const цвета = palettes.find((кандидат) => кандидат.name === наряд?.palette);

      setDraft(
        {
          ...(цвета ? { palette: цвета } : {}),
          form: своя ?? { name: `${надето}-${component}`, component, recipe: {} },
        },
        надето,
      );
    } catch (cause) {
      setTrouble(cause);
    }
  };

  /**
   * Сохраняет черновик в службу.
   *
   * Показ при этом НЕ переодевается: человек остаётся в правке, а сохранённая запись равна
   * черновику, которым он одет. Переодень мы его на наряд — экран мигнул бы и вернулся к тому
   * же виду, сообщив о работе, которой не было.
   */
  /**
   * Сохраняет ЦВЕТА под именем.
   *
   * Имя своё — значит новая запись; прежнее — значит правка той, которую тянут другие скины, и
   * увидят они её сразу. Так решил хозяин продукта: палитра одна, копий не заводим.
   */
  const savePalette = (имя: string, черновик: Draft | null) => {
    const цвета = черновик?.palette;
    if (!цвета) return;

    setSaving(true);
    void replace(KINDS.palette, { ...цвета, name: имя }, `Цвета: ${имя}`)
      .then(() => {
        setTrouble(null);
        setDraftSignal({ ...черновик, palette: { ...цвета, name: имя } });
      })
      .catch(setTrouble)
      .finally(() => setSaving(false));
  };

  /**
   * Сохраняет СКИН: форму компонента и сочетание «эти цвета плюс эти формы» под именем.
   *
   * Форма уезжает вместе со скином, а не отдельной кнопкой: человек правил вид кнопки, а не «две
   * записи», и просить его сохранить их порознь значило бы показать ему наше устройство хранения.
   */
  const saveSkin = async (имя: string, черновик: Draft | null, поверх: string | undefined) => {
    if (!черновик?.form) return;

    setSaving(true);

    try {
      const прежний = поверх === undefined ? undefined : await readOutfit(поверх);
      const форма: Form = { ...черновик.form, name: `${имя}-${черновик.form.component}` };
      const цвета = черновик.palette;

      await replace(KINDS.form, форма, `Форма: ${форма.component}`);

      const формы = [
        ...(прежний?.forms ?? []).filter((чужая) => !чужая.endsWith(`-${форма.component}`)),
        форма.name,
      ];

      await replace(
        KINDS.outfit,
        { name: имя, palette: цвета?.name ?? прежний?.palette ?? "", forms: формы },
        `Скин: ${имя}`,
      );

      setTrouble(null);
      setDraftSignal({ ...черновик, form: форма });
      await refetchRecords();
    } catch (cause) {
      setTrouble(cause);
    } finally {
      setSaving(false);
    }
  };

  /** Переход между видами: уход из формы снимает черновик. Приход открывает его эффектом ниже. */
  const chooseView = (next: View) => {
    setView(next);

    if (next !== "form" && draft() !== null) setDraft(null, worn()?.name);
  };

  // ФОРМА ОТКРЫВАЕТСЯ, КОГДА ЕСТЬ ПОВЕРХ ЧЕГО. Наряд приезжает из службы, и человек успевает
  // перейти в правку раньше него; открывать по одному щелчку значило бы говорить «наденьте
  // наряд» тому, кто уже его надел, — и оставлять это на экране, пока он не щёлкнет ещё раз.
  //
  // Эффект следит за тремя вещами: вид, компонент и наряд. Правка черновика среди них не
  // значится намеренно — иначе каждая правка перечитывала бы форму из службы поверх неё же.
  createEffect(() => {
    const надето = worn()?.name;
    const компонент = current();

    if (view() !== "form") return;

    void openForm(компонент, надето);
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
          part={part()}
          variant={variant()}
          state={state()}
          view={view()}
          worn={worn()?.name ?? null}
          mode={worn()?.mode ?? "light"}
          records={records()}
          failure={records.error}
          onPart={choosePart}
          onVariant={setVariant}
          onState={setState}
          onView={chooseView}
          onWear={wear}
          onTakeOff={takeOff}
          onMode={setMode}
        />

        <main class="main">
          <Show when={current()} fallback={<p class="empty">В реестре нет ни одного компонента.</p>}>
            {/* ВИТРИНА И ПРАВКА — РАЗНЫЕ ЭКРАНЫ (решение user 2026-08-23).
                На витрине СМОТРЯТ: меняют скин, сверяют обе половины, листают компоненты.
                Настроек здесь нет ни одной — иначе показ перестаёт быть показом.
                В правке ПРАВЯТ: показана та координата, над которой работают, а не весь поток
                вариаций. Разный предмет — разный показ. */}
            {(component) => (
              <Show
                when={view() === "form"}
                fallback={
                  <ComponentPage
                    component={component()}
                    variants={variants()}
                    part={part()}
                    variant={variant()}
                    state={state()}
                  />
                }
              >
                <EditScreen
                  component={component()}
                  draft={draft()}
                  gaps={gaps() ?? []}
                  saving={saving()}
                  trouble={trouble()}
                  onDraft={(черновик) => setDraft(черновик, worn()?.name)}
                  onSavePalette={(имя: string) => savePalette(имя, draft())}
                  onSaveSkin={(имя: string) => void saveSkin(имя, draft(), worn()?.name)}
                />
              </Show>
            )}
          </Show>
        </main>
      </div>
    </div>
  );
}
