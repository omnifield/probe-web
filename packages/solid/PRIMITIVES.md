# Solid Primitives — обзор комьюнити-примитивов

Источник: [`solidjs-community/solid-primitives`](https://github.com/solidjs-community/solid-primitives) —
монорепа реактивных примитивов для Solid, ведут люди из core-команды Solid и экосистемы (не
сторонний энтузиаст). Де-факто стандарт комьюнити, аналог VueUse для Vue. ~85 отдельных npm-пакетов
(`@solid-primitives/<name>`), каждый ставится и тришейкается по одному.

- Доки по каждому: `https://primitives.solidjs.community/docs/<name>`
- Исходник по каждому: `https://github.com/solidjs-community/solid-primitives/tree/main/packages/<name>`

Ниже — что нашли, разбито по разделам сайта комьюнити. Решение "что тянем" — за user, по мере
реального повода (как `mountApp()` стал поводом завести сам `@web-core/solid`), не пакетом сразу.

## Inputs

- **active-element** — отслеживает, какой DOM-элемент сейчас в фокусе. [docs](https://primitives.solidjs.community/docs/active-element) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/active-element)
- **autofocus** — директива автофокуса элемента при монтировании. [docs](https://primitives.solidjs.community/docs/autofocus) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/autofocus)
- **input-mask** — маски форматирования для текстовых полей ввода. [docs](https://primitives.solidjs.community/docs/input-mask) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/input-mask)
- **keyboard** — обработка клавиатурных событий и комбинаций клавиш. [docs](https://primitives.solidjs.community/docs/keyboard) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/keyboard)
- **mouse** — реактивное отслеживание позиции и взаимодействий мыши. [docs](https://primitives.solidjs.community/docs/mouse) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/mouse)
- **pointer** — унифицированные pointer-события по устройствам (мышь/тач/перо). [docs](https://primitives.solidjs.community/docs/pointer) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/pointer)
- **scroll** — реактивное чтение и управление позицией скролла. [docs](https://primitives.solidjs.community/docs/scroll) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/scroll)
- **selection** — работа с выделением текста на странице. [docs](https://primitives.solidjs.community/docs/selection) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/selection)
- **gestures** — директивы для жестов пользователя (свайп/пинч/…), порт с `svelte-gestures`. [docs](https://primitives.solidjs.community/docs/gestures) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/gestures)

## Display & Media

- **audio** — создание и управление воспроизведением аудио. [docs](https://primitives.solidjs.community/docs/audio) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/audio)
- **bounds** — реактивные размеры и позиция элемента. [docs](https://primitives.solidjs.community/docs/bounds) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/bounds)
- **devices** — доступ к списку устройств (камера/микрофон/сенсоры) и медиапотокам. [docs](https://primitives.solidjs.community/docs/devices) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/devices)
- **filesystem** — чтение/запись файлов через разные адаптеры. [docs](https://primitives.solidjs.community/docs/filesystem) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/filesystem)
- **idle** — детекция бездействия пользователя. [docs](https://primitives.solidjs.community/docs/idle) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/idle)
- **intersection-observer** — реактивное наблюдение за видимостью элемента. [docs](https://primitives.solidjs.community/docs/intersection-observer) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/intersection-observer)
- **media** — реактивные media-запросы (`matchMedia`). [docs](https://primitives.solidjs.community/docs/media) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/media)
- **page-visibility** — отслеживание видимости вкладки/страницы. [docs](https://primitives.solidjs.community/docs/page-visibility) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/page-visibility)
- **resize-observer** — реактивное наблюдение за изменением размера элемента. [docs](https://primitives.solidjs.community/docs/resize-observer) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/resize-observer)
- **styles** — реактивный доступ к вычисленным CSS-значениям. [docs](https://primitives.solidjs.community/docs/styles) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/styles)

## Browser APIs

- **broadcast-channel** — обмен сообщениями между вкладками браузера. [docs](https://primitives.solidjs.community/docs/broadcast-channel) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/broadcast-channel)
- **clipboard** — операции копирования/вставки. [docs](https://primitives.solidjs.community/docs/clipboard) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/clipboard)
- **event-listener** — реактивное управление обработчиками событий. [docs](https://primitives.solidjs.community/docs/event-listener) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-listener)
- **event-props** — реактивные пропсы-обработчики событий. [docs](https://primitives.solidjs.community/docs/event-props) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-props)
- **fullscreen** — управление полноэкранным режимом. [docs](https://primitives.solidjs.community/docs/fullscreen) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/fullscreen)
- **mutation-observer** — реактивное отслеживание изменений DOM. [docs](https://primitives.solidjs.community/docs/mutation-observer) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/mutation-observer)
- **permission** — проверка разрешений браузерных API. [docs](https://primitives.solidjs.community/docs/permission) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/permission)
- **storage** — реактивный доступ к persistent-хранилищам (`localStorage`/`sessionStorage`/cookies/IndexedDB/Tauri/кастом), с синхронизацией между вкладками и клиент-сервер. [docs](https://primitives.solidjs.community/docs/storage) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/storage)
- **timer** — планирование колбэков на сигналах. [docs](https://primitives.solidjs.community/docs/timer) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/timer)
- **upload** — обработка загрузки файлов и drag-and-drop. [docs](https://primitives.solidjs.community/docs/upload) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/upload)
- **workers** — создание и работа с Web Worker'ами. [docs](https://primitives.solidjs.community/docs/workers) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/workers)

## Network

- **connectivity** — мониторинг статуса интернет-соединения. [docs](https://primitives.solidjs.community/docs/connectivity) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/connectivity)
- **cookies** — управление HTTP-cookies. [docs](https://primitives.solidjs.community/docs/cookies) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/cookies)
- **fetch** — реактивные HTTP-запросы. [docs](https://primitives.solidjs.community/docs/fetch) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/fetch)
- **graphql** — GraphQL-клиент с реактивными запросами. [docs](https://primitives.solidjs.community/docs/graphql) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/graphql)
- **sse** — работа с Server-Sent Events. [docs](https://primitives.solidjs.community/docs/sse) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/sse)
- **stream** — работа с медиапотоками. [docs](https://primitives.solidjs.community/docs/stream) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/stream)
- **websocket** — WebSocket-коммуникация. [docs](https://primitives.solidjs.community/docs/websocket) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/websocket)

## Control Flow

- **context** — создание и предоставление значений контекста. [docs](https://primitives.solidjs.community/docs/context) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/context)
- **jsx-tokenizer** — токенизация JSX-контента (для нестандартных рендер-паттернов). [docs](https://primitives.solidjs.community/docs/jsx-tokenizer) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/jsx-tokenizer)
- **keyed** — рендер списков с явными ключами. [docs](https://primitives.solidjs.community/docs/keyed) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/keyed)
- **list** — альтернатива `<For>`/`<Index>` с реактивным значением и реактивным индексом элемента. [docs](https://primitives.solidjs.community/docs/list) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/list)
- **match** — компоненты паттерн-матчинга. [docs](https://primitives.solidjs.community/docs/match) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/match)
- **range** — генерация числовых диапазонов. [docs](https://primitives.solidjs.community/docs/range) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/range)
- **refs** — управление ссылками на элементы/компоненты. [docs](https://primitives.solidjs.community/docs/refs) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/refs)

## Utilities

- **controlled-props** — синхронизация controlled/uncontrolled пропсов. [docs](https://primitives.solidjs.community/docs/controlled-props) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/controlled-props)
- **cursor** — смена стиля курсора мыши. [docs](https://primitives.solidjs.community/docs/cursor) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/cursor)
- **date** — работа с датами и разницей во времени. [docs](https://primitives.solidjs.community/docs/date) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/date)
- **event-bus** — publish-subscribe система событий. [docs](https://primitives.solidjs.community/docs/event-bus) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-bus)
- **event-dispatcher** — диспатч кастомных событий. [docs](https://primitives.solidjs.community/docs/event-dispatcher) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/event-dispatcher)
- **flux-store** — стейт-менеджмент по Flux-паттерну. [docs](https://primitives.solidjs.community/docs/flux-store) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/flux-store)
- **history** — undo/redo функциональность. [docs](https://primitives.solidjs.community/docs/history) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/history)
- **i18n** — поддержка интернационализации. [docs](https://primitives.solidjs.community/docs/i18n) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/i18n)
- **platform** — определение браузера и ОС. [docs](https://primitives.solidjs.community/docs/platform) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/platform)
- **promise** — утилиты для работы с промисами. [docs](https://primitives.solidjs.community/docs/promise) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/promise)
- **props** — объединение и фильтрация пропсов компонента. [docs](https://primitives.solidjs.community/docs/props) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/props)
- **scheduled** — debounce/throttle и планирование вызовов функций. [docs](https://primitives.solidjs.community/docs/scheduled) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/scheduled)
- **script-loader** — динамическая загрузка внешних скриптов. [docs](https://primitives.solidjs.community/docs/script-loader) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/script-loader)
- **share** — соцшеринг и Web Share API. [docs](https://primitives.solidjs.community/docs/share) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/share)
- **analytics** — трекинг аналитики с очередью диспатча, реактивными сигналами, шарингом контекста и navigation guards; плагины (Google Analytics, Segment, Amplitude, Mixpanel, …) не вшиты, подключаются отдельно. [docs](https://primitives.solidjs.community/docs/analytics) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/analytics)
- **utils** — базовые реактивные типы и хелперы, на которых построены другие примитивы пакета (служебный, напрямую редко нужен). [docs](https://primitives.solidjs.community/docs/utils) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/utils)

## Reactivity

- **db-store** — реактивная привязка данных к базам данных. [docs](https://primitives.solidjs.community/docs/db-store) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/db-store)
- **deep** — глубокое реактивное отслеживание и обновление вложенных структур. [docs](https://primitives.solidjs.community/docs/deep) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/deep)
- **destructure** — безопасная деструктуризация реактивных объектов без потери реактивности. [docs](https://primitives.solidjs.community/docs/destructure) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/destructure)
- **immutable** — неизменяемые реактивные структуры данных. [docs](https://primitives.solidjs.community/docs/immutable) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/immutable)
- **lifecycle** — дополнительный слой lifecycle-примитивов поверх Solid. [docs](https://primitives.solidjs.community/docs/lifecycle) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/lifecycle)
- **map** — реактивные `Map`/`WeakMap`. [docs](https://primitives.solidjs.community/docs/map) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/map)
- **memo** — продвинутые паттерны мемоизации. [docs](https://primitives.solidjs.community/docs/memo) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/memo)
- **mutable** — создание мутабельных реактивных объектов. [docs](https://primitives.solidjs.community/docs/mutable) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/mutable)
- **resource** — продвинутое управление ресурсами и кэшем поверх `createResource`. [docs](https://primitives.solidjs.community/docs/resource) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/resource)
- **rootless** — хелперы для использования реактивных примитивов вне реактивного root'а. [docs](https://primitives.solidjs.community/docs/rootless) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/rootless)
- **set** — реактивные `Set`/`WeakSet`. [docs](https://primitives.solidjs.community/docs/set) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/set)
- **signal-builders** — набор цепочечных (chainable) реактивных вычислений над сигналами. [docs](https://primitives.solidjs.community/docs/signal-builders) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/signal-builders)
- **state-machine** — реализация конечного автомата. [docs](https://primitives.solidjs.community/docs/state-machine) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/state-machine)
- **static-store** — нереактивные (статические) стора. [docs](https://primitives.solidjs.community/docs/static-store) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/static-store)
- **trigger** — ручные (manual) реактивные триггеры. [docs](https://primitives.solidjs.community/docs/trigger) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/trigger)

## UI Patterns

- **marker** — разметка и ссылки на конкретные позиции (например, для подсветки текста). [docs](https://primitives.solidjs.community/docs/marker) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/marker)
- **masonry** — раскладка masonry-сеткой. [docs](https://primitives.solidjs.community/docs/masonry) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/masonry)
- **pagination** — пагинация данных и бесконечный скролл. [docs](https://primitives.solidjs.community/docs/pagination) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/pagination)
- **virtual** — виртуальный скролл для больших списков. [docs](https://primitives.solidjs.community/docs/virtual) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/virtual)

## Animation

- **presence** — анимация монтирования/размонтирования компонента. [docs](https://primitives.solidjs.community/docs/presence) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/presence)
- **raf** — утилиты поверх `requestAnimationFrame`. [docs](https://primitives.solidjs.community/docs/raf) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/raf)
- **spring** — физически-обоснованные spring-анимации. [docs](https://primitives.solidjs.community/docs/spring) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/spring)
- **transition-group** — анимация переходов для списков. [docs](https://primitives.solidjs.community/docs/transition-group) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/transition-group)
- **tween** — интерполяция значений во времени. [docs](https://primitives.solidjs.community/docs/tween) · [src](https://github.com/solidjs-community/solid-primitives/tree/main/packages/tween)

## Рассмотренные, но не выбранные альтернативы

- **[solidjs-hooks](https://github.com/NukeJS/solidjs-hooks)** (NukeJS) — небольшая личная коллекция
  хуков, заметно меньше и не так активно живёт, как `solid-primitives`.
- **solid-use** — попытка портировать идею VueUse на Solid, тоже сильно уступает по охвату и
  активности `solid-primitives`.

Формы (`modular-forms`/`formisch`) не разбирал подробно — у кита уже есть свой `@web-core/form`,
это отдельный вопрос, не про этот файл.
