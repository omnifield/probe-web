import { createMemo } from "solid-js";
import {
  blankElement,
  type FieldDescriptor,
  fieldsOfElement,
} from "@web-core/generators/fields";
import type { FieldBinding } from "./binding";

/** Механика одного `list`-поля — элементы (`items`/`indices`, читает `binding.value()`),
 *  их собственная схема (`elementFields`, `field.element`) и действия над списком (`add`/
 *  `removeAt`). Общая между `node.tsx` (кнопка «Добавить» у лейбла) и `box.tsx` (аккордеон
 *  элементов, «Убрать» на каждый) — та же самая пара `field`+`binding`, тот же список. */
export function useTree(field: FieldDescriptor, binding: FieldBinding) {
  const elementFields = createMemo(() =>
    field.element ? fieldsOfElement(field.element) : [],
  );
  const items = createMemo(() =>
    Array.isArray(binding.value()) ? (binding.value() as unknown[]) : [],
  );
  const indices = createMemo(() => items().map((_, index) => index));

  function add() {
    if (!field.element) return;
    binding.onChange([...items(), blankElement(field.element)]);
  }

  function removeAt(index: number) {
    binding.onChange(items().filter((_, current) => current !== index));
  }

  return { elementFields, items, indices, add, removeAt };
}
