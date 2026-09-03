// ИНФОРМАЦИЯ О КОМПОНЕНТЕ — подключение готового `createComponentInfo`
// (`@omnifield/probe-web-ui/component-info`, PWEB-217–219) к нашей службе раздачи. Кит —
// умолчание самой фабрики (`kitComponentProvider()`, наш и единственный поставщик сегодня);
// назвать снаружи нужно только адрес службы.
import { createComponentInfo } from "@omnifield/probe-web-ui/component-info";
import { createPresetsClient } from "@omnifield/probe-web-skin/presets";

const PRESETS_URL =
  (import.meta.env["VITE_PRESETS_URL"] as string | undefined) ?? "http://127.0.0.1:8787/api/presets";

/** Всё, что известно про компонент нашего кита — кит синхронно, служба асинхронно, одним вызовом. */
export const componentInfo = createComponentInfo({
  presets: createPresetsClient({ url: PRESETS_URL }),
});
