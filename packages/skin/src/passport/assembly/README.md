# passport/assembly

Как выглядит РАБОЧИЙ экземпляр компонента (`PWEB-89`), и РОД содержимого — чем узел является,
когда его кладут внутрь чужого узла (`PWEB-24`).

## Срез редактора, не рантайма (`PWEB-115`)

Ни сборку, ни правило вложенности `generateSkinCss`/`checkOutfit`/`assemble` не читают —
проверено по всей механике скина. Читает их только `RenderTree`/`baseAssemblyOf`, а это
редакторская механика продукта. Наружу это идёт только подпутём `../../editor.js` — модель и
корневой вход (`../../model.js`, `../..`) видят только рантайм-срез (`nodes.ts`'s
`PassportSelfAssembly`/`DataBinding`/`DynamicValue`/`DispatchAction` и т.д.), не редакторские
типы (`PassportAssembly`, `DataPreset` — несут `means` и сценарии витрины).

## Что это чинит

Чтобы показать гармошку, витрина должна была бы выдумывать: сколько разделов, какие пропы дать
киту, чтобы тот вообще заработал (`value` у раздела — без него Ark не знает, какой пункт
раскрывать), чем наполнить части. Это знание о компоненте, и у витрины его быть не должно:
следующий пульт напишет своё, поставщик выпустит четвёртую часть — и оба покажут её пустой,
каждый по-своему.

Даёт сборку тот, кто компонент написал. Кастомные сборки остаются потребителю.

## Форма: объявление вложенное, выход — плоский

Объявляют вложенным деревом ЧАСТЕЙ (`PassportAssembly`): так его пишут и читают глазами.
Отдаётся плоская карта с корнем (`BaseAssemblyTree`) — та форма, в которой дерево читает
механика сборки (`output.ts`). Имена узлов, обратные ссылки и адреса частей ставит
`baseAssemblyOf` (`expand.ts`), а не рука: написанные руками, они разъехались бы с анатомией на
первой же правке.

## Почему выход — ЧУЖАЯ форма, объявленная у нас

Условие задачи: сборка обязана собираться механикой сборки БЕЗ доработки потребителем, иначе это
не сборка, а описание. Значит отдавать надо ровно то, что механика принимает.

Приём не новый и не наш: механика сборки ровно так же объявляет у себя `ReadablePassport` — самую
узкую запись того, что она с паспорта снимает, — вместо того чтобы зависеть на форму. Здесь то же
самое, зеркально: узкая запись того, что мы отдаём, вместо зависимости на механику. Зависеть на
неё форма и не может — направление зависимостей одностороннее.

Совпадение двух записей держится не договорённостью, а пробой у ЧИТАТЕЛЯ: дерево, поданное в
`RenderTree`, либо типизируется, либо нет. Пробы этой у нас нет и быть не может (форма не вправе
тянуть механику даже в пробы — это замкнуло бы граф зависимостей), поэтому она названа в отчёте по
задаче как долг читающей зоны.

## Сборок стало МНОГО (`PWEB-115`)

Раньше сборка была одна: перечень сборок превратил бы паспорт в витрину, а витрина — не предмет
паспорта. Решение пересмотрено: витриной сборки становится не паспорт, а компонент, у которого им
И ПОЛОЖЕНО быть несколько («три раздела, первый раскрыт» / «пять разделов, все закрыты»). Держатель
сборки (`PassportEditorInfo.assemblies`, в `../editor.ts`) стал перечнем ОДНОГО и того же типа
`PassportAssembly`, а не полем с ним одним.

## Адрес компонента — вход, а не константа

В реестре компонент может лежать под чужим пространством имён (`ui.accordion`): адрес — дело того,
кто реестр складывает. Поэтому адрес приходит параметром, а внутри дерева части адресуются от
него; зашей мы `accordion.itemTrigger` в объявление — сборка сломалась бы у первого же потребителя,
который положил кит не под голым именем.

## Admission (`admission.ts`)

`PassportGenus` — РОД содержимого-ЛИСТА: чем значение является, когда его кладут внутрь чужого
узла как `PassportAssemblyContent` (`{genus, value}`, ни пропов, ни детей, ни адреса). Род, а не
имя компонента: «внутрь кнопки только текст или значок» — утверждение о роде допустимого, и
записать его иначе нечем — перечень имён отстанет на первом же новом значке.

Форма взята, а не придумана (сверено 2026-08-20): в HTML `<button>` пускает внутрь phrasing
content — КАТЕГОРИЮ содержимого, а не список тегов; в схеме ProseMirror узел объявляет свою
группу (`group`), а родитель — допустимые группы (`content`). Обе стороны там же, где у нас:
кандидат называет себя сам, принимающий называет род.

- `text` — подпись: узел-текст, компонентом не являющийся.
- `icon` — значок-плейсхолдер: печатается как есть, живым компонентом не бывает.

`"component"` здесь БОЛЬШЕ НЕТ (был, снят при доводке `PWEB-172`): лист физически не может нести
компонент — только строку/путь (`value: DynamicValue`). Ссылка на настоящий компонент —
`PassportAssemblyElement`, отдельный узел, не содержимое, и её допуск — `PassportAdmission`'s
`{kind:"component"}`, не жанр листа.

`PassportComponentGenus` — род, которым КОМПОНЕНТ ЦЕЛИКОМ объявляет сам себя
(`defineEditorInfo`'s `genus`) — используется ссылкой на этот компонент (`PassportAdmission`'s
`{kind:"component", genus}`), не содержимым-листом. Independent от `PassportGenus` (не
`Exclude<..., "text">`) с тех пор, как `PassportGenus` лишился `"component"` — словари разошлись:
лист не может БЫТЬ компонентом, а компонент вправе объявить себя обычным (не значком).

`PassportAdmission` — что допустимо внутри части, ОДНИМ перечнем: named nodes and leaf content
mixed together. Перечень один намеренно (`PWEB-24`). Часть компонента и есть вложенный компонент,
увиденный с другой стороны: у Ark вкладка гармошки — и часть `item`, и самостоятельный компонент.
Разведи это на два поля — и у одного дерева окажется два правила, которые редактор обязан
складывать сам; складывать он их будет по-своему, и каждый читатель паспорта по-своему же.

ONE named-node kind, not three (`PWEB-172` continuation, 2026-08-28). Own anatomy part, private
`extra`, and a reference to another component of the shared registry used to be three separate
admission kinds (`part`/`extra`/`component`) — the SAME question ("is this named thing allowed
here") asked three different ways depending on WHERE the name resolves to. That WHERE is a
resolution detail (own anatomy vs. `KitComponent.extras` vs. the general registry,
`packages/assembly/src/registry.ts`'s `readAddress`) — admission doesn't need to know it, the same
way the declaration side stopped needing two fields (`node`, `PWEB-172`) for the same reason.
Content stays its own kind: a leaf (`value`, no props/children/identity) is a genuinely different
thing from a named node, not the same thing seen from another angle.

`{kind: "component"}`'s `genus` restricts to a component that declares ITSELF this genus. Absent —
no genus restriction. Never matches an own part or an `extra`: neither declares a genus, both are
addressed by `name` instead. Multiple allowed genera are multiple `accepts` entries, not an array
— the same way multiple allowed part names were always multiple `{kind:"part", name}` entries,
never a `name` array.

`name` restricts to this exact name — an anatomy part's name, an `extras` key, or a top-level
registry name, whichever it turns out to be. Typed `Part | Registry` (was `Part | string`,
`PWEB-208` — half of the non-guarantee `PWEB-172` accepted is now closeable): a real registry
component name is checkable once `packages/ui`'s generated barrel hands the second type parameter
a literal union to plug in, same door `node` uses (`./nodes.ts`). The THIRD case — an `extras`
key — stays open on purpose: an extra is private to whichever assembly declared it (`PWEB-165`),
never a member of any closed list, so `admits`'s runtime `candidate` (built from an actual node,
never authored) is typed with the loose default `PassportAdmission`, not `<Part, Registry>` —
tightening only pays off on the AUTHORED side, `accepts`.

`admits(part, candidate)` — пускает ли часть внутрь себя кандидата. Решение машинное, и в этом
весь смысл поля: редактор обязан уметь ОТВЕРГНУТЬ заведомо неверное вложение, а не только
показать, что «что-то класть можно». Живёт рядом с родом и сборкой, а не у читателя паспорта:
правило одно на всех читателей — редактор, `defineEditorInfo`, — и написанное вторым читателем
разъедется с написанным первым молча, оба будут зелёными. `genus` only rejects when BOTH sides
state one — `checkAssembly` (declaration-time, no registry) can never know a foreign reference's
own declared genus, only a registry-aware caller (`nesting.ts`) supplies it.

## Binding (`binding.ts`)

`DataBinding` — ссылка на значение во ВНЕШНИХ данных, JSON Pointer (RFC 6901), тем же приёмом, что
у A2UI (`PWEB-156`, решение изучено и записано в README `packages/assembly` — не изобретаем свою
форму). Узкая запись того же понятия, что и в `packages/assembly/src/tree.ts` — зеркально тому,
как реестр уже держит свою узкую запись пары поставщика: механика не зависит на форму скина, форма
скина не зависит на механику.

`DynamicValue = string | DataBinding` — значение содержимого: готовый литерал ЛИБО ссылка на
данные, разрешаемая при отрисовке.

**`DataBinding<Data, AtRoot>`/`DynamicValue<Data, AtRoot>`/`DispatchAction<Data, AtRoot>` (`PWEB-209`).**
`path` — и внутри `context` тоже (point 4: та же дыра, что у `bind`, не только `bind`) — перестал
быть голым `string`: `./paths.ts`'s `BoundPath<Data, AtRoot>` сверяет его с реальной io-схемой.
`Data = unknown` умолчанием держит старое поведение (произвольная строка) для каждого объявления,
которое ещё не подставило схему. `AtRoot` — формат: абсолютный путь (`/sections`, от корня
`io.input`) на самом верху дерева, относительный (`title`) везде, куда уже дотянулся хоть один
`repeat` — то же правило, что `expand.ts`'s `scopedPath` уже применяет в рантайме (см. ниже,
`Nodes`), просто на уровне типа, на шаг раньше.

`resolveDataBinding(data, path)` — значение по пути в данных (`/a/b/0`, `~0`→`~`, `~1`→`/`). Узкая
копия того же самого в `packages/assembly/src/tree.ts`. Здесь она нужна только для
`baseAssemblyOf`: узнать длину массива под повтором (`PWEB-156`) — резолвинг СОДЕРЖИМОГО для
показа — дело `RenderTree`, не разворота дерева. Пустая строка указывает на сами данные целиком.

`DispatchAction` — событие узла наружу (`PWEB-157`) — форма A2UI (`Action`,
`{event: {name, context}}`), сверенная по их настоящему исходнику
(`renderers/web_core/src/v0_9/schema/common-types.ts`), не придумана заново. `functionCall`-
вариант (вызов клиентской функции по имени) сюда НЕ завозится — этот случай в кит не нужен, пока
для него нет потребителя (тот же довод, что и у `call` в `DynamicValue`). `context` резолвится до
отправки (тем же приёмом, что и `bind`): вызывающий получает готовый JSON, не сырое DOM-событие.

## Paths (`paths.ts`)

Type-level machinery for `PWEB-209` (group C of the closed-set audit) — every `bind`/`repeat.path`/
content `value` was a bare `string`, a JSON Pointer no compiler ever read, and an opaque one at
that: a typo caught nothing before the record actually rendered against real data.

`Paths<T>` — every field-name path reachable from `T`, `/`-joined, NEVER a numeric segment. An
array-typed field is offered both as a leaf (itself — a `repeat` target) and, transparently, one
level further in, because the index a literal JSON Pointer would need there is supplied by `repeat`
at RENDER time (`../nodes.ts`), not authored in the type. `ArrayPaths<T>` narrows `Paths<T>` to
paths that actually resolve to an array — the only legal shape for `repeat.path`; before this, a
path into a plain field type-checked as a repeat target and was wrong every single time.
`ElementAt<T, K>` — the element type at an array path, what a `repeat`'s own template/children
actually see.

**Found while building this, not by inspection: an OPTIONAL array field breaks the array check
unless `NonNullable` runs first.** `readonly X[] | undefined` does not extend `readonly unknown[]`
— a union only extends a type when EVERY member does, and `undefined` never does — so
`ArrayPaths<T>` silently dropped every `?`-optional array field until `ArrayPaths` wrapped the
lookup in `NonNullable`. Caught by running this against accordion's own `items?: readonly Item[]`
(`test/paths.test.ts`) before it ever reached the assembly tree types, exactly per the ticket's own
instruction to prove this on real nesting first.

`BoundPath<T, AtRoot>`/`RepeatPath<T, AtRoot>` — the SAME path, in whichever format this one tree
position actually authors it: absolute (`/sections`) at the untouched root, relative (`title`)
everywhere a `repeat` has already narrowed the branch — the exact rule `../expand.ts`'s
`scopedPath` already enforces at runtime, moved one step earlier into the type. `NextRoot<T>` —
what `AtRoot` becomes for a `repeat`'s own children: `false` once `T` is a real schema (something
narrowed), unchanged (`true`) while `T` is still the untyped default `unknown` (nothing to narrow,
and flipping it anyway would make the default/permissive path diverge from itself between
recursion levels — see `../nodes.ts`'s note on why that broke `checkAssembly`/`expand.ts`).

**Found by the ui-architect piloting this against a REAL, shipping assembly (accordion's
`playground/assemblies/base.ts`), not a synthetic one: `""` is a legal third path shape, missing
from the first cut.** `""` is `binding.ts`'s `resolveDataBinding`'s own documented sentinel for
"the whole current node/Data" (`path === "" ? data : ...`) — button's `selfAssembly` and
accordion's own action-list already write `payload: ""`/`context: {payload: {path: ""}}` in
production, and neither typechecked until `BoundPath` learned `""` is ALWAYS legal (no `AtRoot`
fork — `scopedPath` checks `path === ""` before it ever asks whether a path is absolute) and
`RepeatPath` learned it's legal ONLY when `T` itself is already array-shaped, and — unlike a real
field path — never gets the `/` prefix. `ElementAt<T, K>`'s constraint widened to
`ArrayPaths<T> | ""` to match, resolving to `Elem<T>` (self) for the `""` case rather than routing
through `ValueAt`, which has no field named `""` to resolve. One committed-but-unmerged pilot found
a real gap a synthetic two-level schema alone did not surface — the ticket's own emphasis on
"prove this on real nesting first" earned its keep a second time here.

Every one of these five is escape-hatched to the fully permissive form (`string`/`unknown`) the
instant `T` is `unknown` — `unknown extends T`, true only when `T` genuinely IS the default, never
for a real schema — so every existing declaration across the kit, none of which names a third
`Data` type argument yet, keeps compiling exactly as it did before this file existed.

`Depth` (defaults 6, generous for real form nesting — accordion needs 2) bounds every recursive
definition here so a self-referential or unusually deep schema fails closed (`never`) instead of
`tsc`'s "type instantiation is excessively deep" — worth having before the first pathological
schema hit it, not after.

## Nodes (`nodes.ts`)

`PassportAssemblyElement` — declaration node: a piece of the tree, own part OR a reference to
another component of the shared registry — ONE field for both (`PWEB-172`, page 112 §1).
`PassportAssemblyPart` and `PassportAssemblyComponent` used to be two separate types (`PWEB-166`)
for the same relationship seen from two sides: "put a component here" is the same instruction
whether that component is one of this component's own anatomy parts or a completely independent
one from the registry. Splitting them cost two admission kinds and two node shapes everywhere a
tree is walked, paid for exactly one thing: a typo in a foreign name was already only caught live,
so a typo in an OWN part name being caught by `tsc` was the one asymmetry worth keeping two fields
for — found not worth it once the reference mechanism (`PWEB-167`–`171`) actually got exercised:
same source, `egor6-66/capsuleTech`, one field (`type: string`) for a kit primitive and a whole
business page alike.

`node`'s value is looked up against the OWNING component's own anatomy (`expand.ts`'s
`baseAssemblyOf`) to tell the two apart: matches a real part name → it is one; anything else is
assumed a reference to that name in the general registry. A typo in an own part name is therefore
no longer caught AT ALL before render — the accepted price of one field (`PWEB-172`'s own ticket
named it going in), not an oversight. Имени у узла нет: имена ставит `baseAssemblyOf`, тем же
приёмом, что и образец механики — именем части, а при повторе с числом.

**`node: Part | Registry`, not `Part | string` (`PWEB-208`).** `Registry` is the second half of the
price named above, made payable: defaults to `string` (every call in the kit infers it, none names
it — same as `Part`, nothing existing recompiles differently), and closes for real once a
component writes `PassportAssemblyElement<OwnPart, KitComponentName>` with a literal union sourced
from `packages/ui`'s generated barrel. The runtime lookup in `baseAssemblyOf` above is UNCHANGED —
this is a `tsc`-time net laid before that lookup ever runs, not a replacement for it (an author
outside TypeScript, or one who bypasses the type, still needs the runtime check it always had).

`props` — пропы, без которых кит не заработает. НЕ вид и не состояние: раскрытость, наведение,
отключённость — состояния, у них своя ось и свои средства.

`bind` — пропы, чьё значение резолвится из данных при отрисовке (`PWEB-156`) — имя пропа → путь.
ОТДЕЛЬНОЕ поле, а не «значение пропа бывает и строкой, и `{path}`»: `props` остаётся ВСЕГДА
литералом. Резолвится `RenderTree`, добавляется к `props` поверх (побеждает при совпадении имени).

`repeat` (`PassportAssemblyElement.repeat`) — Repeat THIS node itself by the length of the array at
`repeat.path` (`PWEB-171`) — a field next to `node`/`bind`/`props`, not a separate wrapper node
(see `PassportAssemblyRepeat` below, kept for now as the older, still-working form). The node's own
`bind`/`props`/`on`/`children` are the per-instance template; nothing about the node's shape
changes when `repeat` is set, only that it grows once per array element instead of once.

**`Data`/`AtRoot`, and why `PassportAssemblyElement` became a union of one variant PER legal
`repeat.path` (`PWEB-209`, point 2).** The node CARRYING `repeat` reads its OWN `bind`/`children` in
the POST-repeat element's shape, not its incoming one — accordion's real `{node: "item", repeat:
{path: "/sections"}, bind: {value: "id"}, ...}` binds `"id"`, `Section`'s own field, not a field of
the outer `io.input`. A plain optional `repeat?` field next to a FIXED `Data` couldn't make `bind`'s
type depend on WHICH path ended up chosen — only indexing a mapped type by its own key union
(`{[K in RepeatPath<Data,AtRoot>]: ...}[RepeatPath<Data,AtRoot>]`) ties the two together. `./paths.ts`'s
`ElementAt<Data, K>` computes the narrowed shape, `NextRoot<Data>` flips `AtRoot` to `false` for
everything below — except when `Data` is still the untyped default `unknown`, where it stays `true`;
without that exception, `../editor/check-assembly.ts`/`./expand.ts` (both written against the bare,
all-defaults node type) would stop accepting their OWN children two levels down, from a `true`-vs-
`false` literal mismatch that carries no actual difference once `Data` has nothing to narrow.

Found while proving this against accordion's real two-level shape (`test/data-threading.test.ts`,
per the ticket's own instruction to test on real nesting first): a mismatch buried three levels deep
inside ONE unbroken tree literal can get MISATTRIBUTED by `tsc` to an unrelated line near the top of
that same literal — confirmed, not merely suspected, by watching an intentional error move to the
wrong line and back while writing that test. **Guidance for whoever authors a real assembly under
this typing:** name a sub-tree as its own `const` with an explicit `PassportAssemblyNode<...>`
annotation rather than nesting the whole tree as one literal, at least around anything non-trivial —
the error lands where it belongs then, same as it does for any other TypeScript object literal
checked in smaller pieces.

`PassportAssemblyContent` — узел объявления: СОДЕРЖИМОЕ — значение, названное родом. Дискриминант
— наличие рода, как и в дереве механики.

`PassportAssemblyExtra` — узел объявления: ВСПОМОГАТЕЛЬНЫЙ компонент кита, БЕЗ адреса анатомии.
Часть-без-адреса — реальный случай: скрытый `<input>` чекбокса/радиогруппы/файлов, которым Ark
никогда не пишет `data-part`, но без которого клик по превью не работает — реальный `onChange`
висит именно на нём. `extra` — имя из карты `KitComponent.extras`
(`packages/ui/src/kit-form.ts`), не анатомии.

`PassportSelfAssembly` — component's OWN behavior — runtime slice (`PWEB-167`, page 112 §4,
"Accepted — Option B, refined"). NOT a showcase scenario: no `name`, no `means`. A reference to
this component from someone else's assembly feeds THIS tree data (`props`/`bind` on the reference
node), it does not override its `on`/`children` — the component stays the author of its own
behavior (page 111 §5, user verbatim: "the button doesn't know who passes what in the payload").
Lives in the RUNTIME slice (re-exported through `../../model.js`, not only `../../editor.js`) —
unlike `PassportAssembly` (carries `means` and showcase scenarios, stays editor-only).

`PassportAssemblyRepeat` — узел объявления: ПОВТОР (older, wrapper form — `PWEB-156`). Superseded
by `repeat` as a field on the node itself (`PWEB-171`): user's sketch put `repeat` next to
`node`/`bind` on ONE node, not wrapped around it. Kept working, not removed, until every consumer
has moved off it (grepped for at the time of `PWEB-171` — accordion's live assemblies still use
this wrapper). Число копий НЕ называется в дереве никем — оно равно длине массива по `repeat.path`,
и только ей (постановка user, 2026-08-27 — «точка входа одна»). `template`'s paths without a
leading `/` are read relative to the CURRENT array element (same device as A2UI). Typed by the
exact same per-`K` mapped-type device as the field form above (`PWEB-209`) — `template`'s `Data`
depends on which path this wrapper's OWN `repeat.path` names, for the identical reason.

**`PassportAssemblyRef` — deliberately NOT `Data`-threaded (`PWEB-209`).** `bind` stays a bare
`string`. A ref's template lives ONCE in `PassportAssembly.refs` and is reused at however many tree
positions reference it (`{ref: "name"}`), each potentially at a DIFFERENT `Data` — closing this
needs the reference's OWN use-site `Data` threaded through `expand.ts`'s `mergeRef`, real work not
attempted in this pass. The bare `string` this had before `PWEB-209` is exactly the bare `string` it
still has; nothing regressed, a gap just didn't close alongside its neighbors.

`PassportAssemblyRef` — узел объявления: ССЫЛКА на именованный кусок дерева, объявленный один раз
(`PassportAssembly.refs`, `PWEB-160`). Найдено ресёрчем рынка (2026-08-27, user: «сборки
дублируются, таскать целиком дорого»): у A2UI компоненты лежат плоской картой по id, а «ребёнок» —
просто СВОЙСТВО, ссылающееся на чужой id. Тот же приём — GraphQL-нормализация и
мастер-компонент/инстанс у Figma (переопределения поверх, не копия). `RenderTree` обходит настоящее
дерево (`parentId`, одно поле, не список) — граф не заводим, ссылка на разворачивании
(`expand.ts`) превращается в СВОИ настоящие узлы на КАЖДОЙ площадке, где стоит `{ ref }`. Сайт
ссылки побеждает при совпадении имени с тем, что шаблон объявил сам.

## Assembly (`assembly.ts`)

`PassportAssembly` — одна сборка компонента — рабочий экземпляр, он же СХЕМА, по которой компонент
собирается. Держатель сборки (`PassportEditorInfo.assemblies`) объявляет их СКОЛЬКО УГОДНО
(`PWEB-115`).

**Третий параметр типа, `Data` (`PWEB-209`).** `tree` теперь `PassportAssemblyElement<Part,
Registry, Data, true>` — `true` захардкожен, не параметр: это КОРЕНЬ дерева, выше него сузить
ничего не могло. `Data = unknown` умолчанием держит любую сборку, ещё не подставившую схему, ровно
такой, какой она была. `refs` типом НЕ участвует (`../nodes.ts`'s заметка про
`PassportAssemblyRef`) — сборка, инстанцированная как `PassportAssembly<Part, Registry, Data>` с
реальной `Data`, всё равно структурно годится туда, где ждут непараметризованную
`PassportAssembly<Part, Registry>` (`../editor/types.ts`'s `PassportEditorSpec.assemblies`,
`checkAssembly`, `defineEditorInfo`) — обычное структурное расширение вширь, ни один из этих трёх
файлов Data вообще не тронут.

`name` (`PWEB-126`) — имя — не украшение, а адрес. Список без имён читается по ПОЗИЦИИ
(`assemblies[0]`), а позиция — не адрес: переставь записи местами, и ссылавшийся на «первую»
получит другую схему молча.

`providerProps` (`PWEB-153`) — пропы невидимого провайдера, оборачивающего корень — у
поповера/меню/диалога настоящего DOM-узла на самом верху нет вообще: `<Popover>`/`<Menu>` ничего
не рисуют, только раздают состояние вниз через контекст Solid, а паспорт называет корнем ближайшую
РЕАЛЬНУЮ часть (`positioner`). Без обёртки та часть пытается прочитать контекст и падает. Поле
отдельное от `tree.props` — те пропы корневой ЧАСТИ, эти пропы провайдера, разных компонентов с
разными пропами.

`refs` (`PWEB-160`) — именованные куски дерева, объявленные ОДИН раз и используемые сколько угодно
раз через `{ ref: "имя" }` где угодно внутри `tree`. Область — ЭТА сборка, не глобальный реестр.

`DataPreset` — один заготовленный набор данных под сборку (`filled`, `PWEB-156`) — «вариант
заполнения». Поставляет ЕГО ТОТ ЖЕ, кто поставляет сборку. Не путать с адаптером, который позже
подключит ЧУЖИЕ данные произвольной формы (`PWEB-158`, не начато) — пресет уже в форме, которую
сборка ждёт.

## Output (`output.ts`)

`BaseAssemblyElement` — узел ЭЛЕМЕНТА плоского дерева — то, что рисуется компонентом из реестра.
`type` — адрес части в реестре (`accordion.itemTrigger`, а у корня — сам адрес компонента). `bind`
— пропы из данных, уже абсолютные (прошедшие через `scopeTemplate`, если узел вырос из повтора).

`BaseAssemblyContent` — узел СОДЕРЖИМОГО плоского дерева — лист, детей у него нет.

`BaseAssemblyTree` — плоская карта с корнем — форма, в которой дерево читает механика сборки.
Обёртка `components` вокруг пары «корень и узлы» повторена намеренно: расхождение здесь означало
бы, что отдаваемое надо перекладывать, а перекладывание и есть та доработка потребителем, от
которой уходим.

## Expand (`expand.ts`)

`baseAssemblyOf(passport, assembly, address, data)` — собирает сборку компонента в плоское дерево,
готовое к отрисовке. Сборка приходит ПАРАМЕТРОМ, а не снимается с паспорта (`PWEB-115`): паспорт
(срез рантайма) сборок больше не держит вовсе, держатель — `PassportEditorInfo.assemblies`, и их
там может быть несколько. Имена узлов детерминированы: имя части, при повторе — с числом (`item`,
`item-2`) — значит дерево одной и той же сборки собирается одинаково у всех, и записанный по этим
именам скин не разъедется от того, кто собирал.

Без данных повтор разворачивается в ноль узлов (законное состояние, не отказ). Содержимого
(`value`) это не касается — литерал/ссылка проезжают в плоское дерево как есть, резолвит их
`RenderTree` при отрисовке, не эта функция.

Внутреннее устройство (все замыкания держат общее состояние `nodes`/`taken`, поэтому живут одной
функцией — разнести их по файлам значило бы завести отдельный объект-контекст, не сделано в этом
заходе, целимся под ~150 строк на файл «в идеале», здесь сознательное исключение):

- `nameFor` — имя, которого в дереве ещё нет: имя части, а при повторе — с числом.
- `addressOf`/`addressOfExtra` — корневая часть и компонент целиком делят один адрес (механика
  приводит обе записи к этой); extras живут в отдельном неймспейсе (`~` сразу после точки — часть
  с таким именем анатомия не заведёт никогда, коллизия исключена структурно).
- `scopedPath` — абсолютный путь для пути БЕЗ ведущего `/` внутри шаблона повтора (A2UI-приём):
  относительный путь читается от ТЕКУЩЕГО элемента массива. Пустая строка — SPECIAL case, не
  обычный относительный сегмент (`PWEB-170`): по RFC 6901 пустой путь уже значит «все данные» —
  здесь то же значение применяется к ТЕКУЩЕМУ элементу повтора: «весь текущий узел, не поле на
  нём». Без этой ветки пустая строка склеилась бы в `${base}/` — путь с висящим слэшем.
- `scopeTemplate` — копия узла-шаблона с относительными путями внутри, приведёнными к абсолютным
  для ОДНОГО элемента массива. Field-form repeat (`PWEB-171`) откладывает свой собственный
  `repeat.path` на этот же проход, а `bind`/`on`/`children` — на СЛЕДУЮЩИЙ, когда `growAll` уже
  знает индекс элемента.
- `grow` — разворачивает узел объявления в узел дерева и спускается в детей. Узел кладётся ДО
  спуска: дети ссылаются на владельца по имени, и имя должно быть занято раньше, чем его займёт
  повтор той же части глубже по дереву.
- `mergeRef` — сайт ссылки поверх найденного по имени шаблона (`PWEB-160`) — сайт ПОБЕЖДАЕТ при
  совпадении имени, тем же приёмом, что переопределение инстанса поверх мастер-компонента у Figma.
- `growAll` — один объявленный узел → ноль или больше выросших id: обычный узел даёт один, повтор
  — по числу элементов массива под `repeat.path`. `flatMap`, не `map`: шаблон повтора вправе сам
  оказаться повтором (вложенный список), и тогда один элемент внешнего массива даёт не один узел,
  а свои несколько.
