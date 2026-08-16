/**
 * ОБЯЗАТЕЛЬСТВО зоны: имена зацепок `data-slot`, за которые цепляется чужое оформление.
 *
 * Это не перечень «что сейчас в коде», а обещание потребителю (`kb:PROBEWEB-4`, раздел про
 * `data-slot`; решение — `kb:PROBEWEB-12`, пункт 7): **имя из этого списка не меняется и не
 * исчезает без мажорного поднятия версии.** Добавить новое имя можно минором — тех, кто
 * цеплялся за прежние, добавление не ломает.
 *
 * Список выписан РУКАМИ, а не снят с исходников: снятый с кода перечень подтверждал бы сам
 * себя и переименование проезжало бы молча вместе с правкой. Правка этого файла в сторону
 * удаления или переименования = ломающее изменение поставки, и она обязана быть решением, а
 * не побочным следствием рефакторинга.
 *
 * Стережёт перечень `test/slots.test.tsx` — с обеих сторон: имя из списка обязано появиться
 * в документе, а зацепка из исходников обязана быть в списке.
 *
 * `Slot` в перечне отсутствует НАМЕРЕННО: своего имени у него нет, семантику узла задаёт
 * потребитель через `as` (`src/slot.tsx`).
 *
 * Числа слотов здесь нет и не будет: число устаревает при каждом добавлении примитива, а
 * обещание — нет. Контракт — этот перечень, а не его длина (решение architect 2026-08-16, там
 * же число убрано из `kb:PROBEWEB-11`).
 */
export const PROMISED_SLOTS = [
  "button",
  "checkbox",
  "checkbox-control",
  "checkbox-description",
  "checkbox-error",
  "checkbox-indicator",
  "checkbox-input",
  "checkbox-label",
  "field",
  "field-description",
  "field-error",
  "input",
  "label",
  "radio-group",
  "radio-group-description",
  "radio-group-error",
  "radio-group-item",
  "radio-group-item-control",
  "radio-group-item-description",
  "radio-group-item-indicator",
  "radio-group-item-input",
  "radio-group-item-label",
  "radio-group-label",
  "select",
  "select-content",
  "select-icon",
  "select-item",
  "select-item-indicator",
  "select-item-label",
  "select-listbox",
  "select-trigger",
  "select-value",
  "separator",
  "spinner",
  "switch",
  "switch-control",
  "switch-description",
  "switch-error",
  "switch-input",
  "switch-label",
  "switch-thumb",
  "textarea",
  "toggle",
];
