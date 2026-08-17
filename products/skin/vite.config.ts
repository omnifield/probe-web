// Сборка — фабрика из зоны `build` (точка 2 замороженной поверхности, kb:PROBEWEB-4).
// Своей оснастки зона не заводит: стоит НА базе, как и соседи по products/ (kb:PROBEWEB-5).
// Порт дев-сервера задаётся флагом в `scripts.dev` (`--port 5174 --strictPort`), а не здесь:
// это запуск, а не конфиг. `--strictPort` обязателен — без него Vite при занятом порте молча
// берёт соседний, и пульт (`tools/dev-nav`) показывает зону мёртвой, хотя она поднята.
import { defineConfig } from "@omnifield/probe-web-build/vite";

export default defineConfig();
