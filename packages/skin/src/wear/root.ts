// Корень документа как среда: чтение и запись опознания скина. Внутреннее.

const SKIN_ATTR = "data-skin";
const DARK_CLASS = "dark";

function root(): HTMLElement {
  return document.documentElement;
}

/** Скин, надетый на корень сейчас. `null` — голый кит. */
export function readWorn(): string | null {
  return root().getAttribute(SKIN_ATTR);
}

/** Ставит опознание скина на корень; `null` — снимает атрибут. */
export function writeWorn(name: string | null): void {
  const el = root();
  if (name === null) el.removeAttribute(SKIN_ATTR);
  else el.setAttribute(SKIN_ATTR, name);
}

/** Стоит ли тёмная пара. */
export function readDark(): boolean {
  return root().classList.contains(DARK_CLASS);
}

/** Ставит или снимает тёмную пару. */
export function writeDark(dark: boolean): void {
  root().classList.toggle(DARK_CLASS, dark);
}

/** Значение кастом-свойства, вычисленное на корне. */
export function readToken(name: string): string {
  return getComputedStyle(root()).getPropertyValue(name).trim();
}
