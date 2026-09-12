// ОДИН ВХОД ЗА ВСЕЙ ИНФОРМАЦИЕЙ О КОМПОНЕНТЕ (`PWEB-217`, умолчание и мердж — `PWEB-219`) —
// паспорт и срез редактора (кит, синхронно), паспорт формы (реестр `packages/io`, синхронно) и
// то, что знает о компоненте служба раздачи (сохранённая форма, её варианты, наряды, в которые
// она входит — `packages/skin/presets`, асинхронно) — ОДНИМ вызовом, одной цельной записью.
//
// Ручной сбор этих четырёх кусков (замечено на `apps/skin/pages/showcase`) требовал каждый
// раз заново: `passportOf`/`editorInfoOf`/`IO.get` — синхронно, `presets.list("form")` — асинхронно
// с фильтром по `component` руками, а варианты — ещё раскопкой внутри найденной формы. Тот же
// довод, что у цепочки `PWEB-213`–`PWEB-216`: продукт зовёт ОДНО, не собирает куски сам.
//
// ПОЧЕМУ ЗДЕСЬ, А НЕ В `packages/skin`/`packages/io`. Источники принимаются, а не зашиваются
// (`ComponentInfoSources` ниже) — этот файл не решает, ЧЕЙ это кит, ЧЕЙ реестр форм и КАКАЯ
// служба раздачи, он просто складывает готовые ответы в одну запись. Но чтобы это набрать, нужны
// типы разом из трёх пакетов — `packages/skin` (паспорт/срез редактора/форма наряда), `packages/
// io` (`IoRegistry`) и снова `packages/skin` (`presets`, служба). `packages/ui` — уже единственное
// место, где это пересечение не новое: `dependencies` пакета уже несут и `-io`, и `-skin` ради
// `src/io.ts`/`src/passport.ts`. Заводить это в `skin` или `io` добавило бы им зависимость друг на
// друга, которой сегодня нет ни в одну сторону.
//
// УМОЛЧАНИЕ — В ОДИН ПРОВАЙДЕР (user, `PWEB-219`): «даже если и появится другой поставщик, он
// будет поставлять полностью идентичную структуру». `passportOf`/`editorInfoOf`/`io` этого файла
// НЕ обязательны — не названы, берутся у СВОЕГО кита (`kitComponentProvider()` ниже, тот же
// `passportOf`/`PASSPORTS`/`IO`, что уже несёт `./passport.js`/`./io.js`); продукту снаружи
// достаточно назвать `presets`. Единственное, что реально меняется от продукта к продукту —
// адрес службы, а не набор паспортов кита (второго поставщика кита сегодня нет — `diagrams`
// отключён, `apps/skin/entities/component/model/providers.ts`).
//
// МЕРДЖ НЕСКОЛЬКИХ — на случай, если второй поставщик кита (`diagrams` или другой) вернётся.
// Раньше это решалось руками в продукте (`providers.ts`, снесён) — свой `Object.keys(...)
// .filter(Object.hasOwn(...))` на каждый повторный случай. Форма поставщика ОДНА и та же
// (`ComponentProvider`), значит и слияние — не хак под конкретного второго поставщика, а
// повторно применимый механизм: столкновение имени компонента у двух поставщиков — явный отказ
// со списком всех столкнувшихся имён, а не молчаливый приоритет одного над другим (то же
// поведение, что было в снесённом `providers.ts`).

import { createIoRegistry, type IoEntry, type IoRegistry } from "@web-core/io";
import type { ComponentPassport, Form } from "@web-core/skin/model";
import { groupOf as groupOfEditorInfo, GROUPS, type ComponentGroup, type PassportEditorInfo } from "@web-core/skin/editor";
import { PRESET_KIND, type PresetRecord, type PresetsClient } from "@web-core/skin/presets";
import { groupByTag, type TagGroup } from "@web-core/skin/tags";

import type { KitComponent } from "./kit-form.js";
import { IO as KIT_IO } from "./io.js";
import { editorInfoOf as kitEditorInfoOf, passportOf as kitPassportOf, PASSPORTS } from "./passport.js";

/**
 * Форма ОДНОГО поставщика кита — паспорт, срез редактора, паспорта формы.
 *
 * `kitOf` — НЕОБЯЗАТЕЛЬНОЕ четвёртое поле: `createComponentInfo` (данные, без Solid) его не
 * требует, а `kitComponentRenderer` (`component-registry.ts`, `PWEB-220`) требует — карту частей
 * (`KitComponent.parts`) без неё не собрать. Тип — только ТИП (`KitComponent` из `./kit-form.js`
 * не несёт solid-js ни строкой, см. его же шапку), поэтому объявить поле здесь безопасно для
 * инварианта «этот файл не тянет Solid» — тянет его РЕАЛЬНОЕ значение `KIT`, которое сюда не
 * заходит.
 */
interface ComponentProviderFields {
  readonly passportOf: (component: string) => ComponentPassport | undefined;
  readonly editorInfoOf: (component: string) => PassportEditorInfo | undefined;
  readonly io: IoRegistry;
  readonly kitOf?: (component: string) => KitComponent | undefined;
}

/**
 * Поставщик кита ЦЕЛИКОМ — та же форма, что `ComponentInfoSources`, но с полным перечнем имён:
 * слиянию (`mergeComponentProviders`) нужно видеть все имена сразу, а не спрашивать по одному,
 * чтобы найти столкновение ДО того, как оно молча потеряет половину компонентов.
 */
export interface ComponentProvider extends ComponentProviderFields {
  /** Все имена компонентов этого поставщика. */
  readonly components: readonly string[];
}

/**
 * Ленивая инициализация модульного синглтона — тот же приём нужен и {@link kitComponentProvider}
 * здесь, и `ownKitRendererProvider` в `component-registry.ts`; вынесено сюда, а не продублировано
 * во втором файле, по той же причине, что и у `mergeComponentProviders` чуть ниже — повторно
 * написанное второй раз разъезжается с первым молча.
 */
export function lazy<T>(factory: () => T): () => T {
  let value: T | undefined;
  return () => (value ??= factory());
}

/**
 * Поставщик этого кита (`packages/ui`) — паспорт/срез редактора из `PASSPORTS`/`EDITOR_INFOS`
 * (сгенерённых обходом `src/*`), реестр форм построен из `IO` (`./io.js`) тем же правилом
 * направления, что раньше писал руками каждый продукт: есть `output` — `"io"`, иначе `"input"`.
 *
 * Построен ОДИН РАЗ и переиспользуется: перечень кита статический, второй экземпляр реестра на
 * тот же перечень не несёт ничего нового.
 */
export const kitComponentProvider = lazy((): ComponentProvider => {
  const io = createIoRegistry();
  for (const [component, entry] of Object.entries(KIT_IO)) {
    if (entry.input) io.register(component, entry.input, entry.output ? "io" : "input");
  }

  return {
    components: Object.keys(PASSPORTS),
    passportOf: kitPassportOf,
    editorInfoOf: kitEditorInfoOf,
    io,
  };
});

/**
 * Складывает N поставщиков одной формы в один. Имя компонента, встреченное у двух поставщиков
 * разом, — явный отказ со списком ВСЕХ столкнувшихся имён, не молчаливый приоритет первого
 * поставщика над вторым: столкновение — это изъян постановки (кто-то забыл переименовать), а не
 * законный сценарий переопределения.
 *
 * `io` слитого поставщика — ТОЛЬКО ДЛЯ ЧТЕНИЯ: регистрировать в него в обход исходных реестров
 * значило бы регистрировать неизвестно куда — `register()` явно отказывает, а не притворяется.
 */
export function mergeComponentProviders(...providers: readonly ComponentProvider[]): ComponentProvider {
  const ownerOf = new Map<string, ComponentProvider>();
  const collisions: string[] = [];

  for (const provider of providers) {
    for (const component of provider.components) {
      if (ownerOf.has(component)) collisions.push(component);
      else ownerOf.set(component, provider);
    }
  }

  if (collisions.length > 0) {
    throw new Error(
      `реестр компонентов: имя совпало у двух поставщиков — ${collisions.join(", ")}. ` +
        "решить надо явным переименованием у одного из них, не молчаливым приоритетом.",
    );
  }

  return {
    components: [...ownerOf.keys()],
    passportOf: (component) => ownerOf.get(component)?.passportOf(component),
    editorInfoOf: (component) => ownerOf.get(component)?.editorInfoOf(component),
    kitOf: (component) => ownerOf.get(component)?.kitOf?.(component),
    io: {
      get: (component) => ownerOf.get(component)?.io.get(component),
      has: (component) => ownerOf.get(component)?.io.has(component) ?? false,
      require: (component) => {
        const provider = ownerOf.get(component);
        if (provider === undefined) {
          throw new Error(`компонент «${component}» не известен ни одному из слитых поставщиков`);
        }
        return provider.io.require(component);
      },
      list: () => providers.flatMap((provider) => provider.io.list()),
      register() {
        throw new Error(
          "слитый поставщик — только для чтения: регистрировать паспорт формы нужно в исходном " +
            "реестре, до слияния, не в результате mergeComponentProviders().",
        );
      },
    },
  };
}

/**
 * Синхронный срез одного компонента — паспорт, срез редактора, io-схема, БЕЗ службы раздачи.
 *
 * Заведён отдельно от {@link ComponentInfo} не как урезанная копия, а как то, что реально нужно
 * потребителю, которому нечем ждать `Promise` и негде взять `presets` (MCP-инструменты
 * `apps/skin/.mcp` — синхронный процесс, `skin`-пресеты им не нужны вовсе). Раньше такой
 * потребитель либо тащил async-путь ради данных, которые у него есть синхронно, либо стыковал
 * `passportOf`/`editorInfoOf`/`IO.get` тремя вызовами сам — и обе копии (эта и `createComponentInfo`
 * ниже) держали одну и ту же склейку раздельно, разъезжаясь при первой же правке одной из них.
 */
export interface ComponentDescriptor {
  readonly component: string;
  readonly passport: ComponentPassport | undefined;
  readonly editorInfo: PassportEditorInfo | undefined;
  readonly io: IoEntry | undefined;
}

/**
 * Складывает паспорт + срез редактора + io-схему ОДНОГО компонента — не назван поставщик, берётся
 * у {@link kitComponentProvider} (свой кит). Второй поставщик — {@link mergeComponentProviders},
 * результатом сюда.
 *
 * @param component имя компонента, оно же `data-scope` на каждом его узле
 * @param provider `passportOf`/`editorInfoOf`/`io` — не назван, берётся у своего кита
 */
export function componentDescriptorOf(
  component: string,
  provider: Pick<ComponentProviderFields, "passportOf" | "editorInfoOf" | "io"> = kitComponentProvider(),
): ComponentDescriptor {
  return {
    component,
    passport: provider.passportOf(component),
    editorInfo: provider.editorInfoOf(component),
    io: provider.io.get(component),
  };
}

/**
 * Имена компонентов поставщика, отсортированные — не назван, берётся у {@link kitComponentProvider}.
 *
 * Заведена по тому же следу, что {@link componentDescriptorOf}: `Object.keys(KIT).sort()` писался
 * в двух местах `apps/skin` (список каталога и дерево показа) ради одного и того же перечня имён —
 * и оба тащили ради этого весь Solid-кит (реальные компоненты всех частей), хотя нужны были только
 * ключи, которые давно лежат в данных (`PASSPORTS`) без единой строчки Solid.
 */
export function listComponents(provider: Pick<ComponentProvider, "components"> = kitComponentProvider()): readonly string[] {
  return [...provider.components].sort();
}

/**
 * Каталог групп кита (`id` → человеческое название) — та же таблица, по которой раскладывается
 * {@link groupOf}. Реэкспорт, а не отдельный источник: держать здесь второй перечень рядом с
 * `@web-core/skin/editor` означало бы то же расхождение, которого этот файл избегает у паспорта и
 * io.
 */
export { GROUPS };

/**
 * Группа компонента в каталоге — `undefined`, если компонент не объявлен в ките/без среза
 * редактора (кому группа не нужна, тому и код неоткуда взять). Найдено у user живьём (2026-09-12,
 * `apps/skin/.../catalog/tree/adapter.ts`): дерево показа звало `editorInfoOf(component)` из
 * `@web-core/ui/passport` напрямую и само считало `groupOf(editorInfo)` — прямой импорт паспорта
 * там, где нужен был один производный факт. Тот же довод, что у {@link componentDescriptorOf}:
 * потребитель, которому нужна не сама анатомия компонента, а факт О компоненте, зовёт готовое
 * здесь, а не собирает его из сырых `passport`/`editorInfo`/`io` сам.
 *
 * @param component имя компонента, оно же `data-scope` на каждом его узле
 * @param provider `editorInfoOf` — не назван, берётся у {@link kitComponentProvider}
 */
export function groupOf(
  component: string,
  provider: Pick<ComponentProviderFields, "editorInfoOf"> = kitComponentProvider(),
): ComponentGroup | undefined {
  const editorInfo = provider.editorInfoOf(component);
  return editorInfo && groupOfEditorInfo(editorInfo);
}

/** Источники, из которых складывается запись. Не названо — берётся у {@link kitComponentProvider}. */
export interface ComponentInfoSources extends Partial<ComponentProviderFields> {
  /** Клиент службы раздачи (`createPresetsClient()`, `@web-core/skin/presets`). */
  readonly presets: PresetsClient;
}

/**
 * Что известно об ОДНОЙ сохранённой форме компонента — variants/outfits/tags считаются на эту
 * форму конкретно, не на компонент целиком (у компонента их может быть несколько, см.
 * {@link ComponentSkinInfo}).
 */
export interface ComponentSkinFormInfo {
  /** Сохранённая запись формы целиком — id/label/name службы плюс само содержимое. */
  readonly form: PresetRecord<Form>;
  /** Имена стилевых вариантов, объявленных формой (`Form.recipe.variants`, ключи объекта). */
  readonly variants: readonly string[];
  /** Имена нарядов службы, которые включают эту форму. */
  readonly outfits: readonly string[];
  /** `Form.variantTags`, перевёрнутые в тег→варианты (`@web-core/skin/tags`, отсортировано). */
  readonly tags: readonly TagGroup[];
}

/**
 * Что известно о компоненте на стороне СЛУЖБЫ — `undefined`, если форму ещё не сохраняли.
 *
 * `forms` — СПИСОК, не одна запись: несколько именованных форм на один компонент (`Form.name`
 * разное, `Form.component` одно и то же) такая же законная часть модели, как несколько нарядов —
 * у наряда нет понятия "текущая форма компонента", выбор ОДНОЙ был бы произвольным и терял
 * остальные молча (PWEB — заявка `component-info-multiple-forms-per-component`, 2026-09-10).
 */
export interface ComponentSkinInfo {
  readonly forms: readonly ComponentSkinFormInfo[];
}

/** Всё известное об одном компоненте — из кита и из службы, одной записью. */
export interface ComponentInfo {
  readonly component: string;
  readonly passport: ComponentPassport | undefined;
  readonly editorInfo: PassportEditorInfo | undefined;
  readonly io: IoEntry | undefined;
  readonly skin: ComponentSkinInfo | undefined;
}

/**
 * Заводит запрос «расскажи мне всё про компонент X» поверх названных источников.
 *
 * Кит читается синхронно, служба — асинхронно; наружу это не течёт, потребитель зовёт
 * одну асинхронную функцию и получает цельную запись, а не собирает её сам.
 *
 * @param sources `presets` обязателен (адрес службы — то единственное, что меняется от продукта
 *   к продукту); `passportOf`/`editorInfoOf`/`io` не названы — берутся у {@link kitComponentProvider}.
 *   Второй поставщик кита — {@link mergeComponentProviders}, потом сюда результатом.
 */
export function createComponentInfo(sources: ComponentInfoSources): (component: string) => Promise<ComponentInfo> {
  const kit = kitComponentProvider();
  const provider = {
    passportOf: sources.passportOf ?? kit.passportOf,
    editorInfoOf: sources.editorInfoOf ?? kit.editorInfoOf,
    io: sources.io ?? kit.io,
  };
  const { presets } = sources;

  return async function componentInfo(component: string): Promise<ComponentInfo> {
    const [forms, outfits] = await Promise.all([presets.list(PRESET_KIND.form), presets.list(PRESET_KIND.outfit)]);
    const componentForms = forms.filter((record) => record.state.component === component);

    const skin: ComponentSkinInfo | undefined =
      componentForms.length === 0
        ? undefined
        : {
            forms: componentForms.map((form) => ({
              form,
              variants: Object.keys(form.state.recipe.variants ?? {}),
              outfits: outfits
                .filter((record) => record.state.forms.includes(form.name))
                .map((record) => record.name),
              tags: groupByTag(form.state.variantTags ?? {}),
            })),
          };

    return { ...componentDescriptorOf(component, provider), skin };
  };
}
