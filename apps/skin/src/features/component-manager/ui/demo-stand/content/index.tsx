import { CarouselItem } from "@web-core/ui";
import { For, Match, Switch } from "solid-js";
import type { ComponentDescriptor } from "#/entities/component";
import type { ViewMode } from "../../../model";
import { StandAssembly } from "./assembly";
import { StandFeed } from "./feed";
import { StandForm } from "./form";
import { StandStyle } from "./style";

export function StandContent(props: {
  component: string;
  descriptor: ComponentDescriptor;
  variants: readonly string[];
  mode: ViewMode;
}) {
  return (
    <For each={props.variants}>
      {(variant, index) => (
        <CarouselItem index={index()}>
          <Switch>
            <Match when={props.mode === "form"}>
              <StandForm component={props.component} variant={variant} />
            </Match>
            <Match when={props.mode === "style"}>
              <StandStyle component={props.component} variant={variant} />
            </Match>
            <Match when={props.mode === "assembly"}>
              <StandAssembly descriptor={props.descriptor} />
            </Match>
            <Match when={props.mode === "feed"}>
              <StandFeed />
            </Match>
          </Switch>
        </CarouselItem>
      )}
    </For>
  );
}
