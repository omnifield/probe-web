import { createFileRoute } from "@tanstack/solid-router";

// Без выбранного компонента показывать нечего — `ShowcasePage`
// (`pages/_workspace/showcase/index.tsx`) требует его имя параметром.
export const Route = createFileRoute("/_workspace/showcase/")({
  component: () => <p>Выбери компонент слева.</p>,
});
