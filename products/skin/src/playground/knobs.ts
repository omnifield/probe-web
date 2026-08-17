// РУЧКИ СТЕНДА — и главное решение о том, КУДА они применяются.
//
// Первая редакция ставила переменные на контейнер образцов. Работало это только на вид: сами
// переменные менялись (замер подтверждал), а компоненты оставались прежними — половина ручек
// «ничего не делала».
//
// ПРИЧИНА, и она про устройство базы, а не про стенд. Производные шкалы и роли объявлены в
// `:root` базового слоя:
//
//     :root { --space-4: calc(var(--space) * 4 * var(--density)); }
//     :root { --brand-solid: var(--brand-9); }
//
// Значение такого свойства вычисляется ТАМ, ГДЕ ОНО ОБЪЯВЛЕНО, — на `:root`. Потомки наследуют
// уже посчитанный результат. Поэтому переопределение семени (`--density`, `--radius`,
// `--brand-9`) ниже по дереву не пересчитывает ничего: пересчитывать нужно было бы объявление,
// а оно осталось наверху.
//
// Отсюда правило: **семена ставятся на корень документа**. Ровно так их поставит и потребитель
// — в своей теме или через `registerTheme`, а не на отдельном блоке страницы.
//
// Что осталось на контейнере: ничего. Локальная настройка «этот блок плотнее» требует, чтобы
// база объявляла производные и на потомке, — это находка про базу, и она названа в отчёте.

import { buildScale, registerTheme } from "@omnifield/probe-web-style";
import { createEffect, createSignal, onCleanup } from "solid-js";

import { TWITTER_THEME, TWITTER_THEME_NAME } from "../theme/twitter.js";
import skinCss from "../skin/skin.css?inline";

const STYLE_ID = "probe-web-skin";

/** Ступени радиуса. Значение уезжает в семя `--radius`, шкала считается из него базой. */
export const RADIUS_STEPS = [
  { id: "theme", label: "из темы", value: null },
  { id: "none", label: "нет", value: "0rem" },
  { id: "small", label: "малый", value: "0.25rem" },
  { id: "medium", label: "средний", value: "0.5rem" },
  { id: "large", label: "крупный", value: "0.75rem" },
  { id: "full", label: "полный", value: "1.5rem" },
] as const;

/**
 * Семена акцента. Семя — ВХОД для генератора шкалы, а не значение оформления: из него база
 * строит двенадцать ступеней и держит обещания контраста. Поэтому литеральный цвет здесь
 * уместен, а в поставке (`src/skin`) его нет и быть не может.
 */
export const ACCENTS = [
  { id: "theme", label: "из темы", seed: null },
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
  dressed: () => boolean;
  toggleDressed: () => void;
  dark: () => boolean;
  setDark: (on: boolean) => void;
  palette: () => boolean;
  setPalette: (on: boolean) => void;
  radius: () => string;
  setRadius: (id: string) => void;
  accent: () => string;
  setAccent: (id: string) => void;
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

/** Все ручки стенда. Семена уезжают на корень документа — иначе они ничего не меняют. */
export function createKnobs(): Knobs {
  const root = document.documentElement;
  const skin = useSkinTag();

  registerTheme(TWITTER_THEME);

  const [dark, setDark] = createSignal(root.classList.contains("dark"));
  const [palette, setPalette] = createSignal(true);
  const [radius, setRadius] = createSignal("theme");
  const [accent, setAccent] = createSignal("theme");
  const [density, setDensity] = createSignal("normal");

  createEffect(() => root.classList.toggle("dark", dark()));

  createEffect(() => {
    if (palette()) root.dataset.theme = TWITTER_THEME_NAME;
    else delete root.dataset.theme;
  });

  createEffect(() => {
    const step = RADIUS_STEPS.find((s) => s.id === radius())?.value ?? null;
    if (step === null) root.style.removeProperty("--radius");
    else root.style.setProperty("--radius", step);
  });

  createEffect(() => {
    const value = DENSITIES.find((d) => d.id === density())?.value ?? "1";
    root.style.setProperty("--density", value);
  });

  // Шкалу бренда строит БАЗА: у неё закреплено назначение ступеней и проверены обещания
  // контраста. Пересчитывается при смене режима — тёмная лестница своя, а не инверсия светлой.
  createEffect(() => {
    const seed = ACCENTS.find((a) => a.id === accent())?.seed;
    const steps = buildScale(seed ?? "oklch(0.62 0.012 248)", dark() ? "dark" : "light");

    for (const [step, value] of Object.entries(steps)) {
      const name = `--brand-${step}`;
      if (seed) root.style.setProperty(name, value);
      else root.style.removeProperty(name);
    }
  });

  onCleanup(() => {
    for (const name of ["--radius", "--density"]) root.style.removeProperty(name);
    for (const step of [...Array(12).keys()]) root.style.removeProperty(`--brand-${step + 1}`);
    root.style.removeProperty("--brand-contrast");
  });

  return {
    dressed: skin.dressed,
    toggleDressed: skin.toggle,
    dark,
    setDark,
    palette,
    setPalette,
    radius,
    setRadius,
    accent,
    setAccent,
    density,
    setDensity,
  };
}
