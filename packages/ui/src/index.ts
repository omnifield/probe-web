// ПОРОЖДЁН СБОРКОЙ (`scripts/generate.mjs`, движок — `@probe-web/generators/barrel`) — НЕ ПРАВИТЬ И НЕ КОММИТИТЬ.
//
// Поверхность зоны `ui` — примитивы поверх `@ark-ui/solid`/`@kobalte/core`.
//
// Перечень компонентов собирается обходом папок `src/*`: компонент называет себя вовне СВОИМ
// `index.ts` (`export { … } from "./components/index.js"`) и попадает в поставку самим фактом
// объявления — добавлять его сюда отдельной строкой не нужно и не надо.
//
// Вход для примитивов ОДИН. Причина не в лени: пакет объявляет `sideEffects: false` и ESM, а
// значит неиспользованный примитив выбрасывается сборщиком потребителя и без сегментации по
// подпутям. Подпути — это ещё и поверхность, каждая точка которой замерзает выпуском; заводим их,
// когда появится потребитель, которому корневого входа не хватило (`PROBEWEB-4` — «не строить
// вперёд спроса»).
//
// Такой потребитель появился ровно один — и подпуть у зоны ровно один: `./passport` (`PWEB-2`).
// Паспорт читают механика скина и редактор, и им нужны ДАННЫЕ о частях, состояниях и оси
// вариаций, а не примитивы: через корневой вход перечень тянул бы за собой JSX, Solid и
// `@kobalte/core`. Отсюда же и обратное правило — ГОЛЫЙ паспорт из этого файла НЕ
// реэкспортируется: два входа к одним данным означали бы два обещания вместо одного.
//
// Стилей отсюда не едет НИЧЕГО: у зоны нет CSS-артефакта, потому что нет и стилей по умолчанию.
// Оформление приезжает из `@omnifield/probe-web-style` и пишется потребителем.
export * from "./accordion/index.js";
export * from "./avatar/index.js";
export * from "./button/index.js";
export * from "./carousel/index.js";
export * from "./checkbox/index.js";
export * from "./date-picker/index.js";
export * from "./dialog/index.js";
export * from "./drawer/index.js";
export * from "./field/index.js";
export * from "./file-upload/index.js";
export * from "./flow/index.js";
export * from "./grid/index.js";
export * from "./listbox/index.js";
export * from "./menu/index.js";
export * from "./popover/index.js";
export * from "./radio-group/index.js";
export * from "./scroll-area/index.js";
export * from "./segment-group/index.js";
export * from "./select/index.js";
export * from "./slider/index.js";
export * from "./splitter/index.js";
export * from "./surface/index.js";
export * from "./switch/index.js";
export * from "./table/index.js";
export * from "./tabs/index.js";
export * from "./timer/index.js";
export * from "./toast/index.js";
export * from "./toggle/index.js";
export * from "./toggle-group/index.js";
export * from "./tree-view/index.js";
export * from "./workspace/index.js";
export * from "./shared/utils/collection.js";
// Карта частей вместе с паспортами (`PWEB-84`) и форма самой карты (`kit-form.js`, `export *`
// внутри `kit.js` уже её несёт).
export * from "./kit.js";
