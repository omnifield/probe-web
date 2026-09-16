import {
  Flow,
  FlowItem,
  Select,
  SelectContent,
  SelectControl,
  SelectHiddenSelect,
  SelectIndicator,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPositioner,
  SelectTrigger,
  SelectValueText,
} from "@web-core/ui";
import { layoutGroup } from "@web-core/skin";
import { createMemo, createSignal, ErrorBoundary, For, Show } from "solid-js";

import { Renderer } from "#/shared/ui/renderer";

import { EXAMPLES } from "./examples";

export function PlaygroundPage() {
  const [selected, setSelected] = createSignal(EXAMPLES[0]?.value);
  const example = createMemo(() => EXAMPLES.find((item) => item.value === selected()));

  return (
    <Flow style={layoutGroup({ direction: "column", gap: "space-4" })}>
      <FlowItem>
        <Select
          items={[...EXAMPLES]}
          value={selected() === undefined ? [] : [selected()!]}
          onValueChange={(details) => setSelected(details.value[0])}
        >
          <SelectControl>
            <SelectTrigger>
              <SelectValueText placeholder="Выбрать пример" />
            </SelectTrigger>
            <SelectIndicator>▾</SelectIndicator>
          </SelectControl>
          <SelectPositioner>
            <SelectContent>
              <For each={EXAMPLES}>
                {(item) => (
                  <SelectItem item={item}>
                    <SelectItemText>{item.label}</SelectItemText>
                    <SelectItemIndicator>✓</SelectItemIndicator>
                  </SelectItem>
                )}
              </For>
            </SelectContent>
          </SelectPositioner>
          <SelectHiddenSelect />
        </Select>
      </FlowItem>
      <FlowItem>
        {/* `keyed` — на смену примера дерево и ErrorBoundary создаются заново: упавшая сборка
            не залипает ошибкой, когда переключились на соседнюю. */}
        <Show when={example()} keyed>
          {(current) => (
            <ErrorBoundary fallback={(error: unknown) => <pre>{String(error)}</pre>}>
              <Renderer composition={current.composition} />
            </ErrorBoundary>
          )}
        </Show>
      </FlowItem>
    </Flow>
  );
}
