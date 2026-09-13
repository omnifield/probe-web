import { neuroboxUrl, resolveAccessHeaders } from "./access.js";
import type { NeuroboxAccessOptions } from "./access.js";

export type NeuroboxFeedbackKind = "friction" | "praise";

/**
 * `POST /api/feedback/{threadId}` (`NEUROBOX_CLIENT.md`, раздел «Отзывы о боксе»): хорошее
 * записывают наравне с плохим — по одним жалобам не видно, что работает. Про чужие зоны сюда не
 * пишут, у них свои ручки отзывов. `workaround` — как обошли затык; осмыслен для `friction`, для
 * `praise` обычно нет, поэтому необязателен.
 */
export interface NeuroboxFeedback {
  kind: NeuroboxFeedbackKind;
  what: string;
  where: string;
  workaround?: string;
}

export interface NeuroboxFeedbackOptions extends NeuroboxAccessOptions {
  /** Адрес бокса. Пусто — запрос идёт относительным путём (`/api/feedback/...`). */
  baseUrl?: string;
  fetchClient?: typeof fetch;
}

export async function sendNeuroboxFeedback(
  threadId: string,
  feedback: NeuroboxFeedback,
  options: NeuroboxFeedbackOptions,
): Promise<void> {
  const fetchClient = options.fetchClient ?? fetch;
  const headers = await resolveAccessHeaders(options);

  const response = await fetchClient(neuroboxUrl(options.baseUrl, "api", "feedback", threadId), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(feedback),
  });
  if (!response.ok) {
    throw new Error(`Нейробокс отказал в записи отзыва: ${response.status} ${response.statusText}`);
  }
}
