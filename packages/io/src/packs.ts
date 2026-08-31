// РЕЕСТР ЗАГОТОВОК ПО ТЕМЕ (PWEB-187/188) — словарный контент, ГОЛЫЙ, БЕЗ схемы вообще: тема
// не знает и не обязана знать, для какого компонента её записи когда-нибудь подойдут (та же
// граница, что у паспорта формы, `registry.ts` — данные не зависят от того, кто их использует).
//
// Тем же приёмом, что `IoRegistry` (явный отказ на повтор имени, явный отказ у `require` вместо
// тихого `undefined`) — второй стиль отказа рядом заводить незачем, вопрос тот же.

export interface PackRegistry {
  /** Регистрирует тему. Повторная регистрация тем же именем — явный отказ, не тихая перезапись. */
  register(theme: string, items: readonly unknown[]): readonly unknown[];
  get(theme: string): readonly unknown[] | undefined;
  /** То же, что `get`, но явный отказ вместо `undefined` — где вызывающий без темы дальше не может. */
  require(theme: string): readonly unknown[];
  has(theme: string): boolean;
  /** Имена зарегистрированных тем — то, что показывает выбору темы. */
  themes(): string[];
}

export function createPackRegistry(): PackRegistry {
  const byTheme = new Map<string, readonly unknown[]>();

  return {
    register(theme, items) {
      if (byTheme.has(theme)) {
        throw new Error(`тема «${theme}» уже зарегистрирована — двух заготовок на одно имя быть не может`);
      }

      byTheme.set(theme, items);
      return items;
    },
    get(theme) {
      return byTheme.get(theme);
    },
    require(theme) {
      const found = byTheme.get(theme);
      if (!found) {
        throw new Error(`тема «${theme}» не зарегистрирована — заготовок для неё нет`);
      }
      return found;
    },
    has(theme) {
      return byTheme.has(theme);
    },
    themes() {
      return [...byTheme.keys()];
    },
  };
}
