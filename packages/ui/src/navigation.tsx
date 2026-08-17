import {
  type BreadcrumbsLinkProps,
  type BreadcrumbsRootProps,
  type BreadcrumbsSeparatorProps,
  Link as KobalteBreadcrumbsLink,
  Root as KobalteBreadcrumbs,
  Separator as KobalteBreadcrumbsSeparator,
} from "@kobalte/core/breadcrumbs";
import {
  type ImageFallbackProps,
  type ImageImgProps,
  type ImageRootProps,
  Fallback as KobalteImageFallback,
  Img as KobalteImg,
  Root as KobalteImage,
} from "@kobalte/core/image";
import { type LinkRootProps, Root as KobalteLink } from "@kobalte/core/link";
import { Polymorphic, type PolymorphicProps } from "@kobalte/core/polymorphic";
import type { ValidComponent } from "solid-js";

import { traceLife } from "./trace.js";

// Ссылка, хлебные крошки и картинка — три мелких примитива в одном файле.
//
// Вместе они здесь потому, что каждый по отдельности слишком мал для своего файла, а общего у
// них ровно одно: все трое существуют не ради вида, а ради состояния, которого у нативного
// элемента нет.
//
//   • `<a>` не умеет сказать «я отключена» — атрибута `disabled` у ссылки не существует;
//   • `<img>` не умеет сказать «я ещё гружусь» или «я не загрузилась»;
//   • хлебные крошки это не список ссылок, а объявленная навигация с текущей страницей.

/**
 * Пропсы `Link`.
 *
 * @typeParam T — что рендерить. По умолчанию `a`.
 */
export type LinkProps<T extends ValidComponent = "a"> = PolymorphicProps<T, LinkRootProps<T>>;

/**
 * Ссылка — ОДИН узел `<a>`.
 *
 * Смысл обёртки один: `disabled`. У нативной ссылки такого атрибута нет, и «отключённая»
 * ссылка на практике либо остаётся кликабельной, либо превращается в `<span>` и теряет фокус.
 * Здесь kobalte снимает `href`, ставит `data-disabled` и `aria-disabled` — узел остаётся тем
 * же, поведение честным.
 */
export function Link<T extends ValidComponent = "a">(props: LinkProps<T>) {
  traceLife("ui.link");

  return <KobalteLink data-slot="link" {...(props as LinkRootProps)} />;
}

/**
 * Пропсы `Breadcrumbs`.
 *
 * @typeParam T — что рендерить. По умолчанию `nav`.
 */
export type BreadcrumbsProps<T extends ValidComponent = "nav"> = PolymorphicProps<
  T,
  BreadcrumbsRootProps<T>
>;

/**
 * Хлебные крошки — ОДИН узел `<nav aria-label>`; список внутри собирает потребитель.
 *
 * Разделитель приходит пропом `separator` корня и рисуется частью `BreadcrumbsSeparator`.
 *
 * @example
 * ```tsx
 * <Breadcrumbs>
 *   <BreadcrumbsList>
 *     <BreadcrumbsItem>
 *       <BreadcrumbsLink href="/">Главная</BreadcrumbsLink>
 *       <BreadcrumbsSeparator />
 *     </BreadcrumbsItem>
 *     <BreadcrumbsItem>
 *       <BreadcrumbsLink current>Отчёт</BreadcrumbsLink>
 *     </BreadcrumbsItem>
 *   </BreadcrumbsList>
 * </Breadcrumbs>
 * ```
 */
export function Breadcrumbs<T extends ValidComponent = "nav">(props: BreadcrumbsProps<T>) {
  traceLife("ui.breadcrumbs");

  return <KobalteBreadcrumbs data-slot="breadcrumbs" {...(props as BreadcrumbsRootProps)} />;
}

/**
 * Пропсы `BreadcrumbsList`.
 *
 * @typeParam T — что рендерить. По умолчанию `ol`.
 */
export type BreadcrumbsListProps<T extends ValidComponent = "ol"> = PolymorphicProps<T>;

/**
 * Список крошек — ОДИН узел `<ol>`. **НАША часть, у kobalte её нет:** он рендерит только
 * `<nav>` и оставляет список потребителю.
 *
 * Пока списка не было, оформление цеплялось за прямого ребёнка корня (`[data-slot=…] > *`) —
 * то есть за структуру, которую мы вправе поменять молча. Теперь у него есть имя.
 *
 * Порядковый список, а не `<ul>`: путь это последовательность, и вспомогательная техника
 * читает её по порядку. Поведения часть не несёт — только зацепку и семантику тега.
 */
export function BreadcrumbsList<T extends ValidComponent = "ol">(props: BreadcrumbsListProps<T>) {
  traceLife("ui.breadcrumbs-list");

  return <Polymorphic as="ol" data-slot="breadcrumbs-list" {...props} />;
}

/**
 * Пропсы `BreadcrumbsItem`.
 *
 * @typeParam T — что рендерить. По умолчанию `li`.
 */
export type BreadcrumbsItemProps<T extends ValidComponent = "li"> = PolymorphicProps<T>;

/**
 * Одна крошка — ОДИН узел `<li>`, тоже наша часть.
 *
 * Внутрь кладут ссылку и разделитель. Отдельной зацепкой, а не тегом `li` в селекторе: тег
 * это структура, а зацепка — обещание.
 */
export function BreadcrumbsItem<T extends ValidComponent = "li">(props: BreadcrumbsItemProps<T>) {
  traceLife("ui.breadcrumbs-item");

  return <Polymorphic as="li" data-slot="breadcrumbs-item" {...props} />;
}

/**
 * Пропсы `BreadcrumbsLink`.
 *
 * @typeParam T — что рендерить. По умолчанию `a`.
 */
export type BreadcrumbsLinkComponentProps<T extends ValidComponent = "a"> = PolymorphicProps<
  T,
  BreadcrumbsLinkProps<T>
>;

/**
 * Ссылка крошки — ОДИН узел.
 *
 * `current` — не оформление: с ним kobalte ставит `aria-current="page"` и убирает `href`,
 * потому что ссылка на страницу, где ты уже стоишь, ведёт в никуда.
 */
export function BreadcrumbsLink<T extends ValidComponent = "a">(
  props: BreadcrumbsLinkComponentProps<T>,
) {
  traceLife("ui.breadcrumbs-link");

  return (
    <KobalteBreadcrumbsLink data-slot="breadcrumbs-link" {...(props as BreadcrumbsLinkProps)} />
  );
}

/**
 * Пропсы `BreadcrumbsSeparator`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type BreadcrumbsSeparatorComponentProps<T extends ValidComponent = "span"> =
  PolymorphicProps<T, BreadcrumbsSeparatorProps<T>>;

/** Разделитель крошек — ОДИН узел `<span aria-hidden>`; знак задаётся на корне. */
export function BreadcrumbsSeparator<T extends ValidComponent = "span">(
  props: BreadcrumbsSeparatorComponentProps<T>,
) {
  traceLife("ui.breadcrumbs-separator");

  return (
    <KobalteBreadcrumbsSeparator
      data-slot="breadcrumbs-separator"
      {...(props as BreadcrumbsSeparatorProps)}
    />
  );
}

/**
 * Пропсы `Image` — корня.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type ImageProps<T extends ValidComponent = "span"> = PolymorphicProps<
  T,
  ImageRootProps<T>
>;

/**
 * Корень картинки — ОДИН узел `<span>` плюс контекст.
 *
 * Он и решает, что показать: сама картинка появляется, только когда БРАУЗЕР её загрузил, а до
 * того (и при ошибке) стоит заглушка. Без этого аватарка мигает битым значком на каждой
 * медленной сети.
 *
 * `fallbackDelay` — задержка перед показом заглушки: на быстрой сети мелькание заглушки хуже,
 * чем её отсутствие.
 *
 * @example
 * ```tsx
 * <Image fallbackDelay={300}>
 *   <ImageImg src={user.avatar} alt={user.name} />
 *   <ImageFallback>{initials(user.name)}</ImageFallback>
 * </Image>
 * ```
 */
export function Image<T extends ValidComponent = "span">(props: ImageProps<T>) {
  traceLife("ui.image");

  return <KobalteImage data-slot="image" {...(props as ImageRootProps)} />;
}

/**
 * Пропсы `ImageImg`.
 *
 * @typeParam T — что рендерить. По умолчанию `img`.
 */
export type ImageImgComponentProps<T extends ValidComponent = "img"> = PolymorphicProps<
  T,
  ImageImgProps<T>
>;

/** Сама картинка — ОДИН узел `<img>`, появляющийся только после успешной загрузки. */
export function ImageImg<T extends ValidComponent = "img">(props: ImageImgComponentProps<T>) {
  traceLife("ui.image-img");

  return <KobalteImg data-slot="image-img" {...(props as ImageImgProps)} />;
}

/**
 * Пропсы `ImageFallback`.
 *
 * @typeParam T — что рендерить. По умолчанию `span`.
 */
export type ImageFallbackComponentProps<T extends ValidComponent = "span"> = PolymorphicProps<
  T,
  ImageFallbackProps<T>
>;

/** Заглушка — ОДИН узел; показывается, пока картинки нет или она не загрузилась. */
export function ImageFallback<T extends ValidComponent = "span">(
  props: ImageFallbackComponentProps<T>,
) {
  traceLife("ui.image-fallback");

  return <KobalteImageFallback data-slot="image-fallback" {...(props as ImageFallbackProps)} />;
}
