// Лист стилей надетого скина. Внутреннее. Обычный тег, не конструируемый лист — разбор в FAQ.md.

const OWNER_ATTR = "data-web-core-skin";

export interface SkinSheet {
  /** Кладёт текст скина в свой лист, заводя его при первой надобности. */
  put(css: string): void;
  /** Снимает свой лист из документа. Повторный вызов безвреден. */
  drop(): void;
  /** Стоит ли наш лист в документе сейчас. */
  attached(): boolean;
}

/** Заводит владельца одного листа стилей. */
export function makeSkinSheet(): SkinSheet {
  let el: HTMLStyleElement | undefined;

  function sheet(): HTMLStyleElement {
    if (el === undefined || !el.isConnected) {
      el = document.createElement("style");
      el.setAttribute(OWNER_ATTR, "");
      document.head.append(el);
    }
    return el;
  }

  return {
    put(css: string): void {
      sheet().textContent = css;
    },

    drop(): void {
      el?.remove();
      el = undefined;
    },

    attached(): boolean {
      return el !== undefined && el.isConnected;
    },
  };
}
