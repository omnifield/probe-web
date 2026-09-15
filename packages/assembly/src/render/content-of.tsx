// см. README.md / FAQ.md

import { type Component, createMemo, createRoot, For, getOwner, onCleanup, runWithOwner, untrack, type JSX } from "solid-js";

import { isContent, type AssemblyNode, type NodeId } from "../engine/tree.js";
import { takesContent } from "./takes-content.js";
import type { RenderNodeProps } from "./types.js";

/**
 * Дети узла — либо объявленные в дереве (`<For>` по `children`), либо живой контент слота
 * (`props.slots`), либо `null`. `RenderNode` передаётся аргументом, не импортом — сама рекурсия
 * (детьми узла снова могут быть узлы) собирается в `render-node.tsx`, эта фабрика её только
 * зовёт, обратной зависимости файла на файл нет.
 *
 * `declared` собирается ОДИН РАЗ, СНАРУЖИ мемо (`each` внутри несёт свой геттер — сам остаётся
 * реактивным). Две ловушки, обе найдены эмпирически (PWEB, 2026-09-06):
 *
 * 1) Если строить `<For>`+детей ВНУТРИ тела мемо (даже за ленивым `if (declared === undefined)`),
 *    они попадают в число «усыновлённых» этим самым мемо на первом заходе — а Solid при КАЖДОМ
 *    следующем пересчёте мемо сперва диспоузит всё усыновлённое на прошлом заходе, ПУСТЬ ДАЖЕ
 *    выход мемо не поменяется. Вторая пересборка дерева уже попадает на мёртвых детей.
 * 2) Проверка «есть ли вообще дети» не может читать `node()` СНАРУЖИ мемо напрямую (реактивно)
 *    — тогда эта подписка на `props.tree` утекает потребителю `props.children`, тот сам
 *    переподписывается на каждую пересборку, и ТА ЖЕ история — Solid диспоузит усыновлённое им
 *    (сам мемо, созданный внутри) при каждой такой переподписке. Отсюда `untrack`: снимок
 *    структуры берём один раз, без подписки, а не через `node()` в теле функции контейнера.
 * 3) `declared` строится «снаружи мемо», но всё равно ВНУТРИ первого вызова `contentOf()` —
 *    а этот первый вызов сам происходит ВНУТРИ чужого реактивного владельца: потребителя
 *    `props.children` (обычно эффект `insert()`, что вставляет детей узла в DOM). Пока
 *    `contentCache.memo()` отдаёт `null` (детей ещё нет), этот потребитель не перезапускается —
 *    незачем. Как только у узла появляется ПЕРВЫЙ ребёнок, выход мемо реально меняется
 *    (`null`→`declared`) — потребитель ОБЯЗАН перезапуститься, чтобы вставить `declared` в DOM, а
 *    Solid ПЕРЕД повторным запуском эффекта диспоузит всё, что тот усыновил на ПРОШЛОМ заходе —
 *    то есть сам `<For>`, ведь он был построен именно на этом (первом) заходе ЭТОГО ЖЕ
 *    потребителя. Ссылка `declared` переживает (это просто JS-переменная), но её внутренняя
 *    реактивность уже мертва — рост `node().children` дальше ПОСЛЕ первого ребёнка никто не
 *    подхватывает (`content-of-for-freezes-after-first-nonempty`, ROADMAP.yaml).
 *
 *    ПЕРВАЯ попытка лечения — `runWithOwner(getOwner_из_тела_createContentOf, () => <For>...)`,
 *    т.е. усыновить `<For>` владельцем самого `RenderNode`, а не транзитного потребителя. СЛОМАЛА
 *    контекст: `getOwner()`, вызванный в теле `createContentOf` (тело `RenderNode`, синхронно, ДО
 *    того как `rendered()` вообще построит `Comp`), стоит ВЫШЕ того места, где `Comp` (например
 *    `Select.RootProvider`) заводит СВОЙ контекст — `runWithOwner` туда перепривязывает не только
 *    ДИСПОУЗ, но и РАЗРЕШЕНИЕ КОНТЕКСТА (`useContext` идёт по цепочке владельцев, не по DOM), а
 *    значит части ВНУТРИ этого контекста (`label`/`control`/`positioner` — дети ROOT'а, не только
 *    `content`) ловят `useSelectContext() === undefined`. Другими словами: нужен был владелец,
 *    который не пересобирается САМ, но ОСТАЁТСЯ внутри чужого контекста — `getOwner()` в теле
 *    `createContentOf` не годится НИ ОДНОМУ узлу, чей `Comp` заводит контекст для своих детей.
 *
 *    РАБОЧЕЕ лечение — `createRoot((dispose) => <For>...)`: контекст СОХРАНЯЕТСЯ (Solid: root с
 *    АРНОСТЬЮ-1 колбэком, `dispose` явным параметром, — не «unowned», наследует `context` от
 *    ТЕКУЩЕГО владельца на момент вызова, `dev.js`'s `createRoot`, `current.context`) — то есть
 *    выполняется ТАМ ЖЕ, где выполнялся раньше (внутри того самого первого вызова `contentOf()`,
 *    внутри контекста `Comp`), просто с СОБСТВЕННОЙ, независимой от родителя, границей диспоуза.
 *    Родительский (транзитный) эффект больше не может утащить `<For>` за собой при повторном
 *    запуске — `createRoot`'s диспоуз вызывается вручную, не автоматическим каскадом очистки
 *    родителя. Ручной вызов пристёгнут через `onCleanup` к ДРУГОМУ, долгоживущему владельцу —
 *    тому самому `getOwner()` из тела `createContentOf` (тело `RenderNode`), но ТОЛЬКО как
 *    получатель события «размонтировался НАВСЕГДА», не как владелец рендера/контекста.
 *
 * Итог: мемо ниже читает `node()` только ради решения «слот или объявленное», это единственная
 * его настоящая реактивная зависимость; сам вывод стабилен, пока слот не поменялся, поэтому
 * потребитель `props.children` не видит «мемо поменялся» на каждую пересборку и не диспоузит
 * сам мемо. Пусто — `null`, не пустой `<For>`: чужие компоненты различают их (Ark-паттерн
 * `props.children ?? "*"` — пустой `<For>` truthy, дефолт молча не срабатывает).
 *
 * Ветка null-vs-`<For>` — ДВА независимых критерия, не один, каждый решает свой вопрос:
 *
 * 1) МОЖЕТ ли эта часть вообще принимать контент — `takesContent(registry, type)`,
 *    СТРУКТУРНОЕ свойство адреса из реестра (тот же тест уже стоит в `rendered()` для оверлея),
 *    решает, строить ли `declared` (`<For>`) ВООБЩЕ. Часть, закрытая по реестру (например
 *    trigger), получает `declared = null` раз и навсегда — `<For>` для неё не заводится, дальше
 *    вопрос не в этом файле.
 * 2) ЕСТЬ ли у неё дети ПРЯМО СЕЙЧАС — `cur.children.length === 0`, решает, отдать `declared`
 *    (если он вообще есть) или `null` для ЭТОГО прохода. Эта проверка живёт ВНУТРИ тела
 *    `createMemo` (где и так уже читается `node()` ради слота) — не нарушает ловушку 2) выше,
 *    та про чтение `node()` СНАРУЖИ мемо, а не про чтение внутри его собственного тела, которое
 *    и так уже реактивная зависимость мемо. Мемо честно пересчитывается на каждую пересборку
 *    дерева и может вернуть то `null`, то `declared` — обе ветки стабильные ссылки
 *    (`null === null`, `declared === declared`, JSX объекта не пересоздаёт), значит потребитель
 *    `props.children` видит «мемо поменялось» ровно тогда, когда решение РЕАЛЬНО поменялось
 *    (пусто↔непусто), и не переподписывается вхолостую — ловушка 1) тоже не нарушена, `<For>`
 *    как строился один раз СНАРУЖИ мемо, так и продолжает.
 *
 * Было (первая версия, PWEB-2026-09-10, коммит 4b5ce9a): критерий 2) отсутствовал вовсе —
 * `declared` отдавался как есть, стоило пройти критерий 1). Чинило репро-баг `select`'а (см.
 * ниже), но ломало реальный кит: `field`'s `requiredIndicator` и `table`'s заголовки — части,
 * которые ПО РЕЕСТРУ принимают контент (критерий 1 = true), но у конкретного узла нет ни
 * одного ребёнка НИКОГДА (не `repeat`, просто по условию — необязательное поле, невключённая
 * сортировка). Раньше (до самого первого бага) такие части получали `null` (`children.length
 * === 0` на первом чтении) — Ark-дефолт срабатывал. Первая версия фикса стала ВСЕГДА отдавать
 * `declared` (пустой, но truthy `<For>`) для любой структурно-открытой части — дефолт `field`/
 * `table` молча переставал срабатывать, найдено architect'ом `pnpm --filter @web-core/ui test`
 * (270/275, не 275/275) при ревью, см. `content-of-null-vs-for-breaks-ark-native-defaults` в
 * ROADMAP.yaml.
 *
 * Изначальный баг (`content-of-null-vs-for-by-structure`, ROADMAP.yaml): узел монтируется
 * раньше, чем `repeat` успевает развернуть детей (данные ещё не приехали), `children.length` на
 * первом чтении — 0. Критерий 2), в отличие от ПЕРВОЙ версии этого фикса, не кэшируется —
 * читается заново на каждую пересборку дерева ВНУТРИ мемо, значит «пусто на монтировании, потом
 * приехали данные» и «пусто навсегда» больше не путаются: первое даёт `null`→`declared` по мере
 * прихода данных, второе — стабильный `null` всегда. Разбор заявки, приведшей к обоим заходам —
 * FAQ.md, `test/contentof-null-vs-for.test.tsx` доказывает оба случая на голом реестре.
 */
export function createContentOf(
  props: RenderNodeProps,
  node: () => AssemblyNode | undefined,
  ownProps: () => Record<string, unknown>,
  RenderNode: Component<RenderNodeProps>,
): () => JSX.Element | null {
  const contentCache: { memo?: () => JSX.Element | null; context?: unknown } = {};
  // Долгоживущий владелец `RenderNode`'а САМОГО — ТОЛЬКО получатель финального `dispose` ниже
  // (сигнал «узел размонтирован НАВСЕГДА»), не владелец рендера/контекста для `<For>` (см. ловушку
  // 3)). Переживает ЛЮБОЕ число пересборок `declared` (see ниже, `PWEB-215`) — сам он не меняется.
  const lifetimeOwner = getOwner();
  let currentDispose: (() => void) | undefined;
  if (lifetimeOwner) runWithOwner(lifetimeOwner, () => onCleanup(() => currentDispose?.()));

  return function contentOf(): JSX.Element | null {
    // `Owner.context` (та же приватная деталь, что докблок выше уже опирается на неё цитатой из
    // `dev.js`) — объект контекстов ТЕКУЩЕЙ цепочки владельцев; `useContext` внутри читает именно
    // его (`Owner.context[id]`). Обычный потомок НАСЛЕДУЕТ ту же самую ссылку от родителя, новый
    // `<X.Provider>` заводит НОВУЮ (`Owner.context = {...Owner.context, [id]: value}`) — значит
    // сравнение по ссылке ловит РОВНО «между двумя вызовами появился/исчез provider», не «это
    // другой DOM-эффект» (`DoubleReader` в `slots.test.tsx`: два места чтения `props.children` в
    // ОДНОМ теле компонента — два разных транзитных эффекта, но ОДНА и та же цепочка провайдеров,
    // `.context` совпадает, кэш ЗАКОННО не перестраивается).
    const callerContext = (getOwner() as { context?: unknown } | null)?.context;
    // PWEB-215 — та же ловушка №3 из докблока выше, но с ДРУГОЙ стороны: кэш по «уже строили
    // хоть раз» ломается, когда СТРУКТУРА-обёртка вокруг `props.children` у ЧУЖОГО компонента
    // меняется ПОСЛЕ первого вызова (не только у content — у самого узла-хозяина `contentOf`),
    // а НОВАЯ обёртка заводит СВОЙ provider, которого закэшированный `declared` не видит (доказано
    // голым тестом, `test/nested-provider-lazy-open.test.tsx`). Живой баг `tree-view` (ROADMAP.yaml,
    // `composite-context-lost-for-label-control-positioner-recurrence`) ПОХОЖ по симптому
    // (`useCollapsibleContext() === undefined` у детей, добавленных `recur`'ом), но эмпирически
    // (реальный браузер, трассировка `Owner.context` до/после) НЕ ловится этим сравнением — там
    // `contentOf()` для «content»-узла зовётся из ОДНОГО и ТОГО ЖЕ владельца что до, что после
    // перехода лист→ветка (значит `declared` строится ОДИН раз и переиспользуется ЗАКОННО с точки
    // зрения этой проверки), и уже на ПЕРВОМ построении `callerContext` пуст — не хватает даже
    // контекста, установленного `TreeRoot`'ом заметно выше. Разбор (RenderTree's единый
    // `<Suspense>` + `recur`-узел того же адреса, что и корень, + множество вложенных `createRoot`
    // на каждом уровне) — в ROADMAP, не решён этим фиксом.
    if (!contentCache.memo || contentCache.context !== callerContext) {
      currentDispose?.();
      contentCache.context = callerContext;
      const current = untrack(node);
      const declared =
        !current || isContent(current) || !takesContent(props.registry, current.type) ? null : (
          createRoot((dispose) => {
            currentDispose = dispose;
            return (
              <For each={(node()?.children ?? []) as readonly NodeId[]}>
                {(childId) => (
                  <RenderNode
                    nodeId={childId}
                    tree={props.tree}
                    registry={props.registry}
                    fallback={props.fallback}
                    errorFallback={props.errorFallback}
                    editOverlay={props.editOverlay}
                    data={props.data}
                    dispatch={props.dispatch}
                    slots={props.slots}
                  />
                )}
              </For>
            );
          })
        );

      contentCache.memo = createMemo(() => {
        const cur = node();
        if (!cur) return null;

        const entry = !isContent(cur) ? props.slots?.[cur.type] : undefined;
        if (!entry) return cur.children.length === 0 ? null : declared;

        const rendered = entry.render(ownProps());
        const placement = entry.placement ?? "replace";
        if (placement === "before") return <>{rendered}{declared}</>;
        if (placement === "after") return <>{declared}{rendered}</>;
        return rendered;
      });
    }
    return contentCache.memo();
  };
}
