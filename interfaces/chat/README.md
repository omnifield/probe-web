# 💬 web-core Chat

🏷️ interfaces · 🧬 engine · 📦 `@web-core/chat`

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
- 🧪 [Примеры](./EXAMPLES.md)

<h2 id="главное">🏠 Главное</h2>

⚡ Второй кейс корня `interfaces/` (после [`@web-core/feeder`](../feeder/README.md)) — слоя между
`packages/` (кирпичи) и `apps/` (поверхности), где сущность сводит функционал нескольких пакетов
фреймворка под общий UI и переиспользуется больше чем одним приложением. Разбор самого слоя (genus
`engine`, группа `interfaces`, правило «FSD-расклад — внутри Анатомии, не отдельным разделом») —
раздел «Интерфейсы» корневого README, не пересказывается здесь второй раз.

🚧 Полное назначение (список фич первого релиза) не определено — но архитектурное направление
решено (2026-09-14, разбор — FAQ.md), architect+user закрыли ревью тем же днём:

- **Ядро не привязано к тому, кто по ту сторону.** Юзер↔агент и юзер↔юзер рендерятся одним и тем
  же ядром, поведение чата от собеседника не зависит. Тулз-коллы, видео, вложения — не
  архитектурная развилка внутри ядра, а **фичи поверх него**, каждая опциональна (рабочему чату по
  умолчанию не нужен видеоплеер). `@web-core/neurobox` (сосед по слою, клиент протокола AG-UI под
  агентские рантаймы) в этой картине — один из будущих АДАПТЕРОВ ядра, не источник его модели:
  ядро не знает слов AG-UI.
- **Историю чат не хранит.** Состояние беседы (участники+сообщения) — забота потребителя, тем же
  приёмом, что `Tree` у `interfaces/feeder` (схема/значение снаружи, движок сам ничего не хранит).
  Пакет отдаёт механику + строго типизированный ИО-контракт входа/выхода, хранилище (бэк/сессия/
  IndexedDB) выбирает потребитель.

✅ Ядро готово (2026-09-14, ROADMAP.yaml, категория «Ядро (готово)»): типы (`Participant`/`Part`/
`Message`/`Conversation`/`ChatIO`), точка расширения parts (`registerPart`/`PartView`), рендер
`text` (RAF-буферизованный), список сообщений со stick-to-bottom-скроллом (`Transcript`),
композер (`Composer`, многострочный, стоп вместо сабмита во время стрима). Плейсхолдер
(`ChatPlaceholder`), подключённый в `apps/skin/src/pages/lab`, — фундамент до ядра, остаётся
отдельным экспортом.

✅ Первая фича — агентский адаптер `@web-core/neurobox` (2026-09-14, ROADMAP.yaml,
`neurobox-agent-adapter`): переводит поток бокса (AG-UI) в нейтральные `parts` ядра. Живёт
ОТДЕЛЬНЫМ подпутём поставки — `@web-core/chat/neurobox`, не частью корневого `.` — потребитель,
которому агент не нужен, физически не получает `@web-core/neurobox`/TanStack AI в свой бандл
(проверено `grep`'ом по собранному `dist/index.js` — ноль упоминаний). Разбор — «Использование»
ниже и FAQ.md.

Что дальше — открытая работа, категория «Назначение» в ROADMAP.yaml.

<h2 id="анатомия">🧩 Анатомия</h2>

🗺️ Как и у любого движка без DOM-паспорта — «часть» здесь означает подпуть поставки, «адрес» —
импорт-спецификатор. Сегодня один вход, без подпутей.

| Часть                   | Адрес             | Экспортирует      |
| ------------------------ | ------------------ | -------------------- |
| Ядро — типы (без UI пока) | `@web-core/chat` | `Participant`/`Part`/`TextPart`/`Message`/`Conversation`/`ChatIO` |
| Ядро — точка расширения parts | `@web-core/chat` | `registerPart`/`rendererOf`/`PartRenderer`/`PartView` |
| Ядро — рендер `text` | внутренний (регистрируется сам через `PartView`) | — |
| Ядро — список сообщений + скролл | `@web-core/chat` | `Transcript` |
| Ядро — композер | `@web-core/chat` | `Composer` |
| Плейсхолдер (dev-проба) | `@web-core/chat`  | `ChatPlaceholder`  |
| Фича — агентский адаптер | `@web-core/chat/neurobox` | `useNeuroboxChat`/`NeuroboxPart`/`ThinkingPart`/`ToolCallPart`/`ToolResultPart`/`AGENT_PARTICIPANT_ID` |

<h2 id="использование">🚀 Использование</h2>

✅ Единственный сценарий сегодня — сам плейсхолдер, подключённый в `apps/skin/src/pages/lab`:

```tsx
import { ChatPlaceholder } from "@web-core/chat";

export function LabPage() {
  return <ChatPlaceholder />;
}
```

✅ `PartView` уже умеет рендерить `text`-часть сам (RAF-буферизованный текст, `white-space:
pre-wrap` — переносы строк не схлопываются) — регистрация встроена, вызывать ничего отдельно не
нужно:

```tsx
import { PartView, type TextPart } from "@web-core/chat";

const part: TextPart = { type: "text", text: "привет" };

<PartView part={part} />;
```

✅ `Transcript` собирает список сообщений целиком: рендерит `parts` каждого `Message` через
`PartView` внутри `@web-core/ui`'s `scroll-area`, со stick-to-bottom-скроллом (внизу — едем за
новым сообщением, ушёл читать историю — кнопка «новые сообщения ↓» вместо автопрыжка):

```tsx
import { Transcript, type Message, type TextPart } from "@web-core/chat";

const messages: Message<TextPart>[] = [
  { id: "1", participantId: "u1", parts: [{ type: "text", text: "привет" }], createdAt: Date.now() },
];

<Transcript messages={messages} />;
```

Форма на будущее, как фича добавит свой тип part:

```tsx
import { registerPart, PartView, type Part } from "@web-core/chat";

interface ToolCallPart extends Part {
  type: "tool-call";
  name: string;
}

registerPart<ToolCallPart>("tool-call", (props) => <span>вызов: {props.part.name}</span>);

// где-то в виджете списка сообщений, для каждой части сообщения:
// <PartView part={part} /> — найдёт зарегистрированный рендер сама по part.type
```

✅ Первый реальный кейс — чат с агентом через `@web-core/neurobox`, подпуть `@web-core/chat/neurobox`:

```tsx
import { Transcript, Composer } from "@web-core/chat";
import { useNeuroboxChat } from "@web-core/chat/neurobox";
import { createNeuroboxConnection } from "@web-core/neurobox";

const connection = createNeuroboxConnection({ baseUrl: "https://neurobox.example" });

function AgentChat() {
  const chat = useNeuroboxChat({
    connection,
    threadId: "сеанс-работы-42", // пережить перезагрузку страницы — забота потребителя
    viewerId: "u1",
  });

  return (
    <>
      <Transcript messages={chat.conversation().messages} />
      <Composer onSend={chat.onSend} isStreaming={chat.isStreaming()} onStop={chat.onStop} />
    </>
  );
}
```

`connection` заводит сам потребитель (`createNeuroboxConnection` из `@web-core/neurobox`, токены/
заголовки — его забота) — фича его только принимает, не создаёт. Разбор решений — FAQ.md.

<h2 id="настройки">🎚️ Настройки</h2>

🔧 Пока нет — у плейсхолдера нет пропов.

<h2 id="состояния">🎛️ Состояния</h2>

🚦 Пока нет — у плейсхолдера нет состояний.

<h2 id="io">🔌 IO</h2>

↔️ Форма зафиксирована (`Participant`/`Part`/`TextPart`/`Message`/`Conversation`/`ChatIO` —
`src/entities/conversation`, публичный реэкспорт `src/index.ts`). `Transcript` потребляет
`messages`, `Composer` — `onSend`/`isStreaming`/`onStop`; агентская фича (`useNeuroboxChat`,
`@web-core/chat/neurobox`) отдаёт готовую форму под оба сразу.

```ts
interface Participant {
  id: string;
  name: string;
}

interface Part {
  type: string; // ядро закрывает только "text", остальное — точка расширения фич
}

interface TextPart extends Part {
  type: "text";
  text: string;
}

interface Message<TPart extends Part = TextPart> {
  id: string;
  participantId: Participant["id"];
  parts: readonly TPart[];
  createdAt: number;
}

interface Conversation<TPart extends Part = TextPart> {
  participants: readonly Participant[];
  messages: readonly Message<TPart>[];
}

interface ChatIO<TPart extends Part = TextPart> {
  conversation: Conversation<TPart>;
  viewerId: Participant["id"]; // локальный зритель — нужен любому чату, не только агентскому
  onSend: (parts: readonly TPart[]) => void; // единственный выход; чат не собирает Message сам
}
```

Чат не хранит `conversation` сам (см. «Главное») — она едет снаружи на каждый рендер, `onSend`
отдаёт только то, что сочинил `viewerId`, собрать из этого полноценный `Message` (id/createdAt) и
дописать в свою историю — решение потребителя.

<h2 id="сборки">🏗️ Сборки</h2>

🧪 Пока нет — автоматических тестов у пакета ещё нет.

<h2 id="рецепт">🎨 Рецепт</h2>

🎨 Своего рецепта у chat нет и не будет — визуал приходит НЕ ручным CSS-файлом пакета, а нарядом
(`@web-core/skin`) поверх настоящих кит-компонентов (`apps/skin/src/app/index.tsx`: «цвет
приходит со скином — или не приходит вовсе, и тогда кит голый»). Поэтому `Transcript` (`scroll-
area`) и `Composer` (`Field`/`FieldTextarea`/`Button`) собраны из компонентов `@web-core/ui`, не
голого HTML — они наследуют тот же наряд, что и весь остальной скин, автоматически, без отдельной
работы со стороны chat. Наряд не надет (служба пресетов недоступна/ничего не выбрано) — кит голый
целиком, это не баг конкретно chat.
