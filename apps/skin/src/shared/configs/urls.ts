// Адреса внешних служб — один файл на оба: до этого адрес службы пресетов и адрес доки читали
// env каждый своим маленьким парсером рядом. Живёт в shared по тому же доводу, что и `api/box`:
// за адресом приходят и сущности, и виджеты, и никто из них не должен импортировать другого ради
// него.

/** Первое непустое значение env-ключа из перечисленных, по порядку. */
function fromEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = import.meta.env[key] as string | undefined;
    if (value !== undefined && value.trim() !== "") return value.trim();
  }
  return undefined;
}

/** Путь ручки у службы пресетов. Не настройка: его держит сам бэк константой
 *  (`mux.Handle("POST /graphql", ...)` в `backend/presets/cmd/presets/main.go`), и врозь они
 *  разъезжаются. */
const GRAPHQL_PATH = "/graphql";

/** Куда ходим, когда снаружи не сказано ничего — служба на этой же машине (`backend/presets`,
 *  порт по умолчанию 8787). Так витрина поднимается без единой переменной. */
const PRESETS_LOCAL = "http://127.0.0.1:8787";

/** База службы пресетов, готовая для `createPresetsClient({ url })`.
 *
 *  `PRESETS_URL` — корневой `.env` воркспейса, общий с серверными потребителями (у них имя без
 *  префикса). `VITE_PRESETS_URL` — прежняя ручка этой зоны, оставлена: ею переопределяют адрес
 *  на одну команду, не трогая общий файл. Путь дописываем сами, если его не дали: в `.env`
 *  естественно записать АДРЕС СЛУЖБЫ, а клиенту (`@web-core/skin/presets`) нужен готовый
 *  `/graphql` целиком. Полный адрес с путём тоже принимаем: тогда не трогаем. */
export const PRESETS_URL = (() => {
  const base = (fromEnv("PRESETS_URL", "VITE_PRESETS_URL") ?? PRESETS_LOCAL).replace(/\/+$/, "");
  return base.endsWith(GRAPHQL_PATH) ? base : base + GRAPHQL_PATH;
})();

/** Куда ходим за докой компонента, когда снаружи не сказано ничего — бэк доки на этой же машине,
 *  порт 7777 (не 5555): он же проверяет CSP (`frame-ancestors`), там же явно разрешён наш origin
 *  для встраивания. */
const DOCS_LOCAL = "http://localhost:7777/workspaces/UI/pages";

const DOCS_URL = fromEnv("VITE_DOCS_URL") ?? DOCS_LOCAL;

/** Адрес embed-страницы доки компонента — базовый урл + имя компонента + `/embed` (голая
 *  страница, без интерфейса воркспейса вокруг). */
export function docsUrlOf(component: string): string {
  return `${DOCS_URL}/${component}/embed`;
}
