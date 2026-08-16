import type { PolymorphicProps } from "@kobalte/core/polymorphic";
import {
  Content as KobalteContent,
  Indicator as KobalteIndicator,
  List as KobalteList,
  Root as KobalteTabs,
  type TabsContentProps,
  type TabsIndicatorProps,
  type TabsListProps,
  type TabsRootProps,
  type TabsTriggerProps,
  Trigger as KobalteTrigger,
} from "@kobalte/core/tabs";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Вкладки: разделы панели настроек, режимы просмотра, страницы формы.
//
// ## Пять частей, и у корня узел ЕСТЬ — в отличие от всплывающих
//
// Вкладки не всплывают и никуда не переносятся: это обычный кусок страницы. Поэтому корень
// здесь рендерит узел и несёт зацепку `tabs`, а портала нет вовсе.
//
// ## Полоска-указатель — часть, а не псевдоэлемент
//
// `TabsIndicator` существует потому, что положение активной вкладки знает только kobalte: он
// считает её размеры и пишет их в переменные CSS. Псевдоэлемент такого не умеет — ему пришлось
// бы знать ширину заранее, то есть запрещать вкладкам быть разной длины.
//
// Полоска необязательна: без неё активность видно по `[data-selected]` на самой вкладке.

/**
 * Пропсы `Tabs` — корня: выбранная вкладка, ориентация, способ активации.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type TabsProps<T extends ValidComponent = "div"> = PolymorphicProps<T, TabsRootProps<T>>;

/**
 * Корень вкладок — ОДИН узел плюс контекст для частей.
 *
 * Держит выбранное значение (`value` / `defaultValue` / `onChange`), `orientation` и
 * `activationMode`. Последнее — не косметика: `automatic` переключает вкладку сразу при
 * переходе стрелками, `manual` ждёт `Enter`. Для вкладок с тяжёлым содержимым верно второе.
 *
 * @example
 * ```tsx
 * <Tabs value={tab()} onChange={setTab}>
 *   <TabsList>
 *     <TabsTrigger value="вид">Вид</TabsTrigger>
 *     <TabsTrigger value="доступ">Доступ</TabsTrigger>
 *     <TabsIndicator />
 *   </TabsList>
 *   <TabsContent value="вид">…</TabsContent>
 *   <TabsContent value="доступ">…</TabsContent>
 * </Tabs>
 * ```
 */
export function Tabs<T extends ValidComponent = "div">(props: TabsProps<T>) {
  traceLife("ui.tabs");

  return <KobalteTabs data-slot="tabs" {...(props as TabsRootProps)} />;
}

/**
 * Пропсы `TabsList`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type TabsListComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  TabsListProps<T>
>;

/**
 * Полоса вкладок — ОДИН узел `[role=tablist]`.
 *
 * Отдельная часть, потому что оформляется она как единое целое (рамка снизу, фон, обводка), а
 * содержимое вкладок лежит СНАРУЖИ неё — в `TabsContent`.
 */
export function TabsList<T extends ValidComponent = "div">(props: TabsListComponentProps<T>) {
  traceLife("ui.tabs-list");

  return <KobalteList data-slot="tabs-list" {...(props as TabsListProps)} />;
}

/**
 * Пропсы `TabsTrigger`.
 *
 * @typeParam T — что рендерить. По умолчанию `button`.
 */
export type TabsTriggerComponentProps<T extends ValidComponent = "button"> = PolymorphicProps<
  T,
  TabsTriggerProps<T>
>;

/**
 * Сама вкладка — ОДИН узел `<button role="tab">`. Обязателен проп `value`.
 *
 * Активность приезжает атрибутом данных (`data-selected`), поэтому оформлению не нужен ни
 * класс, ни знание о том, какая вкладка выбрана.
 */
export function TabsTrigger<T extends ValidComponent = "button">(
  props: TabsTriggerComponentProps<T>,
) {
  traceLife("ui.tabs-trigger");

  return <KobalteTrigger data-slot="tabs-trigger" {...(props as TabsTriggerProps)} />;
}

/**
 * Пропсы `TabsIndicator`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type TabsIndicatorComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  TabsIndicatorProps<T>
>;

/**
 * Полоска под активной вкладкой — ОДИН узел.
 *
 * Несёт инлайновый стиль от kobalte: размеры и смещение активной вкладки. Это механика, а не
 * вид, — считает их он, а рисует (цвет, толщину, скорость перехода) оформление потребителя.
 */
export function TabsIndicator<T extends ValidComponent = "div">(
  props: TabsIndicatorComponentProps<T>,
) {
  traceLife("ui.tabs-indicator");

  return <KobalteIndicator data-slot="tabs-indicator" {...(props as TabsIndicatorProps)} />;
}

/**
 * Пропсы `TabsContent`.
 *
 * @typeParam T — что рендерить. По умолчанию `div`.
 */
export type TabsContentComponentProps<T extends ValidComponent = "div"> = PolymorphicProps<
  T,
  TabsContentProps<T>
>;

/**
 * Содержимое вкладки — ОДИН узел `[role=tabpanel]`. Обязателен проп `value`.
 *
 * По умолчанию неактивная панель из документа УДАЛЯЕТСЯ, а не прячется. Для оформления это
 * важнее, чем кажется: несуществующую панель нельзя ни анимировать, ни измерить. Нужно
 * сохранить состояние внутри (набранный текст, прокрутка) или сделать переход — `forceMount`,
 * и панель остаётся в документе.
 *
 * Связка с вкладкой односторонняя: вкладка называет панель через `aria-controls`, обратной
 * ссылки на панели у kobalte 0.13.12 нет. Панель при этом сама попадает в порядок обхода
 * (`tabindex="0"`) — иначе до её содержимого не дойти с клавиатуры, когда внутри нет ни
 * одного фокусируемого элемента.
 */
export function TabsContent<T extends ValidComponent = "div">(props: TabsContentComponentProps<T>) {
  traceLife("ui.tabs-content");

  return <KobalteContent data-slot="tabs-content" {...(props as TabsContentProps)} />;
}
