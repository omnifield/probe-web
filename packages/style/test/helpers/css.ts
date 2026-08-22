// Разбор ПОСТАВЛЯЕМОГО CSS для проб. Общий помощник, а не копия в каждом файле: пробы
// палитры и пробы маркера смотрят на одни и те же файлы с разных сторон, и два парсера
// разъехались бы молча — вместе с ответом на вопрос «что считается объявлением».
//
// Читаем текстом, но по ПРАВИЛАМ, а не подстрокой: заголовки файлов сами рассказывают и про
// `:root`, и про `data-theme`, и наивный `grep` спотыкался бы о собственную документацию.
// У потребителя эти заголовки к тому же срежет минификатор.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Собранный артефакт зоны по имени файла. */
export const readBuilt = (name: string): string =>
  readFileSync(resolve(import.meta.dirname, `../../dist/css/${name}`), "utf8");

/** Тело без комментариев. */
export const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, "");

export interface Rule {
  selector: string;
  /** Кастом-свойства блока, БЕЗ ведущих дефисов в ключе. */
  declarations: Map<string, string>;
  /**
   * Обычные свойства блока, имя как написано.
   *
   * Отдельной картой, а не вперемешку с кастомными: после снятия ключ `box-sizing` мог бы
   * прийти и от свойства сброса, и от кастомного `--box-sizing` — разными сущностями с одним
   * ключом. Спутать их означало бы, что маркер приезда базы иногда находится там, где его нет.
   */
  plain: Map<string, string>;
}

/**
 * Правила файла: внутренние блоки со своим селектором. Обёртки вроде `@supports` при этом не
 * теряются — правило внутри разбирается само по себе, а обёртка на то, КУДА оно целится, не
 * влияет; сама обёртка остаётся видна в селекторе отдельной записью.
 */
export const rules = (css: string): Rule[] =>
  [...stripComments(css).matchAll(/([^{}]*)\{([^{}]*)\}/g)].map((match) => {
    const declarations = new Map<string, string>();
    const plain = new Map<string, string>();
    for (const line of match[2].split(";")) {
      const [, custom, name, value] = /^\s*(--)?([\w-]+):\s*([\s\S]+)$/.exec(line) ?? [];
      if (!name) continue;
      (custom ? declarations : plain).set(name, (value as string).trim());
    }
    return {
      selector: match[1].trim().replace(/^@supports[^{]*$/, "@supports"),
      declarations,
      plain,
    };
  });

/** Значения блока по его селектору. */
export const block = (css: string, selector: string): Record<string, string> | undefined => {
  const rule = rules(css).find((item) => item.selector === selector);
  return rule && Object.fromEntries(rule.declarations);
};

/**
 * Правила, которые подходят документу БЕЗ имени палитры. После `kb:PROBEWEB-18` это законное
 * состояние: атрибута нет — красить нечему, но геометрия обязана работать.
 */
export const unthemedRules = (...files: string[]): Rule[] =>
  files.flatMap((css) => rules(css)).filter((rule) => !rule.selector.includes("data-theme"));
