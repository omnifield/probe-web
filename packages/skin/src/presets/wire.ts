// Design notes: ../README.md#presets
//
// НИЗ ПРОВОДА К СЛУЖБЕ РАЗДАЧИ (`backend/presets`) — ровно один вызов, `ask()`, и два класса
// отказа. Разбор конвертов (перечень/содержимое/запись) — выше, в `client.ts`: здесь только то,
// что не знает о форме тела ни на чтении, ни на записи.

/**
 * Служба ОТВЕТИЛА и отказала: имя занято, предел, кривой конверт.
 *
 * Отличать от {@link PresetsDown} обязательно: приложение обязано говорить по-разному «службы
 * нет» и «служба отказала» — молчаливо слить их значило бы показать человеку не то лечение.
 */
export class PresetsRefused extends Error {}

/** Службы нет по названному адресу: обрыв связи или пятисотка. */
export class PresetsDown extends Error {}

/**
 * Один HTTP-вызов к службе раздачи с переводом отказов в {@link PresetsDown}/{@link PresetsRefused}.
 *
 * Граница ровно на 500: ниже — служба ответила по делу и это её решение, выше и обрыв связи —
 * службы как будто нет.
 */
export async function ask(url: string, init?: RequestInit): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(url, init);
  } catch (cause) {
    // Обрыв связи — не отказ: службы просто нет по этому адресу. Человеку нужен адрес, а не
    // текст ошибки движка: «Failed to fetch» не говорит, что делать, а адрес говорит.
    throw new PresetsDown(`служба раздачи не отвечает по адресу ${new URL(url).origin}`, { cause });
  }

  if (response.ok) return response;

  if (response.status < 500) {
    const said = (await response.text().catch(() => "")).trim();
    throw new PresetsRefused(said === "" ? `служба раздачи отказала (${response.status})` : said);
  }

  throw new PresetsDown(`служба раздачи ответила ${response.status}`);
}
