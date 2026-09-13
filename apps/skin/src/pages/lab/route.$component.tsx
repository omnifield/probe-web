import { createFileRoute } from "@tanstack/solid-router";

import { LabPage } from "../pages/lab";

// Тот же приём, что у showcase-соседей (`_workspace.showcase.$component.index.tsx`): хук
// `useParams()` дёрнуть один раз при установке компонента, дальше `params()` — простой аксессор.
export const Route = createFileRoute("/_workspace/lab/$component")({
  component: () => {
    const params = Route.useParams();
    return <LabPage component={params().component} />;
  },
});
