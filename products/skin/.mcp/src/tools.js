// РЕГИСТРАЦИЯ РУЧЕК — тонкий слой поверх kit.js/mechanics.js/store.js/validate.js. Здесь нет
// проверок содержимого: палитра/форма/наряд/сборка приходят СВОБОДНОЙ формой (`z.looseObject`),
// потому что содержимое проверяет механика (`checkOutfit`/`checkSkin`/`checkAssembly`), а не эта
// граница протокола — второй, более узкий контракт здесь молча разошёлся бы с настоящим.

import { z } from "zod";
import { getPassport, listComponents } from "./kit.js";
import { skin, checkAssembly, skinGaps } from "./mechanics.js";
import { OutfitRefused, SkinRefused } from "@omnifield/probe-web-skin";
import * as store from "./store.js";
import { checkForm, checkPalette } from "./validate.js";

const KIND = z.enum(["palette", "form", "outfit", "assembly"]);
const looseRecord = z.looseObject({ name: z.string() });

/** @param {unknown} value */
const json = (value) => ({ content: [{ type: /** @type {const} */ ("text"), text: JSON.stringify(value, null, 2) }] });

/** @param {import("@modelcontextprotocol/sdk/server/mcp.js").McpServer} server */
export function registerTools(server) {
  server.registerTool(
    "list_components",
    {
      title: "Компоненты кита",
      description:
        "Перечень компонентов, у которых есть паспорт — то, что вообще можно одеть. По каждому: род, группа, " +
        "части анатомии, готовые сборки-образцы кита (не хранимые, кодовые).",
      inputSchema: {},
    },
    async () => json(listComponents()),
  );

  server.registerTool(
    "get_passport",
    {
      title: "Паспорт компонента",
      description:
        "Паспорт компонента структурированно: части, состояния (с mark), настройки (с mark/умолчанием/dependsOn), " +
        "переменные, admission по частям (что можно вложить), io-схема (JSON Schema), сборки-образцы и means — " +
        "разведка перед тем, как писать палитру/форму/сборку.",
      inputSchema: { component: z.string().describe("имя компонента, оно же data-scope") },
    },
    async ({ component }) => {
      const info = getPassport(component);
      if (!info) return json({ ok: false, error: `unknown component "${component}" — no passport in the kit` });
      return json({ ok: true, ...info });
    },
  );

  server.registerTool(
    "list_presets",
    {
      title: "Перечень сохранённого",
      description: "Что уже лежит в службе пресетов, по ярлыку вида (без него — все виды). Без содержимого, только список.",
      inputSchema: { kind: KIND.optional().describe("ярлык вида; не назван — отдаются все четыре") },
    },
    async ({ kind }) => {
      const kinds = kind ? [kind] : ["palette", "form", "outfit", "assembly"];
      const byKind = Object.fromEntries(await Promise.all(kinds.map(async (k) => [k, await store.list(k)])));
      return json(byKind);
    },
  );

  server.registerTool(
    "get_preset",
    {
      title: "Содержимое сохранённого",
      description:
        "Содержимое одной записи по имени и ярлыку вида. Ответ — конверт целиком ({id,label,...,state}). " +
        "Другим ручкам (check_form/check_outfit/save_preset/assemble_preview) передавайте поле .state, " +
        "а не весь этот ответ — они ждут голое содержимое Palette/Form/Outfit/ComponentAssembly.",
      inputSchema: { kind: KIND, name: z.string() },
    },
    async ({ kind, name }) => {
      const record = await store.findByName(kind, name);
      if (!record) return json({ ok: false, error: `no "${kind}" record named "${name}"` });
      return json({ ok: true, ...(await store.read(record.id)) });
    },
  );

  server.registerTool(
    "check_palette",
    {
      title: "Проверить палитру",
      description:
        "Проверяет палитру ДО сохранения — закрытие словаря ролей, легальность шкал. Своей функции для одной " +
        "палитры у механики нет: проверка идёт синтетическим нарядом без форм (checkOutfit проверяет палитру " +
        "безусловно), тем же путём, каким проверяется настоящий наряд.",
      inputSchema: { palette: looseRecord.describe("Palette целиком, включая name") },
    },
    async ({ palette }) => json(await checkPalette(/** @type {never} */ (palette))),
  );

  server.registerTool(
    "check_form",
    {
      title: "Проверить форму (рецепт компонента)",
      description:
        "Проверяет рецепт ДО сохранения в два прохода: ссылки (роль/переменная существует?) — тем же checkOutfit, " +
        "что и наряд, затем адрес (часть/состояние/настройка существуют у паспорта?) — checkSkin на собранном " +
        "скине. Опечатка возвращается с адресом, не тихим неприменением. Нужна палитра для сверки ролей — " +
        "не назвали paletteName, берётся первая из службы.",
      inputSchema: {
        form: looseRecord.extend({ component: z.string() }).describe("Form целиком: name, component, recipe, keyframes?"),
        paletteName: z.string().optional(),
      },
    },
    async ({ form, paletteName }) => json(await checkForm(/** @type {never} */ (form), paletteName)),
  );

  server.registerTool(
    "check_assembly",
    {
      title: "Проверить сборку компонента",
      description:
        "Проверяет дерево сборки (PassportAssembly) ДО сохранения, в два прохода. Структура — обход " +
        "admits()/анатомии, тот же обход, которым checkAssembly проверяет кодовые сборки кита при загрузке " +
        "модуля. Данные — КАЖДЫЙ bind/repeat.path сверяется с примером по io-схеме компонента (checkAssemblyData); " +
        "это то, чего checkAssembly НЕ делает вовсе (сама не читает bind/props/on) — опечатка в пути раньше " +
        "проходила как ok:true. Компонент без entity/io.ts — dataCheck: \"skipped\", не тихий успех.",
      inputSchema: { component: z.string(), assembly: z.looseObject({ name: z.string() }) },
    },
    async ({ component, assembly }) => json(checkAssembly(component, assembly)),
  );

  server.registerTool(
    "check_outfit",
    {
      title: "Проверить наряд",
      description:
        "Прямой проброс checkOutfit(outfit, parts): unknown-palette/unknown-form/palette-incomplete/" +
        "component-twice/unknown-component/outside-vocabulary/variable-elsewhere и т.д. Палитра и формы " +
        "резолвятся по имени из службы целиком (как и настоящий клиент витрины).",
      inputSchema: { outfit: looseRecord.extend({ palette: z.string(), forms: z.array(z.string()) }) },
    },
    async ({ outfit }) => {
      const palettes = await store.readPalettes();
      const forms = await store.readForms();
      const flaws = skin.checkOutfit(/** @type {never} */ (outfit), { palettes, forms });
      return json({ ok: flaws.length === 0, flaws });
    },
  );

  server.registerTool(
    "assemble_preview",
    {
      title: "Собрать и увидеть текстом",
      description:
        "Собирает наряд (assemble), отдаёт CSS-текст (generateSkinCss) и покрытие (skinGaps) — минимальный " +
        "уровень обратной связи v1: без скриншота, но видно, что реально сгенерируется, и что ещё не одето. " +
        "Наряд с флавами не собирается — отдаёт их вместо CSS, ничего не выдумывая за автора.",
      inputSchema: { outfit: looseRecord.extend({ palette: z.string(), forms: z.array(z.string()) }) },
    },
    async ({ outfit }) => {
      const palettes = await store.readPalettes();
      const forms = await store.readForms();
      const parts = { palettes, forms };

      try {
        const assembled = skin.assemble(/** @type {never} */ (outfit), parts);
        const css = skin.generateSkinCss(assembled.skin);
        const gaps = skinGaps(assembled.skin);
        return json({ ok: true, report: assembled.report, gaps, css });
      } catch (cause) {
        if (cause instanceof OutfitRefused) return json({ ok: false, flaws: cause.flaws });
        if (cause instanceof SkinRefused) return json({ ok: false, error: cause.message });
        throw cause;
      }
    },
  );

  server.registerTool(
    "save_preset",
    {
      title: "Сохранить запись",
      description:
        "Кладёт запись в службу ПОСЛЕ проверки: palette/form через ту же проверку, что и check_palette/check_form, " +
        "outfit через checkOutfit, assembly через ту же двухпроходную проверку, что и check_assembly (структура + " +
        "bind/repeat.path против примера по io-схеме). Флав — отказ до записи, служба не тронута. " +
        "Кладёт вместо прежней записи с тем же именем (снять-положить), не плодит дубли по имени.",
      inputSchema: {
        kind: KIND,
        state: z.looseObject({ name: z.string() }).describe("Palette | Form | Outfit | {component, assembly} — по kind"),
        label: z.string().optional(),
        paletteName: z.string().optional().describe("для kind=form — какую палитру сверять, см. check_form"),
      },
    },
    async ({ kind, state, label, paletteName }) => {
      if (kind === "palette") {
        const result = await checkPalette(/** @type {never} */ (state));
        if (!result.ok) return json(result);
      } else if (kind === "form") {
        const result = await checkForm(/** @type {never} */ (state), paletteName);
        if (!result.ok) return json(result);
      } else if (kind === "outfit") {
        const palettes = await store.readPalettes();
        const forms = await store.readForms();
        const flaws = skin.checkOutfit(/** @type {never} */ (state), { palettes, forms });
        if (flaws.length > 0) return json({ ok: false, flaws });
      } else if (kind === "assembly") {
        const component = /** @type {{component?: unknown}} */ (state)["component"];
        const assembly = /** @type {{assembly?: unknown}} */ (state)["assembly"];
        if (typeof component !== "string" || !assembly) {
          return json({ ok: false, error: 'assembly state needs "component" (string) and "assembly" (PassportAssembly)' });
        }
        const result = checkAssembly(component, assembly);
        if (!result.ok) return json(result);
      }

      const saved = await store.replace(kind, state.name, state, label);
      return json({ ok: true, saved });
    },
  );
}
