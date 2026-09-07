import { createFileRoute } from "@tanstack/solid-router";

import { ShowcasePage } from "../pages/showcase";

export const Route = createFileRoute("/showcase/$component/$tag")({
  component: () => {
    // Тот же приём, что у `index.tsx` соседом: хук `useParams()` дёрнуть один раз при установке,
    // дальше `params()` — простой аксессор.
    const params = Route.useParams();
    return (
      <ShowcasePage
        component={params().component}
        tag={params().tag}
      />
    );
  },
});
