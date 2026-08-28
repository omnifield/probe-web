// ПАНЕЛЬ СВОЙСТВ — ЧЕМ КОМПОНЕНТ МОЖЕТ БЫТЬ (`PWEB-89`), отдельной колонкой справа.
//
// Не фильтр показа и не ось: вариация и состояние отбирают, какие случаи видно, а настройка
// меняет сам ЭКЗЕМПЛЯР — поведение и разметку, вертикальная гармошка и горизонтальная это разные
// клавиши и разные `aria`. Смешать её с осями значило бы поставить рядом два разных вопроса:
// «что показать» и «чем это является».
//
// Перечень объявляет ПОСТАВЩИК, витрина своего не ведёт — иначе гармошка навсегда осталась бы
// такой, какой её однажды показали: без закрытия последнего раздела и в одном положении.
//
// Компонент без объявленных настроек панель не рисует вовсе: пустая колонка сбоку — вопрос без
// ответа, а не честное «здесь настраивать нечего».
//
// НАСТОЯЩИЙ КИТ, НЕ НАТИВНАЯ РАЗМЕТКА (решение user 2026-08-27, `PWEB-161`): панель — колонка
// того же продукта, что показывает витрина, и одевается тем же нарядом. Булева настройка — через
// `switch` (два положения, дословно), выбор — через `field`+`select` вне зависимости от числа
// вариантов (сегментный переключатель на два пункта — законное сужение, которое здесь НЕ сделано:
// два вида пикера ради одной панели настроек — накрутка сверх того, что просили, `kit-bridge.ts`
// объясняет, откуда берутся сами части).

import { Surface } from "@omnifield/probe-web-ui";
import type { DataPreset } from "@omnifield/probe-web-ui/passport";
import { For, Show, type JSX } from "solid-js";

import { settingApplies, settingsOf } from "../model/settings.js";
import { extraOf, partOf } from "./kit-bridge.js";

const Field = partOf<{ title?: string; children?: JSX.Element }>("field", "root");
const FieldLabel = partOf<{ children?: JSX.Element }>("field", "label");
const FieldSelect = partOf<JSX.SelectHTMLAttributes<HTMLSelectElement>>("field", "select");
const Switch = partOf<{
  checked?: boolean;
  disabled?: boolean;
  onCheckedChange?: (details: { checked: boolean }) => void;
  title?: string;
  children?: JSX.Element;
}>("switch", "root");
const SwitchControl = partOf<{ children?: JSX.Element }>("switch", "control");
const SwitchThumb = partOf<Record<string, never>>("switch", "thumb");
const SwitchLabel = partOf<{ children?: JSX.Element }>("switch", "label");
// `hiddenInput` несёт НЕ адрес анатомии, а `extra` (`PWEB-152`) — настоящий `<input>`, на котором
// реально висит `onChange`; без него превью выглядит верно, но клик ничего не переключает (та же
// дыра, что чинили для показа компонентов в галерее, — здесь она ровно так же актуальна: движка
// сборки тут нет, но урок общий для любой прямой JSX-композиции `switch`).
const SwitchHiddenInput = extraOf<Record<string, never>>("switch", "hiddenInput");

export function SettingsPanel(props: {
  component: string;
  settings: Readonly<Record<string, unknown>>;
  onSetting: (name: string, value: unknown) => void;
  /**
   * Заполнение данными (`PWEB-156`) — заготовленные JSON под сборку `filled`, если у компонента
   * она есть. Пустой перечень — компонент без такой сборки, раздел не рисуется вовсе, тем же
   * приёмом, что и у «Свойства» без объявленных настроек.
   */
  dataPresets: readonly DataPreset[];
  dataPreset: DataPreset | null;
  onDataPreset: (preset: DataPreset | null) => void;
}) {
  const hasSettings = () => settingsOf(props.component).length > 0;
  const hasData = () => props.dataPresets.length > 0;

  return (
    <Show when={hasSettings() || hasData()}>
      <Surface as="aside" data-variant="raised" style={{ display: "flex", "flex-direction": "column", gap: "var(--space-4)" }}>
        <Show when={hasData()}>
          <section style={{ display: "flex", "flex-direction": "column", gap: "var(--space-2)" }}>
            <b>Заполнение</b>
            <span>заготовленные данные — просто посмотреть, как компонент смотрится в разных ситуациях</span>

            <Field>
              <FieldLabel>данные</FieldLabel>
              <FieldSelect
                value={props.dataPreset?.name ?? ""}
                onChange={(event) => {
                  const name = event.currentTarget.value;
                  props.onDataPreset(name === "" ? null : (props.dataPresets.find((preset) => preset.name === name) ?? null));
                }}
              >
                <option value="">демо кита (по умолчанию)</option>
                <For each={props.dataPresets}>{(preset) => <option value={preset.name}>{preset.means}</option>}</For>
              </FieldSelect>
            </Field>
          </section>
        </Show>

        <Show when={hasSettings()}>
          <section style={{ display: "flex", "flex-direction": "column", gap: "var(--space-2)" }}>
            <b>Свойства</b>
            <span>чем компонент может быть — задаёт поставщик</span>

            <For each={settingsOf(props.component)}>
              {(setting) => {
                // Применимость СПРАШИВАЕТСЯ у паспорта (`SKINED-7`), а не сравнивается именами
                // руками: паспорт объявляет зависимость данными (`dependsOn`), и второй, наш
                // список «какая настройка кого перебивает» разошёлся бы с ним на первом же новом
                // поставщике. Настройка при этом не пропадает из панели — она гаснет: человек
                // должен видеть, что компонент её несёт, а не гадать, куда она делась.
                const applies = () => settingApplies(props.component, setting.name, props.settings);
                const means = () =>
                  applies() ? setting.means : `${setting.means} — сейчас не действует: перебито другой настройкой`;

                return (
                  <Show
                    when={setting.values.kind === "choice" ? setting.values : null}
                    fallback={
                      <Switch
                        checked={props.settings[setting.name] === true}
                        disabled={!applies()}
                        onCheckedChange={(details) => props.onSetting(setting.name, details.checked)}
                        title={means()}
                      >
                        <SwitchControl>
                          <SwitchThumb />
                        </SwitchControl>
                        <SwitchLabel>{setting.title}</SwitchLabel>
                        <SwitchHiddenInput />
                      </Switch>
                    }
                  >
                    {(choice) => (
                      <Field title={means()}>
                        <FieldLabel>{setting.title}</FieldLabel>
                        <FieldSelect
                          disabled={!applies()}
                          value={String(props.settings[setting.name] ?? setting.byDefault)}
                          onChange={(event) => props.onSetting(setting.name, event.currentTarget.value)}
                        >
                          <For each={choice().options}>{(option) => <option value={option.value}>{option.means}</option>}</For>
                        </FieldSelect>
                      </Field>
                    )}
                  </Show>
                );
              }}
            </For>
          </section>
        </Show>
      </Surface>
    </Show>
  );
}
