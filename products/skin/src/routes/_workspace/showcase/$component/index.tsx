import { createFileRoute } from "@tanstack/solid-router";

import { ComponentShowcasePage } from "../../../../pages/showcase/index.jsx";

export const Route = createFileRoute("/_workspace/showcase/$component/")({
  component: () => {
    // Хук — ОДИН РАЗ на установке компонента: `params` дальше просто читаемый аксессор. Раньше
    // весь вызов `Route.useParams()()` стоял прямо в JSX-пропе — Solid делает из такого пропа
    // геттер, и КАЖДОЕ чтение `props.component` внутри `ComponentShowcasePage` заново звало сам
    // хук (не просто аксессор), а не только читало значение. Слот `ComponentPreview` читает
    // `props.component` отдельно от `variants()` — двух чтений хватило поймать хук в момент,
    // когда его внутреннее состояние роутера ещё `null` (`Cannot read properties of null
    // (reading 'stores')`).
    const params = Route.useParams();
    return <ComponentShowcasePage component={params().component} />;
  },
});
