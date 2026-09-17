import { CarouselItem } from "@web-core/ui";
import { For, Match, Switch } from "solid-js";
import type { ComponentDescriptor } from "#/entities/component";
import type { ViewMode } from "../../../model";
import { Assembly, Feed, Form, Style } from "../views";

export function Content(props: {
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
              <Form component={props.component} variant={variant} />
            </Match>
            <Match when={props.mode === "style"}>
              <Style component={props.component} variant={variant} />
            </Match>
            <Match when={props.mode === "assembly"}>
              <Assembly descriptor={props.descriptor} />
            </Match>
            <Match when={props.mode === "feed"}>
              <Feed />
            </Match>
          </Switch>
        </CarouselItem>
      )}
    </For>
  );
}
