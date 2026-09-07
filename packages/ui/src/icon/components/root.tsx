import { createResource, Show, splitProps, type Component, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";

export interface IconProps {
  readonly name: string;
}

type ResolvedIcon = Component<JSX.SvgSVGAttributes<SVGSVGElement>>;

const modules = import.meta.glob<{ default: ResolvedIcon }>(
  "../../../node_modules/lucide-solid/dist/esm/icons/*.mjs",
);

async function resolveIcon(name: string): Promise<ResolvedIcon> {
  const load = modules[`../../../node_modules/lucide-solid/dist/esm/icons/${name}.mjs`];
  if (!load) throw new Error(`unknown icon "${name}"`);

  const mod = await load();
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
