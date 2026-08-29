// АДАПТЕР — каталожные данные (разделы кита из стора, `entities/catalog/model/store.ts`) → форма,
// которую ждут сборки аккордеона по путям `/sections/N/{id,title,items/M/{id,title}}`
// (`packages/ui/src/accordion/playground/assemblies.ts`).
//
// ВРЕМЕННО ПРОДУКТОВЫЙ (постановка user, 2026-08-28): «адаптер — это будет отдельная тема, это
// будет универсальная меха, и она поедет из фреймворка чуть позже, пока сделай у себя». Здесь —
// не универсальный механизм, а конкретная, ручная форма под ЭТИ пути: каждый раздел каталога →
// один узел `/sections`, каждый компонент раздела → один пункт `items` (рисуется настоящей
// `Button` из общего реестра, `PWEB-166`/`167`), не схлопнутый текст — кликабельный список
// КОМПОНЕНТОВ внутри уже есть.

import type { ComponentGroup } from "../../entities/catalog/model/store.js";

/** Один пункт раздела — компонент кита: id/подпись = его же адрес. */
export interface AccordionItemData {
  readonly id: string;
  readonly title: string;
}

/** Данные под путь `/sections`: раздел → id/подпись/пункты. */
export interface AccordionSectionsData {
  readonly sections: readonly {
    readonly id: string;
    readonly title: string;
    readonly items: readonly AccordionItemData[];
  }[];
}

export function groupsToSectionsData(groups: readonly ComponentGroup[]): AccordionSectionsData {
  return {
    sections: groups.map((section) => ({
      id: section.group,
      title: section.title,
      items: section.components.map((component) => ({ id: component, title: component })),
    })),
  };
}
