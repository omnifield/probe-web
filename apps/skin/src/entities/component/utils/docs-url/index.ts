// Тот же приём, что у PRESETS_URL (`../../model/info.ts`) — адрес задаётся окружением, дефолт
// на случай, если переменная не задана. Порт 7777, не 5555: это бэкенд, он и проверяет CSP
// (`frame-ancestors`) — там же явно разрешён наш origin для встраивания.
const DOCS_URL =
  (import.meta.env["VITE_DOCS_URL"] as string | undefined) ??
  "http://localhost:7777/workspaces/UI/pages";

/** Адрес embed-страницы доки компонента — базовый урл + имя компонента + `/embed` (голая
 *  страница, без интерфейса воркспейса вокруг). Сборка URL живёт здесь, не в виджете показа
 *  (`widgets/component/docs`) — тот ждёт готовый урл, не имя. */
export function docsUrlOf(component: string): string {
  return `${DOCS_URL}/${component}/embed`;
}
