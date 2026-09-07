import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "@web-core/io";
import { err, ok, registerTool } from "@web-core/mcp";
import { paginate } from "@web-core/mcp/pagination";
import { OutfitRefused } from "@web-core/skin";
import { DEFAULT_TAG, groupByTag, sortTags } from "@web-core/skin/tags";
import { getPassport, listComponents, skin, checkAssembly, skinGaps, store, checkForm, checkPalette, checkTags } from "../engine";

const KIND = z.enum(["palette", "form", "outfit", "assembly", "tag"]);
const looseRecord = z.looseObject({ name: z.string() });

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
  registerTool(server, {
    name: "list_components",
    title: "Компоненты кита",
    description:
      "Перечень компонентов, у которых есть паспорт — то, что вообще можно одеть. По каждому: род, группа, " +
      "части анатомии, готовые сборки-образцы кита (не хранимые, кодовые).",
    access: "read",
    handler: () => ok(listComponents()),
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
      "Кладёт вместо прежней записи с тем же именем (снять-положить), не плодит дубли по имени.",
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
    }),
    handler: async ({ kind, state, label, paletteName }) => {
      let stateToSave: typeof state = state;

      if (kind === "palette") {
        const result = await checkPalette(state as never);
        if (!result.ok) return ok(result);
      } else if (kind === "form") {
        const { variantTags, flaws: tagFlaws } = await resolveVariantTags(state as Record<string, unknown>);
        if (tagFlaws.length > 0) return ok({ ok: false, referenceFlaws: tagFlaws, structuralFlaws: [] });
        stateToSave = { ...state, variantTags };

        const result = await checkForm(stateToSave as never, paletteName);
        if (!result.ok) return ok(result);
      } else if (kind === "outfit") {
        const { tags, flaws: tagFlaws } = await resolveTags(state);
        if (tagFlaws.length > 0) return ok({ ok: false, flaws: tagFlaws });
        stateToSave = { ...state, tags };

        const palettes = await store.readPalettes();
        const forms = await store.readForms();
        const flaws = skin.checkOutfit(stateToSave as never, { palettes, forms });
        if (flaws.length > 0) return ok({ ok: false, flaws });
      } else if (kind === "assembly") {
        const component = (state as { component?: unknown })["component"];
        const assembly = (state as { assembly?: unknown })["assembly"];
        if (typeof component !== "string" || !assembly) {
          return err('assembly state needs "component" (string) and "assembly" (PassportAssembly)');
        }
        const result = checkAssembly(component, assembly);
        if (!result.ok) return ok(result);
      }

      return ok({ saved: await store.replace(kind, stateToSave.name, stateToSave, label) });
    },
  });
}
