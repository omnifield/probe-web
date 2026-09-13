// ШАПКА ВИТРИНЫ — переключатель экрана (showcase/lab/playground) и переключатель темы. Содержимое
// `WorkspaceHeader`, не сам слот: раскладку (флекс, отступы) держит страница (`pages/index.tsx`).
import {
  SegmentGroup,
  SegmentGroupIndicator,
  SegmentGroupItem,
  SegmentGroupItemControl,
  SegmentGroupItemText,
  FlowItem,
  Flow,
} from "@web-core/ui";
import { layoutGroup } from "@web-core/skin";
import { useLocation, useNavigate, useParams } from "@web-core/router";
import { createMemo, For } from "solid-js";

import { ThemeSwitch } from "#/shared/ui/theme-switch";
import { Auth } from "#/entities/user";

const SCREENS = [
  { value: "lab", label: "Lab", to: "/lab/{-$component}", prefix: "/lab" },
  { value: "showcase", label: "Showcase", to: "/showcase/{-$component}", prefix: "/showcase" },
  { value: "playground", label: "Playground", to: "/playground", prefix: "/playground" },
] as const;

export function Header() {
  const pathname = useLocation({ select: (location) => location.pathname });
  // `strict: false` — тот же приём, что у `CatalogTree`'s `activeValue`: `$component` объявлен то у
  // showcase, то у lab, читаем его независимо от того, в каком из двух сейчас находимся.
  const component = useParams({
    strict: false,
    select: (params) => params.component,
  });
  const navigate = useNavigate();

  const screen = createMemo(
    () =>
      SCREENS.find((item) => pathname().startsWith(item.prefix))?.value ??
      "showcase",
  );

  // Переключение showcase↔lab несёт имя ТЕКУЩЕГО компонента дальше (ТЗ user: "чтобы при переходе
  // осталось название компонента") — обе стороны используют путь с опциональным `{-$component}`.
  // Playground компонент не выбирает, ему параметр нести некуда — идёт голым путём, как раньше.
  const onValueChange = (details: { value: string | null }) => {
    const target = SCREENS.find((screen) => screen.value === details.value);
    if (!target) return;

    const active = component();
    if (
      active !== undefined &&
      (target.value === "lab" || target.value === "showcase")
    ) {
      void navigate({ to: target.to, params: { component: active } });
      return;
    }

    void navigate({ to: target.to });
  };

  return (
    <Flow style={layoutGroup({ justify: "space-between" })}>
      <FlowItem>LOGO</FlowItem>
      <FlowItem>
        <SegmentGroup
          value={screen()}
          onValueChange={onValueChange}
          orientation="horizontal"
        >
          <SegmentGroupIndicator />
          <For each={SCREENS}>
            {(item) => (
              <SegmentGroupItem value={item.value}>
                <SegmentGroupItemControl />
                <SegmentGroupItemText>{item.label}</SegmentGroupItemText>
              </SegmentGroupItem>
            )}
          </For>
        </SegmentGroup>
      </FlowItem>
      <FlowItem>
        <Flow>
          {/* <ThemeSwitch /> */}
          <Auth />
        </Flow>
      </FlowItem>
    </Flow>
  );
}
