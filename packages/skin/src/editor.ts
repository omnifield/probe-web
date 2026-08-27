// ПОДПУТЬ `./editor` (`PWEB-115`) — срез РЕДАКТОРА паспорта: всё, что читают только человек и
// редакторская механика продукта, и что `generateSkinCss`/`checkOutfit`/`assemble` не трогают.
//
// Отдельный вход, а не часть `./model` или корня, — и это НЕ стиль, а сама граница: приложение,
// импортирующее `.`/`./model`, не создаёт ссылки НИ НА ОДНУ привязку этого файла, и бандлер
// вправе выбросить редакторские данные (`means`, сборки) как мёртвый код. Импорт `./editor` —
// осознанный акт того, кто действительно строит редактор, а не случайная утечка через общий вход.
//
// Разбор устройства, довод и рецепт объявления — в шапке `passport-editor.ts`.

export type {
  ComponentFootprint,
  ComponentGroup,
  PassportComponentGenus,
  PassportEditorInfo,
  PassportEditorSpec,
  PassportGenus,
  PassportAdmission,
  PassportPartEditorInfo,
  PassportSettingEditorInfo,
  PassportSettingOptionEditorInfo,
  PassportStateEditorInfo,
  PassportVariableEditorInfo,
} from "./passport-editor.js";
export { admits, defineEditorInfo, footprintOf, GROUPS, groupOf } from "./passport-editor.js";

// БАЗОВАЯ СБОРКА (`PWEB-89`) — держатель переехал в `PassportEditorInfo.assemblies` и стал
// списком (`PWEB-115`); объявление дерева и его разворот в плоскую форму остались здесь же, где
// были всегда.
export type {
  BaseAssemblyContent,
  BaseAssemblyElement,
  BaseAssemblyNode,
  BaseAssemblyTree,
  DataBinding,
  DataPreset,
  DispatchAction,
  DynamicValue,
  PassportAssembly,
  PassportAssemblyContent,
  PassportAssemblyExtra,
  PassportAssemblyNode,
  PassportAssemblyPart,
  PassportAssemblyRepeat,
} from "./passport-assembly.js";
export {
  baseAssemblyOf,
  isAssemblyContent,
  isAssemblyExtra,
  isAssemblyRepeat,
  isContentNode,
  isDataBinding,
  resolveDataBinding,
} from "./passport-assembly.js";
