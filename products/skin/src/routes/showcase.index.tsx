import { createFileRoute } from "@tanstack/solid-router";

// Без выбранного компонента показывать нечего — `ShowcasePage` (`pages/showcase/index.tsx`)
// требует его имя параметром.
export const Route = createFileRoute("/showcase/")({
  component: () => <p>Выбери компонент слева.</p>,
});
