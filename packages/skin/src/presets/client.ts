// Полный CRUD по каждому виду записи службы раздачи. Имя — довод операции, не поле содержимого
// (`ComponentAssembly` своего имени не несёт). Транспорт — GraphQL (`backend/presets`'s REST снят),
// но наружу это ничем не видно: `PresetsClient`/`PresetRecord<T>` и сигнатуры не изменились, обе
// зоны-потребителя (`packages/ui/component-info.ts`, `./source.ts`) получают фикс без своей правки.
// Разбор — FAQ.md.

import { ClientError, createGraphQLClient, gql } from "@web-core/query/graphql";

import type { ComponentAssembly, Form, Outfit, Palette } from "../engine/look/index.js";
import { PresetsDown, PresetsRefused } from "./wire.js";

/** Ярлыки вида: по ним служба отбирает записи, не толкуя ни одной. */
export const PRESET_KIND = {
  palette: "palette",
  form: "form",
  outfit: "outfit",
  assembly: "assembly",
  content: "content",
  tag: "tag",
} as const;

export type PresetKind = (typeof PRESET_KIND)[keyof typeof PRESET_KIND];

/** Готовые данные компонента — второй источник наполнения показа, рядом с фейк-генератором. */
export interface ContentState {
  readonly component: string;
  readonly data: unknown;
  readonly author?: string;
}

/** Словарная запись тега (`packages/skin/src/tags`). Канона для неё в `engine/look/types.ts` нет
 *  и не заводился — форма только по живой записи (`tag/status`), другие модули её типом не берут,
 *  `checkTags`/`groupByTag` работают со строками имён, не с записью. Тип inline, не в каноне. */
export interface Tag {
  readonly name: string;
  /** Человеческое имя тега — ОТДЕЛЬНО от `PresetRecord.label` (на живой записи это два разных
   *  значения: "status" / "Статусы"). */
  readonly label?: string;
  readonly author?: string;
}

/** Содержимое по ярлыку — то, что действительно лежит под `state`. */
interface PresetKindState {
  palette: Palette;
  form: Form;
  outfit: Outfit;
  assembly: ComponentAssembly;
  content: ContentState;
  tag: Tag;
}

/** Запись службы ЦЕЛИКОМ — то же самое, что несёт `GET {base}/{id}`, типизированное содержимым. */
export interface PresetRecord<T> {
  /** Идентификатор записи — только для человека в отладчике; операции клиента адресуют ИМЕНЕМ. */
  readonly id: string;
  /** Имя для человека. */
  readonly label: string;
  /** Имя для машины — им запись зовут наряд и источник. */
  readonly name: string;
  /** Вид записи — то же, чем её адресовали (`PRESET_KIND`). */
  readonly kind: PresetKind;
  /** Когда записана — ставит служба, не клиент. */
  readonly savedAt: string;
  /** Содержимое: Palette/Form/Outfit/ComponentAssembly — по ярлыку. */
  readonly state: T;
}

/** Чужой ответ разбирается, а не приводится типом. */
interface WirePreset {
  id?: unknown;
  label?: unknown;
  name?: unknown;
  kind?: unknown;
  savedAt?: unknown;
  // Palette/Form/Content/Assembly — общий сквозной атрибут.
  author?: unknown;
  // Palette
  scales?: unknown;
  dimensions?: unknown;
  light?: unknown;
  dark?: unknown;
  // Form
  component?: unknown;
  recipe?: unknown;
  keyframes?: unknown;
  variantTags?: unknown;
  // Outfit — связи резолвятся в объекты, канон Outfit хочет строки имён; переходник в toState.
  palette?: { name?: unknown } | null;
  forms?: readonly { name?: unknown }[];
  tags?: readonly { name?: unknown }[];
  overrides?: unknown;
  // Content
  data?: unknown;
  // Assembly
  assembly?: unknown;
  // Tag — tagLabel, НЕ верхнеуровневый label (тот самой записи, этот — самого тега).
  tagLabel?: unknown;
}

const text = (value: unknown): string => (typeof value === "string" ? value : "");

/** Одно и то же тело запроса для любого вида — фрагмент по нужному типу резолвится сам, `kind`
 *  фильтрует уже на бэке. Единый текст запроса на весь клиент, а не собранный под каждый вызов. */
const LIST_QUERY = gql`
  query ListPresets($kind: String, $component: [String!]) {
    presets(kind: $kind, component: $component) {
      id
      label
      name
      kind
      savedAt
      ... on Palette {
        author
        scales
        dimensions
        light
        dark
      }
      ... on Form {
        component
        recipe
        keyframes
        variantTags
        author
      }
      ... on Outfit {
        palette {
          name
        }
        forms {
          name
        }
        tags {
          name
        }
        overrides
        author
      }
      ... on Content {
        component
        data
        author
      }
      ... on Assembly {
        component
        assembly
        author
      }
      ... on Tag {
        tagLabel
        author
      }
    }
  }
`;

const CREATE_MUTATION = gql`
  mutation CreatePreset($input: PresetInput!) {
    createPreset(input: $input) {
      id
      label
      name
      kind
      savedAt
    }
  }
`;

const REPLACE_MUTATION = gql`
  mutation ReplacePreset($id: ID!, $input: PresetInput!) {
    replacePreset(id: $id, input: $input) {
      id
      label
      name
      kind
      savedAt
    }
  }
`;

const DELETE_MUTATION = gql`
  mutation DeletePreset($id: ID!) {
    deletePreset(id: $id)
  }
`;

/** `state`, каким его хочет `types.ts` — плоские имена вместо резолвленных Outfit-связей. */
function toState<T>(kind: PresetKind, item: WirePreset): T {
  if (kind === "outfit") {
    return {
      palette: text(item.palette?.name),
      forms: (item.forms ?? []).map((form) => text(form.name)),
      tags: (item.tags ?? []).map((tag) => text(tag.name)),
      overrides: item.overrides,
      author: item.author,
    } as T;
  }

  if (kind === "palette") {
    return {
      scales: item.scales,
      dimensions: item.dimensions,
      light: item.light,
      dark: item.dark,
      author: item.author,
    } as T;
  }

  if (kind === "form") {
    return {
      component: item.component,
      recipe: item.recipe,
      keyframes: item.keyframes,
      variantTags: item.variantTags,
      author: item.author,
    } as T;
  }

  if (kind === "assembly") {
    return { component: item.component, assembly: item.assembly, author: item.author } as T;
  }

  if (kind === "tag") {
    return { label: item.tagLabel, author: item.author } as T;
  }

  // content
  return { component: item.component, data: item.data, author: item.author } as T;
}

function toRecord<K extends PresetKind>(kind: K, item: WirePreset): PresetRecord<PresetKindState[K]> {
  const name = text(item.name);
  return {
    id: text(item.id),
    label: text(item.label) === "" ? name : text(item.label),
    name,
    kind: text(item.kind) as PresetKind,
    savedAt: text(item.savedAt),
    state: { name, ...toState<PresetKindState[K]>(kind, item) },
  };
}

/** Сетевой обрыв/5xx — служба физически недоступна; занятое имя/неизвестный kind/кривой конверт
 *  (`errors` в теле 200-ответа) — служба ответила и отказала. Статус решает, куда отнести отказ:
 *  `< 500` держит и HTTP 4xx, и GraphQL-`errors` при HTTP 200 (`ClientError.response.status`
 *  в обоих случаях — код исходного ответа, не выдуманный). */
async function wire<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (cause) {
    if (cause instanceof ClientError) {
      const said = cause.response.errors?.[0]?.message?.trim();
      if (cause.response.status >= 500) {
        throw new PresetsDown(`служба раздачи ответила ${cause.response.status}`, { cause });
      }
      throw new PresetsRefused(said === undefined || said === "" ? `служба раздачи отказала (${cause.response.status})` : said, {
        cause,
      });
    }

    throw new PresetsDown(`служба раздачи не отвечает`, { cause });
  }
}

/** Клиент службы раздачи: по каждому виду — перечень, чтение, запись, замена, удаление. */
export interface PresetsClient {
  /** Перечень записей вида со содержимым — один GraphQL-запрос, без отдельного чтения на запись.
   *  `component` сужает выдачу до ЛЮБОГО из перечисленных (OR) — смысл несёт только у видов,
   *  содержащих поле `component` (`form`/`assembly`/`content`); у прочих видов (`palette`/`outfit`/
   *  `tag`) записи такого поля не несут и при заданном `component` в выдачу не попадают —
   *  см. `schema.graphql`. */
  list<K extends PresetKind>(
    kind: K,
    options?: { readonly component?: readonly string[] },
  ): Promise<readonly PresetRecord<PresetKindState[K]>[]>;

  /** Запись по имени, либо `undefined` — такой в службе нет. */
  get<K extends PresetKind>(kind: K, name: string): Promise<PresetRecord<PresetKindState[K]> | undefined>;

  /** Кладёт новую запись. Уникальность имени держит служба. */
  save<K extends PresetKind>(
    kind: K,
    name: string,
    state: PresetKindState[K],
    label?: string,
  ): Promise<PresetRecord<PresetKindState[K]>>;

  /** Кладёт запись вместо прежней с тем же именем и ярлыком — одна атомарная замена на бэке. */
  replace<K extends PresetKind>(
    kind: K,
    name: string,
    state: PresetKindState[K],
    label?: string,
  ): Promise<PresetRecord<PresetKindState[K]>>;

  /** Убирает запись по имени и ярлыку. Имени нет — уже убрано, а не отказ. */
  remove(kind: PresetKind, name: string): Promise<void>;
}

/** Чем заводится клиент. */
export interface PresetsClientOptions {
  /** Адрес `/graphql` службы раздачи целиком, не REST-`{base}`. */
  readonly url: string;
}

interface ListResponse {
  presets: readonly WirePreset[];
}

interface MutateResponse {
  id?: unknown;
  kind?: unknown;
  savedAt?: unknown;
}

/** Заводит клиент службы раздачи по одному адресу; общего состояния между экземплярами нет. */
export function createPresetsClient(options: PresetsClientOptions): PresetsClient {
  const client = createGraphQLClient({ url: options.url });

  async function wireList(kind: PresetKind, component?: readonly string[]): Promise<WirePreset[]> {
    const body = await wire(() => client.request<ListResponse>(LIST_QUERY, { kind, component }));
    return body.presets.filter((item) => text(item.name) !== "" && text(item.id) !== "");
  }

  async function list<K extends PresetKind>(
    kind: K,
    options?: { readonly component?: readonly string[] },
  ): Promise<readonly PresetRecord<PresetKindState[K]>[]> {
    return (await wireList(kind, options?.component)).map((item) => toRecord(kind, item));
  }

  async function get<K extends PresetKind>(
    kind: K,
    name: string,
  ): Promise<PresetRecord<PresetKindState[K]> | undefined> {
    const item = (await wireList(kind)).find((candidate) => text(candidate.name) === name);
    return item === undefined ? undefined : toRecord(kind, item);
  }

  async function save<K extends PresetKind>(
    kind: K,
    name: string,
    state: PresetKindState[K],
    label?: string,
  ): Promise<PresetRecord<PresetKindState[K]>> {
    const body = await wire(() =>
      client.request<{ createPreset: MutateResponse }>(CREATE_MUTATION, {
        input: { kind, label: label ?? name, name, state },
      }),
    );

    return {
      id: text(body.createPreset.id),
      label: label ?? name,
      name,
      kind: text(body.createPreset.kind) as PresetKind,
      savedAt: text(body.createPreset.savedAt),
      state,
    };
  }

  async function replace<K extends PresetKind>(
    kind: K,
    name: string,
    state: PresetKindState[K],
    label?: string,
  ): Promise<PresetRecord<PresetKindState[K]>> {
    const existing = (await wireList(kind)).find((candidate) => text(candidate.name) === name);
    if (existing === undefined) return save(kind, name, state, label);

    const body = await wire(() =>
      client.request<{ replacePreset: MutateResponse }>(REPLACE_MUTATION, {
        id: text(existing.id),
        input: { kind, label: label ?? name, name, state },
      }),
    );

    return {
      id: text(body.replacePreset.id),
      label: label ?? name,
      name,
      kind: text(body.replacePreset.kind) as PresetKind,
      savedAt: text(body.replacePreset.savedAt),
      state,
    };
  }

  async function remove(kind: PresetKind, name: string): Promise<void> {
    const existing = (await wireList(kind)).find((candidate) => text(candidate.name) === name);
    // Имени нет — оно уже убрано (или никогда не было): второй вызов `remove` с тем же именем —
    // не отказ, идемпотентность держится смыслом, а не только HTTP-методом.
    if (existing === undefined) return;

    await wire(() => client.request<{ deletePreset: boolean }>(DELETE_MUTATION, { id: text(existing.id) }));
  }

  return { list, get, save, replace, remove };
}
