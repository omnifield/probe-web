import { createMemo, For, type JSX } from "solid-js";
import {
  Surface,
  TabsContent,
  TabsList,
  type TabsProps,
  Tabs as TabsRoot,
  TabsTrigger,
} from "@web-core/ui";

export function NavigationTabs(props: {
  content: Record<string, () => JSX.Element>;
  value?: TabsProps["value"];
  defaultValue?: TabsProps["defaultValue"];
  onValueChange?: TabsProps["onValueChange"];
}) {
  const content = createMemo(() => props.content);
  const keys = createMemo(() => Object.keys(content()));

  return (
    <TabsRoot
      value={props.value}
      defaultValue={props.defaultValue ?? keys()[0]}
      onValueChange={props.onValueChange}
      unmountOnExit
    >
      <TabsList>
        <For each={keys()}>
          {(key) => <TabsTrigger value={key}>{key}</TabsTrigger>}
        </For>
      </TabsList>
      <For each={keys()}>
        {(key) => (
          <TabsContent value={key}>
            <Surface data-variant="filled">{content()[key]!()}</Surface>
          </TabsContent>
        )}
      </For>
    </TabsRoot>
  );
}
