import type { FieldRule } from "@web-core/io";

import type { MappingResult } from "../../entities/mapping/index.js";

export interface MappingChange {
  /** Правила — сохранить их и есть способ переиспользовать сведение на новых данных той же формы
   *  (сохранение — забота потребителя, у feeder его нет). */
  readonly rules: readonly FieldRule[];
  readonly result: MappingResult;
}
