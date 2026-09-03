import { createFileRoute } from "@tanstack/solid-router";

import { ShowcasePage } from "../../../../pages/showcase/index.jsx";

export const Route = createFileRoute("/_workspace/showcase/$component/$assembly")({
  component: () => {
    // Тот же приём, что у `index.tsx` соседом: хук `useParams()` дёрнуть один раз при установке,
    // дальше `params()` — простой аксессор.
    const params = Route.useParams();
    return (
      <ShowcasePage
        component={params().component}
        assembly={params().assembly}
      />
    );
  },
});
