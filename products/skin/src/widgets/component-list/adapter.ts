// АДАПТЕР — каталожные данные (разделы кита из стора, `entities/catalog/model/store.ts`) → форма,
// которую ждут сборки аккордеона по путям `/sections/N/{id,title,body}`
// (`packages/ui/src/accordion/playground/assemblies.ts`).
//
// ВРЕМЕННО ПРОДУКТОВЫЙ (постановка user, 2026-08-28): «адаптер — это будет отдельная тема, это
// будет универсальная меха, и она поедет из фреймворка чуть позже, пока сделай у себя». Здесь —
// не универсальный механизм, а конкретная, ручная форма под ЭТИ пути: каждый раздел каталога →
// один узел `/sections`, список компонентов раздела схлопнут в `body` текстом — кликабельного
// списка КОМПОНЕНТОВ внутри пока нет (по одной ссылке `component:` на раздел, не на компонент),
// это следующий шаг.

import type { ComponentGroup } from "../../entities/catalog/model/store.js";

/** Данные под путь `/sections`: раздел → id/подпись/текст. */
export interface AccordionSectionsData {
  readonly sections: readonly { readonly id: string; readonly title: string; readonly body: string }[];
}

export function groupsToSectionsData(groups: readonly ComponentGroup[]): AccordionSectionsData {
  return {
    sections: groups.map((section) => ({
      id: section.group,
      title: section.title,
      body: section.components.join(", "),
    })),
  };
}
