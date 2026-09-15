import type { PathType } from "@web-core/io";
import { Field, FieldSelect } from "@web-core/ui";
import { For } from "solid-js";

const UNMAPPED = "";

/** Выбор ОДНОГО пути варианта А для одного поля Б — нативный `<select>` (`FieldSelect` из
 *  `@web-core/ui`), не Ark-UI `Select`: список путей может быть длинным и плоским, родного
 *  контрола достаточно, не нужна вся машинерия поповера ради одного значения. Пустая опция
 *  сверху — «убрать сведение», не запятая опция без выбора. */
export function FieldPicker(props: {
  fields: readonly PathType[];
  value: string | undefined;
  onChange: (path: string | undefined) => void;
}) {
  return (
    <Field>
      <FieldSelect
        value={props.value ?? UNMAPPED}
        onChange={(event) => {
          const next = event.currentTarget.value;
          props.onChange(next === UNMAPPED ? undefined : next);
        }}
      >
        <option value={UNMAPPED}>— не сведено —</option>
        <For each={props.fields}>
          {(field) => (
            <option value={field.path}>
              {field.path} ({field.type})
            </option>
          )}
        </For>
      </FieldSelect>
    </Field>
  );
}
