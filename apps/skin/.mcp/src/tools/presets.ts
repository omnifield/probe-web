import { randomUUID } from "node:crypto";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "@web-core/io";
import { err, ok, registerTool } from "@web-core/mcp";
import { limitSchema, paginate } from "@web-core/mcp/pagination";
import { OutfitRefused } from "@web-core/skin";
import { groupByTag } from "@web-core/skin/tags";
import { checkAssembly, checkForm, checkPalette, checkTags, presets, readForms, readPalettes, skin, skinGaps } from "../engine";
import { authorGuard, KIND, looseRecord, resolveAuthor, resolveTags } from "./shared";

async function resolveVariantTags(form: Record<string, unknown>) {
  const recipe = form["recipe"] as { variants?: Record<string, unknown> } | undefined;
  const variantNames = Object.keys(recipe?.variants ?? {});
  const provided = (form["variantTags"] as Record<string, unknown> | undefined) ?? {};

  const variantTags: Record<string, string[]> = {};
  const flaws: (Awaited<ReturnType<typeof checkTags>>[number] | { name: "unknown-variant"; where: string; means: string })[] = [];

  for (const name of variantNames) {
    const resolved = await resolveTags(provided[name], `variantTags.${name}`);
    variantTags[name] = resolved.tags;
    flaws.push(...resolved.flaws);
  }

  // Ключ variantTags, которого нет среди recipe.variants — раньше тихо игнорировался (нашла живая
  // заявка): опечатка в имени варианта проходила как ok:true, тег никуда не применялся.
  for (const name of Object.keys(provided)) {
    if (!variantNames.includes(name)) {
      flaws.push({
        name: "unknown-variant",
        where: `variantTags.${name}`,
        means: `variantTags называет значение "${name}", которого нет в recipe.variants — опечатка в имени, тег никуда не применится`,
      });
    }
  }

  return { variantTags, tagGroups: groupByTag(variantTags), flaws };
}

// list_presets сознательно без state (бюджет токенов, api-response-shape-rework) — presets.list()
// всегда тащит state, режем до заголовков перед отдачей агенту.
function headersOf<T extends { id: string; label: string; name: string; kind: string; savedAt: string }>(
  records: readonly T[],
) {
  return records.map((r) => ({ id: r.id, label: r.label, name: r.name, kind: r.kind, savedAt: r.savedAt }));
}

export function registerPresetTools(server: McpServer): void {
  // CSS сгенерированного наряда — ресурс, не инлайн: полотно легко весит больше клиентского среза
  // ответа тула. Своя карта на СЕССИЮ (как и вкладка браузера) — замыкание, не общий на все сессии.
  const cssById = new Map<string, string>();

  server.registerResource(
    "assembled-css",
    new ResourceTemplate("skin-css://{id}", { list: undefined }),
    { title: "CSS собранного наряда", mimeType: "text/css" },
    async (uri, { id }) => {
      const css = cssById.get(id as string);
      if (css === undefined) throw new Error(`no cached CSS for "${id}" — call assemble_preview again`);
      return { contents: [{ uri: uri.href, mimeType: "text/css", text: css }] };
    },
  );

  registerTool(server, {
    name: "list_presets",
    title: "Перечень сохранённого",
    description: "Записи по ярлыку вида (kind); без него — до 10 на вид, для обзора. kind:\"tag\" — словарь тегов.",
    access: "read",
    input: z.object({
      kind: KIND.optional().describe("ярлык вида; не назван — до 10 на вид, обзор пяти сразу"),
      cursor: z.string().optional().describe("курсор из предыдущей страницы; только вместе с kind"),
      limit: limitSchema.optional(),
    }),
    handler: async ({ kind, cursor, limit }) => {
      if (kind) return ok(paginate(headersOf(await presets.list(kind)), { cursor, limit }));

      // Без kind — та же ловушка, что была у list_components: самый первый, необученный вызов не
      // должен быть самым тяжёлым. Общий DEFAULT_LIMIT paginate() (50) не годится сюда: цель этой
      // ветки — обзор ПЯТИ видов сразу, не глубокий листинг одного, значит и планка ниже. Найдено
      // живьём: paginate()'s 50 не отличался от "без лимита вовсе" на сегодняшних ~30 записях —
      // не бага паджинации, а неверный default под задачу обзора. Без cursor (пять параллельных
      // курсоров в одном ответе не имеют единого смысла) — для ЛЮБОГО вида целиком назовите его
      // kind явно и листайте cursor.
      const OVERVIEW_LIMIT = 10;
      const kinds = ["palette", "form", "outfit", "assembly", "tag"] as const;
      const byKind = Object.fromEntries(
        await Promise.all(
          kinds.map(async (k) => [k, paginate(headersOf(await presets.list(k)), { limit: limit ?? OVERVIEW_LIMIT }).items]),
        ),
      );
      return ok(byKind);
    },
  });

  registerTool(server, {
    name: "get_preset",
    title: "Содержимое сохранённого",
    description: "Одна запись по имени и kind — конверт целиком; в другие ручки передавайте .state.",
    access: "read",
    input: z.object({ kind: KIND, name: z.string() }),
    handler: async ({ kind, name }) => {
      const record = await presets.get(kind, name);
      if (!record) return err(`no "${kind}" record named "${name}"`);
      return ok(record);
    },
  });

  registerTool(server, {
    name: "check_palette",
    title: "Проверить палитру",
    description: "Закрытие словаря ролей, легальность шкал — ДО сохранения.",
    access: "read",
    input: z.object({ palette: looseRecord.describe("Palette целиком, включая name") }),
    handler: async ({ palette }) => ok(await checkPalette(palette as never)),
  });

  registerTool(server, {
    name: "check_form",
    title: "Проверить форму (рецепт компонента)",
    description: "Ссылки+адрес рецепта ДО сохранения, плюс unknown-tag по variantTags. См. get_doc(\"forms\") при сомнении.",
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
    description: "Структура (admits/анатомия) + данные (bind/repeat.path против io-схемы) ДО сохранения.",
    access: "read",
    input: z.object({ component: z.string(), assembly: z.looseObject({ name: z.string() }) }),
    handler: ({ component, assembly }) => ok(checkAssembly(component, assembly)),
  });

  registerTool(server, {
    name: "check_outfit",
    title: "Проверить наряд",
    description: "Палитра+формы+теги целиком, резолвятся по имени из службы. См. check_palette/check_form по частям.",
    access: "read",
    input: z.object({ outfit: looseRecord.extend({ palette: z.string(), forms: z.array(z.string()) }) }),
    handler: async ({ outfit }) => {
      const palettes = await readPalettes();
      const forms = await readForms();
      const flaws = skin.checkOutfit(outfit as never, { palettes, forms });
      const { flaws: tagFlaws } = await resolveTags((outfit as Record<string, unknown>)["tags"]);
      const allFlaws = [...flaws, ...tagFlaws];
      return ok({ ok: allFlaws.length === 0, flaws: allFlaws });
    },
  });

  registerTool(server, {
    name: "assemble_preview",
    title: "Собрать и увидеть",
    description: "Отчёт+покрытие без сохранения; CSS — resource_link (skin-css://…), не инлайном.",
    access: "read",
    input: z.object({ outfit: looseRecord.extend({ palette: z.string(), forms: z.array(z.string()) }) }),
    handler: async ({ outfit }) => {
      const palettes = await readPalettes();
      const forms = await readForms();
      const parts = { palettes, forms };

      try {
        const assembled = skin.assemble(outfit as never, parts);
        const css = skin.generateSkinCss(assembled.skin);
        const gaps = skinGaps(assembled.skin);

        const id = randomUUID();
        cssById.set(id, css);

        const body = { report: assembled.report, gaps };
        return {
          content: [
            { type: "text" as const, text: JSON.stringify(body, null, 2) },
            {
              type: "resource_link" as const,
              uri: `skin-css://${id}`,
              name: "assembled.css",
              mimeType: "text/css",
              description: "Сгенерированный CSS этого наряда — читайте resources/read, когда реально нужен текст",
            },
          ],
          structuredContent: body,
          isError: false,
        };
      } catch (cause) {
        if (cause instanceof OutfitRefused) return ok({ flaws: cause.flaws });
        throw cause;
      }
    },
  });

  registerTool(server, {
    name: "save_preset",
    title: "Сохранить запись",
    description: "Сохраняет ПОСЛЕ той же проверки, что check_*. author — атрибуция И владение (см. get_doc(\"author\")).",
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
      author: z.string().optional().describe("резерв на stdio без заголовка; на HTTP имя берётся из X-User-Login, не отсюда — см. get_doc(\"author\")"),
    }),
    handler: async ({ kind, state, label, paletteName, author: argumentAuthor }, context) => {
      const author = resolveAuthor(context, argumentAuthor);
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

        const palettes = await readPalettes();
        const forms = await readForms();
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

      return ok({ saved: await presets.replace(kind, stateToSave.name, stateToSave as never, label) });
    },
  });
}
