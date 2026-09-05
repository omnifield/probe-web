// см. README.md / FAQ.md — реестр паспортов формы по строковому имени, не `z.registry()`.
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
  /** Регистрирует паспорт формы под именем компонента; повтор имени — явный отказ. Возвращает ту же схему. */
  register<Schema extends z.ZodType>(component: string, schema: Schema, direction?: IoDirection): Schema;
  get(component: string): IoEntry | undefined;
  /** То же, что `get`, но явный отказ вместо `undefined` — где вызывающий без паспорта дальше не может. */
  require(component: string): IoEntry;
  has(component: string): boolean;
  /** Все зарегистрированные паспорта — тому, кому нужно пройтись по каждому (например, сгенерировать по записи на компонент). */
  list(): readonly IoEntry[];
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
    list() {
      return [...byComponent.values()];
    },
  };
}
