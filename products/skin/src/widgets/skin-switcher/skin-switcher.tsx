// ПЕРЕКЛЮЧАТЕЛЬ СКИНА — какой наряд надет и в какой половине (`PWEB-173`, восстановлено, было
// частью `pages/showcase/ui/head.tsx`). Общее на всё приложение — скин один, половина одна, —
// поэтому виджет ставится один раз в постоянном каркасе (`pages/_workspace/index.tsx`), а не на
// отдельной странице: тронь надетое на `/lab`, показалось бы, что одеваешь `/lab`, а одевается всё.
//
// ВЫПАДАЮЩИЙ СПИСОК — НАТИВНЫЙ `<select>`, НЕ КОМПОНЕНТ КИТА, и это находка, не выбор со вкуса.
// `field`/`select` уже мигрированы на новую anatomy-форму (паспорт и `kit` зарегистрированы —
// `field/entity/passport.ts`, `select/entity/passport.ts`), но `packages/ui/src/index.ts`
// (публичный вход примитивов) всё ещё реэкспортирует СТАРЫЕ legacy-файлы (`field.tsx`,
// Kobalte-`select.tsx`) под теми же именами `Field`/`Select` — их адресация (`data-scope`/
// `data-part`) не обязана совпасть с тем, что объявляет уже зарегистрированный паспорт. Ставить
// сюда `Select` значило бы одеть узел, который паспорт не признает своим. Замерено 2026-08-29,
// заявка architect → components (переключить `index.ts` на новые `field/index.js`/
// `select/index.js`). `Button` ниже — не легаси, обычный экспорт, без вопросов.
import type { SkinMode } from "@omnifield/probe-web-runtime";
import { Button } from "@omnifield/probe-web-ui";
import { For, Show } from "solid-js";

import { EMPTY_HINT, SERVICE_HINT } from "../../entities/outfit/model/index.js";
import { createWearingState } from "./model.js";

const MODES: readonly SkinMode[] = ["light", "dark"];

export function SkinSwitcher() {
  const wearing = createWearingState();

  const choose = (value: string) => {
    if (value === "") wearing.takeOff();
    else wearing.wear(value);
  };

  const worn = () => wearing.worn();

  /** Строка тревоги — не более одной сразу, порядок содержателен (см. комментарий ниже). */
  const trouble = (): string | null => {
    // Службы нет — надевать нечего вообще, и об этом говорят первым.
    if (wearing.records.error !== undefined) {
      return `${String((wearing.records.error as Error).message)} · ${SERVICE_HINT}`;
    }

    // Отказ надевания — следом: список пришёл, скин выбран, а вида нет.
    if (wearing.refusal() !== null) return wearing.refusal();

    return (wearing.records()?.length ?? 0) === 0 ? `Скинов в службе нет · ${EMPTY_HINT}` : null;
  };

  return (
    <div style={{ display: "flex", "align-items": "center", gap: "var(--space-3)" }}>
      <Show when={trouble()}>{(said) => <span>{said()}</span>}</Show>

      {/* РЕЖИМ ПОКАЗЫВАЕТСЯ ТОЛЬКО ПРИ НАДЕТОМ СКИНЕ. Светлая и тёмная половины — половины
          СКИНА: цвет принадлежит одежде, а не тому, на что её надевают. Нет скина — переключать
          нечего. */}
      <Show when={worn() !== null}>
        <div role="group" aria-label="Режим" style={{ display: "flex", gap: "var(--space-1)" }}>
          <For each={MODES}>
            {(mode) => (
              <Button
                data-variant="tertiary"
                data-pressed={worn()?.mode === mode ? "" : undefined}
                aria-pressed={worn()?.mode === mode}
                onClick={() => wearing.setMode(mode)}
              >
                {mode === "light" ? "светлый" : "тёмный"}
              </Button>
            )}
          </For>
        </div>
      </Show>

      <label style={{ display: "flex", "align-items": "center", gap: "var(--space-2)" }}>
        Скин
        <select
          value={worn()?.name ?? ""}
          disabled={wearing.records.error !== undefined || (wearing.records()?.length ?? 0) === 0}
          onChange={(event: Event & { currentTarget: HTMLSelectElement }) =>
            choose(event.currentTarget.value)
          }
        >
          <option value="">без скина</option>
          <For each={wearing.records() ?? []}>
            {(record) => <option value={record.name}>{record.label}</option>}
          </For>
        </select>
      </label>
    </div>
  );
}
