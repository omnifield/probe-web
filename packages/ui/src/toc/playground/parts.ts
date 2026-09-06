import type { PassportPartEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import type { passport } from "../entity/passport.js";

type TocPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const parts: Readonly<Record<TocPart, PassportPartEditorInfo<TocPart>>> = {
  root: {
    means: "оглавление целиком — держит список заголовков и отслеживает, какой сейчас на виду",
    variables: {
      "--top": { means: "измеренное вертикальное положение указателя активного пункта" },
      "--left": { means: "измеренное горизонтальное положение указателя активного пункта" },
      "--width": { means: "измеренная ширина указателя активного пункта" },
      "--height": { means: "измеренная высота указателя активного пункта" },
    },
    accepts: [
      { kind: "component", name: "content" },
      { kind: "component", name: "nav" },
    ],
  },
  content: {
    means: "настоящий скроллируемый контент со своими заголовками — оглавление отслеживает ИХ, а не рисует само",
  },
  nav: {
    means: "боковая панель навигации — оборачивает заголовок панели и сам список ссылок",
    accepts: [
      { kind: "component", name: "title" },
      { kind: "component", name: "list" },
    ],
  },
  title: {
    means: "подпись панели — например, «На этой странице»",
    accepts: [{ kind: "content", genus: "text" }],
  },
  list: {
    means: "список ссылок на заголовки",
    accepts: [
      { kind: "component", name: "indicator" },
      { kind: "component", name: "item" },
    ],
  },
  indicator: {
    means: "скользящий указатель под активной ссылкой — просто бокс, своего графика не несёт",
    accepts: [],
  },
  item: {
    means: "один пункт списка — оборачивает ссылку на один заголовок",
    states: {
      active: { means: "заголовок этого пункта сейчас виден" },
      first: { means: "этот пункт — первый среди видимых сейчас заголовков" },
      last: { means: "этот пункт — последний среди видимых сейчас заголовков" },
    },
    variables: {
      "--depth": { means: "уровень вложенности заголовка — из данных, не решение рецепта" },
    },
    accepts: [{ kind: "component", name: "link" }],
  },
  link: {
    means: "сама ссылка — клик скроллит к заголовку вместо обычного перехода",
    states: {
      active: { means: "заголовок, на который ведёт эта ссылка, сейчас виден" },
    },
    accepts: [{ kind: "content", genus: "text" }],
  },
};
