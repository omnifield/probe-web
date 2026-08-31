// АДАПТЕР — каталожные данные (разделы кита из стора, `entities/component/model/store.ts`) → форма,
// которую ждут сборки аккордеона по путям `/sections/N/{id,title,items/M/{value,label}}`
// (`packages/ui/src/accordion/playground/assemblies/action-list.ts`).
//
// ВРЕМЕННО ПРОДУКТОВЫЙ (постановка user, 2026-08-28): «адаптер — это будет отдельная тема, это
// будет универсальная меха, и она поедет из фреймворка чуть позже, пока сделай у себя». Здесь —
// не универсальный механизм, а конкретная, ручная форма под ЭТИ пути: каждый раздел каталога →
// один узел `/sections`, каждый компонент раздела → один пункт `items` (рисуется настоящим
// `Listbox` из общего реестра — content'ом раздела вместо кнопки, 2026-08-30).
//
// `value`/`label`, не `id`/`title`: пункт читает настоящий листбокс (`packages/ui/src/listbox/
// entity/io.ts`), а он по умолчанию берёт эти два поля (`@zag-js/collection`'s `fallback.
// itemToValue`/`itemToString`) — переименовано вместе со схемой в ките, иначе пункты рисуются
// пустыми (значение и подпись не находятся).

import type { ComponentGroup } from "../../entities/component/model/store.js";

/** Один пункт раздела — компонент кита: value/label = его же адрес. */
export interface AccordionItemData {
  readonly value: string;
  readonly label: string;
}

/** Данные под путь `/sections`: раздел → id/подпись/пункты/отмеченный пункт. */
export interface AccordionSectionsData {
  readonly sections: readonly {
    readonly id: string;
    readonly title: string;
    readonly items: readonly AccordionItemData[];
    /** Ровно то, что примет `bind: { value: "activeValues" }` листбокса раздела. */
    readonly activeValues: readonly string[];
  }[];
}

/**
 * @param active показанный сейчас компонент (`entities/preview/model/store.ts`'s
 *   `usePreviewComponent()`) — единственный источник правды для «какой пункт отмечен»; листбокс
 *   каждого раздела больше не решает это сам (найдено живьём, 2026-08-31: без этого можно было
 *   отметить по пункту в КАЖДОМ разделе разом, а после перезагрузки отметка пропадала везде).
 */
export function groupsToSectionsData(
  groups: readonly ComponentGroup[],
  active: string | undefined,
): AccordionSectionsData {
  return {
    sections: groups.map((section) => ({
      id: section.group,
      title: section.title,
      items: section.components.map((component) => ({ value: component, label: component })),
      activeValues: active !== undefined && section.components.includes(active) ? [active] : [],
    })),
  };
}
