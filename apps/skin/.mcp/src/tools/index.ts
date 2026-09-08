import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "@web-core/io";
import { err, ok, registerTool } from "@web-core/mcp";
import { paginate } from "@web-core/mcp/pagination";
import { OutfitRefused } from "@web-core/skin";
import { GROUPS, type ComponentGroup } from "@web-core/skin/editor";
import { DEFAULT_TAG, groupByTag, sortTags } from "@web-core/skin/tags";
import {
  browser,
  checkAssembly,
  checkContentData,
  checkForm,
  checkPalette,
  checkTags,
  getDoc,
  getPassport,
  listComponents,
  listDocs,
  skin,
  skinGaps,
  store,
} from "../engine";

const KIND = z.enum(["palette", "form", "outfit", "assembly", "tag"]);
// Список групп берётся у кита, не переписывается здесь: разойдись они — фильтр молча пустеет.
const GROUP = z.enum(Object.keys(GROUPS) as [ComponentGroup, ...ComponentGroup[]]);
const FOOTPRINT = z.enum(["compact", "regular", "wide"]);
const STATUS_FILTER = z.enum(["open", "resolved", "all"]);
const looseRecord = z.looseObject({ name: z.string() });

// Заявка без поля status — та, что записана до появления разбора: она открыта, а не «непонятно».
function statusOf(state: unknown): string {
  const said = (state as { status?: unknown } | null)?.status;
  return said === "resolved" ? "resolved" : "open";
}

// Владение, не админ: у записи уже есть author — трогать её может только запрос с ТЕМ ЖЕ author,
// не отдельный секрет и не одно защищённое имя на всех. Нет author у существующей записи — никем
// не занята, пишет кто угодно. author приезжает с запросом от платформы, которая уже знает, с каким
// залогиненным юзером говорит — сама эта зона identity не проверяет (см. FAQ.md), только сверяет
// строки, поэтому здесь никогда не было и не будет отдельного секрета вида adminToken.
async function authorGuard(kind: string, name: string, nextAuthor: string | undefined): Promise<string | undefined> {
  const existing = await store.findByName(kind, name);
  if (!existing) return undefined;

  const currentAuthor = ((await store.read(existing.id)).state as { author?: unknown })["author"];
  if (typeof currentAuthor !== "string") return undefined;

  if (nextAuthor !== currentAuthor) {
    return `"${kind}/${name}" is owned by "${currentAuthor}" — only requests with that author may modify it`;
  }

  return undefined;
}

async function resolveTags(rawTags: unknown, where = "tags") {
  const requested = Array.isArray(rawTags) ? rawTags.filter((t): t is string => typeof t === "string") : [];
  const tags = sortTags(requested.length > 0 ? requested : [DEFAULT_TAG]);
  return { tags, flaws: await checkTags(tags, where) };
}

async function resolveVariantTags(form: Record<string, unknown>) {
  const recipe = form["recipe"] as { variants?: Record<string, unknown> } | undefined;
  const variantNames = Object.keys(recipe?.variants ?? {});
  const provided = (form["variantTags"] as Record<string, unknown> | undefined) ?? {};

  const variantTags: Record<string, string[]> = {};
  const flaws: Awaited<ReturnType<typeof checkTags>> = [];

  for (const name of variantNames) {
    const resolved = await resolveTags(provided[name], `variantTags.${name}`);
    variantTags[name] = resolved.tags;
    flaws.push(...resolved.flaws);
  }

  return { variantTags, tagGroups: groupByTag(variantTags), flaws };
}

export function registerTools(server: McpServer) {
  // Своя вкладка на СЕССИЮ, не на весь сервер — registerTools зовётся заново на каждую новую
  // сессию (@web-core/mcp/transport), значит замыкание здесь и есть та самая изоляция, ту же роль
  // у store.ts играет пер-сессийная карта на уровне транспорта, здесь она не нужна — замыкания
  // достаточно.
  let pageId: number | undefined;

  async function ensurePage(): Promise<number> {
    if (pageId === undefined) pageId = await browser.newPage();
    return pageId;
  }

  registerTool(server, {
    name: "list_components",
    title: "Компоненты кита",
    description:
      "Перечень компонентов, у которых есть паспорт — то, что вообще можно одеть. Карточка на каждый: род, " +
      "группа, размерность (footprint), пакет, СКОЛЬКО частей и имена готовых сборок-образцов (кодовых, не " +
      "хранимых). Сами части, состояния и описания сборок — в get_passport по выбранному компоненту: там они " +
      "стоят одного компонента, здесь стоили бы всех сразу. Сужайте group/footprint — так ответ короче " +
      "выборки глазами; страница по cursor/limit (по умолчанию 50), как у list_presets.",
    access: "read",
    input: z.object({
      group: GROUP.optional().describe("группа компонента; не названа — все группы"),
      footprint: FOOTPRINT.optional().describe("размерность компонента; не названа — все"),
      cursor: z.string().optional().describe("курсор из предыдущей страницы"),
      limit: z.number().int().positive().optional(),
    }),
    handler: ({ group, footprint, cursor, limit }) =>
      ok(paginate(listComponents({ group, footprint }), { cursor, limit })),
  });

  registerTool(server, {
    name: "list_docs",
    title: "Перечень тематических доков",
    description:
      "Список docs/*.md этой зоны — заголовок каждого файла, без содержимого. README.md держит только костяк " +
      "(что есть, как вызывать), объёмный разбор конкретной темы (например цвет наряда) живёт отдельным " +
      "файлом и подтягивается get_doc ТОЛЬКО когда он реально нужен для текущей задачи — не платите токенами " +
      "на каждую сессию за темы, которые сейчас не при делах.",
    access: "read",
    handler: async () => ok(await listDocs()),
  });

  registerTool(server, {
    name: "get_doc",
    title: "Содержимое тематического дока",
    description: "Сырой markdown одного docs/<topic>.md — имя topic берите из list_docs.",
    access: "read",
    input: z.object({ topic: z.string() }),
    handler: async ({ topic }) => {
      const content = await getDoc(topic);
      return content === undefined ? err(`no doc named "${topic}" — see list_docs`) : ok(content);
    },
  });

  registerTool(server, {
    name: "get_passport",
    title: "Паспорт компонента",
    description:
      "Паспорт компонента структурированно: части, состояния (с mark), настройки (с mark/умолчанием/dependsOn), " +
      "переменные, admission по частям (что можно вложить), io-схема (JSON Schema), сборки-образцы и means — " +
      "разведка перед тем, как писать палитру/форму/сборку.",
    access: "read",
    input: z.object({ component: z.string().describe("имя компонента, оно же data-scope") }),
    handler: ({ component }) => {
      const info = getPassport(component);
      return info ? ok(info) : err(`unknown component "${component}" — no passport in the kit`);
    },
  });

  registerTool(server, {
    name: "list_presets",
    title: "Перечень сохранённого",
    description:
      "Что уже лежит в службе пресетов, по ярлыку вида (без него — все пять видов, без пагинации). " +
      "С ярлыком — страница по cursor/limit (по умолчанию 50), не весь список разом. kind:\"tag\" — " +
      "словарь допустимых тегов наряда (см. check_outfit/save_preset).",
    access: "read",
    input: z.object({
      kind: KIND.optional().describe("ярлык вида; не назван — отдаются все пять, без пагинации"),
      cursor: z.string().optional().describe("курсор из предыдущей страницы; только вместе с kind"),
      limit: z.number().int().positive().optional(),
    }),
    handler: async ({ kind, cursor, limit }) => {
      if (kind) return ok(paginate(await store.list(kind), { cursor, limit }));

      const kinds = ["palette", "form", "outfit", "assembly", "tag"] as const;
      const byKind = Object.fromEntries(await Promise.all(kinds.map(async (k) => [k, await store.list(k)])));
      return ok(byKind);
    },
  });

  registerTool(server, {
    name: "get_preset",
    title: "Содержимое сохранённого",
    description:
      "Содержимое одной записи по имени и ярлыку вида. Ответ — конверт целиком ({id,label,...,state}). " +
      "Другим ручкам (check_form/check_outfit/save_preset/assemble_preview) передавайте поле .state, " +
      "а не весь этот ответ — они ждут голое содержимое Palette/Form/Outfit/ComponentAssembly.",
    access: "read",
    input: z.object({ kind: KIND, name: z.string() }),
    handler: async ({ kind, name }) => {
      const record = await store.findByName(kind, name);
      if (!record) return err(`no "${kind}" record named "${name}"`);
      return ok(await store.read(record.id));
    },
  });

  registerTool(server, {
    name: "check_palette",
    title: "Проверить палитру",
    description:
      "Проверяет палитру ДО сохранения — закрытие словаря ролей, легальность шкал. Своей функции для одной " +
      "палитры у механики нет: проверка идёт синтетическим нарядом без форм (checkOutfit проверяет палитру " +
      "безусловно), тем же путём, каким проверяется настоящий наряд.",
    access: "read",
    input: z.object({ palette: looseRecord.describe("Palette целиком, включая name") }),
    handler: async ({ palette }) => ok(await checkPalette(palette as never)),
  });

  registerTool(server, {
    name: "check_form",
    title: "Проверить форму (рецепт компонента)",
    description:
      "Проверяет рецепт ДО сохранения в два прохода: ссылки (роль/переменная существует?) — тем же checkOutfit, " +
      "что и наряд, затем адрес (часть/состояние/настройка существуют у паспорта?) — checkSkin на собранном " +
      "скине. Плюс unknown-tag по каждому значению recipe.variants против словаря (kind:\"tag\") — тот же " +
      "механизм, что и tags наряда, только на уровне значения варианта, не всей записи. Опечатка возвращается " +
      "с адресом, не тихим неприменением. Нужна палитра для сверки ролей — не назвали paletteName, берётся " +
      "первая из службы. При ok:true в ответе есть tagGroups — variantTags, перевёрнутые в тег→варианты " +
      "(отсортировано, default первым) — готовая раскладка для свайперов/витрины по группам.",
    access: "read",
    input: z.object({
      form: looseRecord
        .extend({ component: z.string() })
        .describe("Form целиком: name, component, recipe, keyframes?, variantTags?: {[имя варианта]: string[]}"),
      paletteName: z.string().optional(),
    }),
    handler: async ({ form, paletteName }) => {
      const result = await checkForm(form as never, paletteName);
      const { flaws: variantTagFlaws, tagGroups } = await resolveVariantTags(form as Record<string, unknown>);
      if (variantTagFlaws.length === 0) return ok({ ...result, tagGroups });
      return ok({
        ...result,
        ok: false,
        referenceFlaws: [...result.referenceFlaws, ...variantTagFlaws],
        css: undefined,
      });
    },
  });

  registerTool(server, {
    name: "check_assembly",
    title: "Проверить сборку компонента",
    description:
      "Проверяет дерево сборки (PassportAssembly) ДО сохранения, в два прохода. Структура — обход " +
      "admits()/анатомии, тот же обход, которым checkAssembly проверяет кодовые сборки кита при загрузке " +
      "модуля. Данные — КАЖДЫЙ bind/repeat.path сверяется с примером по io-схеме компонента (checkAssemblyData); " +
      "это то, чего checkAssembly НЕ делает вовсе (сама не читает bind/props/on) — опечатка в пути раньше " +
      "проходила как ok:true. Компонент без entity/io.ts — dataCheck: \"skipped\", не тихий успех.",
    access: "read",
    input: z.object({ component: z.string(), assembly: z.looseObject({ name: z.string() }) }),
    handler: ({ component, assembly }) => ok(checkAssembly(component, assembly)),
  });

  registerTool(server, {
    name: "check_outfit",
    title: "Проверить наряд",
    description:
      "Прямой проброс checkOutfit(outfit, parts): unknown-palette/unknown-form/palette-incomplete/" +
      "component-twice/unknown-component/outside-vocabulary/variable-elsewhere и т.д, плюс unknown-tag " +
      "по словарю (kind:\"tag\") — tags пустой считается [\"default\"]. Палитра и формы резолвятся по " +
      "имени из службы целиком (как и настоящий клиент витрины).",
    access: "read",
    input: z.object({ outfit: looseRecord.extend({ palette: z.string(), forms: z.array(z.string()) }) }),
    handler: async ({ outfit }) => {
      const palettes = await store.readPalettes();
      const forms = await store.readForms();
      const flaws = skin.checkOutfit(outfit as never, { palettes, forms });
      const { flaws: tagFlaws } = await resolveTags((outfit as Record<string, unknown>)["tags"]);
      const allFlaws = [...flaws, ...tagFlaws];
      return ok({ ok: allFlaws.length === 0, flaws: allFlaws });
    },
  });

  registerTool(server, {
    name: "assemble_preview",
    title: "Собрать и увидеть текстом",
    description:
      "Собирает наряд (assemble), отдаёт CSS-текст (generateSkinCss) и покрытие (skinGaps) — минимальный " +
      "уровень обратной связи v1: без скриншота, но видно, что реально сгенерируется, и что ещё не одето. " +
      "Наряд с флавами не собирается — отдаёт их вместо CSS, ничего не выдумывая за автора.",
    access: "read",
    input: z.object({ outfit: looseRecord.extend({ palette: z.string(), forms: z.array(z.string()) }) }),
    handler: async ({ outfit }) => {
      const palettes = await store.readPalettes();
      const forms = await store.readForms();
      const parts = { palettes, forms };

      try {
        const assembled = skin.assemble(outfit as never, parts);
        const css = skin.generateSkinCss(assembled.skin);
        const gaps = skinGaps(assembled.skin);
        return ok({ report: assembled.report, gaps, css });
      } catch (cause) {
        if (cause instanceof OutfitRefused) return ok({ flaws: cause.flaws });
        throw cause;
      }
    },
  });

  registerTool(server, {
    name: "save_preset",
    title: "Сохранить запись",
    description:
      "Кладёт запись в службу ПОСЛЕ проверки: palette через check_palette, form через check_form (плюс " +
      "variantTags — по значению каждой recipe.variants против словаря kind:\"tag\"), outfit через checkOutfit " +
      "(плюс tags — на весь наряд, тот же словарь), assembly через ту же двухпроходную проверку, что и " +
      "check_assembly (структура + bind/repeat.path против примера по io-схеме). Тег — одна и та же механика " +
      "на двух уровнях (наряд целиком / значение варианта формы): пусто считается [\"default\"], неизвестный " +
      "тег — флав unknown-tag той же формы, что unknown-palette. Флав — отказ до записи, служба не тронута. " +
      "Кладёт вместо прежней записи с тем же именем (снять-положить), не плодит дубли по имени. " +
      "author — атрибуция И владение разом: у записи уже есть author — переписать её может только " +
      "запрос с ТЕМ ЖЕ author (не отдельный секрет, не одно защищённое имя на всех — каждый владеет " +
      "своим). Без author у существующей записи — никем не занята, пишет кто угодно.",
    access: "write",
    input: z.object({
      kind: KIND,
      state: z
        .looseObject({ name: z.string() })
        .describe(
          "Palette | Form ({..., variantTags?: {[имя варианта]: string[]}}) | " +
            "Outfit ({..., tags?: string[]}) | {component, assembly} | {name} — по kind",
        ),
      label: z.string().optional(),
      paletteName: z.string().optional().describe("для kind=form — какую палитру сверять, см. check_form"),
      author: z.string().optional().describe("кто сохранил — атрибуция И владение, см. описание тула"),
    }),
    handler: async ({ kind, state, label, paletteName, author }) => {
      const guardFlaw = await authorGuard(kind, state.name, author);
      if (guardFlaw) return err(guardFlaw);

      let stateToSave: typeof state = author !== undefined ? { ...state, author } : state;

      if (kind === "palette") {
        const result = await checkPalette(stateToSave as never);
        if (!result.ok) return ok(result);
      } else if (kind === "form") {
        const { variantTags, flaws: tagFlaws } = await resolveVariantTags(stateToSave as Record<string, unknown>);
        if (tagFlaws.length > 0) return ok({ ok: false, referenceFlaws: tagFlaws, structuralFlaws: [] });
        stateToSave = { ...stateToSave, variantTags };

        const result = await checkForm(stateToSave as never, paletteName);
        if (!result.ok) return ok(result);
      } else if (kind === "outfit") {
        const { tags, flaws: tagFlaws } = await resolveTags(stateToSave);
        if (tagFlaws.length > 0) return ok({ ok: false, flaws: tagFlaws });
        stateToSave = { ...stateToSave, tags };

        const palettes = await store.readPalettes();
        const forms = await store.readForms();
        const flaws = skin.checkOutfit(stateToSave as never, { palettes, forms });
        if (flaws.length > 0) return ok({ ok: false, flaws });
      } else if (kind === "assembly") {
        const component = (stateToSave as { component?: unknown })["component"];
        const assembly = (stateToSave as { assembly?: unknown })["assembly"];
        if (typeof component !== "string" || !assembly) {
          return err('assembly state needs "component" (string) and "assembly" (PassportAssembly)');
        }
        const result = checkAssembly(component, assembly);
        if (!result.ok) return ok(result);
      }

      return ok({ saved: await store.replace(kind, stateToSave.name, stateToSave, label) });
    },
  });

  registerTool(server, {
    name: "report_feedback",
    title: "Оставить репорт по ручке",
    description:
      "Лёгкий сигнал «тут не так» по любой ручке этого MCP — не тикет и не заявка на разбор прямо " +
      "сейчас, просто сырая заметка: какую ручку звали, что сделали, что ожидали, что получили. " +
      "Ничего не проверяется и не анализируется на этой стороне — раз в службу пресетов, тем же " +
      "kind-агностичным хранилищем, что и palette/form/outfit/assembly/tag, но отдельным kind:" +
      "\"feedback\", не смешивается с ними в list_presets. Живёт в этой службе, а не у платформы " +
      "агента — переживает смену агента/сессии/платформы.",
    access: "write",
    input: z.object({
      tool: z.string().describe("имя ручки этого MCP, к которой относится репорт"),
      action: z.string().describe("что сделали — вызов и с чем, своими словами"),
      expected: z.string().optional().describe("что ожидали получить"),
      actual: z.string().describe("что получили на самом деле"),
    }),
    handler: async ({ tool, action, expected, actual }) => {
      const name = `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const state = { tool, action, expected, actual, at: new Date().toISOString(), status: "open" };
      return ok({ saved: await store.save("feedback", name, state, `${tool}: ${actual.slice(0, 60)}`) });
    },
  });

  registerTool(server, {
    name: "list_feedback",
    title: "Прочитать репорты",
    description:
      "Читает report_feedback обратно — постранично (cursor/limit, по умолчанию 50), каждый элемент уже с " +
      "содержимым (tool/action/expected/actual/at/status), не только id/label: репорт мал, второй шаг " +
      "(get_preset) тут не нужен. По умолчанию отдаются только НЕРАЗОБРАННЫЕ (status:\"open\") — разобранное " +
      "закрывает resolve_feedback и из списка уходит; status:\"resolved\" или \"all\" — если нужно увидеть " +
      "его тоже. kind:\"feedback\" не входит в list_presets/get_preset по той же причине, по которой не " +
      "смешивается с palette/form/outfit/assembly/tag там — своя ручка на чтение, своя на запись.",
    access: "read",
    input: z.object({
      status: STATUS_FILTER.optional().describe("что показывать; по умолчанию только open"),
      cursor: z.string().optional().describe("курсор из предыдущей страницы"),
      limit: z.number().int().positive().optional(),
    }),
    handler: async ({ status = "open", cursor, limit }) => {
      const records = await store.list("feedback");
      const entries = await Promise.all(records.map((record) => store.read(record.id)));
      const wanted = status === "all" ? entries : entries.filter((entry) => statusOf(entry.state) === status);
      const page = paginate(wanted, { cursor, limit });
      return ok({ items: page.items, nextCursor: page.nextCursor });
    },
  });

  registerTool(server, {
    name: "resolve_feedback",
    title: "Закрыть репорт",
    description:
      "Помечает заявку разобранной: status становится \"resolved\", проставляется resolvedAt и note — чем " +
      "кончился разбор. Имя берите из list_feedback. Запись переписывается на месте, id прежний — ссылка на " +
      "заявку остаётся рабочей, а сам текст заявки не трогается. Закрытая уходит из list_feedback по " +
      "умолчанию, но никуда не пропадает: status:\"resolved\" покажет её снова. Заявки не удаляются вовсе — " +
      "история разбора остаётся.",
    access: "write",
    input: z.object({
      name: z.string().describe("имя заявки из list_feedback (report-…)"),
      note: z.string().optional().describe("чем кончился разбор — своими словами"),
    }),
    handler: async ({ name, note }) => {
      const existing = await store.findByName("feedback", name);
      if (!existing) return err(`заявки "${name}" нет — имя берётся из list_feedback`);

      const entry = await store.read(existing.id);
      const state = entry.state as Record<string, unknown>;

      if (statusOf(state) === "resolved") return err(`заявка "${name}" уже разобрана`);

      const next = { ...state, status: "resolved", resolvedAt: new Date().toISOString(), ...(note ? { note } : {}) };
      return ok({ resolved: await store.update(existing.id, "feedback", name, next, entry.label) });
    },
  });

  registerTool(server, {
    name: "save_content",
    title: "Сохранить данные для наполнения компонента",
    description:
      "Кладёт РЕАЛЬНЫЕ данные (не абстрактный мок) под конкретный компонент — то, чем можно заполнить bind/" +
      "repeat.path сборки при живом просмотре (browser_navigate), вместо случайного значения из io-схемы. " +
      "Перед записью сверяет data с io-схемой компонента (get_passport().io.input) — несовпадение отказывает " +
      "флавом, не тихой записью мусора; у компонента без io-схемы (например table — свои props, не bind по " +
      "IO) сверять нечем, проходит без проверки. kind:\"content\" — ещё один бесплатный вид (backend/presets " +
      "не толкует kind), отдельно от palette/form/outfit/assembly/tag/feedback. author — та же владельческая " +
      "граница, что и у save_preset.",
    access: "write",
    input: z.object({
      component: z.string().describe("имя компонента, оно же data-scope из паспорта"),
      name: z.string().describe("имя ЭТОГО набора данных, не компонента — можно завести несколько на компонент"),
      data: z.unknown().describe("данные вида, ожидаемого io-схемой компонента"),
      label: z.string().optional(),
      author: z.string().optional().describe("кто сохранил — атрибуция И владение, см. save_preset"),
    }),
    handler: async ({ component, name, data, label, author }) => {
      const guardFlaw = await authorGuard("content", name, author);
      if (guardFlaw) return err(guardFlaw);

      const check = checkContentData(component, data);
      if (!check.ok) return ok(check);

      const state = author !== undefined ? { component, data, author } : { component, data };
      return ok({ saved: await store.replace("content", name, state, label) });
    },
  });

  registerTool(server, {
    name: "list_content",
    title: "Перечень сохранённых данных наполнения",
    description:
      "Что уже лежит в kind:\"content\", постранично (cursor/limit, по умолчанию 50), сразу с содержимым " +
      "(component/data), не только id/label — второй проход не нужен. Необязательный component сужает до " +
      "наборов ИМЕННО этого компонента.",
    access: "read",
    input: z.object({
      component: z.string().optional(),
      cursor: z.string().optional(),
      limit: z.number().int().positive().optional(),
    }),
    handler: async ({ component, cursor, limit }) => {
      const records = await store.list("content");
      const entries = await Promise.all(records.map((record) => store.read(record.id)));
      const matching = component
        ? entries.filter((entry) => (entry.state as { component?: unknown })["component"] === component)
        : entries;
      return ok(paginate(matching, { cursor, limit }));
    },
  });

  registerTool(server, {
    name: "get_content",
    title: "Содержимое набора данных наполнения",
    description: "Один набор данных по имени (см. list_content) — конверт целиком, .state есть {component, data}.",
    access: "read",
    input: z.object({ name: z.string() }),
    handler: async ({ name }) => {
      const record = await store.findByName("content", name);
      if (!record) return err(`no content record named "${name}"`);
      return ok(await store.read(record.id));
    },
  });

  registerTool(server, {
    name: "browser_navigate",
    title: "Открыть страницу в браузере сервера",
    description:
      "Переходит по URL в СВОЕЙ вкладке headless-браузера этого сервера — одна вкладка на эту MCP-" +
      "сессию, заводится при первом вызове, живёт до конца сессии. Отдельный процесс от чьего-либо " +
      "интерактивного браузера (свой профиль, --isolated) — сессии друг другу не мешают. Обычный " +
      "адрес — витрина apps/skin, например http://127.0.0.1:5174/showcase/<component>/<tag> — " +
      "реальный рендер сохранённого наряда, не только CSS-текст assemble_preview.",
    access: "read",
    input: z.object({ url: z.string().describe("куда перейти") }),
    handler: async ({ url }) => {
      const id = await ensurePage();
      return ok({ report: await browser.navigate(id, url) });
    },
  });

  registerTool(server, {
    name: "browser_snapshot",
    title: "Снимок доступности текущей страницы",
    description:
      "Текстовое a11y-дерево своей вкладки (см. browser_navigate — сначала туда перейти) — каждый узел с " +
      "uid, например `uid=1_1 button \"Сохранить\"`. Источник uid для browser_click: кликнуть можно ТОЛЬКО " +
      "по узлу из САМОГО СВЕЖЕГО снимка — DOM меняется, старый uid может уже не существовать, снимайте заново " +
      "после click, если собираетесь кликать ещё раз.",
    access: "read",
    handler: async () => {
      if (pageId === undefined) return err("no page yet — call browser_navigate first");
      return ok({ snapshot: await browser.snapshot(pageId) });
    },
  });

  registerTool(server, {
    name: "browser_click",
    title: "Клик по элементу своей страницы",
    description:
      "Настоящий клик мышью по узлу из browser_snapshot (не переход по URL — это ДРУГОЙ код-путь: клик по " +
      "пункту дерева/меню внутри SPA идёт через роутер приложения, browser_navigate такой переход не " +
      "воспроизводит). Нужен uid из СВЕЖЕГО browser_snapshot той же страницы.",
    access: "read",
    input: z.object({
      uid: z.string().describe("узел из browser_snapshot"),
      dblClick: z.boolean().optional(),
    }),
    handler: async ({ uid, dblClick }) => {
      if (pageId === undefined) return err("no page yet — call browser_navigate first");
      return ok({ report: await browser.click(pageId, uid, { dblClick }) });
    },
  });

  registerTool(server, {
    name: "browser_screenshot",
    title: "Скриншот текущей страницы",
    description:
      "PNG текущей страницы своей вкладки (см. browser_navigate — сначала туда перейти). " +
      "Единственный способ в этой зоне реально УВИДЕТЬ вид, а не прочитать CSS-текст.",
    access: "read",
    handler: async () => {
      if (pageId === undefined) return err("no page yet — call browser_navigate first");
      const { mimeType, base64 } = await browser.screenshot(pageId);
      return { content: [{ type: "image", data: base64, mimeType }], isError: false };
    },
  });
}
