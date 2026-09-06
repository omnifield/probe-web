import { useAtom } from "@web-core/store";
import { createEffect, createMemo, For, Show } from "solid-js";

import {
  componentDataAtom,
  componentHandle,
  setCurrentComponent,
} from "#/entities/component";
import { Preview } from "#/widgets/component";

export function ShowcasePage(props: { component: string; assembly?: string }) {
  createEffect(() => setCurrentComponent(props.component));

  const data = useAtom(componentDataAtom);
  const component = componentHandle();
  const assemblies = createMemo(
    () => component.info()?.editorInfo?.assemblies ?? [],
  );
  const skin = createMemo(() => component.info()?.skin);

  // Сырой инфо-объект в консоль — типизированный ComponentSkinInfo мог отрезать поля, которых
  // ещё нет в типе (например tags на outfit'е), но которые уже реально лежат в записи службы.
  createEffect(() => console.log(component.info()));

  return (
    <For each={assemblies()}>
      {(assembly) => (
        <Preview
          component={props.component}
          assembly={assembly.name}
          data={data()}
        />
      )}
    </For>
  );
}
