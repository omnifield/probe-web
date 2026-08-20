// ПАСПОРТА ДЛЯ ПРОБ. Настоящие, а не изображённые.
//
// Кнопка берётся ЖИВАЯ — из кита, вместе с её анатомией, состояниями и осью вариаций. Она же
// обкатка всей механики (страница «Основания»): если форма подошла компоненту, которого в чужом
// ките не существует, она подойдёт любому.
//
// Второй компонент нужен ровно из-за честного предела кнопки: у неё ОДНА часть, и предка у неё
// быть не может — половина адреса на ней не проверяется вовсе (страница «Паспорт компонента»).
// Поэтому здесь объявлен составной компонент — ТОЙ ЖЕ функцией, что и любой другой: своей формы
// паспорта проба не заводит, иначе она проверяла бы не то, чем механика пользуется.

import { createAnatomy } from "@zag-js/anatomy";

import {
  definePassport,
  PASSPORTS,
  type ComponentPassport,
} from "@omnifield/probe-web-ui/passport";

/** Составной компонент: есть предок, есть вложенные части, есть состояния на обоих уровнях. */
const fieldAnatomy = createAnatomy("field").parts("root", "control", "label");

export const fieldPassport = definePassport({
  anatomy: fieldAnatomy,
  package: "@omnifield/probe-web-skin/test",
  genus: "component",
  root: "root",
  parts: [
    {
      name: "root",
      means: "поле целиком",
      states: [
        { name: "disabled", means: "править нельзя", mark: { kind: "attribute", name: "data-disabled" } },
        { name: "invalid", means: "значение не прошло проверку", mark: { kind: "attribute", name: "data-invalid" } },
      ],
      accepts: [
        { kind: "part", name: "label" },
        { kind: "part", name: "control" },
      ],
    },
    {
      name: "control",
      means: "то, во что вводят",
      states: [
        { name: "focus", means: "фокус на вводе", mark: { kind: "attribute", name: "data-focus" } },
        { name: "hover", means: "указатель над вводом", mark: { kind: "pseudo", name: ":hover" } },
      ],
    },
    {
      name: "label",
      means: "подпись поля",
      states: [],
    },
  ],
  variantAxis: {
    means: "имя вариации поля",
    mark: { kind: "attribute", name: "data-variant" },
  },
});

/** Паспорт кнопки — живой, из кита. */
export const buttonPassport = PASSPORTS.button!;

/** Чем пробы находят паспорт по имени компонента. */
export function lookup(component: string): ComponentPassport | undefined {
  if (component === fieldPassport.component) return fieldPassport;
  return PASSPORTS[component];
}

/** Лукап, не знающий ни одного компонента, — для проверки именованных отказов. */
export function emptyLookup(): undefined {
  return undefined;
}
