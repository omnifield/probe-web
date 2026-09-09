// СЛОВАРЬ ИКОНОК КИТА — свой, а не сквозной проброс имён `lucide`.
//
// Почему список, а не «любое из 1808 имён апстрима». Прежняя реализация обещала второе и
// собирала карту глобом Vite по пути `../../../node_modules/lucide-solid/…`. Это МАКРОС
// Vite: он раскрывается при трансформации ТОГО ЖЕ файла, а ветку `solid` поставки
// (`dist/index.jsx`) сборка кита не трансформирует — макрос уезжал потребителю буквальным и
// раскрывался уже его Vite относительно `packages/ui/dist/`, где `../../../node_modules` — это
// корень монорепозитория, а pnpm пакет туда не поднимает. Ноль совпадений, пустая карта, ни
// ошибки, ни предупреждения: в прод-бандле витрины стояло `Object.assign({})`, и каждый `<Icon>`
// падал `unknown icon "…"`. Дев этого не показывал — `@web-core/build` подменяет соседей по
// воркспейсу исходниками (`workspace-source.ts`, `apply: "serve"`), и там путь считался от
// `src/`, где он верный.
//
// Чинимого ПУТИ нет: у опубликованного пакета раскладка `node_modules` другая (npm поднимает
// зависимости в корень потребителя, pnpm — нет), а макрос в поставке привязывает кит к Vite
// потребителя. Значит чинится не путь, а обещание.
//
// Альтернативы замерены, не угаданы (2026-09-09, `vite@8.2.1`, `lucide-solid@1.41.0`):
//   • `import { icons } from "lucide-solid"` — способ из доки lucide для Solid: три строки, но
//     805 КБ / 164 КБ gzip в бандл ВСЕГДА и +30 с сборки (solid-transform на 2073 файла);
//   • данные из ядра `lucide` + свой рендер — 498 КБ / 94 КБ gzip всегда, плюс новая зависимость;
//   • порождённая карта на все 1808 имён — ровно то, что `lucide-react` отдаёт как
//     `lucide-react/dynamic` (`dynamicIconImports.mjs`, ~2000 строк, 123 КБ). У них она лежит
//     ВНУТРИ пакета, пути в ней относительные к себе, и потому бесплатна; у нас такой файл — это
//     120 КБ порождённого мусора в исходниках ради имён, которых кит не называет.
//     У `lucide-solid` своего `./dynamic` нет — сверено с exports-картой версии 1.43.0.
//
// Здесь — только те имена, которые кит реально называет: шесть в сборках playground плюс
// ближайшие соседи по механике компонентов, у которых есть слот под иконку (22 компонента).
// Специфер ЛИТЕРАЛЬНЫЙ и ПАКЕТНЫЙ — его резолвит exports-карта самой `lucide-solid`, одинаково
// у Vite, Rollup, webpack и в `node`; ни макроса, ни шаблонной строки, ни пути в `node_modules`.
//
// НУЖНОЙ ИКОНКИ НЕТ — добавь строку сюда. Это не обход механизма, это и есть механизм: словарь
// кита растёт заявкой, а не молча вслед за апстримом.
import type { IconLoader } from "./model.js";

export const catalog = {
  // Раскрытие и навигация: accordion, select, menu, tree-view, carousel, date-picker, tabs.
  "chevron-down": () => import("lucide-solid/icons/chevron-down"),
  "chevron-up": () => import("lucide-solid/icons/chevron-up"),
  "chevron-left": () => import("lucide-solid/icons/chevron-left"),
  "chevron-right": () => import("lucide-solid/icons/chevron-right"),
  "chevrons-left": () => import("lucide-solid/icons/chevrons-left"),
  "chevrons-right": () => import("lucide-solid/icons/chevrons-right"),

  // Действия: dialog/drawer/toast закрываются, listbox/checkbox отмечают, table правит строку.
  "x": () => import("lucide-solid/icons/x"),
  "check": () => import("lucide-solid/icons/check"),
  "minus": () => import("lucide-solid/icons/minus"),
  "plus": () => import("lucide-solid/icons/plus"),
  "trash": () => import("lucide-solid/icons/trash"),
  "pencil": () => import("lucide-solid/icons/pencil"),
  "copy": () => import("lucide-solid/icons/copy"),
  "search": () => import("lucide-solid/icons/search"),
  "ellipsis": () => import("lucide-solid/icons/ellipsis"),
  "ellipsis-vertical": () => import("lucide-solid/icons/ellipsis-vertical"),

  // Состояние: field показывает разбор ввода, toast — исход, любой асинхронный узел — ожидание.
  "circle-alert": () => import("lucide-solid/icons/circle-alert"),
  "circle-check": () => import("lucide-solid/icons/circle-check"),
  "circle-x": () => import("lucide-solid/icons/circle-x"),
  "info": () => import("lucide-solid/icons/info"),
  "triangle-alert": () => import("lucide-solid/icons/triangle-alert"),
  "loader-circle": () => import("lucide-solid/icons/loader-circle"),

  // Предметные: date-picker, timer, file-upload, avatar, splitter, table, tree-view, field.
  "calendar": () => import("lucide-solid/icons/calendar"),
  "clock": () => import("lucide-solid/icons/clock"),
  "upload": () => import("lucide-solid/icons/upload"),
  "file": () => import("lucide-solid/icons/file"),
  "file-text": () => import("lucide-solid/icons/file-text"),
  "film": () => import("lucide-solid/icons/film"),
  "image": () => import("lucide-solid/icons/image"),
  "user": () => import("lucide-solid/icons/user"),
  "grip-vertical": () => import("lucide-solid/icons/grip-vertical"),
  "arrow-up": () => import("lucide-solid/icons/arrow-up"),
  "arrow-down": () => import("lucide-solid/icons/arrow-down"),
  "arrow-up-down": () => import("lucide-solid/icons/arrow-up-down"),
  "folder": () => import("lucide-solid/icons/folder"),
  "folder-open": () => import("lucide-solid/icons/folder-open"),
  "eye": () => import("lucide-solid/icons/eye"),
  "eye-off": () => import("lucide-solid/icons/eye-off"),
  "external-link": () => import("lucide-solid/icons/external-link"),
} as const satisfies Readonly<Record<string, IconLoader>>;

/** Словарь кита — то, что `<Icon name>` принимает. Не `string`: список свой, и он проверяется. */
export type IconName = keyof typeof catalog;

/** Все имена словаря — для редактора скина и проб. */
export const iconNames = Object.keys(catalog) as readonly IconName[];
