/** Значение заголовка доступа: постоянная строка либо геттер, если оно вычисляется на месте отправки. */
export type NeuroboxAccessValue = string | (() => string | Promise<string>);

export interface NeuroboxAccessOptions {
  /** `Authorization: Bearer <token>` — общий токен на приложение, не на человека. */
  token: NeuroboxAccessValue;
  /** `X-User-Login` — логин, которым приложение представляется. Только латиница (см. NEUROBOX_CLIENT.md). */
  userLogin: NeuroboxAccessValue;
}

async function resolveAccessValue(value: NeuroboxAccessValue): Promise<string> {
  return typeof value === "function" ? await value() : value;
}

export async function resolveAccessHeaders(options: NeuroboxAccessOptions): Promise<Record<string, string>> {
  const [token, userLogin] = await Promise.all([
    resolveAccessValue(options.token),
    resolveAccessValue(options.userLogin),
  ]);
  return { Authorization: `Bearer ${token}`, "X-User-Login": userLogin };
}

/**
 * Строит адрес бокса из сегментов пути, кодируя каждый через `encodeURIComponent`. `threadId`
 * приходит от потребителя пакета (имя придумывает он, см. NEUROBOX_CLIENT.md, раздел «Поток и
 * прогон») — без кодирования пробел/`/`/кириллица в нём ломает путь или подмешивает лишний сегмент.
 * Один хелпер на все места, что раньше собирали `${baseUrl}/api/...` руками (connect(), /cancel,
 * /spent, /feedback) — так дыра, однажды найденная в одном месте, не может тихо повториться в
 * следующем.
 */
export function neuroboxUrl(baseUrl: string | undefined, ...segments: Array<string>): string {
  return `${baseUrl ?? ""}${segments.map((segment) => `/${encodeURIComponent(segment)}`).join("")}`;
}
