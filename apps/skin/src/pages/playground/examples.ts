// СПИСОК ПРИМЕРОВ ПЛЕЙГРАУНДА — сборки из `./examples/`, между которыми переключается селект страницы.
// Новый пример: положить JSON в `examples/` и дописать сюда строку. `value` — ключ, уникальный в списке.
import type { CompositionElement } from "@web-core/assembly";

import testModule from "./examples/test-module.json";

export type PlaygroundExample = {
  value: string;
  label: string;
  composition: CompositionElement;
};

export const EXAMPLES: readonly PlaygroundExample[] = [
  {
    value: "test-module",
    label: "Тестовый модуль",
    composition: testModule as CompositionElement,
  },
];
