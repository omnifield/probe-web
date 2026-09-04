// Тесты — пресет из зоны `build` (точка 4 замороженной поверхности, PROBEWEB-4).
// Берётся целиком и без добавок: JSX-трансформ, `resolve.conditions` и `jsdom` приезжают
// оттуда. Подпорка здесь спрятала бы поломку пресета от всех, кто соберётся после нас.
import { defineTestConfig } from "@web-core/build/vitest";

export default defineTestConfig();
