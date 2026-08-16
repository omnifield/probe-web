/**
 * Что зона обещает наружу — ЯВНЫМ перечнем.
 *
 * Список выписан руками, а не снят с модуля: снятый с модуля перечень подтверждает сам
 * себя, и внутренний хелпер, случайно уехавший наружу, прошёл бы незамеченным. Меняется
 * этот файл — значит меняется поверхность пакета, и это решение, а не правка.
 *
 * Живёт отдельно, потому что сверяют его ДВА прогона в разных мирах: браузерный смотрит на
 * исходник, сборочный — на обе ветки тарбола. Второй копии списка в пакете нет.
 */
export const EXPECTED_SURFACE = [
  "Button",
  "Checkbox",
  "CheckboxControl",
  "CheckboxDescription",
  "CheckboxError",
  "CheckboxIndicator",
  "CheckboxInput",
  "CheckboxLabel",
  "Field",
  "FieldDescription",
  "FieldError",
  "Input",
  "Label",
  "RadioGroup",
  "RadioGroupDescription",
  "RadioGroupError",
  "RadioGroupItem",
  "RadioGroupItemControl",
  "RadioGroupItemDescription",
  "RadioGroupItemIndicator",
  "RadioGroupItemInput",
  "RadioGroupItemLabel",
  "RadioGroupLabel",
  "Select",
  "SelectContent",
  "SelectIcon",
  "SelectItem",
  "SelectItemIndicator",
  "SelectItemLabel",
  "SelectListbox",
  "SelectPortal",
  "SelectTrigger",
  "SelectValue",
  "Separator",
  "Slot",
  "Spinner",
  "Switch",
  "SwitchControl",
  "SwitchDescription",
  "SwitchError",
  "SwitchInput",
  "SwitchLabel",
  "SwitchThumb",
  "Textarea",
  "Toggle",
];
