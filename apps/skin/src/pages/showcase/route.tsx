import { createFileRoute } from "@tanstack/solid-router";
import { Show } from "solid-js";

import { ShowcasePage } from "./index";

export const Route = createFileRoute("/_workspace/showcase/{-$component}")({
  component: () => {
    const params = Route.useParams();
    return (
      <Show when={params().component} fallback={<p>Выбери компонент слева.</p>}>
        <ShowcasePage />
      </Show>
    );
  },
});
