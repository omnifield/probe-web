// Поверхность зоны `ui` — примитивы поверх `@kobalte/core`.
//
// Вход ОДИН, подпутей нет. Причина не в лени: пакет объявляет `sideEffects: false` и ESM, а
// значит неиспользованный примитив выбрасывается сборщиком потребителя и без сегментации по
// подпутям. Подпути — это ещё и поверхность, каждая точка которой замерзает выпуском; заводим
// их, когда появится потребитель, которому корневого входа не хватило (`kb:PROBEWEB-4` —
// «не строить вперёд спроса»).
//
// Стилей отсюда не едет НИЧЕГО: у зоны нет CSS-артефакта, потому что нет и стилей по
// умолчанию. Оформление приезжает из `@omnifield/probe-web-style` и пишется потребителем.

export { Button, type ButtonProps } from "./button.jsx";
export {
  Field,
  FieldDescription,
  type FieldDescriptionProps,
  FieldError,
  type FieldErrorProps,
  type FieldProps,
  Input,
  type InputProps,
  Label,
  type LabelProps,
  Textarea,
  type TextareaProps,
} from "./field.jsx";
export {
  Select,
  SelectContent,
  type SelectContentComponentProps,
  SelectIcon,
  type SelectIconComponentProps,
  SelectItem,
  type SelectItemComponentProps,
  SelectItemIndicator,
  type SelectItemIndicatorComponentProps,
  SelectItemLabel,
  type SelectItemLabelComponentProps,
  SelectListbox,
  type SelectListboxComponentProps,
  SelectPortal,
  type SelectProps,
  SelectTrigger,
  type SelectTriggerComponentProps,
  SelectValue,
  type SelectValueComponentProps,
} from "./select.jsx";
export { Separator, type SeparatorProps } from "./separator.jsx";
export { Slot, type SlotProps } from "./slot.jsx";
export { Spinner, type SpinnerProps } from "./spinner.jsx";
export { Toggle, type ToggleProps } from "./toggle.jsx";
