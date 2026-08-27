import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { useAddress, slotAware } from "../../slot-chain.js";
import { traceLife } from "../../trace.js";
import { anatomyParts } from "../entity/anatomy.js";

// Рабочая область — каркас приложения именованными слотами (`PWEB-154`).
//
// ## Пять узлов, ни одного вложенного вручную
//
// Раньше каркас приходилось собирать из двух вложенных `Grid` и помнить, каким по счёту ребёнком
// класть шапку, а каким — показ. Здесь каждый слот назван — `WorkspaceHeader`/`WorkspaceSidebar`/
// `WorkspaceMain`/`WorkspaceRightbar` — и потребитель кладёт их в любом порядке внутрь `Workspace`;
// раскладку по местам решает скин через `grid-template-areas` (`playground/recipe.ts`), а не
// порядок разметки.
//
// ## Ни зазора, ни ширины колонок в разметке
//
// Тем же доводом, что у сетки и потока: сколько весит рельса, схлопывается ли пустая боковая
// панель — вид, и его здесь нет ни пропом, ни умолчанием. Голая рабочая область — законное
// рабочее состояние кита без скина, тем же приёмом, что голый поток и голая сетка.
//
// ## `rightbar` необязателен НАСТОЯЩИМ образом
//
// Не смонтирован узел `WorkspaceRightbar` — колонка под него схлопывается сама средствами CSS
// (`playground/recipe.ts` объясняет, как именно), а не условием в разметке потребителя. Тот же
// довод, что у `indicator`/`itemPreviewImage` в остальном ките: часть, которую можно не класть,
// не должна требовать от потребителя знать, ЧТО будет, если её не положить.

/** Пропсы `Workspace`: всё, что принимает целевой элемент, плюс `as`. */
export type WorkspaceProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

/**
 * Рабочая область — корень раскладки, ОДИН узел с адресом.
 *
 * @example
 * ```tsx
 * <Workspace>
 *   <WorkspaceSidebar>…</WorkspaceSidebar>
 *   <WorkspaceHeader>…</WorkspaceHeader>
 *   <WorkspaceMain>…</WorkspaceMain>
 *   <WorkspaceRightbar>…</WorkspaceRightbar>
 * </Workspace>
 * ```
 */
export const Workspace = slotAware(function Workspace<T extends ValidComponent = "div">(
  props: WorkspaceProps<T>,
) {
  traceLife("ui.workspace");

  const [address, rest] = useAddress(props, anatomyParts.root.attrs);

  return <Polymorphic as="div" {...rest} {...address} />;
});

/** Пропсы `WorkspaceHeader`. */
export type WorkspaceHeaderProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

/** Верхняя полоса — не на всю высоту, только над `main`/`rightbar`. */
export const WorkspaceHeader = slotAware(function WorkspaceHeader<T extends ValidComponent = "div">(
  props: WorkspaceHeaderProps<T>,
) {
  traceLife("ui.workspace-header");

  const [address, rest] = useAddress(props, anatomyParts.header.attrs);

  return <Polymorphic as="div" {...rest} {...address} />;
});

/** Пропсы `WorkspaceSidebar`. */
export type WorkspaceSidebarProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

/** Левая колонка — во всю высоту, рядом с шапкой и показом сразу. */
export const WorkspaceSidebar = slotAware(function WorkspaceSidebar<T extends ValidComponent = "div">(
  props: WorkspaceSidebarProps<T>,
) {
  traceLife("ui.workspace-sidebar");

  const [address, rest] = useAddress(props, anatomyParts.sidebar.attrs);

  return <Polymorphic as="div" {...rest} {...address} />;
});

/** Пропсы `WorkspaceMain`. */
export type WorkspaceMainProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

/** Показ — единственный слот, который есть всегда. */
export const WorkspaceMain = slotAware(function WorkspaceMain<T extends ValidComponent = "div">(
  props: WorkspaceMainProps<T>,
) {
  traceLife("ui.workspace-main");

  const [address, rest] = useAddress(props, anatomyParts.main.attrs);

  return <Polymorphic as="div" {...rest} {...address} />;
});

/** Пропсы `WorkspaceRightbar`. */
export type WorkspaceRightbarProps<T extends ValidComponent = "div"> = PolymorphicProps<T>;

/** Правая колонка — необязательна; не положена в разметку, колонка схлопывается сама. */
export const WorkspaceRightbar = slotAware(function WorkspaceRightbar<T extends ValidComponent = "div">(
  props: WorkspaceRightbarProps<T>,
) {
  traceLife("ui.workspace-rightbar");

  const [address, rest] = useAddress(props, anatomyParts.rightbar.attrs);

  return <Polymorphic as="div" {...rest} {...address} />;
});
