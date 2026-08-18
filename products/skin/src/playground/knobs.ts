// РУЧКИ СТЕНДА поверх пресетов.
//
// Работа устроена так: подключается ПРЕСЕТ целиком, ручки его меняют, изменённый пресет можно
// сохранить в службу. Пока не сохранён — он «изменён», и это видно.
//
// ── ОТКУДА БЕРУТСЯ ПРЕСЕТЫ ────────────────────────────────────────────────────────────────
//
// Из СЛУЖБЫ (`tasker:PROBEWEB-55`), а не из браузерного хранилища: стенд уезжает на VPS, и пресет,
// сделанный коллегой, обязан быть виден остальным. Браузерного хранилища здесь больше нет вовсе —
// решение user 2026-08-17: черновик, невидимый никому, не нужен, а два хранилища расходятся.
//
// Встроенные три — СЕМЯ службы (`pnpm run seed:presets`), не второй источник: модель в коде
// остаётся тем, из чего рождаются и семя, и файлы поставки.
//
// Служба может не ответить, и это нормальное состояние: стенд от этого не ломается. ЗАПАСНОГО
// ПЕРЕЧНЯ НЕТ — он был бы вторым источником правды, — поэтому список в этом случае пуст, вид не
// подключён, а компоненты работают на умолчаниях базы: оформление необязательно (`kb:SKIN-7`,
// инвариант 4). Человеку это говорится вслух и ровно так, как есть: обещать «работаем на
// встроенных» там, где встроенных нет, — та же ложь, что и молчание, только заметнее не сразу.
//
// ── ЧЕЙ ВЫБОР СИЛЬНЕЕ ─────────────────────────────────────────────────────────────────────
//
// Два уровня и ровно два состояния (`kb:PROBEWEB-13`):
//   • «слушаю панель» — пресет и режим приходят с общего пульта, мы за ними следим;
//   • «свой вид» — человек тронул ручку здесь, и панель нас больше не перебивает.
//
// Отвязка обязана быть ВИДНА, иначе читается как поломка: человек переключит пресет в панели,
// увидит, что все зоны переключились, а эта нет. Признак отвязки — `data-look-own` на корне, его
// же читает пульт и уважает.
//
// ── КУДА ПРИМЕНЯЮТСЯ ЗНАЧЕНИЯ ─────────────────────────────────────────────────────────────
//
// Семена уезжают на КОРЕНЬ документа, а не на контейнер образцов: производные шкалы и роли
// объявлены в `:root` и там же вычисляются, потомки наследуют готовый результат. Первая редакция
// ставила их на контейнер — переменные менялись, компоненты нет, половина ручек «ничего не
// делала». Ровно так их поставит и потребитель.

import { registerTheme } from "@omnifield/probe-web-style";
import { createEffect, createSignal, on, onCleanup } from "solid-js";

import { BUILT_IN, DEFAULT_PRESET_ID } from "../presets/built-in.js";
import {
  isDirty,
  type Preset,
  type PresetState,
  slugOf,
  stateOf,
  themeOf,
} from "../presets/model.js";
import { createPresetsApi, type PresetsApi, PresetRefused } from "./presets-api.js";
import skinCss from "../skin/skin.css?inline";

const STYLE_ID = "probe-web-skin";

/** Ступени радиуса. Значение уезжает в семя `--radius`, шкалу считает база. */
export const RADIUS_STEPS = [
  { id: "preset", label: "из пресета", value: undefined },
  { id: "none", label: "нет", value: "0rem" },
  { id: "small", label: "малый", value: "0.25rem" },
  { id: "medium", label: "средний", value: "0.5rem" },
  { id: "large", label: "крупный", value: "0.75rem" },
  { id: "full", label: "полный", value: "1.5rem" },
] as const;

/**
 * Семена акцента. Семя — ВХОД для генератора шкалы, а не значение оформления: из него база строит
 * двенадцать ступеней и держит обещания контраста. Поэтому литеральный цвет здесь уместен, а в
 * поставке (`src/skin`) его нет и быть не может.
 */
export const ACCENTS = [
  { id: "preset", label: "из пресета", seed: undefined },
  { id: "violet", label: "фиолетовый", seed: "#7c3aed" },
  { id: "teal", label: "бирюзовый", seed: "#0d9488" },
  { id: "amber", label: "янтарный", seed: "#d97706" },
  { id: "rose", label: "розовый", seed: "#e11d48" },
] as const;

/** Плотность множит интервалы и высоты контролов; кегль база плотностью не трогает. */
export const DENSITIES = [
  { id: "compact", label: "плотно", value: "0.8" },
  { id: "normal", label: "обычно", value: "1" },
  { id: "roomy", label: "просторно", value: "1.15" },
] as const;

/**
 * Отвечает ли служба. Состояний ровно два, и запасного склада нет ни в одном из них.
 *
 * Значение читает панель и по нему выбирает, что сказать человеку, — поэтому оно называет
 * ФАКТ («служба» / «нет связи»), а не источник перечня. Прежнее имя `встроенные` обещало
 * запасной перечень, которого не существует с тех пор, как пресеты уехали в службу.
 */
export type Source = "служба" | "нет связи";

export interface Knobs {
  presets: () => Preset[];
  /** Показанный пресет; `undefined` — пресетов нет вовсе, и вид не подключён. */
  preset: () => Preset | undefined;
  usePreset: (id: string) => void;
  dirty: () => boolean;
  reset: () => void;

  /** Сохранить изменённый пресет в службу под своим именем. */
  save: (title: string, description?: string) => Promise<void>;
  /** Удалить свой пресет из службы. Встроенные не удаляются — их там просто нет. */
  drop: () => Promise<void>;

  /** Откуда перечень: служба ответила или работаем на встроенных. */
  source: () => Source;
  /** Почему не служба; `null` — служба отвечает. Показывается человеку. */
  trouble: () => string | null;
  /** Последний отказ службы по делу (предел, кривой ввод) — тоже человеку. */
  refusal: () => string | null;
  /** Работа со службой идёт. */
  busy: () => boolean;

  /** Живём выбором пульта или своим. */
  own: () => boolean;
  /** Вернуться к выбору пульта: своё снимается, третьего состояния нет. */
  follow: () => void;

  dressed: () => boolean;
  toggleDressed: () => void;
  dark: () => boolean;
  setDark: (on: boolean) => void;

  accent: () => string;
  setAccent: (id: string) => void;
  radius: () => string;
  setRadius: (id: string) => void;
  density: () => string;
  setDensity: (id: string) => void;
}

/** Ставит и снимает оформление; каждый экземпляр владеет СВОИМ тегом (гонка при HMR). */
function useSkinTag() {
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
    setDressed(el !== undefined && el.isConnected);
  };

  apply(true);
  onCleanup(() => apply(false));

  return { dressed, toggle: () => apply(!dressed()) };
}

export function createKnobs(api: PresetsApi = createPresetsApi()): Knobs {
  const root = document.documentElement;
  const skin = useSkinTag();

  const [fromService, setFromService] = createSignal<Preset[]>([]);
  // Начальное состояние — «нет связи», а не «служба»: до первого ответа мы про службу ничего не
  // знаем, и оптимистичное начало на мгновение показало бы человеку «сохранённое видят все».
  const [source, setSource] = createSignal<Source>("нет связи");
  const [trouble, setTrouble] = createSignal<string | null>(null);
  const [refusal, setRefusal] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  // ПЕРЕЧЕНЬ ТОЛЬКО ИЗ СЛУЖБЫ. Локального запасного нет намеренно (решение user 2026-08-17):
  // запасной перечень — это второй источник правды, и расходится он молча. Службы нет — список
  // пуст, об этом сказано человеку, а компоненты продолжают работать на умолчаниях базы:
  // оформление необязательно (`kb:SKIN-7`, инвариант 4).
  const presets = () => fromService();

  /**
   * ЧТО ПОСТАВИЛ ХОЗЯИН — пульт или встраивающее приложение.
   *
   * Базовая механика такая: тему задаёт ХОЗЯИН, встроенная зона её ЧИТАЕТ. Поэтому здесь лежит
   * то, что стоит на корне документа, а не наш выбор: пока мы слушаем хозяина, `data-theme`
   * принадлежит ему, и писать туда своё — значит перебивать того, кого слушаешь. Первая
   * редакция так и делала: зона молча заменяла выбор пульта своим умолчанием.
   *
   * Опознать пресет по этому значению можно двумя способами — по имени темы и по идентификатору
   * записи службы: пульт сегодня ставит второе. Поэтому сверяем оба.
   */
  const [hostId, setHostId] = createSignal(root.dataset.theme ?? "");
  const [chosenId, setPresetId] = createSignal("");

  const find = (id: string) =>
    presets().find((one) => one.id === id || one.recordId === id);

  /**
   * Показанный пресет — ИЛИ НИЧЕГО.
   *
   * «Нет пресета — нет скина» (решение user 2026-08-17): удалить можно любой, включая семя, и
   * тогда вид не подключается вовсе. Это рабочее состояние, а не поломка: компоненты остаются на
   * умолчаниях базы, оформление необязательно (`kb:SKIN-7`, инвариант 4). Возврат к семени — в
   * одну команду: `pnpm run seed:presets`.
   */
  const preset = (): Preset | undefined =>
    find(own() ? chosenId() : hostId()) ??
    find(chosenId()) ??
    // Хозяин молчит и своего выбора нет — берём семя (`twitter`), а не первый попавшийся: первым
    // из службы приходит самый свежий чужой пресет, и стенд открывался бы каждый раз другим.
    find(DEFAULT_PRESET_ID) ??
    presets()[0];

  const [state, setState] = createSignal<PresetState>(stateOf(BUILT_IN[0]!));
  const [dark, setDarkSignal] = createSignal(root.classList.contains("dark"));
  const [own, setOwn] = createSignal(root.dataset.lookOwn === "true");

  // Какая ручка чем выбрана — только для показа в панели: истина живёт в `state`.
  const [accent, setAccentId] = createSignal("preset");
  const [radius, setRadiusId] = createSignal("preset");
  const [density, setDensityId] = createSignal("normal");

  /** Перечитать перечень из службы. Отказ службы и её отсутствие различаются. */
  const refresh = async () => {
    setBusy(true);
    try {
      // Служба про наши виды не знает и метит всё одинаково. ВСТРОЕННЫЙ узнаётся по имени темы:
      // встроенный — тот, у кого есть файл поставки (`presets/<id>.css`). Иначе семя выглядело бы
      // в списке как чужая правка, а рядом с ним стояла бы кнопка «удалить».
      const known = new Set(BUILT_IN.map((one) => one.id));
      const items = (await api.list()).map((one) =>
        known.has(one.id) ? { ...one, origin: "встроенный" as const } : one,
      );
      setFromService(items);
      setSource("служба");
      setTrouble(null);
    } catch (error) {
      // Перечень взять неоткуда — ни в одном из случаев. Причину человек видит ту, что назвала
      // служба: «не отвечает по адресу …» и «ответила 5xx» посылают его в разные места.
      setSource("нет связи");
      setTrouble(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  };

  void refresh();

  /** Подключить пресет целиком: значения, ручки и режим возвращаются к его состоянию. */
  const usePreset = (id: string) => {
    const next = presets().find((p) => p.id === id);
    if (!next) return;

    setPresetId(id);
    setState(stateOf(next));
    setAccentId("preset");
    setRadiusId("preset");
    setDensityId(DENSITIES.find((d) => d.value === next.density)?.id ?? "normal");
  };

  /**
   * Любое действие в этой панели отвязывает зону от пульта.
   *
   * Признак ставится на корень, и его читает сам пульт: зона со своим выбором не перебивается
   * общим. Состояний ровно два, поэтому «частично своё» здесь невыразимо — и не нужно.
   */
  const takeOwn = () => {
    setOwn(true);
    root.dataset.lookOwn = "true";
  };

  /**
   * Отвязываемся, только если значение ДЕЙСТВИТЕЛЬНО изменилось.
   *
   * Оплачено живым случаем: контрол кита зовёт `onChange` и при монтировании, с тем же значением.
   * Первая редакция отвязывала зону от пульта на этом вызове — стенд открывался уже «со своей
   * темой», и человек, не тронувший ни одной ручки, видел, что панель его не перебивает.
   */
  const changed = <T,>(was: T, becomes: T): boolean => {
    if (was === becomes) return false;
    takeOwn();
    return true;
  };

  /** Вернуться к выбору пульта. Возвращаемся в «слушаю панель», а не в конкретный пресет. */
  const follow = () => {
    setOwn(false);
    delete root.dataset.lookOwn;
    // Возвращаем на корень то, что стояло у хозяина: наш выбор оттуда уходит вместе с признаком.
    if (hostId() !== "") root.dataset.theme = hostId();
    readShared();
  };

  /**
   * То, что на корень написали МЫ САМИ. Нужно, чтобы отличить свою запись от хозяйской.
   *
   * Без этого зона, поставившая умолчание в отсутствие хозяина, прочитала бы его обратно как
   * «выбор хозяина» — и «вернуть к хозяину» возвращало бы к своему же значению.
   */
  let mine = "";

  /** Прочитать выбор хозяина с корня документа: он ставит атрибут и класс, мы их читаем. */
  const readShared = () => {
    const seen = root.dataset.theme ?? "";
    setHostId(seen === mine ? "" : seen);
    setDarkSignal(root.classList.contains("dark"));
  };

  // Хозяин применяет свой выбор ПОСЛЕ загрузки рамки, поэтому мало прочитать его один раз: пока
  // мы его слушаем, мы следим за корнем и повторяем за ним. Иначе смена пресета в пульте не
  // доехала бы до уже открытой зоны.
  const watcher = new MutationObserver(() => {
    if (!own()) readShared();
  });
  watcher.observe(root, { attributes: true, attributeFilter: ["data-theme", "class"] });
  onCleanup(() => watcher.disconnect());

  // Перечень пришёл из службы — выбор пульта мог указывать на пресет, которого мы ещё не знали.
  createEffect(() => {
    if (source() === "служба" && !own()) readShared();
  });

  // Пока слушаем хозяина, СОСТОЯНИЕ РУЧЕК следует за показанным пресетом. Иначе к чужому пресету
  // применились бы наши правки от предыдущего: хозяин переключил тему, а семя бренда осталось
  // прежним — и человек увидел бы вид, которого нет ни у кого.
  createEffect(
    on(
      () => preset()?.id,
      () => {
        const shown = preset();
        if (!own() && shown !== undefined) {
          setState(stateOf(shown));
          setAccentId("preset");
          setRadiusId("preset");
          setDensityId(DENSITIES.find((d) => d.value === shown.density)?.id ?? "normal");
        }
      },
    ),
  );

  createEffect(() => root.classList.toggle("dark", dark()));

  // Тема регистрируется на каждое изменение: пересчёт ступеней делает база, и тёмная лестница у
  // неё своя, а не инверсия светлой. Регистрируем и когда слушаем панель: значения для её
  // выбора должны существовать, а взять их можно только из перечня.
  createEffect(() => {
    const current = preset();

    if (current === undefined) {
      // Нет пресета — снимаем и тему: иначе на корне остался бы атрибут, для которого значений
      // никто не объявлял, и вид оказался бы «наполовину подключён».
      if (root.dataset.theme === mine) delete root.dataset.theme;
      root.style.removeProperty("--density");
      return;
    }

    const theme = themeOf(current, state());

    // Значения регистрируются ПОД ОБОИМИ именами: под своим именем темы и под тем, что стоит на
    // корне. Пульт ставит туда идентификатор записи службы, и без второй регистрации правила
    // `[data-theme="<id записи>"]` не нашли бы значений — вид остался бы от умолчаний базы.
    registerTheme(theme);
    const onRoot = own() ? current.id : hostId();
    if (onRoot !== "" && onRoot !== theme.name) registerTheme({ ...theme, name: onRoot });

    // Атрибут пишем в двух случаях: выбор свой — тогда он наш по праву; либо хозяин НИЧЕГО не
    // задал (стенд открыли напрямую, без пульта) — тогда без записи зона осталась бы вовсе без
    // темы, на умолчаниях базы, и человек увидел бы не пресет, а его отсутствие. Хозяин, когда
    // появится, перепишет: мы за корнем следим и своё от чужого отличаем.
    if (own() || hostId() === "") {
      mine = current.id;
      root.dataset.theme = current.id;
    }
    root.style.setProperty("--density", state().density);
  });

  onCleanup(() => {
    root.style.removeProperty("--density");
    delete root.dataset.lookOwn;
  });

  return {
    presets,
    preset,
    usePreset: (id) => {
      if (!changed(preset()?.id, id)) return;
      usePreset(id);
    },
    dirty: () => {
      const shown = preset();
      return shown !== undefined && isDirty(shown, state());
    },
    reset: () => {
      const shown = preset();
      if (shown !== undefined) usePreset(shown.id);
    },

    save: async (title, description) => {
      const current = preset();
      if (current === undefined) return;
      const named = title.trim() === "" ? `${current.title} — правка` : title.trim();
      const edited: Preset = {
        // Имя темы производится ОТ НАЗВАНИЯ, а не наследуется: сохранённая правка «Плотного» не
        // должна встать под именем `dense` и перекрыть встроенный вид у потребителя.
        id: slugOf(named, presets().map((p) => p.id)),
        title: named,
        origin: "свой",
        seeds: { ...current.seeds, brand: state().brand },
        meta: { ...current.meta, ...(state().radius ? { radius: state().radius } : {}) },
        ...(current.darkOverrides === undefined ? {} : { darkOverrides: current.darkOverrides }),
        density: state().density,
      };

      setBusy(true);
      setRefusal(null);
      try {
        const saved = await api.save(edited, description);
        await refresh();
        usePreset(saved.id);
      } catch (error) {
        // Отказ службы — не «нет связи»: человек обязан узнать, что пресет НЕ сохранён.
        if (error instanceof PresetRefused) setRefusal(error.message);
        else setTrouble(error instanceof Error ? error.message : String(error));
      } finally {
        setBusy(false);
      }
    },

    drop: async () => {
      // Удалить можно ЛЮБОЙ, включая семя: пресеты общие, и «своих» среди них нет — есть те, что
      // сделал человек, и то, чем засеяли пустую службу. Семя возвращается одной командой.
      const current = preset();
      if (current === undefined) return;

      setBusy(true);
      try {
        // Удаляется ЗАПИСЬ службы, а не тема: идентификаторы разные, и путать их нельзя.
        await api.remove(current.recordId ?? current.id);
        await refresh();
        // Список мог опустеть — тогда выбирать нечего, и вид не подключается.
        const next = presets()[0];
        if (next !== undefined) usePreset(next.id);
      } catch (error) {
        if (error instanceof PresetRefused) setRefusal(error.message);
        else setTrouble(error instanceof Error ? error.message : String(error));
      } finally {
        setBusy(false);
      }
    },

    source,
    trouble,
    refusal,
    busy,
    own,
    follow,

    dressed: skin.dressed,
    toggleDressed: skin.toggle,
    dark,
    setDark: (on) => {
      if (!changed(dark(), on)) return;
      setDarkSignal(on);
    },

    accent,
    setAccent: (id) => {
      if (!changed(accent(), id)) return;
      setAccentId(id);
      const seed = ACCENTS.find((a) => a.id === id)?.seed;
      setState({ ...state(), brand: seed ?? preset()?.seeds.brand ?? state().brand });
    },
    radius,
    setRadius: (id) => {
      if (!changed(radius(), id)) return;
      setRadiusId(id);
      const step = RADIUS_STEPS.find((s) => s.id === id);
      setState({ ...state(), radius: step?.value ?? preset()?.meta?.radius });
    },
    density,
    setDensity: (id) => {
      if (!changed(density(), id)) return;
      setDensityId(id);
      const step = DENSITIES.find((d) => d.id === id);
      setState({ ...state(), density: step?.value ?? preset()?.density ?? state().density });
    },
  };
}
