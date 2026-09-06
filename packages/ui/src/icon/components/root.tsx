import { createResource, Show, splitProps, type Component, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export interface IconProps {
  /** Имя иконки — свободная строка, не завязана на то, как её называет конкретная библиотека. */
  readonly name: string;
}

type ResolvedIcon = Component<JSX.SvgSVGAttributes<SVGSVGElement>>;

/**
 * Резолв имени в реальный компонент — единственное место, которое знает про lucide. Смена
 * библиотеки иконок меняет только эту функцию, не проп `name` наружу.
 */
async function resolveIcon(name: string): Promise<ResolvedIcon> {
  const mod = (await import(`lucide-solid/icons/${name}`)) as { default: ResolvedIcon };
  return mod.default;
}

export function Icon(props: IconProps) {
  traceLife("ui.icon");

  const [local] = splitProps(dropAddress(props), ["name"]);
  const [resolved] = createResource(() => local.name, resolveIcon);

  return (
    <Show when={resolved()}>
      {(Loaded) => <Dynamic component={Loaded()} {...anatomyParts.root.attrs} />}
    </Show>
  );
}
