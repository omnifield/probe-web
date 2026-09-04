# ❓ FAQ — грабли, на которые уже наступили

Не документация возможностей (та — в `README.md`) и не план (тот — в `ROADMAP.yaml`). Конкретные
ловушки Ark/Solid/skin-механики, каждая — по факту.

## `root`/`item` не несут `anatomyParts.*.attrs` вручную — и это правильно

В отличие от `control`/`content`/`controlIndicator` (все три — ПЕРЕИМЕНОВАННЫЕ части: Ark's
`itemTrigger`/`itemContent`/`itemIndicator` заменены на свои имена, `entity/anatomy.ts`'s
`.omit(...).extendWith(...)`), `root`/`item` используют оригинальные Ark-имена без изменений — Ark
сам эмитит `data-scope="accordion"`/`data-part="root"`/`data-part="item"` через собственный
`useAccordionContext`, значения совпадают с нашей анатомией один в один. Спреить
`anatomyParts.root.attrs`/`anatomyParts.item.attrs` поверх было бы избыточным дублированием, не
багом их отсутствия. Правило переносится на любой Ark-компонент кита: часть, что НЕ переименована
относительно Ark — адрес даёт сам Ark; часть, что переименована — адрес ставим вручную.

## `data-variant` на assembly-узле не обязан быть покрыт `recipe.ts`

Сборка `action-list` ставит `data-variant="secondary"` на `control` и `data-variant="compact"` на
вложенный `listbox` — ни то, ни другое НЕ описано в `accordion/playground/recipe.ts` (там только
`base` + `settings.orientation`, оси `variants` нет вовсе). `skinGaps` на это не жалуется — он
сверяет состояния паспорта, а не то, какие `data-variant` встречаются в сборках. Кит намеренно
поставляет вариант-нейтральный доказательный рецепт; конкретные виды (`secondary`/`compact`)
рисуют скины продуктов, не кит сам. Не воспринимать "сборка ссылается на вид, которого нет в
recipe.ts" как незамеченный пробел — это ожидаемое разделение ответственности.
