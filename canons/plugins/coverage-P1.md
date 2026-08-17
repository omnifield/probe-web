# Карта покрытия — заказ P1 (contribution-model)

Собрано 2026-08-14. По каждому вопросу захода — чем закрыт.

| # | вопрос | чем закрыт |
|---|---|---|
| 1 | формы объявления вклада, декларация до/во время исполнения | `vscode-extension-api` (contributes + activationEvents, ленивая загрузка) · `osgi-core-8` (FrameworkFactory, сервисный реестр) · `webextensions-manifest` (единый manifest.json) |
| 2 | обязательные поля манифеста, адресация расширения | `webextensions-manifest` (ровно 3 обязательных ключа) · `osgi-core-8` (bundle symbolic name + version) |
| 3 | события/условия активации, ленивая активация | `vscode-extension-api` (activationEvents, onStartupFinished vs `*`) |
| 4 | декларативный вклад в UI без исполнения кода | `vscode-extension-api` (38 точек вклада, перечень закрыт) — **частично**: разрешение декларативных меню детально не выписано |
| 5 | разрешение конфликта вкладов (один идентификатор у двух) | `gaps/contribution-id-conflict-unspecified` — почти не нормировано; неподтверждённая формулировка VS Code НЕ выписана (не сверилась по DOM) |
| 6 | идентификация расширения, уникальность, пространство имён | `osgi-core-8` (bsnversion: single/multiple/managed — уникальность как явное свойство) · `webextensions-manifest` (уникальность за магазином, не за `name`) |
| 7 | нормирована ли модель органом, не проектом | `gaps/no-cross-vendor-extension-manifest` — **органом единой модели нет**; OSGi нормирован органом, но JVM-модули, не UI-вклад |

## Что осталось открытым

- **Вопрос 5** (конфликт вкладов) — закрыт пробелом `gaps/contribution-id-conflict-unspecified`: почти не нормировано. Добор: сверить `registerCommand` по `vscode.d.ts`, выписать Eclipse extension registry первично.
- **Eclipse `plugin.xml`** («extension point / extension» — каноничный термин «точка расширения») назван в `gaps/`, но отдельной выпиской не сделан. Кандидат на добор: это ближайшее к «точкам вклада», нормированное консорциумом.
- Норма органа найдена только в OSGi (JVM). Для браузеров и редакторов — практика проектов.

## Что из найденного норма органа, а что практика проекта

- **Норма органа:** OSGi Core R8 (OSGi Alliance / OSGi Working Group).
- **Де-факто стандарт, не орган:** SemVer (сюда попал по вопросу совместимости, основной — в P2).
- **Практика проекта:** VS Code (Microsoft), WebExtensions (Mozilla/MDN; согласование в W3C Community Group — отчёты, не Recommendation).
