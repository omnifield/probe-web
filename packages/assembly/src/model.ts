// ПОДПУТЬ `./model` — механика без отрисовки: дерево, реестр, правила, правки.
//
// Отдельный вход, а не кусок общего, потому что у этой половины другой потребитель. Хранилище,
// проверка сохранённого дерева, перенос формата, сборка на стороне сервера — им нужны правила
// и правки, но не нужен ни Solid, ни живой компонент. Влей мы всё в один вход, каждый такой
// потребитель тянул бы за собой отрисовку ради проверки вложенности.
//
// Обратное неверно: отрисовка модель использует, поэтому корневой вход отдаёт и её тоже.

export type {
  Admission,
  AdmissionRule,
  ComponentGenus,
  Genus,
  ReadablePart,
  ReadablePassport,
} from "./passport-read.js";
export { partOf } from "./passport-read.js";

export type { SelfAssembly, SelfAssemblyContent, SelfAssemblyElement, SelfAssemblyNode } from "./self-assembly.js";
export { growSelfAssembly } from "./self-assembly.js";

export type {
  AssemblyContent,
  AssemblyElement,
  AssemblyNode,
  AssemblyTree,
  DataBinding,
  DispatchAction,
  DispatchedEvent,
  DynamicValue,
  NodeId,
} from "./tree.js";
export {
  ancestorsOf,
  EMPTY_TREE,
  isContent,
  isDataBinding,
  nodeOf,
  outerTypeOf,
  resolveDataBinding,
  rootOf,
  subtreeOf,
} from "./tree.js";

export type {
  Address,
  ReadableComponent,
  Registry,
  RegistryFlaw,
  RegistryFlawName,
  RegistrySpec,
} from "./registry.js";
export {
  checkRegistry,
  createRegistry,
  knownComponents,
  readAddress,
  resolveComponent,
} from "./registry.js";

export type {
  AllowedInside,
  NestingRefusal,
  NestingVerdict,
  PossibleOwner,
} from "./nesting.js";
export {
  allowedInside,
  canAdmit,
  canContain,
  ownersAdmitting,
  possibleOwnersOf,
} from "./nesting.js";

export type { NodeCoordinate } from "./coordinate.js";
export { coordinateOfType, nodesByCoordinate, nodesSharingCoordinate } from "./coordinate.js";

export type { SketchNaming } from "./sketch.js";
export { sketchOf } from "./sketch.js";

export type { TreeFlaw, TreeFlawName } from "./integrity.js";
export { checkTree } from "./integrity.js";

export type {
  EditRefusal,
  EditResult,
  NewContent,
  NewElement,
  NewNode,
  NodePatch,
} from "./edits.js";
export { insertNode, moveNode, removeNode, updateNode } from "./edits.js";
