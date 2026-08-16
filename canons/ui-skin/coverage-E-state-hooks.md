# Карта покрытия — заказ E (state-hooks)

**Сбор от 2026-08-15.** Чем компонент объявляет состояние наружу для оформления. По каждому из 8 вопросов: чем закрыт и что осталось.

Собрано: 5 новых выписок (wai-aria-1.2, css-selectors-4, css-transitions-2, radix-primitives-data-state, aria-apg-patterns); 1 запись пробела. Три поверхности разведены намеренно: НОРМА доступности (ARIA) · CSS-псевдоклассы · СОГЛАШЕНИЕ набора (data-state).

| # | вопрос | закрыт | чем | не закрыто |
|---|---|---|---|---|
| 1 | какие состояния обязательны к выражению и какими атрибутами | **да** | wai-aria-1.2: `aria-expanded`/`selected`/`pressed`/`checked`/`disabled`/`invalid` (state), `aria-required`/`readonly` (property) — с дословными определениями и меткой state/property | нативные HTML-состояния (`disabled`, `required` на самих элементах формы) через HTML Standard отдельно не выписаны |
| 2 | что APG предписывает дословно для образцов | **да** | aria-apg-patterns: Button (role button, toggle → `aria-pressed` true/false, недоступно → `aria-disabled=true`) · Switch (role switch, `aria-checked` on/off) | образцы combobox (`aria-expanded`) и поля с ошибкой (`aria-invalid`/`aria-errormessage`) дословно не выписаны — добор |
| 3 | какое соглашение о зацепках принято (data-*/aria/классы), объявлено ли контрактом | **да (соглашение) / пробел (контракт)** | radix-primitives-data-state (`data-state="open"`, «target its data-state attribute») · wai-aria-1.2 (сами ARIA-атрибуты как зацепка) | публичный ВЕРСИОНИРОВАННЫЙ контракт зацепок — `gaps/state-hooks-version-contract.md` |
| 4 | какие псевдоклассы состояний нормированы в CSS и их поведение | **да** | css-selectors-4: `:disabled` §12.1.1, `:checked`/`:indeterminate` §12.2, `:required` §12.3.3, `:placeholder-shown` §12.1.3, `:focus-visible` §9.4, `:focus-within` §9.5, `:has()` §4.5 | `:invalid`/`:user-invalid` и `:popover-open` дословно не выписаны — добор |
| 5 | различие фокуса с клавиатуры и указателем | **да** | css-selectors-4: `:focus-visible` (§9.4) — «UA has determined that a focus ring… should be drawn»: норма отдаёт эвристику UA, а не фиксирует «только клавиатура» | точные условия эвристики UA нормой не заданы (это и есть ответ) |
| 6 | чем выражаются состояния вне CSS (загрузка, частичный выбор, «занято») | **да** | radix-primitives-data-state (`data-state` для не-нативных состояний) · wai-aria-1.2 (`aria-checked=mixed` для частичного) | `aria-busy` для «занято/загрузка» дословно не выписан — добор для полноты |
| 7 | анимация перехода состояний (появление/исчезновение) | **да** | css-transitions-2: `@starting-style` §3.3, `transition-behavior: allow-discrete` §2.5 (переход дискретных свойств вроде `display`) | — |
| 8 | устойчивость зацепок между версиями | **пробел** | — | `gaps/state-hooks-version-contract.md`: соглашения есть, обещания стабильности между версиями — нет |

## Статусы норм — снимок на 2026-08-15 (по издателю)

| норма | статус | редакция |
|---|---|---|
| WAI-ARIA 1.2 | **W3C Recommendation** | 06.06.2023 |
| Selectors L4 | Working Draft | 22.01.2026 |
| CSS Transitions L2 | Working Draft | 04.02.2026 |
| APG (Button/Switch) | informative (руководство практик) | живая публикация |

**Наблюдение:** единственная Recommendation захода — WAI-ARIA 1.2; псевдоклассы состояний (Selectors 4) и переходы (Transitions 2) при повсеместной реализации остаются Working Draft. APG — не норма, а руководство: обязательность атрибутов идёт от WAI-ARIA, APG показывает применение.

## Проверка гипотез (правило 5)

- Гипотеза «кто-то объявил зацепки состояния публичным контрактом с версиями» — **не подтвердилась**: найдено соглашение (`data-state`) без обещания стабильности (`gaps/state-hooks-version-contract.md`). Полноценный результат, как и предупреждал заказ.

## Что осталось не закрытым — честно

1. **Вопрос 8** — пробел (контракт устойчивости зацепок).
2. **Добор дословных**: APG combobox и поле с ошибкой (Q2); `:invalid`/`:user-invalid`/`:popover-open` (Q4); `aria-busy` (Q6); нативные HTML-состояния через HTML Standard (Q1).
3. Не выписаны вторые свидетели-соглашения из гипотез: Kobalte, Ark UI/Zag.js (машина состояний как источник атрибутов), Base UI (data-атрибуты — частично из заказа A), Melt UI, corvu. Интерес — объявляли ли контрактом; вероятный второй пробел.
