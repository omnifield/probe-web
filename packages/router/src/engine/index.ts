import { useNavigate, useParams } from "@tanstack/solid-router";
import { createEffect } from "solid-js";

export * from "@tanstack/solid-router";

export const defaultRouterOptions = {
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
} as const;

/** Читает `paramName` из параметров текущего маршрута, выбор — переход по `to` с тем же
 *  именем параметра (остальные параметры маршрута сохраняются как есть). Снимает дублирование
 *  одного и того же среза `useParams`+`useNavigate`, который иначе пишется заново в каждом
 *  виджете-адаптере. `options.defaultValue` — если параметр ещё не задан в адресе, хук сам
 *  подставляет его туда (`replace`, без записи в историю); заданный параметр не трогает —
 *  соседний селектор того же маршрута меняет свой сегмент, не задевая этот. */
export function useRouteParamSelection<Value extends string = string>(
  paramName: string,
  to: string,
  options?: { defaultValue?: Value },
) {
  const params = useParams({ strict: false }) as () => Record<string, Value | undefined>;
  const navigate = useNavigate();
  const defaultValue = options?.defaultValue;

  if (defaultValue !== undefined) {
    createEffect(() => {
      if (params()[paramName] === undefined) {
        void navigate({ to, params: { ...params(), [paramName]: defaultValue }, replace: true });
      }
    });
  }

  return {
    get value() {
      return params()[paramName] ?? defaultValue;
    },
    select(value: Value) {
      void navigate({ to, params: { ...params(), [paramName]: value } });
    },
  };
}
