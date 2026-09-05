// Низ провода к службе раздачи — один вызов и два класса отказа. Разбор конвертов — в client.ts.

/** Служба ответила и отказала: имя занято, предел, кривой конверт. Отличать от {@link PresetsDown}. */
export class PresetsRefused extends Error {}

/** Службы нет по названному адресу: обрыв связи или пятисотка. */
export class PresetsDown extends Error {}

/** Один HTTP-вызов к службе раздачи с переводом отказов. Граница ровно на 500. */
export async function ask(url: string, init?: RequestInit): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch (cause) {
    // Адрес в сообщении, не текст ошибки движка: «Failed to fetch» не говорит, что делать.
    throw new PresetsDown(`служба раздачи не отвечает по адресу ${new URL(url).origin}`, { cause });
  }

  if (response.ok) return response;

  if (response.status < 500) {
    const said = (await response.text().catch(() => "")).trim();
    throw new PresetsRefused(said === "" ? `служба раздачи отказала (${response.status})` : said);
  }

  throw new PresetsDown(`служба раздачи ответила ${response.status}`);
}
