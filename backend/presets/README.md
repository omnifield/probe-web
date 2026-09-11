# 🗄️ web-core Presets

🏷️ хранилище · 🧬 service · 📦 `presets`

## 🧭 Навигация

- 🏠 [Главное](#главное)
- 🧩 [Анатомия](#анатомия)
- 🚀 [Использование](#использование)
- 🎚️ [Настройки](#настройки)
- 🎛️ [Состояния](#состояния)
- 🔌 [IO](#io)
- 🏗️ [Сборки](#сборки)
- 🎨 [Рецепт](#рецепт)
- ❓ [FAQ](./FAQ.md)

<h2 id="главное">🏠 Главное</h2>

🗄️ Служба, которая кладёт JSON и отдаёт обратно — используйте, если нужно хранить именованные
настройки (пресеты) любого вида и раздавать их по сети. 🧬 Один сквозной поток: конверт (label +
опциональные name/description + kind) → атомарная запись в базе → GraphQL-запрос забирает ровно те
поля, которые нужны конкретному клиенту — точечно (MCP-агенту) или всей страницей разом (витрине).
🛠️ Хранилище (bbolt) как было непрозрачным к содержимому `state`, так и остаётся — типизация
встаёт СНАРУЖИ, на границе GraphQL-схемы (`internal/kinds` — реестр видов), а не внутри store.
Разбор ФОРМАТА содержимого (что значит конкретное поле конкретного вида для рендера/логики)
по-прежнему у владельца вида, не у этой службы — просто теперь у каждого вида есть Go-структура на
границе API, а не голый blob.

📢 Сервис — не только про пресеты скина. Второй, независимый смысл — фидбэк: сигнал по любой
ручке любого продукта ("сработало"/"не сработало"), не дизайн-настройка. У фидбэка своя причина
жить именно здесь — не общая модель с пресетами, а общая инфраструктура (bbolt уже поднят, том уже
смонтирован, заводить второй под ту же задачу незачем). Своя схема, свой bbolt-бакет, свой путь —
подробности в «Анатомии» и FAQ.md, раздел «Почему фидбэк не вид Preset».

Это `genus: service` — не библиотека, которую импортируют в свой процесс, а самостоятельный
сервис: у него есть свой бинарник, свой порт, свой сетевой контракт (GraphQL, было REST). 
Потребитель не собирает из него механизм внутри себя (как с `engine`) — он ходит к уже поднятой
службе по HTTP.

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ У сервиса нет экспортируемых функций — часть здесь означает именованный маршрут со своим
устойчивым адресом, GraphQL-тип или узел `internal/`-дерева, а не подпуть поставки или кусок
разметки.

| Часть | Адрес | Значит |
|---|---|---|
| Выполнение | `POST /graphql` | Один путь на любой `query`/`mutation` — тело решает, что делать |
| Песочница | `GET /graphql` | GraphiQL-подобный playground — вручную собрать и отправить запрос |
| Живость | `GET /healthz` | Не проксируется наружу — только докеру и тому, кто разворачивает |

🔌 Схема (`internal/graphql/schema.graphql`) — интерфейс `Preset` (общие поля: `id`/`label`/`name`/
`description`/`kind`/`savedAt`) и шесть конкретных типов по видам реестра —
`Palette`/`Form`/`Outfit`/`Content`/`Tag`/`Assembly`. `Query.presets(kind, component)`/`Query.preset(id)` —
чтение; `Mutation.createPreset`/`replacePreset`/`deletePreset` — запись, конверт (`PresetInput`) по
смыслу тот же, что раньше нёс REST-конверт (`kind`/`label`/`name`/`description`/`state`).

🗳️ Вторая, независимая схема (`internal/graphql/feedback.graphql`) — тип `FeedbackEntry`, НЕ
реализует `Preset`, не смешивается с шестью видами выше. `Query.feedback(status?, sign?)` —
перечень (фильтр по значению полей, не по `kind` — у заявки его нет); `Mutation.reportFeedback` —
создание (`status`/`at` всегда серверные, не из входа), `Mutation.resolveFeedback` — подмешивает
`status:"resolved"`+`resolvedAt`(+`note`) поверх существующей заявки, отказ, если уже разобрана.

📦 Внутри: `cmd/presets` — точка входа (окружение → база → GraphQL-сервер → сигналы).
`internal/model` — форма записи Preset (`Meta`/`Record`/`Input`) и отдельно `FeedbackEntry`
(`feedback.go` в том же пакете — своя структура, не расширение `Meta`: у заявки нет `label`/
`name`/`kind`). `internal/limits` — числовые пределы, общие на пресеты и фидбэк (диск один
физический ресурс). `internal/store` — bbolt-хранилище, вся логика атомарности и пределов (byte
in, byte out — не в курсе типизации); `internal/store/feedback.go` — третий бакет
(`bucketFeedback`), свои методы (`ListFeedback`/`GetFeedback`/`CreateFeedback`/
`ReplaceFeedbackState`), ничего общего с `bucketMeta`/`bucketState`/`bucketNames` Preset'а — у
заявки нет ни `kind`, ни машинного имени, нечего адресовать по имени.
`internal/kinds` — реестр видов Preset: по файлу на вид, Go-структура `state` + запись в карте
`kind → тип`, точка расширения для новых владельцев (`tables` заведёт свой `filter` тут же).
Фидбэк мимо этого реестра — своя форма (`internal/graphql/feedback_convert.go`), не Go-структура
канона.
`internal/graphql` — схема (`schema.graphql` + `feedback.graphql`), резолверы, конвертация
`store.Record → типизированная модель` (`convert.go` для Preset, `feedback_convert.go` для
`FeedbackEntry` — раздельно, тем же принципом раздельности, что и бакеты), проверка конверта на
запись (`envelope.go`); хранилище резолверам и лоадерам видно не как конкретный `*store.Store`, а
как узкий интерфейс (`graphql.Store`, встраивающий `loaders.Store`) — граница, через которую тест
подставляет считающую обёртку и ИЗМЕРЯЕТ батчинг (`batching_test.go`), а не верит чтению кода на
слово. `internal/graphql/loaders` — дата-лоадеры (батч связей на запрос, только Preset — у
`FeedbackEntry` нет связей на другие записи); `internal/graphql/model` — рукописные Go-модели
GraphQL-схемы (`preset.go` + `feedback.go`); `internal/graphql/generated` — кодоген `gqlgen`, не
редактируется руками. Публичного пакета для импорта нет вовсе — вся поверхность фичи это сетевой
контракт, а не Go-экспорт.

<h2 id="использование">🚀 Использование</h2>

**Поднять службу:**

```sh
go run ./cmd/presets
# слушает 127.0.0.1:8787, база — ./db/presets.db, GraphQL на /graphql
```

**Положить пресет и получить его обратно** (мутация + инлайн-фрагмент по конкретному типу):

```sh
curl -s http://127.0.0.1:8787/graphql -H 'content-type: application/json' -d '{
  "query": "mutation($input: PresetInput!) { createPreset(input: $input) { id ... on Palette { name author } } }",
  "variables": { "input": { "kind": "palette", "label": "Бренд", "name": "brand", "state": {"name":"brand","author":"..."} } }
}'
# → { "data": { "createPreset": { "id": "...", "name": "brand", "author": "..." } } }
```

**Точечный запрос** (MCP-профиль — только то, что нужно прямо сейчас, без связей):

```sh
curl -s http://127.0.0.1:8787/graphql -H 'content-type: application/json' -d '{
  "query": "{ presets(kind: \"outfit\") { name kind } }"
}'
```

**Один запрос на всю страницу компонента** (профиль витрины — связи резолвятся и батчатся
дата-лоадером, не N+1):

```sh
curl -s http://127.0.0.1:8787/graphql -H 'content-type: application/json' -d '{
  "query": "{ presets(kind: \"outfit\") { name ... on Outfit { palette { name } forms { name component } } } }"
}'
```

**Заменить содержимое той же записи одним вызовом** (id неизменен, как раньше `PUT`):

```sh
curl -s http://127.0.0.1:8787/graphql -H 'content-type: application/json' -d '{
  "query": "mutation($id: ID!, $input: PresetInput!) { replacePreset(id: $id, input: $input) { id } }",
  "variables": { "id": "<id>", "input": { "kind": "palette", "label": "Бренд v2", "name": "brand", "state": {"name":"brand","author":"...","light":{"bg":"#fff"}} } }
}'
```

**Оставить и закрыть фидбэк** — своя мутация, мимо `PresetInput`/`kind`:

```sh
curl -s http://127.0.0.1:8787/graphql -H 'content-type: application/json' -d '{
  "query": "mutation($input: FeedbackInput!) { reportFeedback(input: $input) { id status at } }",
  "variables": { "input": { "tool": "save_preset", "action": "позвал с кривым конвертом", "actual": "упало 500-кой", "sign": "issue" } }
}'
# → status:"open", at выставляет служба — их нельзя передать во входе

curl -s http://127.0.0.1:8787/graphql -H 'content-type: application/json' -d '{
  "query": "{ feedback(status: \"open\") { id tool action actual sign at } }"
}'

curl -s http://127.0.0.1:8787/graphql -H 'content-type: application/json' -d '{
  "query": "mutation($id: ID!) { resolveFeedback(id: $id, note: \"починили\") { status resolvedAt } }",
  "variables": { "id": "<id>" }
}'
```

**Разведать схему целиком** — `GET /graphql` открывает playground: собрать запрос по автодополнению,
не держать в голове весь `schema.graphql`.

**Устойчивая обвязка сверху** — `@web-core/skin/presets` (`createPresetsClient`,
`createPresetsSkinSource`) говорит на СТАРОМ REST-контракте, которого у этой службы больше нет
(см. FAQ.md, «Чего в фиче нет»): её переезд на GraphQL — `packages/query`, следующий шаг ПОСЛЕ
этой заявки, другая зона. До того, как он сделан, этот клиент этой службой пользоваться не может.

<h2 id="настройки">🎚️ Настройки</h2>

⚙️ Настраивает служебу окружение — тот, кто РАЗВОРАЧИВАЕТ, а не тот, кто пишет код (`cmd/presets`).

| Переменная | По умолчанию | Значит |
|---|---|---|
| `PRESETS_DB` | `./db/presets.db` | Путь к файлу базы (bbolt) |
| `PRESETS_PORT` | `8787` | Порт |
| `PRESETS_HOST` | `0.0.0.0` | Адрес |
| `PRESETS_MAX_RECORD_BYTES` | `1048576` (1 МиБ) | Предел размера ОДНОЙ записи |
| `PRESETS_MAX_RECORDS_PER_KIND` | `200` | Предел числа записей ОДНОГО вида — список выбирают глазами |
| `PRESETS_MAX_TOTAL_BYTES` | `67108864` (64 МиБ) | Предел занятого объёма всего хранилища |
| `PRESETS_MAX_LABEL_CHARS` | `120` | Предел длины `label` |
| `PRESETS_MAX_DESCRIPTION_CHARS` | `1000` | Предел длины `description` |

<h2 id="состояния">🎛️ Состояния</h2>

🚦 GraphQL не использует HTTP-статус для отказа по смыслу (тело всегда `200`, кроме сбоя
транспорта) — отказ приходит полем `errors` в теле ответа, `data` при этом `null` у сломанного
поля. Машиночитаемого кода на каждый случай отказа сегодня нет (см. FAQ.md, «Чего в фиче нет») —
только `message` для человека:

| Когда | `message` (по сути, не дословно) |
|---|---|
| `kind` не зарегистрирован в `internal/kinds` | «неизвестный вид "…"» |
| `state` не разбирается по форме вида | «state не подходит под форму вида "…"» |
| `label` пуст / длиннее предела | «у пресета должно быть непустое label» / «label длиннее N символов» |
| `name` не подходит под форму | то же сообщение, что раньше отдавал REST (`^[a-z0-9][a-z0-9-]{0,31}$`) |
| `description` длиннее предела | «description длиннее N символов» |
| Имя занято другой записью ЭТОГО ЖЕ вида | `NameTakenError` из `internal/store`, как раньше |
| Кончилось место (список вида / байты хранилища) | `StorageFullError` из `internal/store`, как раньше |
| Одна запись больше предела | `TooLargeError` из `internal/store`, как раньше |
| Замена/удаление записи, которой нет | `store.ErrNotFound`; `preset(id)` на несуществующий id — не отказ, `null` |

<h2 id="io">🔌 IO</h2>

Полная форма — `internal/graphql/schema.graphql` (или playground на `GET /graphql`), здесь только
разводка входа/выхода.

<h3 id="io-вход">📥 Вход</h3>

`PresetInput` — конверт `createPreset`/`replacePreset`, `state` в нём проверяется структурно по
зарегистрированному виду (`internal/kinds`), но не по смыслу содержимого:

| Поле | Обязательно | Форма |
|---|---|---|
| `kind` | да | зарегистрированный вид (`palette`/`form`/`outfit`/`content`/`tag`/`assembly` сегодня) |
| `label` | да | непустая строка, ≤ `LabelChars` |
| `name` | нет | `^[a-z0-9][a-z0-9-]{0,31}$` |
| `description` | нет | строка, ≤ `DescriptionChars` |
| `state` | да | JSON-объект по форме вида (обязательные поля — свои у каждого вида, см. `internal/kinds`) |

<h3 id="io-выход">📤 Выход</h3>

| Запрос | Отдаёт |
|---|---|
| `Query.presets(kind, component)` | `[Preset!]!` — записи целиком, типизированные по виду (не `Meta` без `state`, как раньше отдавал индекс REST). `component: [String!]` — доп. сужение по ЛЮБОМУ (OR) из списка, смысл только у видов с полем `component` (`Form`/`Assembly`/`Content`) — записи `Palette`/`Outfit`/`Tag` при заданном фильтре в выдачу не попадают |
| `Query.preset(id)` | `Preset` — запись или `null`, если такой нет |
| `Mutation.createPreset`/`replacePreset` | `Preset!` — только что созданная/делённая запись |
| `Mutation.deletePreset` | `Boolean!` — было ли что удалять |
| `GET /healthz` | `{ ok, presets, bytes, limits }` — как было |

`Preset` (общие поля любого вида) — `{ id, label, name?, description?, kind, savedAt }`, где
`savedAt` — RFC3339 с наносекундами; конкретные поля `state` — свои у каждого из шести типов
(`Palette`/`Form`/`Outfit`/`Content`/`Tag`/`Assembly`), см. схему.

<h2 id="сборки">🏗️ Сборки</h2>

🧪 Своих потребителей у службы нет — она их не знает. Доказывается пробами на реальном GraphQL-слое,
bbolt-хранилище и реальной сети (54 теста, 7 файлов, зелёные под `-race`), плюс двумя мутациями,
снятыми руками на предыдущей (REST) версии контракта — сама логика пределов, которую они стерегли,
не изменилась при переезде.

| Сборка | Что доказывает |
|---|---|
| `internal/store/store_test.go` | CRUD, атомарность `Replace`, пределы (запись/вид/объём целиком), opaque-проход `state`, `GetMany`-батч (пропуск отсутствующего id, не отказ), конкурентные создания под гонкой (`-race`) |
| `internal/store/feedback_test.go` | Свой бакет: create/get/list (новые сверху), `ReplaceFeedbackState` держит id и обновляет `savedAt`, отказ на несуществующую заявку, фидбэк считается в ОБЩИЙ `TotalBytes` (диск общий с пресетами) |
| `internal/kinds/kinds_test.go` | Все шесть видов зарегистрированы, каждый разбирается по своей форме (включая `tag` — по форме живой записи прода, не выдумке), двойная регистрация одного `kind` паникует |
| `internal/graphql/resolver_test.go` | Типизация по видам вперемешку, отказ на незарегистрированный/неверной формы `state`, резолв связей `Outfit.palette/forms/tags` с тихим пропуском dangling-ссылки, `create`/`replace`/`delete`-роундтрип, проверка конверта (label/name/description), проход store-ошибки (`NameTakenError`) через резолвер не глотается |
| `internal/graphql/feedback_test.go` | `sign`/`status` по умолчанию на создании, фильтр `Query.feedback` по status/sign, `resolveFeedback` не трогает остальные поля и отказывает на повторный резолв, фидбэк НЕ появляется среди `Query.presets` (свой бакет — не Preset) |
| `internal/graphql/batching_test.go` | **Измерено, не прочитано по коду**: реальный GraphQL-запрос (`generated.NewExecutableSchema` + `handler.NewDefaultServer`, тот же стек, что в `cmd/presets`) через `httptest`-сервер со считающей обёрткой (`countingStore`) поверх `internal/graphql.Store`/`loaders.Store` — число вызовов `store.List`/`GetMany` ОДИНАКОВОЕ при N=5 и N=50 нарядов, каждый со своей формой и общей палитрой. Доказывает O(1), не просто «мало при одном N» |
| `cmd/presets/main_test.go` | `/healthz`-ответ, CORS-preflight (204 без похода до GraphQL-обработчика) и что не-preflight запрос доходит |
| Мутация: изоляция предела по виду | Снял фильтр по `kind` в счётчике — проба `TestRecordsPerKindLimitDoesNotStarveOtherKinds` покраснела |
| Мутация: изоляция имени по виду | Снял `kind` из ключа индекса имён — проба `TestNameUniquePerKindNotGlobal` покраснела |
| Живой прогон | `go run ./cmd/presets` + `curl` по `/graphql` — create→query (точечный и с резолвом связей)→CORS→playground→report/list/resolve-фидбэк проходят по-настоящему, не только под тестом |

<h2 id="рецепт">🎨 Рецепт</h2>

🧩 У этой фичи ВСЯ логика вида — съёмный слой, и это не частный случай, а сама причина, по которой
служба вообще существует. Хранилище не носит в себе ни одного `kind` и не может: `internal/store`
как принимал байты, так и принимает. Но с переезда на GraphQL у каждого вида есть ещё и Go-структура
на границе API (`internal/kinds`) — понимание СМЫСЛА содержимого по-прежнему живёт у владельца вида
СНАРУЖИ, а вот его ФОРМА (какие поля есть, какие из них — связи на другие записи) теперь называется
и здесь тоже, одним файлом на вид.

```go
// internal/kinds/outfit.go — форма ОДНОГО вида (`outfit`). Служба не знает, ЧТО значит палитра
// или форма компонента, — только что `palette`/`forms`/`tags` это строки/списки строк, по которым
// GraphQL-резолвер найдёт связанные записи.
type Outfit struct {
	Name      string          `json:"name"`
	Palette   string          `json:"palette"`
	Forms     []string        `json:"forms"`
	Overrides json.RawMessage `json:"overrides,omitempty"`
	Tags      []string        `json:"tags,omitempty"`
	Author    *string         `json:"author,omitempty"`
}

func init() { Register(Kind{Label: "outfit", New: func() any { return &Outfit{} }}) }
```

Второй вид (например, `filter` у зоны `tables`) — второй такой же файл в `internal/kinds/`, плюс
свой тип в `schema.graphql` — с нулём правок в существующих файлах видов или резолверах.
