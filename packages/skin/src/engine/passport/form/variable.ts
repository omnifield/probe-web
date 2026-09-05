
import type { StepPurposeClass } from "@web-core/style";

export interface PassportVariable {
  readonly name: string;
  readonly setBy: "kit" | "consumer";
  /**
   * Класс ступени шкалы, который эта переменная вправе нести, если она — промежуточный
   * контейнер под цвет (`--active-color` и подобные). Не объявлено — переменной нечего
   * проверять: гейт (`../../rules/step-purpose.ts`) её не трогает, как и любую другую
   * custom-property без объявленного смысла.
   */
  readonly colorPurpose?: StepPurposeClass;
}
