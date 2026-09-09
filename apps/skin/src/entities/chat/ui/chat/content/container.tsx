import {
  Flow,
  ScrollAreaContent,
  ScrollAreaRootProvider,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
  useScrollArea,
  FlowItem,
} from "@web-core/ui";

import { createEffect, For, untrack } from "solid-js";
import { layoutSelf } from "@web-core/skin";
import { messages } from "../../../model";
import { ChatItem } from "./item";

export function ChatContent() {
  const scrollArea = useScrollArea();

  createEffect(() => {
    messages();
    untrack(() =>
      scrollArea().scrollToEdge({ edge: "bottom", behavior: "smooth" }),
    );
  });

  return (
    <ScrollAreaRootProvider
      value={scrollArea}
      style={{ position: "relative", height: "20rem", overflow: "hidden" }}
    >
      <ScrollAreaViewport style={{ height: "100%" }}>
        <ScrollAreaContent>
          <Flow data-variant="column-center">
            <For each={messages()}>
              {(message) => (
                <FlowItem
                  style={layoutSelf({
                    align: "stretch",
                  })}
                >
                  <ChatItem message={message} />
                </FlowItem>
              )}
            </For>
          </Flow>
        </ScrollAreaContent>
      </ScrollAreaViewport>
      <ScrollAreaScrollbar
        orientation="vertical"
        style={{
          position: "absolute",
          top: "0",
          right: "0",
          bottom: "0",
          width: "0.5rem",
        }}
      >
        <ScrollAreaThumb style={{ width: "100%" }} />
      </ScrollAreaScrollbar>
    </ScrollAreaRootProvider>
  );
}
