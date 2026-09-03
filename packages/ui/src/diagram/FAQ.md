# ❓ FAQ — грабли, на которые уже наступили

Не документация возможностей (та — в `README.md`) и не план (тот — в `ROADMAP.yaml`). Конкретные
ловушки движка/Solid/skin-механики, каждая — по факту, после того как реально наступили на неё.

## Сборки — `node`, не `part`

`playground/assemblies/*.ts`'s `tree` использует ключ `node` для имени части
(`{ node: "root", children: [{ node: "axis", ... }] }`). Референс в `products/diagrams` (откуда
портировался `axis`) использовал `part` — устаревшее имя поля, актуальный тип уже сменился на
`node` к моменту переноса в кит. Смотреть на актуальный тип (`table/playground/assemblies/basic.ts`
как живой пример), не копировать имя поля из референса вслепую.

## `props.children` через `{...dropAddress(rest)}` — реально работает, не требует ручного рендера

`DiagramRoot` не деструктурирует `children` отдельно — `splitProps(props, ["width", "height"])`'s
`rest` несёт `children` дальше, и `<svg {...dropAddress(rest)} .../>` рендерит их по-настоящему:
Solid's спред-раннер обрабатывает ключ `children` в объекте спреда так же, как явный JSX-children,
даже на нативном элементе. Тот же приём уже держит `grid`'s `Grid` (`<Polymorphic as="div" {...rest}
{...address} />`, без единого явного упоминания `children`). Не нужно заводить `local.children`+
явный рендер, как у `table`'s `TableRoot` — там это render-prop (функция), другая категория, не
плейн JSX-вложенность.

## `RenderTree`/сборки требуют реальной `parts`-карты в реестре теста

`createRegistry({ components: { diagram: { passport: ..., parts: {} } } })` с пустой `parts` не
падает явно — просто ничего не рисует (0 узлов, включая `root`). Нужна настоящая карта из
`kit.parts` (`import { kit as diagramKit } from "../components/index.js"`), не заглушка — та же
ошибка, что легко скопировать по инерции из чужого теста, не заметив разницы.
