import { ClientError } from "@web-core/query/graphql";

import { PresetsDown, PresetsRefused } from "../wire.js";

export async function wire<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (cause) {
    if (cause instanceof ClientError) {
      const said = cause.response.errors?.[0]?.message?.trim();
      if (cause.response.status >= 500) {
        throw new PresetsDown(`служба раздачи ответила ${cause.response.status}`, { cause });
      }
      throw new PresetsRefused(
        said === undefined || said === "" ? `служба раздачи отказала (${cause.response.status})` : said,
        { cause },
      );
    }

    throw new PresetsDown(`служба раздачи не отвечает`, { cause });
  }
}
