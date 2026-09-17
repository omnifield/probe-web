// см. README.md / FAQ.md

import {
  isContent,
  isDataBinding,
  isEventBinding,
  resolveDataBinding,
  resolveEventBinding,
  type AssemblyNode,
  type DispatchedEvent,
} from "../engine/tree.js";

const DOM_EVENT_PROP: Readonly<Record<string, string>> = {
  click: "onClick",
  change: "onChange",
  input: "onInput",
  submit: "onSubmit",
};

/** `bind` узла (имя пропа → путь в данных) в готовые значения — путь без значения не кладётся
 * пропом вовсе (`undefined` — не «нет данных», а «пропа нет»), чтобы не перебивать дефолт кита. */
export function resolveBind(
  bind: Readonly<Record<string, string>> | undefined,
  data: unknown,
): Record<string, unknown> | undefined {
  return bind
    ? Object.fromEntries(
        Object.entries(bind)
          .map(([name, path]) => [name, resolveDataBinding(data, path)] as const)
          .filter(([, value]) => value !== undefined),
      )
    : undefined;
}

/** `on` узла в DOM-обработчики — только известные `DOM_EVENT_PROP`, остальные молча пропускаются
 * (не ошибка: адресат неизвестного домового события просто не назначается). Каждый обработчик
 * принимает живое DOM-событие и резолвит свой `context` — литерал как есть, `DataBinding` из
 * данных показа, `EventBinding` с самого этого события — ПЕРЕД тем, как уйти наружу через
 * `dispatch`: тот, кто слушает `DispatchedEvent`, получает готовый JSON, не сырой DOM `Event`. */
export function dispatchHandlersFor(
  current: AssemblyNode | undefined,
  data: unknown,
  dispatch: ((event: DispatchedEvent) => void) | undefined,
): Record<string, (domEvent: Event) => void> {
  if (!current || isContent(current) || !current.on) return {};

  return Object.fromEntries(
    Object.entries(current.on).flatMap(([domEvent, action]) => {
      const propName = DOM_EVENT_PROP[domEvent];
      if (!propName) return [];

      return [
        [
          propName,
          (nativeEvent: Event) => {
            const context = Object.fromEntries(
              Object.entries(action.event.context ?? {})
                .map(([key, value]) => [
                  key,
                  isDataBinding(value)
                    ? resolveDataBinding(data, value.path)
                    : isEventBinding(value)
                      ? resolveEventBinding(nativeEvent, value.event)
                      : value,
                ] as const)
                .filter(([, value]) => value !== undefined),
            );

            dispatch?.({
              name: action.event.name,
              nodeId: current.id,
              address: current.type,
              timestamp: new Date().toISOString(),
              context,
            });
          },
        ],
      ];
    }),
  );
}

/** Пропы, с которыми узел реально рисуется — свои литералы, резолвленный `bind`, обработчики
 * `on`, и `rootProps` ПОСЛЕДНИМ (только у корня непусто — живое состояние показа перебивает
 * объявленное дерево, а не наоборот). Не-content узел без пропов/байндинга/событий — пустой
 * объект, законное рабочее состояние. */
export function ownPropsFor(
  current: AssemblyNode | undefined,
  data: unknown,
  dispatch: ((event: DispatchedEvent) => void) | undefined,
  rootProps: Readonly<Record<string, unknown>> | undefined,
): Record<string, unknown> {
  if (!current || isContent(current)) return {};

  return {
    ...current.props,
    ...resolveBind(current.bind, data),
    ...dispatchHandlersFor(current, data, dispatch),
    ...rootProps,
  };
}

/** Данные для self-assembly-поддерева — пропы+`bind` узла-ссылки, БЕЗ `on`/`rootProps` (те не
 * данные показа, а связь наружу/состояние показа этого конкретного узла, вложенному дереву они
 * не принадлежат). */
export function innerDataFor(
  current: AssemblyNode | undefined,
  data: unknown,
): Record<string, unknown> | undefined {
  if (!current || isContent(current)) return undefined;
  return { ...current.props, ...resolveBind(current.bind, data) };
}
