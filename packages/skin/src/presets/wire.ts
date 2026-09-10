// Два класса отказа службы раздачи, общие для source.ts и client.ts. Разбор конвертов — в client.ts.

/** Служба ответила и отказала: имя занято, предел, кривой конверт. Отличать от {@link PresetsDown}. */
export class PresetsRefused extends Error {}

/** Службы нет по названному адресу: обрыв связи или пятисотка. */
export class PresetsDown extends Error {}
