// Стенд зоны `skin` по модели, которую user выбрал ориентиром (Radix Themes playground):
// панель ручек слева, образцы справа, переключение «главное / все состояния» и вкладки по
// примитивам.
//
// Стенд показывает ДВА утверждения сразу:
//
//   1. **Оформление подключается и снимается отдельно** — тумблер «Оформление» добавляет и
//      удаляет наш CSS живьём. Снял — остались голые примитивы кита, ровно как без нас
//      (kb:PROBEWEB-11, правило первое).
//   2. **Вид настраивается значениями, а не переписыванием правил** — ручки меняют ТОКЕНЫ под
//      оформлением, и ни одна строка CSS зоны при этом не трогается. «Радиус» — одно семя, из
//      которого база считает всю шкалу скруглений; «Акцент» — одно семя, из которого база
//      строит двенадцать ступеней бренда; «Плотность» — множитель интервалов и высот.
//
// Ручки живут на контейнере образцов, а не на `<html>`: так видно, что оформление настраивается
// переопределением переменных в ЛЮБОМ поддереве, и панель стенда остаётся в своём виде, что бы
// ни было накручено рядом.

import { buildScale, registerTheme } from "@omnifield/probe-web-style";
import { createSignal, For, onCleanup, Show } from "solid-js";

// `?inline` — Vite отдаёт содержимое строкой и НЕ подключает его к странице сам. У потребителя
// форма другая: обычный `import "@probe-web/skin/skin.css"` один раз на бутстрапе. Импорт снять
// живьём нельзя, а стенд обязан показать именно снятие.
import skinCss from "../skin/skin.css?inline";
import { TWITTER_THEME, TWITTER_THEME_NAME } from "../theme/twitter.js";
import { SPECIMENS } from "./specimens.jsx";

const STYLE_ID = "probe-web-skin";

/** Ступени радиуса. Значение уезжает в `--radius`, шкала `--radius-*` считается из него в `style`. */
const RADIUS_STEPS = [
  // Первая ступень ничего не задаёт: скругление приходит из палитры, и «из темы» показывает
  // именно её значение, а не наше представление о нём.
  { id: "theme", label: "из темы", value: null },
  { id: "none", label: "нет", value: "0rem" },
  { id: "small", label: "малый", value: "0.25rem" },
  { id: "medium", label: "средний", value: "0.5rem" },
  { id: "large", label: "крупный", value: "0.75rem" },
  { id: "full", label: "полный", value: "1.5rem" },
] as const;

/**
 * Семена акцента. Семя — ВХОД для генератора шкалы, а не значение оформления: из него база
 * строит все двенадцать ступеней и сама держит обещания контраста. Поэтому здесь литеральный
 * цвет уместен, а в поставке (`src/skin`) его нет и быть не может.
 *
 * `null` — не трогать бренд: показать то, что приехало темой.
 */
const ACCENTS = [
  { id: "default", label: "из темы", seed: null },
  { id: "violet", label: "фиолетовый", seed: "#7c3aed" },
  { id: "teal", label: "бирюзовый", seed: "#0d9488" },
  { id: "amber", label: "янтарный", seed: "#d97706" },
  { id: "rose", label: "розовый", seed: "#e11d48" },
] as const;

/** Ступени плотности. Умножают интервалы и высоты контролов; кегль база плотностью не трогает. */
const DENSITIES = [
  { id: "compact", label: "плотно", value: "0.8" },
  { id: "normal", label: "обычно", value: "1" },
  { id: "roomy", label: "просторно", value: "1.15" },
] as const;

type ViewMode = "main" | "states";

/**
 * Ставит и снимает оформление: снятие обязано возвращать исходный кит.
 *
 * КАЖДЫЙ ЭКЗЕМПЛЯР ВЛАДЕЕТ СВОИМ ТЕГОМ, и это не мелочь стиля. Прежняя версия искала тег по
 * `id` — и на горячей перезагрузке получалась гонка: новый экземпляр видел тег, оставшийся от
 * старого, и свой не вставлял; следом срабатывал `onCleanup` старого и тег удалял. После
 * первой же правки файла стенд оставался СОВСЕМ без оформления, а панель продолжала показывать
 * «подключено». Ссылка вместо поиска по документу убирает саму возможность такой гонки:
 * снимает тег ровно тот, кто его поставил.
 */
function useSkin() {
  let el: HTMLStyleElement | undefined;
  const [dressed, setDressed] = createSignal(false);

  const apply = (on: boolean) => {
    if (on) {
      if (!el) {
        el = document.createElement("style");
        el.dataset.owner = STYLE_ID;
        el.textContent = skinCss;
        document.head.append(el);
      }
    } else {
      el?.remove();
      el = undefined;
    }
    // Подпись читает ФАКТ, а не намерение: если тег не встал, панель обязана сказать «снято».
    setDressed(el !== undefined && el.isConnected);
  };

  apply(true);
  onCleanup(() => apply(false));

  return { dressed, toggle: () => apply(!dressed()) };
}

/** Тема — класс `dark` на `<html>`, ровно как у потребителя. Оформление про неё не знает. */
function useMode() {
  const root = document.documentElement;
  const [dark, setDark] = createSignal(root.classList.contains("dark"));

  return {
    dark,
    toggle: () => {
      const next = !dark();
      setDark(next);
      root.classList.toggle("dark", next);
    },
  };
}

/**
 * Палитра зоны. Регистрируется один раз и включается атрибутом `data-theme` — тем же способом,
 * которым её включит потребитель. Стенд не подменяет значения руками: он ставит палитру.
 */
function usePalette() {
  registerTheme(TWITTER_THEME);

  const root = document.documentElement;
  const [on, setOn] = createSignal(true);
  root.dataset.theme = TWITTER_THEME_NAME;

  return {
    on,
    toggle: () => {
      const next = !on();
      setOn(next);
      if (next) root.dataset.theme = TWITTER_THEME_NAME;
      else delete root.dataset.theme;
    },
  };
}

export function App() {
  const skin = useSkin();
  const mode = useMode();
  const palette = usePalette();

  const [radius, setRadius] = createSignal<string>("theme");
  const [accent, setAccent] = createSignal<string>("default");
  const [density, setDensity] = createSignal<string>("normal");
  const [view, setView] = createSignal<ViewMode>("main");
  const [tab, setTab] = createSignal<string>("all");

  const radiusValue = () => RADIUS_STEPS.find((s) => s.id === radius())?.value ?? null;
  const densityValue = () => DENSITIES.find((d) => d.id === density())?.value ?? "1";
  const shown = () => (tab() === "all" ? SPECIMENS : SPECIMENS.filter((s) => s.id === tab()));

  /**
   * Ступени бренда под выбранное семя. Шкалу строит БАЗА (`buildScale`), а не стенд: у неё
   * назначение ступеней закреплено и обещания контраста проверяются машиной. Стенд только
   * подставляет результат в переменные.
   *
   * Пересчитывается при смене темы, потому что тёмная шкала — своя лестница, а не инверсия
   * светлой: при инверсии фон элемента стал бы текстом, и назначение ступеней сломалось бы.
   */
  const brandVars = () => {
    const seed = ACCENTS.find((a) => a.id === accent())?.seed;
    if (!seed) return {};

    const scale = buildScale(seed, mode.dark() ? "dark" : "light");
    return Object.fromEntries(
      Object.entries(scale).map(([step, value]) => [`--brand-${step}`, value]),
    );
  };

  const stageVars = (): Record<string, string> => {
    const radiusOverride = radiusValue();
    return {
      // Ступень «из темы» не задаёт переменную вовсе: значение приходит из палитры, и подставить
      // сюда её копию значило бы завести второй источник правды.
      ...(radiusOverride === null ? {} : { "--radius": radiusOverride }),
      "--density": densityValue(),
      ...brandVars(),
    };
  };

  return (
    <div class="shell">
      {/* ПАНЕЛЬ РУЧЕК. Значения уезжают в переменные на контейнере образцов, а не в правила
          оформления: скин остаётся тем же файлом, меняются только токены под ним. */}
      <aside class="panel">
        <h1 class="panel__title">
          Стенд зоны <b>skin</b>
        </h1>

        <div class="panel__group">
          <span class="panel__label">Оформление</span>
          <div class="panel__row">
            <button
              class="chip"
              type="button"
              aria-pressed={skin.dressed()}
              onClick={skin.toggle}
            >
              {skin.dressed() ? "подключено" : "снято"}
            </button>
          </div>
          <p class="panel__hint">
            Снимите — останется голый кит. Это рабочее состояние примитивов, а не поломка.
          </p>
        </div>

        <div class="panel__group">
          <span class="panel__label">Палитра</span>
          <div class="panel__row">
            <button class="chip" type="button" aria-pressed={palette.on()} onClick={palette.toggle}>
              Twitter
            </button>
            <button class="chip" type="button" aria-pressed={!palette.on()} onClick={palette.toggle}>
              базовая
            </button>
          </div>
          <p class="panel__hint">
            Три семени и форма скругления. Тёмная пара смягчена: у источника фон чистый чёрный,
            и это ровно то, что бьёт по глазам.
          </p>
        </div>

        <div class="panel__group">
          <span class="panel__label">Режим</span>
          <div class="panel__row">
            <button class="chip" type="button" aria-pressed={!mode.dark()} onClick={mode.toggle}>
              светлая
            </button>
            <button class="chip" type="button" aria-pressed={mode.dark()} onClick={mode.toggle}>
              тёмная
            </button>
          </div>
        </div>

        <div class="panel__group">
          <span class="panel__label">Радиус</span>
          <div class="panel__row">
            <For each={RADIUS_STEPS}>
              {(step) => (
                <button
                  class="chip"
                  type="button"
                  aria-pressed={radius() === step.id}
                  onClick={() => setRadius(step.id)}
                >
                  {step.label}
                </button>
              )}
            </For>
          </div>
          <p class="panel__hint">
            Меняется один токен <code>--radius</code> — вся шкала скруглений производная от него.
          </p>
        </div>

        <div class="panel__group">
          <span class="panel__label">Акцент</span>
          <div class="panel__row">
            <For each={ACCENTS}>
              {(item) => (
                <button
                  class="chip"
                  type="button"
                  aria-pressed={accent() === item.id}
                  onClick={() => setAccent(item.id)}
                >
                  {item.label}
                </button>
              )}
            </For>
          </div>
          <p class="panel__hint">
            Из одного семени база строит все двенадцать ступеней (<code>buildScale</code>) и сама
            держит обещания контраста. Оформление при этом не меняется ни на строку.
          </p>
        </div>

        <div class="panel__group">
          <span class="panel__label">Плотность</span>
          <div class="panel__row">
            <For each={DENSITIES}>
              {(item) => (
                <button
                  class="chip"
                  type="button"
                  aria-pressed={density() === item.id}
                  onClick={() => setDensity(item.id)}
                >
                  {item.label}
                </button>
              )}
            </For>
          </div>
          <p class="panel__hint">
            Множит интервалы и высоты контролов. Кегль база плотностью не трогает — мелкий текст
            ломает 1.4.4 Resize Text.
          </p>
        </div>

        <div class="panel__group">
          <span class="panel__label">Показ</span>
          <div class="panel__row">
            <button
              class="chip"
              type="button"
              aria-pressed={view() === "main"}
              onClick={() => setView("main")}
            >
              главное
            </button>
            <button
              class="chip"
              type="button"
              aria-pressed={view() === "states"}
              onClick={() => setView("states")}
            >
              все состояния
            </button>
          </div>
          <p class="panel__hint">
            Наведение и фокус не подделываются: проверяются мышью и клавишей Tab.
          </p>
        </div>

        <div class="panel__group panel__group--pending">
          <span class="panel__label">Чего ещё нет</span>
          <p class="panel__hint">
            Нейтральной шкалы отдельной ручкой и своего набора иконок. Ручка, которая крутится и
            ничего не меняет, здесь не стоит.
          </p>
        </div>
      </aside>

      <main class="stage">
        <nav class="tabs" aria-label="Примитивы">
          <button class="tab" type="button" aria-pressed={tab() === "all"} onClick={() => setTab("all")}>
            Всё
          </button>
          <For each={SPECIMENS}>
            {(specimen) => (
              <button
                class="tab"
                type="button"
                aria-pressed={tab() === specimen.id}
                onClick={() => setTab(specimen.id)}
              >
                {specimen.title}
              </button>
            )}
          </For>
        </nav>

        {/* Токены-ручки живут ЗДЕСЬ, на контейнере образцов, а не на `<html>`: так видно, что
            оформление настраивается переопределением переменных в любом поддереве, и панель
            стенда остаётся в своём виде независимо от того, что накручено. */}
        <div class="specimens" style={stageVars()}>
          <For each={shown()}>
            {(specimen) => (
              <section class="specimen">
                <header class="specimen__head">
                  <h2>{specimen.title}</h2>
                  <span class="specimen__slots">
                    <For each={specimen.slots}>{(slot) => <code>{slot}</code>}</For>
                  </span>
                </header>

                <div class="specimen__row">
                  <Show when={view() === "main" || !specimen.states} fallback={specimen.states?.()}>
                    {specimen.main()}
                  </Show>
                </div>

                <Show when={view() === "states" && !specimen.states}>
                  <p class="specimen__note">
                    У этого примитива нет состояний, выраженных атрибутами.
                  </p>
                </Show>
              </section>
            )}
          </For>
        </div>
      </main>
    </div>
  );
}
