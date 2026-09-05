import { Show, splitProps, type JSX } from "solid-js";
import {
  TreeViewBranchIndicator as ArkBranchIndicator,
  useTreeViewNodeContext,
} from "@ark-ui/solid/tree-view";

import { dropAddress } from "../../../shared/utils/slot-chain.js";
import { traceLife } from "../../../shared/utils/trace.js";
import { anatomyParts } from "../../entity/anatomy.js";
import { activeOverride, useTreeActiveValue } from "../root.js";

export type TreeControlIndicatorProps = JSX.HTMLAttributes<HTMLDivElement>;

export function TreeControlIndicator(props: TreeControlIndicatorProps) {
  traceLife("ui.tree-control-indicator");

  const [local, rest] = splitProps(props, ["children"]);
  const node = useTreeViewNodeContext();
  const activeValue = useTreeActiveValue();

  // Лист не раскрывается — индикатору тут нечего показывать (Ark сам не рисует ItemIndicator у
  // листа в своих примерах). ArkItemIndicator существует для другого сценария (чекмарка
  // выбранного пункта) — рисовать его ради стрелки раскрытия, которой у листа нет, значило бы
  // прятать лишний узел стилями вместо того, чтобы просто не класть его в разметку.
  return (
    <Show when={node().isBranch}>
      <ArkBranchIndicator
        {...dropAddress(rest)}
        {...anatomyParts.controlIndicator.attrs}
        {...activeOverride(activeValue(), node().value)}
      >
        {local.children}
      </ArkBranchIndicator>
    </Show>
  );
}
