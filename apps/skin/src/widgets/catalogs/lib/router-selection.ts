import { useRouteParamSelection } from "@web-core/router";

/** Склейка `CatalogTree` с роутингом: активный пункт — из `component` в параметрах текущего
 *  маршрута, выбор — переход по `to` с тем же именем параметра. Виджет каталога остаётся немым
 *  (`activeValue`/`onSelect` как сырые пропсы) — про роутер знает только этот адаптер, сама
 *  склейка `useParams`+`useNavigate` — в пакете (`useRouteParamSelection`). */
export function useRouterCatalogSelection(to: string) {
  const selection = useRouteParamSelection("component", to);

  return {
    get activeValue() {
      return selection.value;
    },
    onSelect: selection.select,
  };
}
