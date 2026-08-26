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

import { For, Show } from "solid-js";

import { settingApplies, settingsOf } from "./settings.js";

export function SettingsPanel(props: {
  component: string;
  settings: Readonly<Record<string, unknown>>;
  onSetting: (name: string, value: unknown) => void;
}) {
  return (
    <Show when={settingsOf(props.component).length > 0}>
      <aside class="props">
        <div class="props__head">
          <b class="props__title">Свойства</b>
          <span class="props__note">чем компонент может быть — задаёт поставщик</span>
        </div>

        <div class="props__list">
          <For each={settingsOf(props.component)}>
            {(setting) => {
              // Применимость СПРАШИВАЕТСЯ у паспорта (`SKINED-7`), а не сравнивается именами
              // руками: паспорт объявляет зависимость данными (`dependsOn`), и второй, наш
              // список «какая настройка кого перебивает» разошёлся бы с ним на первом же новом
              // поставщике. Настройка при этом не пропадает из панели — она гаснет: человек
              // должен видеть, что компонент её несёт, а не гадать, куда она делась.
              const applies = () => settingApplies(props.component, setting.name, props.settings);
              const means = () =>
                applies()
                  ? setting.means
                  : `${setting.means} — сейчас не действует: перебито другой настройкой`;

              return (
                <label class="props__field" title={means()}>
                  <span class="props__label">{setting.title}</span>
                  <Show
                    when={setting.values.kind === "choice" ? setting.values : null}
                    fallback={
                      <input
                        class="props__flag"
                        type="checkbox"
                        disabled={!applies()}
                        checked={props.settings[setting.name] === true}
                        onChange={(event) =>
                          props.onSetting(setting.name, event.currentTarget.checked)
                        }
                      />
                    }
                  >
                    {(choice) => (
                      <Show
                        when={choice().options.length === 2}
                        // Список — когда choice действительно СПИСОК: три и больше именованных
                        // положений. Ровно на двух список превращается в вопрос «да или нет
                        // применительно к другому», и отвечать на него открыванием и закрыванием
                        // меню — лишнее движение там, где хватает одного клика.
                        fallback={
                          <select
                            class="props__select"
                            disabled={!applies()}
                            value={String(props.settings[setting.name] ?? setting.byDefault)}
                            onChange={(event) =>
                              props.onSetting(setting.name, event.currentTarget.value)
                            }
                          >
                            <For each={choice().options}>
                              {(option) => (
                                <option value={option.value} title={option.means}>
                                  {option.means}
                                </option>
                              )}
                            </For>
                          </select>
                        }
                      >
                        <div class="props__switch" role="radiogroup" aria-label={setting.title}>
                          <For each={choice().options}>
                            {(option) => {
                              const current = () =>
                                String(props.settings[setting.name] ?? setting.byDefault);

                              return (
                                <button
                                  type="button"
                                  class="props__switch-item"
                                  role="radio"
                                  disabled={!applies()}
                                  aria-checked={current() === option.value}
                                  title={option.means}
                                  onClick={() => props.onSetting(setting.name, option.value)}
                                >
                                  {option.means}
                                </button>
                              );
                            }}
                          </For>
                        </div>
                      </Show>
                    )}
                  </Show>
                </label>
              );
            }}
          </For>
        </div>
      </aside>
    </Show>
  );
}
