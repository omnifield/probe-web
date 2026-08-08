// Механика тем. Дефолт работает БЕЗ единой строки JS: `themes.css` красит `:root` в
// светлую пару, `.dark` — в тёмную. Всё, что здесь есть, нужно ровно для двух вещей поверх
// этого: подключить палитру, которой в пакете нет, и переключить режим в рантайме.

import { type Accessor, createSignal } from "solid-js";

import { type ThemeDefinition, themeToCss } from "./tokens.js";
import { trace } from "./trace.js";

const STYLE_ID_PREFIX = "probe-web-theme-";

/**
 * Регистрирует кастомную палитру: инжектит в `<head>` блоки `[data-theme="<name>"]`
 * (и тёмный вариант, если он задан). Идемпотентно по имени — повторный вызов ЗАМЕНЯЕТ
 * содержимое своего тега, а не добавляет второй.
 *
 * Палитры приходят данными сверху и в пакете не лежат намеренно: набор палитр — контент
 * приложения, а зашитый набор притащил бы за собой сборочную связность (`import.meta.glob`
 * предка) ради содержимого, которое стилевому слою не принадлежит.
 *
 * Активация — `setTheme(name)` контроллера либо атрибут `data-theme` руками.
 *
 * @param theme палитра как данные
 * @param doc целевой документ; по умолчанию глобальный (вне DOM вызов — no-op)
 */
export function registerTheme(theme: ThemeDefinition, doc?: Document): void {
  const target = doc ?? (typeof document === "undefined" ? undefined : document);
  if (!target) return;

  const done = trace(`registerTheme(${theme.name})`);

  const css = [
    themeToCss(`[data-theme="${theme.name}"]`, theme.light),
    theme.dark
      ? themeToCss(
          `[data-theme="${theme.name}"].dark, [data-theme="${theme.name}"] .dark`,
          theme.dark,
        )
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const id = `${STYLE_ID_PREFIX}${theme.name}`;
  let el = target.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = target.createElement("style");
    el.id = id;
    target.head.appendChild(el);
  }
  el.textContent = css;

  done();
}

export type ThemeMode = "light" | "dark";

export interface ThemeControllerOptions {
  /** Кастомные палитры, которые нужно зарегистрировать на старте. */
  themes?: ThemeDefinition[];
  /** Стартовая палитра; `undefined` — дефолтная пара, без атрибута `data-theme`. */
  initialTheme?: string;
  initialMode?: ThemeMode;
  /** Элемент-носитель `data-theme` и класса `dark`; по умолчанию `documentElement`. */
  target?: HTMLElement;
}

export interface ThemeController {
  /** Имя активной палитры; `undefined` — дефолтная пара. */
  theme: Accessor<string | undefined>;
  setTheme(name: string | undefined): void;
  mode: Accessor<ThemeMode>;
  setMode(mode: ThemeMode): void;
  toggleMode(): void;
}

/**
 * Контроллер темы — PER-INSTANCE, приложение создаёт его на бутстрапе. Никаких
 * module-global сигналов: синглтон в пакете означает одно состояние темы на весь процесс,
 * и второе приложение (или тест) молча получает чужое.
 *
 * Персиста здесь нет намеренно: ключ хранилища, поведение при SSR и вспышка неверной темы
 * до гидратации — решения приложения, а пакет, выбравший их за него, занимает чужой ключ
 * без спроса.
 */
export function createThemeController(
  options: ThemeControllerOptions = {},
): ThemeController {
  const done = trace("createThemeController");

  const element = () =>
    options.target ??
    (typeof document === "undefined" ? undefined : document.documentElement);

  for (const theme of options.themes ?? []) registerTheme(theme);

  const [theme, setThemeSignal] = createSignal<string | undefined>(options.initialTheme);
  const [mode, setModeSignal] = createSignal<ThemeMode>(options.initialMode ?? "light");

  const applyTheme = (name: string | undefined): void => {
    const el = element();
    if (!el) return;
    if (name) el.setAttribute("data-theme", name);
    else el.removeAttribute("data-theme");
  };

  const applyMode = (value: ThemeMode): void => {
    element()?.classList.toggle("dark", value === "dark");
  };

  applyTheme(theme());
  applyMode(mode());

  done();

  const setMode = (value: ThemeMode): void => {
    setModeSignal(value);
    applyMode(value);
  };

  return {
    theme,
    setTheme: (name) => {
      setThemeSignal(name);
      applyTheme(name);
    },
    mode,
    setMode,
    toggleMode: () => setMode(mode() === "dark" ? "light" : "dark"),
  };
}
