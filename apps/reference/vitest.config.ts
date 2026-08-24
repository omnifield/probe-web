// Точка 4 замороженной поверхности — ТЕСТЫ (PROBEWEB-4).
//
// Пресет берётся целиком и без добавок: JSX-трансформ, `resolve.conditions` и `jsdom` приезжают
// из зоны `build`. Снимут там условие `browser` — `solid-js/web` разрешится в серверную ветку
// и прогон упадёт «Client-only API called on the server side». Именно это и должно случиться:
// подпорка в этом файле спрятала бы поломку от всех, кто соберётся после нас.
//
// Единственный тест, которому пресет не подходит, объявляет своё окружение сам — докблоком
// `@vitest-environment node` в `test/chain.test.ts`: он не рендерит, а запускает НАСТОЯЩУЮ
// сборку. Это механика vitest на файл, а не правка пресета.
import { defineTestConfig } from "@omnifield/probe-web-build/vitest";

export default defineTestConfig();
