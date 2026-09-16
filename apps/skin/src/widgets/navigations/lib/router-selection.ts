import { useRouteParamSelection } from "@web-core/router";
import type { TabsProps } from "@web-core/ui";

/** Склейка `NavigationTabs` с роутингом: активный вид — из `view` в параметрах текущего
 *  маршрута, выбор — переход по `to` с тем же именем параметра (остальные параметры маршрута,
 *  например `component`, сохраняются как есть). Виджет остаётся немым (`value`/`onValueChange`
 *  как сырые пропсы) — про роутер знает только этот адаптер, сама склейка `useParams`+
 *  `useNavigate` — в пакете (`useRouteParamSelection`). `defaultValue` — если вида ещё нет в
 *  адресе, хук сам его проставит (без записи в историю); уже выбранный вид не трогает. */
export function useRouterViewSelection(to: string, defaultValue?: string) {
  const selection = useRouteParamSelection("view", to, { defaultValue });

  return {
    get value() {
      return selection.value;
    },
    onValueChange(
      details: Parameters<NonNullable<TabsProps["onValueChange"]>>[0],
    ) {
      selection.select(details.value);
    },
  };
}
