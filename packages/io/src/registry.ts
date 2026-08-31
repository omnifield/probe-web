// РЕЕСТР ПАСПОРТОВ ФОРМЫ — ядро пакета (PWEB-180/181). Паспорт = zod-схема (позже — codec,
// PWEB-182): что компонент ожидает на входе/выходе, ОТДЕЛЬНО от паспорта скина — скин не
// зависит от данных, данные не зависят от скина (решено user, 2026-08-29). Прочее — слои
// преобразования, кодеки — не этот файл; здесь только регистрация и поиск по имени.
//
// Своя карта по СТРОКОВОМУ имени, не `z.registry()`/`z.globalRegistry` — проверено по исходнику
// (`zod@4.4.3`, `v4/core/registries.ts`), не по памяти и не по описанию в сети: `$ZodRegistry`
// ключуется ССЫЛКОЙ на схему (`WeakMap`), у него нет публичного поиска по строковому `id` (свой
// `_idmap` есть, но это внутреннее поле, не часть контракта); заявленная в паре источников
// «ошибка при повторной регистрации одного id» тоже не подтвердилась чтением кода — `add()`
// молча перезаписывает совпавший `id`. То есть ровно тот случай из решения user: рынок (Zod)
// закрывает типизированную границу и двусторонний трансформ (следующий тикет), но НЕ закрывает
// именованный реестр «имя компонента → паспорт» — это наша забота, не готовая находка.

import { z } from "zod";

/** Какое направление паспорт описывает: только приём данных, только отдачу, или оба разом (codec). */
export type IoDirection = "input" | "output" | "io";

export interface IoMeta {
  /** Имя компонента/адрес — тот же ключ, под которым паспорт лежит в реестре. */
  readonly component: string;
  readonly direction: IoDirection;
}

export interface IoEntry {
  readonly schema: z.ZodType;
  readonly meta: IoMeta;
}

export interface IoRegistry {
  /**
   * Регистрирует паспорт формы под именем компонента.
   *
   * Повторная регистрация тем же именем — явный отказ, не тихая перезапись: два паспорта на одно
   * имя — изъян постановки (кто-то забыл, что паспорт уже есть), а не законный сценарий
   * переопределения, — тем же приёмом, что и двойное объявление части в паспорте скина.
   *
   * Возвращает ту же схему, что приняла (приём `.register()` самого Zod) — можно регистрировать
   * прямо в месте объявления схемы, не заводя отдельную переменную под неё.
   */
  register<Schema extends z.ZodType>(component: string, schema: Schema, direction?: IoDirection): Schema;
  get(component: string): IoEntry | undefined;
  /** То же, что `get`, но явный отказ вместо `undefined` — где вызывающий без паспорта дальше не может. */
  require(component: string): IoEntry;
  has(component: string): boolean;
}

export function createIoRegistry(): IoRegistry {
  const byComponent = new Map<string, IoEntry>();

  return {
    register(component, schema, direction = "io") {
      if (byComponent.has(component)) {
        throw new Error(
          `паспорт формы «${component}» уже зарегистрирован — двух паспортов на одно имя быть не может`,
        );
      }

      byComponent.set(component, { schema, meta: { component, direction } });
      return schema;
    },
    get(component) {
      return byComponent.get(component);
    },
    require(component) {
      const found = byComponent.get(component);
      if (!found) {
        throw new Error(`паспорт формы «${component}» не зарегистрирован — наполнять компонент нечем`);
      }
      return found;
    },
    has(component) {
      return byComponent.has(component);
    },
  };
}
