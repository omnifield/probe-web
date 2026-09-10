import {
  Accordion,
  AccordionContent,
  AccordionControl,
  AccordionControlIndicator,
  AccordionItem,
  Button,
  Checkbox,
  CheckboxControl,
  CheckboxIndicator,
  CheckboxLabel,
  Field,
  FieldInput,
  FieldLabel,
  Flow,
  FlowItem,
  Select,
  SelectContent,
  SelectControl,
  SelectHiddenSelect,
  SelectIndicator,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPositioner,
  SelectTrigger,
  SelectValueText,
  Typography,
} from "@web-core/ui";
import { layoutSelf } from "@web-core/skin";
import { createMemo, For, Index, Match, Switch } from "solid-js";

import { blankElement, fieldsOfElement, valueAt, withValue, type FieldDescriptor, type FieldPath } from "./schema";

interface DataFieldProps {
  readonly field: FieldDescriptor;
  readonly value: unknown;
  readonly onChange: (value: unknown) => void;
}

function BooleanField(props: DataFieldProps) {
  return (
    <Checkbox checked={props.value === true} onCheckedChange={(details) => props.onChange(details.checked)}>
      <CheckboxControl>
        <CheckboxIndicator>✓</CheckboxIndicator>
      </CheckboxControl>
      <CheckboxLabel>{props.field.label}</CheckboxLabel>
    </Checkbox>
  );
}

function EnumField(props: DataFieldProps) {
  const options = createMemo(() => (props.field.options ?? []).map((value) => ({ value, label: value })));
  const current = createMemo(() => (typeof props.value === "string" ? [props.value] : []));

  return (
    <Field>
      <FieldLabel>{props.field.label}</FieldLabel>
      <Select items={options()} value={current()} onValueChange={(details) => props.onChange(details.value[0])}>
        <SelectControl>
          <SelectTrigger>
            <SelectValueText placeholder="—" />
          </SelectTrigger>
          <SelectIndicator>▾</SelectIndicator>
        </SelectControl>
        <SelectPositioner>
          <SelectContent>
            <For each={options()}>
              {(item) => (
                <SelectItem item={item}>
                  <SelectItemText>{item.label}</SelectItemText>
                  <SelectItemIndicator>✓</SelectItemIndicator>
                </SelectItem>
              )}
            </For>
          </SelectContent>
        </SelectPositioner>
        <SelectHiddenSelect />
      </Select>
    </Field>
  );
}

function ScalarField(props: DataFieldProps) {
  const isNumber = () => props.field.kind === "number";
  const text = createMemo(() => (props.value === undefined || props.value === null ? "" : String(props.value)));

  return (
    <Field>
      <FieldLabel>{props.field.label}</FieldLabel>
      <FieldInput
        type={isNumber() ? "number" : "text"}
        value={text()}
        onInput={(event) => {
          const raw = event.currentTarget.value;
          props.onChange(isNumber() ? (raw === "" ? undefined : Number(raw)) : raw);
        }}
      />
    </Field>
  );
}

/** Заголовок раскрывашки — `label` элемента (канонический `item` кита его несёт), нет строки или
 *  она пустая (произвольный массив объектов, свой `label` не обязан быть) — порядковый номер. */
function headingOf(item: unknown, index: number, fieldLabel: string): string {
  const label = item !== null && typeof item === "object" ? (item as Record<string, unknown>)["label"] : undefined;
  return typeof label === "string" && label !== "" ? label : `${fieldLabel} ${index + 1}`;
}

/** Список элементов-объектов (канонический `item` кита — `value`/`label`/`children?` — и любой
 *  другой массив объектов) — аккордеон, раскрывашка на элемент, поля настроек внутри неё.
 *  Добавление/удаление целиком заменяют массив, порядок не меняется (реордер — отдельный заход,
 *  `input-nested-fields-engine`). Каждый элемент — своя вложенная `DataFields` (та же форма, что и
 *  у записи верхнего уровня): если у элемента тоже есть поле-список (`children`), внутри окажется
 *  свой `ListField` — рекурсия идёт по РЕАЛЬНЫМ данным, не по схеме (та рекурсивна всегда через
 *  `z.lazy`, глубже, чем кто-либо реально вложит).
 *
 *  `<Index>`, не `<For>` — правка одного поля идёт иммутабельно (`withValue` копирует узел на
 *  пути), значит у отредактированной строки на каждый символ новая ссылка. `<For>` ключует по
 *  ссылке на значение — увидел бы «другой» элемент на той же позиции и пересобирал DOM строки
 *  целиком (инпут внутри терял фокус на каждый символ). `<Index>` ключует по позиции — элемент
 *  внутри читается через аксессор (`item()`), сама строка DOM (и раскрытость раскрывашки) остаётся
 *  на месте. `value` раскрывашки — сам индекс: свой лицевой id элементы не несут. */
function ListField(props: DataFieldProps) {
  const element = () => {
    if (props.field.element === undefined) throw new Error(`поле "${props.field.label}": kind=list без element`);
    return props.field.element;
  };
  const items = createMemo(() => (Array.isArray(props.value) ? props.value : []));

  const removeAt = (index: number) => props.onChange(items().filter((_, i) => i !== index));
  const add = () => props.onChange([...items(), blankElement(element())]);

  return (
    <Flow data-variant="column-center">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Typography>{props.field.label}</Typography>
      </FlowItem>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Accordion multiple collapsible>
          <Index each={items()}>
            {(item, index) => (
              <AccordionItem value={String(index)}>
                <AccordionControl>
                  <Typography>{headingOf(item(), index, props.field.label)}</Typography>
                  <AccordionControlIndicator>▾</AccordionControlIndicator>
                </AccordionControl>
                <AccordionContent>
                  <Flow data-variant="column-center">
                    <FlowItem style={layoutSelf({ align: "stretch" })}>
                      <DataFields
                        fields={fieldsOfElement(element())}
                        data={item()}
                        onChange={(subpath, value) => {
                          props.onChange(items().map((row, i) => (i === index ? withValue(row, subpath, value) : row)));
                        }}
                      />
                    </FlowItem>
                    <FlowItem style={layoutSelf({ align: "stretch" })}>
                      <Button onClick={() => removeAt(index)}>Удалить</Button>
                    </FlowItem>
                  </Flow>
                </AccordionContent>
              </AccordionItem>
            )}
          </Index>
        </Accordion>
      </FlowItem>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Button onClick={add}>Добавить</Button>
      </FlowItem>
    </Flow>
  );
}

/** Один контрол на `kind` — виды перечислены полностью (`fieldsOf` других не порождает), обёртки
 *  "на всякий случай" не нужно. `Switch`/`Match`, не if/early-return: `field.kind` — проп, значит
 *  реактивный, а Solid-компонент выполняется один раз (см. `solid/components-return-once`). */
function DataField(props: DataFieldProps) {
  return (
    <Switch fallback={<ScalarField {...props} />}>
      <Match when={props.field.kind === "boolean"}>
        <BooleanField {...props} />
      </Match>
      <Match when={props.field.kind === "enum"}>
        <EnumField {...props} />
      </Match>
      <Match when={props.field.kind === "list"}>
        <ListField {...props} />
      </Match>
    </Switch>
  );
}

export interface DataFieldsProps {
  readonly fields: readonly FieldDescriptor[];
  readonly data: unknown;
  readonly onChange: (path: FieldPath, value: unknown) => void;
}

/** Форма по io-схеме выбранного набора данных, поле за полем — точечная правка вместо замены
 *  набора целиком (`input-widget-real-ui`). Список полей и их виды считает `schema.ts`, этот файл
 *  только рисует контрол по `kind` и поднимает правку наверх путём. */
export function DataFields(props: DataFieldsProps) {
  return (
    <Flow data-variant="column-center">
      <For each={props.fields}>
        {(field) => (
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <DataField field={field} value={valueAt(props.data, field.path)} onChange={(value) => props.onChange(field.path, value)} />
          </FlowItem>
        )}
      </For>
    </Flow>
  );
}
