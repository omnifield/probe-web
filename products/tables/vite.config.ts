// Сборка — фабрика из зоны `build` (точка 2 замороженной поверхности, kb:PROBEWEB-4).
// Ни solid-плагина, ни настроек: зона products/ стоит НА базе и своей оснастки не заводит.
// Порт дев-сервера задаётся флагом в `scripts.dev`, а не здесь — это запуск, а не конфиг.
import { defineConfig } from "@omnifield/probe-web-build/vite";

export default defineConfig();
