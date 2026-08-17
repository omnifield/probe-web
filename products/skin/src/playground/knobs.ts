// РУЧКИ СТЕНДА поверх пресетов.
//
// Работа устроена так: подключается ПРЕСЕТ целиком, ручки его меняют, изменённый пресет можно
// сохранить своим. Пока не сохранён — он «изменён», и это видно.
//
// КУДА ПРИМЕНЯЮТСЯ ЗНАЧЕНИЯ. Семена уезжают на КОРЕНЬ документа, а не на контейнер образцов.
// Причина в устройстве базы: производные шкалы и роли объявлены в `:root` и там же вычисляются
// (`--space-4: calc(var(--space) * 4 * var(--density))`), а потомки наследуют готовый результат.
// Первая редакция ставила их на контейнер: переменные менялись, а компоненты нет — половина ручек
// «ничего не делала». Ровно так их поставит и потребитель.
//
// Пресет применяется через `registerTheme` слоя `style` — тем же способом, которым его подключит
// приложение. Свой канал применения не заводим: он разошёлся бы с настоящим.

import { registerTheme } from "@omnifield/probe-web-style";
import { createEffect, createSignal, onCleanup } from "solid-js";

import { BUILT_IN, DEFAULT_PRESET_ID } from "../presets/built-in.js";
import { cssOf, isDirty, type Preset, type PresetState, stateOf, themeOf } from "../presets/model.js";
import { idFor, loadOwn, removeOwn, saveOwn } from "../presets/store.js";
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

export interface Knobs {
  presets: () => Preset[];
  preset: () => Preset;
  usePreset: (id: string) => void;
  dirty: () => boolean;
  reset: () => void;
  save: (title: string) => void;
  drop: () => void;
  css: () => string;

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

export function createKnobs(): Knobs {
  const root = document.documentElement;
  const skin = useSkinTag();

  const [own, setOwn] = createSignal<Preset[]>(loadOwn());
  const presets = () => [...BUILT_IN, ...own()];

  const [presetId, setPresetId] = createSignal(DEFAULT_PRESET_ID);
  const preset = () => presets().find((p) => p.id === presetId()) ?? BUILT_IN[0]!;

  const [state, setState] = createSignal<PresetState>(stateOf(BUILT_IN[0]!));
  const [dark, setDark] = createSignal(root.classList.contains("dark"));

  // Какая ручка чем выбрана — только для показа в панели: истина живёт в `state`.
  const [accent, setAccentId] = createSignal("preset");
  const [radius, setRadiusId] = createSignal("preset");
  const [density, setDensityId] = createSignal("normal");

  /** Подключить пресет целиком: значения, ручки и режим возвращаются к его состоянию. */
  const usePreset = (id: string) => {
    const next = presets().find((p) => p.id === id);
    if (!next) return;

    setPresetId(id);
    setState(stateOf(next));
    setAccentId("preset");
    setRadiusId("preset");
    setDensityId(
      DENSITIES.find((d) => d.value === next.density)?.id ?? "normal",
    );
  };

  createEffect(() => root.classList.toggle("dark", dark()));

  // Тема регистрируется на каждое изменение: пересчёт ступеней делает база, и тёмная лестница у
  // неё своя, а не инверсия светлой.
  createEffect(() => {
    registerTheme(themeOf(preset(), state()));
    root.dataset.theme = preset().id;
    root.style.setProperty("--density", state().density);
  });

  onCleanup(() => {
    root.style.removeProperty("--density");
    delete root.dataset.theme;
  });

  // Стартового вызова `usePreset` здесь НЕТ намеренно: начальное состояние задано при объявлении
  // сигналов, а вызов читал бы их вне отслеживаемой области — правило `solid/reactivity` это
  // поймало. Дефолтный пресет и дефолтные ручки совпадают по построению, и проба это стережёт.

  return {
    presets,
    preset,
    usePreset,
    dirty: () => isDirty(preset(), state()),
    reset: () => usePreset(presetId()),
    save: (title) => {
      const taken = presets().map((p) => p.id);
      const id = idFor(title, taken);
      const current = preset();
      const saved: Preset = {
        id,
        title: title.trim() || id,
        origin: "свой",
        seeds: { ...current.seeds, brand: state().brand },
        meta: { ...current.meta, ...(state().radius ? { radius: state().radius } : {}) },
        darkOverrides: current.darkOverrides,
        density: state().density,
      };
      setOwn(saveOwn(saved));
      usePreset(id);
    },
    drop: () => {
      const current = preset();
      if (current.origin !== "свой") return;
      setOwn(removeOwn(current.id));
      usePreset(DEFAULT_PRESET_ID);
    },
    css: () => cssOf(preset(), state()),

    dressed: skin.dressed,
    toggleDressed: skin.toggle,
    dark,
    setDark,

    accent,
    setAccent: (id) => {
      setAccentId(id);
      const seed = ACCENTS.find((a) => a.id === id)?.seed;
      setState({ ...state(), brand: seed ?? preset().seeds.brand });
    },
    radius,
    setRadius: (id) => {
      setRadiusId(id);
      const step = RADIUS_STEPS.find((s) => s.id === id);
      setState({ ...state(), radius: step?.value ?? preset().meta?.radius });
    },
    density,
    setDensity: (id) => {
      setDensityId(id);
      const step = DENSITIES.find((d) => d.id === id);
      setState({ ...state(), density: step?.value ?? preset().density });
    },
  };
}
