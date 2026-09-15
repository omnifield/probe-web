import { useNavigate, useParams } from "@web-core/router";

/** Склейка `CatalogTree` с роутингом: активный пункт — из `component` в параметрах текущего
 *  маршрута, выбор — переход по `to` с тем же именем параметра. Виджет каталога остаётся немым
 *  (`activeValue`/`onSelect` как сырые пропсы) — про роутер знает только этот адаптер. */
export function useRouterCatalogSelection(to: string) {
  const params = useParams({ strict: false });
  const navigate = useNavigate();

  return {
    get activeValue() {
      return params().component;
    },
    onSelect(value: string) {
      void navigate({ to, params: { component: value } });
    },
  };
}
