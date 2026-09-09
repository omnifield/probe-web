// Тип разрешённой иконки — одно объявление на два места: его держит словарь (`catalog.ts`,
// тип элемента карты) и читает `components/root.tsx`.
//
// Форма — обычный Solid-компонент, принимающий атрибуты `<svg>`: наружу кита едет настоящий
// `<svg>`, а не обёртка конкретной библиотеки, поэтому и тип здесь свой, не импортированный
// из `lucide-solid`.
import type { Component, JSX } from "solid-js";

export type ResolvedIcon = Component<JSX.SvgSVGAttributes<SVGSVGElement>>;

/** Ленивая загрузка одной иконки — ровно то, что лежит значением в словаре. */
export type IconLoader = () => Promise<{ readonly default: ResolvedIcon }>;
