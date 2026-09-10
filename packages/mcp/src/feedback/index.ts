// Тонкий GraphQL-клиент к фидбэку — зеркало трёх операций backend/presets's feedback.graphql
// (уже принята и реализована), ни поля сверх того, что там есть. Фидбэк — отдельная сущность,
// не вид пресета (feedback-bucket-and-type, backend/presets/ROADMAP.yaml), поэтому свой минимальный
// набор отказов (FeedbackDown/FeedbackRefused), не общий с ../wire.ts пресетов — делить контракт
// ошибок между несвязанными сущностями незачем. `url` — параметр каждого вызова, не константа
// модуля: этот пакет не знает и не должен знать, что сегодня это тот же процесс, что у пресетов.
// Тулы конкретной зоны (apps/skin/.mcp/src/tools/feedback.ts) — отдельное ТЗ, не этот файл.

import { ClientError, gql, graphqlRequest } from "@web-core/query/graphql";

/** Заявка — зеркало `FeedbackEntry` схемы (`backend/presets/internal/graphql/feedback.graphql`). */
export interface FeedbackEntry {
  readonly id: string;
  readonly savedAt: string;
  readonly tool: string;
  readonly action: string;
  readonly expected?: string;
  readonly actual: string;
  readonly sign: string;
  readonly status: string;
  readonly at: string;
  readonly resolvedAt?: string;
  readonly note?: string;
}

/** Вход `reportFeedback` — зеркало `FeedbackInput`. `sign` не задан — бэк сам берёт `"issue"`. */
export interface FeedbackInput {
  readonly tool: string;
  readonly action: string;
  readonly expected?: string;
  readonly actual: string;
  readonly sign?: string;
}

/** Фильтр `listFeedback` — зеркало аргументов `Query.feedback`. Оба поля не заданы — все заявки. */
export interface ListFeedbackFilter {
  readonly status?: string;
  readonly sign?: string;
}

/** Служба ответила и отказала: заявка уже разобрана, кривой вход. Отличать от {@link FeedbackDown}. */
export class FeedbackRefused extends Error {}

/** Службы нет по названному адресу: обрыв связи или пятисотка. */
export class FeedbackDown extends Error {}

const FIELDS = `
  id
  savedAt
  tool
  action
  expected
  actual
  sign
  status
  at
  resolvedAt
  note
`;

const REPORT_FEEDBACK = gql`
  mutation ReportFeedback($input: FeedbackInput!) {
    reportFeedback(input: $input) { ${FIELDS} }
  }
`;

const LIST_FEEDBACK = gql`
  query ListFeedback($status: String, $sign: String) {
    feedback(status: $status, sign: $sign) { ${FIELDS} }
  }
`;

const RESOLVE_FEEDBACK = gql`
  mutation ResolveFeedback($id: ID!, $note: String) {
    resolveFeedback(id: $id, note: $note) { ${FIELDS} }
  }
`;

/** Сетевой обрыв/5xx — служба физически недоступна; отказ на HTTP < 500 (в т.ч. GraphQL-`errors`
 *  при HTTP 200) — служба ответила и отказала. Тот же приём, что `packages/skin/src/presets/
 *  client.ts`'s `wire()`, но свой тип отказа — фидбэк не пресет. */
async function wire<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (cause) {
    if (cause instanceof ClientError) {
      const said = cause.response.errors?.[0]?.message?.trim();
      if (cause.response.status >= 500) {
        throw new FeedbackDown(`служба фидбэка ответила ${cause.response.status}`, { cause });
      }
      throw new FeedbackRefused(said === undefined || said === "" ? `служба фидбэка отказала (${cause.response.status})` : said, {
        cause,
      });
    }

    throw new FeedbackDown(`служба фидбэка не отвечает`, { cause });
  }
}

/** Кладёт заявку. */
export async function reportFeedback(url: string, input: FeedbackInput): Promise<FeedbackEntry> {
  const body = await wire(() => graphqlRequest<{ reportFeedback: FeedbackEntry }>(url, REPORT_FEEDBACK, { input }));
  return body.reportFeedback;
}

/** Перечень заявок; `status`/`sign` не заданы — все. */
export async function listFeedback(url: string, filter: ListFeedbackFilter = {}): Promise<readonly FeedbackEntry[]> {
  const body = await wire(() => graphqlRequest<{ feedback: readonly FeedbackEntry[] }>(url, LIST_FEEDBACK, filter));
  return body.feedback;
}

/** Ставит `status:"resolved"` поверх заявки. Уже разобрана — служба отказывает (`FeedbackRefused`). */
export async function resolveFeedback(url: string, id: string, note?: string): Promise<FeedbackEntry> {
  const body = await wire(() => graphqlRequest<{ resolveFeedback: FeedbackEntry }>(url, RESOLVE_FEEDBACK, { id, note }));
  return body.resolveFeedback;
}
