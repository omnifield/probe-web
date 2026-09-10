// Единственный QueryClient на всё приложение — общий инстанс, не деталь `app/index.tsx`. Нужен
// СНАРУЖИ точки входа: `entities/component/model/content.ts` кэширует им ответы службы пресетов
// (`content-graphql-migration`), `entities/chat` инвалидирует кэш по сигналу агента
// (`chat-did-cache-invalidation`). `useQueryClient()`-хук тут не подходит — оба места вызывают
// клиент вне Solid-дерева (обычные async-функции, не компоненты), инстанс должен существовать до
// и без реактивного контекста.
import { QueryClient } from "@web-core/query";

export const queryClient = new QueryClient();
