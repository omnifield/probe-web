// Тесты — пресет из зоны `build` (точка 4 замороженной поверхности, kb:PROBEWEB-4).
// Берётся целиком и без добавок: JSX-трансформ, `resolve.conditions` и `jsdom` приезжают
// оттуда. Подпорка здесь спрятала бы поломку пресета от всех, кто соберётся после нас.
import { defineTestConfig } from "@omnifield/probe-web-build/vitest";

export default defineTestConfig();
