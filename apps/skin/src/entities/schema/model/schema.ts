import type { PathType } from "@web-core/io";

/** Ссылка на поставщика, откуда фактически пришла схема (эндпоинт, загруженный файл, …) — тот же
 *  приём, что задуман для `Adapter.channels` (ROADMAP.yaml, adapter-independent-entities-decomposition):
 *  подсказка UX "где я это уже видел", не рабочая связь — сама схема от поставщика не зависит. */
export interface Ref {
  readonly type: string;
  readonly id: string;
}

export interface Schema {
  readonly id: string;
  readonly fields: readonly PathType[];
  readonly providers?: readonly Ref[];
}
