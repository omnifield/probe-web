// ОДИН ВХОД ЗА ВСЕЙ ИНФОРМАЦИЕЙ О КОМПОНЕНТЕ (`PWEB-217`, умолчание и мердж — `PWEB-219`) —
// паспорт и срез редактора (кит, синхронно), паспорт формы (реестр `packages/io`, синхронно) и
// то, что знает о компоненте служба раздачи (сохранённая форма, её варианты, наряды, в которые
// она входит — `packages/skin/presets`, асинхронно) — ОДНИМ вызовом, одной цельной записью.
//
// Ручной сбор этих четырёх кусков (замечено на `products/skin/pages/showcase`) требовал каждый
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
// отключён, `products/skin/entities/component/model/providers.ts`).
//
// МЕРДЖ НЕСКОЛЬКИХ — на случай, если второй поставщик кита (`diagrams` или другой) вернётся.
// Раньше это решалось руками в продукте (`providers.ts`, снесён) — свой `Object.keys(...)
// .filter(Object.hasOwn(...))` на каждый повторный случай. Форма поставщика ОДНА и та же
// (`ComponentProvider`), значит и слияние — не хак под конкретного второго поставщика, а
// повторно применимый механизм: столкновение имени компонента у двух поставщиков — явный отказ
// со списком всех столкнувшихся имён, а не молчаливый приоритет одного над другим (то же
// поведение, что было в снесённом `providers.ts`).

import { createIoRegistry, type IoEntry, type IoRegistry } from "@omnifield/probe-web-io";
import type { ComponentPassport, Form } from "@omnifield/probe-web-skin/model";
import type { PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
import { PRESET_KIND, type PresetRecord, type PresetsClient } from "@omnifield/probe-web-skin/presets";

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

let kitProvider: ComponentProvider | undefined;

/**
 * Поставщик этого кита (`packages/ui`) — паспорт/срез редактора из `PASSPORTS`/`EDITOR_INFOS`
 * (сгенерённых обходом `src/*`), реестр форм построен из `IO` (`./io.js`) тем же правилом
 * направления, что раньше писал руками каждый продукт: есть `output` — `"io"`, иначе `"input"`.
 *
 * Построен ОДИН РАЗ и переиспользуется: перечень кита статический, второй экземпляр реестра на
 * тот же перечень не несёт ничего нового.
 */
export function kitComponentProvider(): ComponentProvider {
  if (kitProvider === undefined) {
    const io = createIoRegistry();
    for (const [component, entry] of Object.entries(KIT_IO)) {
      if (entry.input) io.register(component, entry.input, entry.output ? "io" : "input");
    }

    kitProvider = {
      components: Object.keys(PASSPORTS),
      passportOf: kitPassportOf,
      editorInfoOf: kitEditorInfoOf,
      io,
    };
  }

  return kitProvider;
}

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

/** Источники, из которых складывается запись. Не названо — берётся у {@link kitComponentProvider}. */
export interface ComponentInfoSources extends Partial<ComponentProviderFields> {
  /** Клиент службы раздачи (`createPresetsClient()`, `@omnifield/probe-web-skin/presets`). */
  readonly presets: PresetsClient;
}

/** Что известно о компоненте на стороне СЛУЖБЫ — `undefined`, если форму ещё не сохраняли. */
export interface ComponentSkinInfo {
  /** Сохранённая запись формы целиком — id/label/name службы плюс само содержимое. */
  readonly form: PresetRecord<Form>;
  /** Имена стилевых вариантов, объявленных формой (`Form.recipe.variants`, ключи объекта). */
  readonly variants: readonly string[];
  /** Имена нарядов службы, которые включают эту форму. */
  readonly outfits: readonly string[];
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
  const passportOf = sources.passportOf ?? kit.passportOf;
  const editorInfoOf = sources.editorInfoOf ?? kit.editorInfoOf;
  const io = sources.io ?? kit.io;
  const { presets } = sources;

  return async function componentInfo(component: string): Promise<ComponentInfo> {
    const [forms, outfits] = await Promise.all([presets.list(PRESET_KIND.form), presets.list(PRESET_KIND.outfit)]);
    const form = forms.find((record) => record.state.component === component);

    const skin: ComponentSkinInfo | undefined =
      form === undefined
        ? undefined
        : {
            form,
            variants: Object.keys(form.state.recipe.variants ?? {}),
            outfits: outfits
              .filter((record) => record.state.forms.includes(form.name))
              .map((record) => record.name),
          };

    return {
      component,
      passport: passportOf(component),
      editorInfo: editorInfoOf(component),
      io: io.get(component),
      skin,
    };
  };
}
