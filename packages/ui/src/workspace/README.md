# Workspace

**Group:** layout · **Genus:** component · **Footprint:** wide

## Anatomy

| part | meaning |
|---|---|
| root | каркас приложения целиком — держит все именованные слоты в одной сетке |
| header | верхняя полоса — не на всю высоту, только над показом и правой панелью |
| sidebar | левая колонка — во всю высоту, рядом и с шапкой, и с показом |
| main | показ — единственный слот, который есть всегда |
| rightbar | правая колонка — необязательна; не положена в сборку, колонка схлопывается сама |
| footer | нижняя полоса — необязательна; не положена в сборку, строка схлопывается сама |

## States

| part | state | mark | meaning |
|---|---|---|---|
| root | — | — | — |
| header | — | — | — |
| sidebar | — | — | — |
| main | — | — | — |
| rightbar | — | — | — |
| footer | — | — | — |

## Settings

| setting | meaning | default | mark |
|---|---|---|---|
| outlined | тонкий шов между занятыми слотами плюс свой фон у каждого — включай, когда блоки одного цвета и без него сливаются друг с другом; выключай, когда блок сам задаёт фон или содержимое и разделение лишнее | `false` | [data-outlined] |

## Notes

<!-- user:start -->
_Nothing written here yet — this section survives regeneration; everything above it does not._
<!-- user:end -->
