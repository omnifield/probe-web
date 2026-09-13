import type { z } from "@web-core/io";

export type { z };

export type FieldKind = "string" | "number" | "boolean" | "enum" | "list";

/** Путь до поля — сегменты ключей. Индексы массива в путь никогда не попадают — поля-массивы
 *  (`kind: "list"`) меняются целиком элементом, не точечным путём внутрь него. */
export type FieldPath = readonly string[];

export interface JsonProp {
  readonly type?: string;
  readonly enum?: readonly unknown[];
  readonly properties?: Record<string, JsonProp>;
  readonly items?: JsonProp;
  readonly $ref?: string;
}

export interface JsonRoot extends JsonProp {
  readonly $defs?: Record<string, JsonProp>;
}

/** Схема ОДНОГО элемента списка — непрозрачный дескриптор для `fieldsOfElement`: несёт JSON Schema
 *  узел элемента и корень документа (нужен для разрешения `$ref` — списки поддерживают
 *  самоссылающиеся элементы, `children` того же вида, что родитель). */
export interface ListElementSchema {
  readonly root: JsonRoot;
  readonly node: JsonProp;
}

export interface FieldDescriptor {
  readonly path: FieldPath;
  /** Путь через точку, человеку — схема сама имён полей не хранит. */
  readonly label: string;
  readonly kind: FieldKind;
  /** Только у `kind: "enum"`. */
  readonly options?: readonly string[];
  /** Только у `kind: "list"` — схема одного элемента, передаётся обратно в `fieldsOfElement`. */
  readonly element?: ListElementSchema;
}
