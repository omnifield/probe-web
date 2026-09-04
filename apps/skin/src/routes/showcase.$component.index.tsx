import { createFileRoute } from "@tanstack/solid-router";

import { ShowcasePage } from "../pages/showcase/index.jsx";

export const Route = createFileRoute("/showcase/$component/")({
  component: () => {
    // Хук — ОДИН РАЗ на установке компонента: `params` дальше просто читаемый аксессор. Раньше
    // весь вызов `Route.useParams()()` стоял прямо в JSX-пропе — Solid делает из такого пропа
    // геттер, и КАЖДОЕ чтение `props.component` внутри `ShowcasePage` заново звало сам хук (не
    // просто аксессор), а не только читало значение.
    const params = Route.useParams();
    return <ShowcasePage component={params().component} />;
  },
});
