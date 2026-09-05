export interface Layer {
  name: string;
  value: number;
  purpose: string;
}

export const LAYERS: readonly Layer[] = [
  { name: "z-base", value: 0, purpose: "обычный поток страницы — точка отсчёта" },
  {
    name: "z-dropdown",
    value: 10,
    purpose: "панель списка: выпадающий список, автодополнение — привязана к своему контролу",
  },
  {
    name: "z-popover",
    value: 20,
    purpose: "поповер и всплывающая подсказка — привязаны к точке, но перекрывают панель списка",
  },
  {
    name: "z-overlay",
    value: 30,
    purpose: "затемнение под модальным слоем — отделяет его от страницы, лежит НИЖЕ него",
  },
  {
    name: "z-dialog",
    value: 40,
    purpose: "диалог и выезжающая панель — модальный слой поверх затемнения",
  },
  {
    name: "z-toast",
    value: 50,
    purpose: "уведомление — выше всего, иначе сообщение о результате скрыто тем, что его вызвало",
  },
];

export const LAYER_TOKENS: readonly string[] = LAYERS.map((layer) => layer.name);

