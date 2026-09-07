import { componentEventsAtom } from "#/entities/component";
import { useAtom } from "@web-core/store";
import { Surface } from "@web-core/ui";

export function Output() {
  const events = useAtom(componentEventsAtom);

  // Сырой JSON — пока задел, настоящее дерево (tree-view) заведём отдельно.
  return (
    <Surface>
      ауа
      <pre>{JSON.stringify(events(), null, 2)}</pre>
    </Surface>
  );
}
