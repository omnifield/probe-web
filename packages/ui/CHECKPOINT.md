Чекпоинт — эталонирование @web-core/ui, передача другой сессии

Эта сессия упёрлась в то, что WEBCORE_SCOPE не задан при старте процесса (гейт governance.mjs
блокирует любую правку — safe-by-default). Файл нужен, чтобы следующая сессия (запущенная как
WEBCORE_SCOPE=ui claude) подхватила контекст без потери деталей. Как только новая сессия
прочитает это и продолжит работу — файл можно удалить, это не постоянная дока, а передача.

1. Где мы вообще находимся (общая рамка)

Идёт долгий проход по компонентам packages/ui/src/\* — "эталонирование": каждый компонент
получает честные README.md / FAQ.md / ROADMAP.yaml по канону (Главное → Анатомия → Использование →
Настройки → Состояния → IO → Сборки → Рецепт → Доступность, без "Навигация", с эмодзи в
заголовках, без тикетов).

Готовы (доведены до канона, порядок секций поправлен): accordion, avatar, button, table, diagram,
checkbox, toggle, toggle-group, switch, surface, slider, select, field, drawer, segment-group,
carousel, popover, date-picker, dialog, radio-group, listbox — 21 компонент. splitter —
осознанно пропущен, вопрос "заполнять ли playground сейчас или отдельной задачей" остался
неотвеченным пользователем.

flow — из его аудита родился крупный архитектурный поворот (см. п.2).

2. Главное открытие сессии — новый стандарт для доки и (следующим шагом) для кода

Аудит flow показал: Flow as={Surface} (два свежих, не-Ark, slotAware-компонента кита)
теряет адрес обёртки — точно так же, как раньше было замечено только для Ark-компонентов. Это
разрушило прежнее убеждение (было закреплено в surface/FAQ.md), что проблема — специфика Ark.

После долгого разговора с пользователем сформулирован стандарт (дословно принят пользователем,
внесён в packages/ui/README.md):

▎ Кит отдаёт наружу ровно один компонент на понятие. Что у него внутри — Ark, Kobalte, Zag или
▎ ничего — потребителю не видно и не важно. Сравнивать "наш as=" и "чужой asChild" как два
▎ конкурирующих механизма — категориальная ошибка, ЕСЛИ ТОЛЬКО кит сам не протекает: не отдаёт
▎ буквально чужой тип пропсов как свой публичный контракт (type XxxProps = ArkXxxProps), и не
▎ тащит чужое имя метода композиции (asChild) как задокументированный публичный пропс кита.

Ключевая цитата пользователя, которая теперь стандарт поведения доки в принципе:

▎ "если нам нужны в доке ссылке на первоисточник, это значит что в нашей доке дыры, а не то что
▎ нужно писать эту ссылку"

То есть: увидел, что тянет сослаться на Ark/Zag/Kobalte по имени — это сигнал дыры в СВОЕЙ доке,
закрывать через честную запись в ROADMAP.yaml категории "Не построено", а не через ссылку на
первоисточник.

Что уже сделано под этот стандарт

- В packages/ui/README.md добавлена секция <h3 id="свой-словарь-пропсов">🎭 Свой словарь пропсов, не чужой</h3> (текст — концепт, без инцидент-репорта, без дат — с первого захода это
  было отклонено пользователем именно за тон "не АДР и не роадмап").
- По всем 21 готовым компонентам прошёл чистка: убраны "тонкая обёртка", "компонент-первоисточник",
  имена Ark/Zag/Kobalte, названия коннекторов/методов (getRootProps, .connect.mjs), буквальные
  цитаты типов (XxxProps = ArkRootProps) из заголовков ROADMAP.
- Два места, где реально нужен рабочий Ark-импорт в примере кода (date-picker: parseDate;
  listbox: useListCollection), оставлены как есть в README, но каждое теперь имеет парную запись
  "Не построено" в ROADMAP.yaml — честно, что у кита нет своего аналога.
- surface/FAQ.md — переписан третий пункт: правило общее (любой компонент кита как as=-цель
  забирает адрес обёртки), а не "surface — особый случай про Ark".
- slider/README.md — пример "живой текст значения" переписан с Ark-паттерна на
  value/onValueChange; добавлена запись live-value-context в ROADMAP.
- carousel/FAQ.md+ROADMAP.yaml — переписаны без имён Ark-экспортов.
- checkbox/ROADMAP.yaml — категория CheckboxGroup-пробела переименована в честное
  "Не построено".

Что НЕ сделано (следующий большой пласт работы)

Пока переделан только уровень ДОКУМЕНТАЦИИ. Уровень КОДА — то, что компоненты реально объявляют
type XxxProps = ArkXxxProps вместо своего типа — ещё не тронут ни в одном компоненте. План:
идти по одному компоненту, начиная с button (пользователь сказал начать с кнопки).

3. Аудит button — сделан, план — не дан

Полный аудит button (entity/anatomy/passport/io/components/root.tsx) сделан и озвучен
пользователю. Пользователь сказал "потом я скажу план" — план ещё не пришёл, работу по кнопке
не начинать самовольно, ждать.

Найдено при аудите:

- components/root.tsx: export type ButtonProps<T> = PolymorphicProps<T, ButtonRootProps<T>> —
  ровно тот протекающий тип, который и есть предмет нового стандарта.
- entity/anatomy.ts, entity/passport.ts (есть selfAssembly с on.click → select),
  entity/io.ts — чистые, свои, вопросов нет.
- test/button.test.tsx — в строках describe() остались тикеты (PWEB-168, PWEB-169,
  PWEB-187/191). Это тот же класс проблемы, что чистили в доках, но в тестовом коде — раньше
  такой паттерн (тикеты в recipe.test.tsx) признавался repo-wide и вне текущего скоупа. Флаг
  есть, действия по нему не запрошено и не дано.

4. Icon — новый компонент, СТРОИТСЯ СЕЙЧАС, заблокирован на последнем шаге

Пользователь прервал очередь (кнопка → план) ради иконок: "половина компонентов уже юзает [иконки],
и потом будет дорого возвращяться". Обсуждение и решение:

- Иконки — НЕ новая пара part/assembly (первая идея пользователя — сборка-подмодуль под каждую
  категорию Lucide, иконки как parts). Поправлено и принято: иконка — это content, genus: "icon",
  вопрос ЗНАЧЕНИЯ, а не паспорта/анатомии.
- Icon — обычный компонент кита в packages/ui/src/icon/, НЕ отдельный пакет (пользователь сам
  поправил первую идею с отдельным packages/icons).
- Публичный пропс — name: string, свободная строка кита, не завязанная на конкретное имя экспорта
  Lucide. Резолвинг конкретной библиотеки — только внутри, невидим снаружи.
- Проверено вживую (curl по реальному опубликованному lucide-solid@1.41.0): пакет отдаёт
  wildcard-подпуть "./icons/_" → ./dist/esm/icons/_.mjs — то есть каждая иконка импортируется
  отдельным файлом (import(\lucide-solid/icons/${name}.mjs`)) без всякой кодогенерации/реестра. Подтверждено: файл реально существует локально в packages/ui/node_modules/lucide-solid/dist/esm/icons/chevron-down.mjs, экспортирует export { ChevronDown as default }`.
- Пользователь одобрил: "четко! го!"

Что уже готово (лежит на диске, не закоммичено)

- packages/ui/package.json — добавлена зависимость "lucide-solid": "^1.41.0" (уже реально
  установлена в node_modules, pnpm install --filter @web-core/ui прогнан).
- packages/ui/src/icon/entity/{anatomy.ts,passport.ts,io.ts,index.ts} — готовы. Одна часть
  root, без состояний, input: { name: z.string() }.
- packages/ui/src/icon/components/root.tsx — готов. НЕ использует slotAware/Polymorphic/as=
  (осознанно — у иконки нет осмысленного кейса "нарисуй другим тегом"). Логика:
  createResource(() => local.name, resolveIcon) → <Show when={resolved()}>{(Loaded) => <Dynamic component={Loaded()} {...anatomyParts.root.attrs} />}</Show>, где resolveIcon
  делает await import(\lucide-solid/icons/${name}.mjs`)`.
  ВАЖНО: этот механизм ни разу не проверен эмпирически — реально ли Vite/Vitest в этом репо
  резолвят такой динамический импорт с шаблонной строкой в подпуть пакета. Это главный
  технический риск, который надо проверить первым делом.
- packages/ui/src/icon/components/index.ts, packages/ui/src/icon/index.ts — барели, готовы.
- packages/ui/src/icon/playground/{parts.ts,index.ts,recipe.ts,assemblies/basic.ts, assemblies/index.ts} — готовы (лежат на диске, содержимое уже корректно).

Что заблокировано и не выполнено

- packages/ui/src/icon/test/icon.test.tsx — директория пустая, файл НЕ записан. Write дважды
  отклонён governance-хуком (WEBCORE_SCOPE не задан). Черновик теста (три describe: рендер
  <Icon name="chevron-down" /> напрямую, рендер <Icon name="trash-2" />, рендер сборки basic
  через <RenderTree>) — приведён полностью ниже, чтобы не терять формулировки.
- icon/README.md, icon/FAQ.md, icon/ROADMAP.yaml — не начаты вообще.
- Полный прогон pnpm vitest/tsc/eslint для пакета — не запускался после добавления icon.
- Не решено (было предложено, не подтверждено срочным): научить packages/assembly's
  render-engine (packages/assembly/src/render/index.tsx) реально резолвить genus: "icon" —
  сейчас движок рендерит любой content-узел одинаково через {valueOf()}, то есть даже сборка
  basic выше рендерится через сам компонент Icon, а не через типовой content-рендер. Это
  отдельный вопрос, спросить пользователя, нужен ли он прямо сейчас.

Черновик теста (не записан на диск, вставить в packages/ui/src/icon/test/icon.test.tsx)

import { createRegistry, type ReadableComponent, type Registry } from "@web-core/assembly";
import { RenderTree } from "@web-core/assembly/render";
import { admits, baseAssemblyOf } from "@web-core/skin/editor";
import type { PassportAssembly, PassportEditorInfo } from "@web-core/skin/editor";
import type { ComponentPassport } from "@web-core/skin/model";
import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { Icon, kit as iconKit } from "../components/index.js";
import { passport as iconPassport } from "../entity/passport.js";
import { assemblies } from "../playground/assemblies/index.js";
import { editorInfo as iconEditorInfo } from "../playground/index.js";

function readable<Part extends string, Data = unknown>(
passport: ComponentPassport<Part>,
editorInfo: PassportEditorInfo<Part, string, Data>,
): ReadableComponent["passport"] {
return {
component: passport.component,
genus: editorInfo.genus,
anatomy: passport.anatomy,
root: passport.root,
parts: passport.parts.map((part) => ({
name: part.name,
accepts: editorInfo.parts[part.name]?.accepts,
})),
selfAssembly: passport.selfAssembly as any,
};
}

const REGISTRY: Registry = createRegistry({
components: {
icon: { passport: readable(iconPassport, iconEditorInfo), parts: iconKit.parts },
},
admits,
});

let dispose: (() => void) | undefined;

afterEach(() => {
dispose?.();
dispose = undefined;
document.body.innerHTML = "";
});

describe("Icon — resolves a real lucide icon by name", () => {
it("renders a real <svg> with the kit's own address, not a placeholder", async () => {
const host = document.createElement("div");
document.body.append(host);

    dispose = render(() => <Icon name="chevron-down" />, host);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const svg = host.querySelector('svg[data-scope="icon"][data-part="root"]');
    expect(svg).not.toBeNull();
    expect(svg?.querySelector("path")).not.toBeNull();

});

it("resolves a different name to a visibly different icon", async () => {
const host = document.createElement("div");
document.body.append(host);

    dispose = render(() => <Icon name="trash-2" />, host);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const svg = host.querySelector('svg[data-scope="icon"][data-part="root"]');
    expect(svg?.innerHTML).toContain("path");

});
});

describe('icon "basic" assembly — one icon by fixed name, through the real engine', () => {
it("renders through RenderTree with the kit's address", async () => {
const assembly = assemblies.find((candidate) => candidate.name === "basic")!;
const tree = baseAssemblyOf(iconPassport, assembly as PassportAssembly, "icon", {});

    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(() => <RenderTree registry={REGISTRY} tree={tree} data={{}} />, host);

    await new Promise((resolve) => setTimeout(resolve, 0));

    const svg = host.querySelector('svg[data-scope="icon"][data-part="root"]');
    expect(svg).not.toBeNull();

});
});

5. Немедленные следующие шаги для новой сессии (по порядку)

1. Записать packages/ui/src/icon/test/icon.test.tsx (черновик выше) и прогнать. Если
   import(\lucide-solid/icons/${name}.mjs`)не резолвится Vite/Vitest — это первое, что надо починить вcomponents/root.tsx, не подгонять тест под неверный компонент. ⚠️ Свериться, что data-scope="icon"в тесте совпадает с реальным атрибутом изentity/passport.ts` — прочитать файл перед прогоном, не полагаться на память.
1. Прогнать полный vitest/tsc/eslint для packages/ui, поймать регрессии от новой
   зависимости/компонента.
1. Написать icon/README.md + icon/FAQ.md + icon/ROADMAP.yaml по канону (см. п.1) — для
   Icon это первый проход, шаблон брать по духу с surface (тоже свежий, не-Ark компонент), но
   без раздела про as=/полиморфизм, раз его тут нет.
1. Спросить пользователя, нужно ли прямо сейчас учить рендер-движок (packages/assembly)
   реальному резолвингу genus: "icon", или это отдельная будущая задача — сейчас это только
   предложено, не подтверждено.
1. Только после Icon — вернуться к button и ждать план от пользователя (он сказал "потом я скажу
   план", план ещё не пришёл — не начинать переделку кнопки самовольно).
1. Держать в уме зависший вопрос про splitter (заполнять playground сейчас или отдельной
   задачей) — не отвечен, спросить при случае, не решать самому.

1. Правила поведения, актуальные для этой сессии (из памяти + этой сессии)

- Ничего не чинить/не переделывать без явной команды — даже когда видно протёкший тип, ждать план.
- Не обходить governance-гейт никаким способом (симлинки, относительные пути, самостоятельная
  простановка WEBCORE_SCOPE внутри сессии) — гейт читает окружение процесса сессии, которое
  задаётся только при старте (WEBCORE_SCOPE=ui claude), внутри уже стартовавшей сессии это не
  подставить.
- Дока: без ссылок на Ark/Zag/Kobalte по имени, без имён коннекторов/методов, без тикетов, без
  ручного оглавления. Если тянет сослаться на первоисточник — значит дыра в доке, закрывать через
  "Не построено" в ROADMAP, не через ссылку.
- Один открытый вопрос за раз, разговорным языком в конце сообщения — не вываливать простыню.
- Эмпирическая проверка обязательна перед тем, как что-то писать в доку как факт — либо реально
  проверено (тест/дебаг-прогон), либо честно помечено "непроверено"/"не построено".
