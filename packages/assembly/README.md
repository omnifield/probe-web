# ⚙️ web-core Assembly

🏷️ assembly · 🧬 engine · 📦 `@web-core/assembly`

## 🧭 Навигация

- 🏠 [Главное](#главное)
- 🧩 [Анатомия](#анатомия)
- 🚀 [Использование](#использование)
- 🎚️ [Настройки](#настройки)
- 🎛️ [Состояния](#состояния)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- ❓ [FAQ](./FAQ.md)

<h2 id="главное">🏠 Главное</h2>

🌳 Механика сборки — то, чем из объявленных компонентов собирают дерево, правят его и рисуют по
данным. Одна на два применения: редактор скинов работает в границах одного компонента,
конструктор страниц — в границах целой страницы; различие между ними в охвате дерева, а не в
устройстве, которое его обходит. 🛠️ Средство, а не решение — механика не приносит своего вида,
не решает, что должно получиться, и не хранит своих правил вложенности: паспорт называет, что
допустимо, скин красит, редактор решает, что показать; здесь только то, чем это сделать. 🧭 Дерево
реально данные — не любая JSX-композиция обязана идти через него: `RenderTree` законен там, где
структура правда приходит JSON'ом (сохраняется, редактируется нетехническим человеком, едет по
сети) или доказывает паспорт одного компонента; состав, известный на этапе кода и никуда не
уезжающий, — обычный JSX, эта механика не при чём.

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ У движка нет DOM-анатомии — вместо частей компонента здесь возможности, каждая в своём файле
`engine/`, и все они собираются в дерево одним и тем же способом: у входа паспорта и правило
допуска, на выходе — либо новое дерево/вердикт, либо именованный отказ. Отрисовка — единственная
возможность, которой действительно нужен браузер, поэтому она одна вынесена в отдельный подпуть
поставки (`./render`), а не смешана с остальными десятью файлами.

| Часть | Адрес | Экспортирует |
|---|---|---|
| Дерево | `@web-core/assembly` | `AssemblyTree`, `AssemblyNode`, `AssemblyElement`, `AssemblyContent`, `NodeId`, `DataBinding`, `DynamicValue`, `EventBinding`, `EMPTY_TREE`, `isContent`, `isDataBinding`, `isEventBinding`, `resolveDataBinding`, `resolveEventBinding`, `nodeOf`, `rootOf`, `subtreeOf`, `ancestorsOf`, `outerTypeOf` |
| Разворот по данным | `@web-core/assembly` | `baseAssemblyOf`, `scopedPath`, `AssemblyTemplate`, `AssemblyTemplateElement`, `AssemblyTemplateContent`, `AssemblyTemplateNode`, `AssemblyTemplateRepeat` |
| Правки | `@web-core/assembly` | `insertNode`, `removeNode`, `moveNode`, `updateNode`, `EditResult`, `EditRefusal`, `NewNode`, `NewElement`, `NewContent`, `NodePatch` |
| Целостность | `@web-core/assembly` | `checkTree`, `TreeFlaw`, `TreeFlawName` |
| Реестр | `@web-core/assembly` | `createRegistry`, `checkRegistry`, `knownComponents`, `readAddress`, `resolveComponent`, `Registry`, `RegistrySpec`, `ReadableComponent`, `Address`, `RegistryFlaw`, `RegistryFlawName` |
| Вложенность | `@web-core/assembly` | `allowedInside`, `canAdmit`, `canContain`, `possibleOwnersOf`, `ownersAdmitting`, `AllowedInside`, `NestingVerdict`, `NestingRefusal`, `PossibleOwner` |
| Координата | `@web-core/assembly` | `coordinateOfType`, `nodesByCoordinate`, `nodesSharingCoordinate`, `NodeCoordinate` |
| Образец | `@web-core/assembly` | `sketchOf`, `SketchNaming` |
| Композиция | `@web-core/assembly` | `composeTree`, `rootNode`, `CompositionElement`, `CompositionContent`, `CompositionSpec`, `CompositionRefusal`, `CompositionResult` |
| Своё поведение | `@web-core/assembly` | `growSelfAssembly`, `SelfAssembly`, `SelfAssemblyElement`, `SelfAssemblyContent`, `SelfAssemblyNode` |
| Паспорт (читаемый срез) | `@web-core/assembly` | `partOf`, `ReadablePassport`, `GrowablePassport`, `ReadablePart`, `Admission`, `AdmissionRule`, `Genus`, `ComponentGenus` |
| Отрисовка | `@web-core/assembly/render` | `RenderTree`, `RenderTreeProps`, `FallbackProps`, `ErrorFallbackProps`, `EditOverlayProps`, `SlotEntry`, `SlotPlacement`, `DispatchedEvent` |

📦 Внутри пакета: `src/index.ts` (тонкий реэкспорт `engine/`), `src/engine/` (одиннадцать файлов —
дерево/правки/целостность/реестр/вложенность/координата/образец/композиция/self-assembly/
разворот-по-данным/паспорт, ноль Solid), `src/render/` (двенадцать файлов, единственный сегодняшний
потребитель `engine/`;
`index.tsx` — тонкий реэкспорт по тому же образцу, что корневой `src/index.ts`; `render-tree.tsx`
— провайдер/`Suspense`/`checkTree`; `render-node.tsx` — сборка ОДНОГО узла, точка входа рекурсии;
`content-of.tsx` — дети узла, самая тонкая часть Solid-реактивности; `composition.ts`/
`self-assembly-branch.ts` — ЧЕМ рисовать узел; `props.ts` — пропы/события/`bind` из данных;
`content-value.ts` — значение content-узла; `edit-overlay.tsx` — украшение путей отрисовки;
`takes-content.ts` — структурный вопрос реестра; `defaults.tsx` — запасные виды; `types.ts` —
проп-контракты), `src/shared/trace.ts` (перф-трасса, общая на оба).

🔤 `genus:"text"`/`genus:"icon"` у `AssemblyContent` — это уровень строки, не уровень компонента:
`{ genus: "text", value: { path: "title" } }` рисуется как нативное значение (строка либо
буквальный символ), резолва через реестр не проходит. Настоящий компонент передаётся не так —
он кладётся узлом (`{ node: "controlIndicator", children: [] }`) и резолвится обычным
`resolveComponent`, тем же путём, что и любой другой компонент дерева (подробнее — [FAQ](./FAQ.md)).

<h2 id="использование">🚀 Использование</h2>

Пять сценариев, а не один «как отрисовать»: движок используют и там, где Solid вообще не
поднимается (хранилище проверяет дерево `checkTree`'ом, сервер режет и правит его `edits`'ом), и
там, где отрисовка живая. 🔗 Реестр собирается один раз на приложение — из паспортов и карт частей,
которые поставляет кит, — и передаётся дальше правкам, вложенности и `RenderTree` одним и тем же
объектом.

**Реестр + отрисовка:**

```ts
import { createRegistry, type Registry } from "@web-core/assembly";
import { kitOf } from "@web-core/ui";
import { admits } from "@web-core/ui/passport";

export const registry: Registry = createRegistry({
  components: {
    button: kitOf("button"),
    accordion: kitOf("accordion"),
  },
  admits,
});
```

```tsx
import { RenderTree } from "@web-core/assembly/render";
import { registry } from "./registry.js";
import { tree } from "./tree.js";

function Preview() {
  return <RenderTree registry={registry} tree={tree} />;
}
```

**Правки — чистые, отказ значением:**

```ts
import { updateNode } from "@web-core/assembly";

const result = updateNode(tree, "кнопка", { props: { disabled: true } });
if (!result.ok) console.warn(result.refusal, result.means);
```

**Целостность:**

```ts
import { checkTree } from "@web-core/assembly";

for (const flaw of checkTree(tree)) console.warn(flaw.flaw, flaw.nodeId, flaw.means);
```

**Своё поведение компонента (self-assembly) — резолвится рекурсивным вызовом той же механики:**

```ts
import { growSelfAssembly } from "@web-core/assembly";

const behaviorTree = growSelfAssembly(passport.selfAssembly, "button", passport.root);
```

**Разворот шаблона по данным (`repeat`/`recur`) — сколько узлов вырастить, решают сами данные:**

```ts
import { baseAssemblyOf } from "@web-core/assembly";

const tree = baseAssemblyOf(
  passport, // GrowablePassport — component/root/anatomy.keys(), больше ничего не читает
  { name: "list", means: "список строк", tree: { node: "root", children: [/* … repeat/recur … */] } },
  "list",
  { rows: [{ id: "a" }, { id: "b" }] },
);
```

**Композиция из целых компонентов (модуль — не один паспорт, а несколько адресов реестра сразу):**

```ts
import { composeTree } from "@web-core/assembly";

const result = composeTree(registry, {
  type: "grid",
  children: [
    { type: "grid.cell", children: [{ type: "card", bind: { title: "/product/name" } }] },
    { type: "grid.cell", children: [{ type: "button", props: { "data-variant": "primary" } }] },
  ],
});

if (!result.ok) console.warn(result.refusals);
```

**Слот живого контента на месте узла:**

```tsx
import { RenderTree, type SlotEntry } from "@web-core/assembly/render";

const slots: Record<string, SlotEntry> = {
  "accordion.itemContent": { render: (props) => <ComponentPreview {...props} /> },
};

<RenderTree registry={registry} tree={tree} slots={slots} />;
```

<h2 id="настройки">🎚️ Настройки</h2>

⚙️ У движка нет одной сущности с переключателями, как у компонента, — есть один конструктор
(`RenderTree`), и настройки это его пропы. Все, кроме `tree`/`registry`, необязательны и не
зависят друг от друга: задать `slots` без `editOverlay` или `dispatch` без `data` — законная
комбинация, ни одна настройка не требует соседнюю.

| Проп `RenderTreeProps` | Тип | По умолчанию |
|---|---|---|
| `tree` | `AssemblyTree \| undefined` | не задан — рисует ничего, молчит |
| `registry` | `Registry` | обязательное |
| `fallback` | `Component<FallbackProps>` | предупреждение в трассу, ничего не рисует |
| `errorFallback` | `Component<ErrorFallbackProps>` | трасса + `console.error`, ничего не рисует |
| `loadingFallback` | `JSX.Element` | не задан — во время `Suspense` ничего |
| `editOverlay` | `Component<EditOverlayProps>` | не задан — ни одного лишнего узла в разметке |
| `data` | `unknown` | не задан — узлы `{path}` резолвятся в `undefined` |
| `dispatch` | `(event: DispatchedEvent) => void` | не задан — родные DOM-события работают, наружу не уходят |
| `slots` | `Readonly<Record<string, SlotEntry>>` | не задан — узлы рисуют объявленных детей как обычно |
| `rootProps` | `Readonly<Record<string, unknown>>` | не задан — корень рисуется без примеси |

<h2 id="состояния">🎛️ Состояния</h2>

🚦 У компонента состояния — это то, что видно глазами (раскрыт/закрыт, фокус, наведение). У движка
«состояние» — это имя отказа: каждая проверка (целостность дерева, правка, вложенность, реестр)
либо молча соглашается, либо возвращает значение с конкретным именем, по которому редактор решает,
что сказать человеку. Полного пересечения между источниками нет намеренно — `NestingRefusal`
целиком входит в `EditRefusal` (правка не проходит мимо той же проверки допуска), а `TreeFlawName`
и `RegistryFlawName` про разное: одно про уже собранное дерево, второе про саму пару поставщика.

| Источник | Имя | Значит |
|---|---|---|
| `checkTree` (`TreeFlawName`) | `root-missing` \| `id-mismatch` \| `child-missing` \| `child-duplicated` \| `parent-mismatch` \| `child-shared` \| `orphaned` \| `cycle` \| `content-in-props` \| `content-with-children` | изъян целостности дерева — возвращаются все сразу, не по одному |
| Правки (`EditRefusal`) | `node-unknown` \| `parent-unknown` \| `id-taken` \| `root-locked` \| `into-own-subtree` \| `content-holds-nothing` \| `patch-not-of-node` | отказ `insertNode`/`removeNode`/`moveNode`/`updateNode` — значение, не исключение |
| Вложенность (`NestingRefusal`) | `parent-unknown` \| `child-unknown` \| `part-undeclared` \| `foreign-part` \| `content-not-admitted` \| `component-not-admitted` | отказ `allowedInside`/`canAdmit`/`canContain`; входит и в `EditRefusal` |
| Реестр (`RegistryFlawName`) | `part-uncharted` \| `part-not-callable` \| `part-astray` | расхождение пары поставщика с анатомией — значение `checkRegistry`, не бросок |

<h2 id="io">🔌 IO</h2>

Вход у движка не один — у каждой возможности свой конструктор, и все они читают одно и то же
дерево/реестр, просто с разных сторон: правки его меняют, вложенность про него спрашивает,
`RenderTree` рисует. 📤 Выход почти всегда одной формы — «получилось» или «отказ с именем» — кроме
`RenderTree`, у которой единственный выход наружу это `dispatch` на клик/событие узла, а не
значение функции.

<h3 id="io-вход">📥 Вход</h3>

| Конструктор | Принимает |
|---|---|
| `createRegistry(spec)` | `{ components: Record<address, ReadableComponent>, admits: AdmissionRule }` |
| `insertNode`/`removeNode`/`moveNode`/`updateNode` | `(tree, id, ...)` — дерево и координаты правки |
| `RenderTree` | `RenderTreeProps` (см. «Настройки») |
| `growSelfAssembly(assembly, address, rootPart)` | `SelfAssembly` компонента + куда он смотрит в реестре |
| `baseAssemblyOf(passport, assembly, address?, data?)` | `GrowablePassport` (`component`/`anatomy.keys()`/`root` — не весь `ReadablePassport`) + шаблон `AssemblyTemplate` (`repeat`/`recur`) + реальные данные — сколько узлов вырастить, решают данные, не шаблон |
| `sketchOf(registry, address, naming?)` | адрес компонента и (опционально) свои имена узлов образца |
| `rootNode(registry, address, id?)` | адрес компонента — первый узел дерева, родителя проверять не у чего |
| `composeTree(registry, spec, rootId?)` | вложенная спека целых компонентов (`CompositionSpec`) — модуль собирается тем же `insertNode`, что и ручная правка |

<h3 id="io-выход">📤 Выход</h3>

| Источник | Отдаёт |
|---|---|
| Правки | `EditResult = { ok: true, tree } \| { ok: false, refusal, means }` |
| `checkTree` | `readonly TreeFlaw[]` — `{ flaw, nodeId, relatedId?, means }` |
| `checkRegistry` | `readonly RegistryFlaw[]` |
| `allowedInside`/`canAdmit`/`canContain` | `NestingVerdict = { allowed: true } \| { allowed: false, refusal, means }` |
| `possibleOwnersOf`/`ownersAdmitting` | `readonly PossibleOwner[]` |
| `coordinateOfType` | `NodeCoordinate \| undefined` |
| `rootNode` | `AssemblyTree \| undefined` |
| `baseAssemblyOf` | `AssemblyTree` — либо бросает именованной ошибкой (`assembly "…" grew past N levels…`) на зацикленный `repeat`/`recur` |
| `composeTree` | `CompositionResult = {ok:true, tree} \| {ok:false, refusals}` — все отказы сразу, не по одному |
| `RenderTree` + `dispatch` | `DispatchedEvent = { name, nodeId, address, timestamp, context }` наружу на каждое `on` |

<h2 id="сборки">🏗️ Сборки</h2>

🧪 Своих сборок в смысле кита у механики нет — она не знает конкретных компонентов. Вместо этого
«сборки» здесь — это пробы, доказывающие саму механику голыми, синтетическими компонентами: то,
что `RenderTree` не путает состояние показа с деревом, что слот подменяет только содержимое узла,
и что Solid-контекст не рвётся через `RenderNode`, — до того, как за дело возьмётся настоящий кит.

| Сборка | Что доказывает | Файл |
|---|---|---|
| `rootProps` на корне | смена динамического состояния показа доезжает до живого пропа корня, дерево не трогает, ребёнок не пересобирается | `test/root-props.test.tsx` |
| `slots` на узле | живой контент сверху рисуется на месте узла, узел резолвится как обычно | `test/slots.test.tsx` |
| Настоящий `createContext`/`useContext` через `RenderNode`/`RenderTree` | owner-цепочка Solid не рвётся ни `<For>`, ни `<ErrorBoundary>`, ни `<Dynamic>`, ни самим `RenderTree` — на двух уровнях дерева | `test/context-repro.test.tsx` |
| Дерево пересобирается на каждую смену `data` (новый объект `AssemblyTree`, те же id) | байндинг доезжает и на первой, и на второй, и на любой следующей пересборке — не только на первой | `test/rebuild-reactivity-repro.test.tsx` |
| `repeat`: 0 items → N items ПОСЛЕ монтирования, без потери Ark-дефолтов на пустом контенте | узел, структурно принимающий контент, подхватывает детей, добавленных позже, — плоский случай и вложенный (через `Portal`, как `select`'s `positioner`); часть, контент не принимающая (`trigger`), остаётся `null`; часть, принимающая контент по реестру, но без детей навсегда (`field`'s `requiredIndicator`), тоже остаётся `null` — Ark-паттерн `props.children ?? "*"` срабатывает | `test/contentof-null-vs-for.test.tsx` |
| `baseAssemblyOf`: `repeat` полем и старой обёрткой `{repeat, template}`, вложенный `repeat`, пустой `bind` внутри `repeat` (весь текущий элемент, не `undefined`), `recur` с гвардом глубины на зацикленном шаблоне/данных | разворот шаблона по данным растит верное число узлов и не виснет на цикле — та же механика, что раньше жила в `packages/skin` | `test/expand.test.ts` |
| `EventBinding` в `on.context` — синтетический вызов и настоящий `<input>` через `RenderTree` | контекст `dispatch` может прийти из самого живого DOM-события (`{event:"target.value"}`), не только из литерала/`DataBinding` по данным показа — закрывает текстовый инпут/global-search, которого раньше нельзя было выразить | `test/on-event-binding.test.tsx` |

✅ Живая проверка на настоящем ките — транзитивно, через тесты пакетов, что реально зовут
`RenderTree`/`baseAssemblyOf`: `packages/ui/src/button/test/button.test.tsx`,
`packages/ui/src/accordion/test/accordion.test.tsx`,
`packages/ui/src/tree-view/test/tree-view.test.tsx` и ещё 27 компонентов кита,
`apps/skin/src/entities/component/model/registry.test.tsx`.

<h2 id="рецепт">🎨 Рецепт</h2>

🧩 Съёмный слой этого движка — хуки `RenderTree`: сама отрисовка их не носит в себе, каждый
подключается отдельным пропом и не требует соседних. Это и есть рецепт редактора: та же одна
функция, что рисует голую витрину компонента без единого пропа, рисует и полноценный конструктор
страниц — разница только в том, сколько хуков ей дали.

```tsx
import { RenderTree, type SlotEntry } from "@web-core/assembly/render";
import { registry } from "./registry.js";

function Editor(props: { tree: AssemblyTree; activeId?: string }) {
  return (
    <RenderTree
      registry={registry}
      tree={props.tree}
      data={{ user: currentUser() }}
      dispatch={(event) => trackEvent(event)}
      fallback={(p) => <UnresolvedAddress type={p.type} />}
      errorFallback={(p) => <BrokenNode error={p.error} reset={p.reset} />}
      editOverlay={(p) => <SelectionHandle nodeId={p.nodeId} />}
      slots={{ "component-list.item": { render: (p) => <ComponentPreview {...p} /> } }}
      rootProps={{ activeValue: props.activeId }}
    />
  );
}
```

🔧 `data`/`dispatch` резолвят содержимое и события узла; `fallback`/`errorFallback` — запасные
виды на неразрешённый адрес и упавший узел, ставятся на каждый узел независимо; `editOverlay` —
украшение снаружи путей отрисовки; `slots` — живой контент по адресу узла; `rootProps` — только
корню, состояние показа мимо дерева.
