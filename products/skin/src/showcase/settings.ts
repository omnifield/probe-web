// НАСТРОЙКИ ПОСТАВЩИКА — чем компонент МОЖЕТ БЫТЬ (`PWEB-89`).
//
// Не вид и не состояние: настройка меняет поведение, разметку и доступность — вертикальная
// гармошка и горизонтальная это разные клавиши и разные `aria`. Своего перечня здесь нет и
// подписей мы не придумываем: и то и другое объявляет поставщик, а два перечня разошлись бы на
// первом же его выпуске.
//
// ДВА ИСТОЧНИКА (`PWEB-115`/`PWEB-118`): рантайм называет значения и умолчание, редактор — текст.
// Читаются оба и складываются в одну запись — так же, как читает их сам редактор.

import { settingApplies as passportSettingApplies } from "@omnifield/probe-web-skin/model";
import { editorInfoOf, passportOf, SETTINGS } from "@omnifield/probe-web-ui/passport";

/** Значение выбора вместе с тем, что оно значит человеку — половина, которую держит редактор. */
export interface ShowcaseSettingOption {
  readonly value: string;
  readonly means: string;
}

/** Какие значения настройка принимает — тот же признак/выбор, что и в рантайме, но с текстом. */
export type ShowcaseSettingValues =
  | { readonly kind: "flag" }
  | { readonly kind: "choice"; readonly options: readonly ShowcaseSettingOption[] };

/** Настройка компонента вместе с её именем и человеческой подписью — витрине для перечня. */
export interface ShowcaseSetting {
  /** Ключ настройки: им же она уезжает пропом на корень. */
  readonly name: string;
  /** Подпись человеку — из закрытого перечня поставщика, а не наша. */
  readonly title: string;
  /** Что настройка делает — из среза редактора (`PWEB-115`), паспорт рантайма этого не несёт. */
  readonly means: string;
  /** Какие значения принимает: признак или выбор, с текстом на каждом варианте. */
  readonly values: ShowcaseSettingValues;
  /** Что действует, когда настройка не названа. */
  readonly byDefault: string | boolean;
}

/**
 * ЧЕМ КОМПОНЕНТ МОЖЕТ БЫТЬ — перечень настроек из паспорта (`PWEB-89`).
 *
 * Компонент, ничего не объявивший, отдаёт пустой перечень — показывать нечего, и это законно.
 */
export function settingsOf(component: string): readonly ShowcaseSetting[] {
  const settings = passportOf(component)?.settings ?? {};
  const editorSettings = editorInfoOf(component)?.settings ?? {};

  return Object.entries(settings).map(([name, setting]) => {
    const editor = editorSettings[name];

    const values: ShowcaseSettingValues =
      setting.values.kind === "choice"
        ? {
            kind: "choice",
            options: setting.values.options.map((option) => ({
              value: option.value,
              means: editor?.options?.[option.value]?.means ?? option.value,
            })),
          }
        : setting.values;

    return {
      name,
      title: SETTINGS[name as keyof typeof SETTINGS] ?? name,
      means: editor?.means ?? name,
      values,
      byDefault: setting.byDefault,
    };
  });
}

/**
 * Умолчания настроек — то, чем компонент работает, пока человек ничего не трогал.
 *
 * Берутся у паспорта, а не подразумеваются пустотой: «не названо» и «названо умолчанием» должны
 * быть одним положением, иначе показ разошёлся бы с тем, что человек видит в списке.
 */
export function defaultSettings(component: string): Record<string, unknown> {
  return Object.fromEntries(settingsOf(component).map((s) => [s.name, s.byDefault]));
}

/**
 * Действует ли настройка ПРИ ТЕКУЩИХ значениях — паспорт объявляет зависимость данными
 * (`PassportSetting.dependsOn`, `SKINED-7`), и спрашивать её надо этим полем, а не сравнением
 * имён настроек руками: сравнение разошлось бы с паспортом на первом же новом поставщике.
 *
 * Пример — гармошка: `collapsible` перестаёт что-либо решать, когда `multiple` уже включена
 * (`redundantWhen: true`), потому что Zag разрешает закрыть последний раздел, если включено ХОТЯ
 * БЫ одно из двух.
 *
 * @param component адрес компонента в реестре
 * @param name имя настройки, чью применимость спрашивают
 * @param values текущие значения настроек компонента
 */
export function settingApplies(
  component: string,
  name: string,
  values: Readonly<Record<string, unknown>>,
): boolean {
  return passportSettingApplies(passportOf(component)?.settings ?? {}, name, values);
}
