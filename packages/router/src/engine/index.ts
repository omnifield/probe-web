import { useNavigate, useParams } from "@tanstack/solid-router";

export * from "@tanstack/solid-router";

export const defaultRouterOptions = {
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
} as const;

/** Читает `paramName` из параметров текущего маршрута, выбор — переход по `to` с тем же
 *  именем параметра (остальные параметры маршрута сохраняются как есть). Снимает дублирование
 *  одного и того же среза `useParams`+`useNavigate`, который иначе пишется заново в каждом
 *  виджете-адаптере. */
export function useRouteParamSelection<Value extends string = string>(
  paramName: string,
  to: string,
) {
  const params = useParams({ strict: false }) as () => Record<string, Value | undefined>;
  const navigate = useNavigate();

  return {
    get value() {
      return params()[paramName];
    },
    select(value: Value) {
      void navigate({ to, params: { ...params(), [paramName]: value } });
    },
  };
}
