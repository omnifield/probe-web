// Сборка — фабрика из зоны `build` (точка 2 замороженной поверхности, PROBEWEB-4).
// Своей оснастки зона не заводит: стоит НА базе, как и соседи по products/ (PROBEWEB-5).
// Порт дев-сервера задаётся флагом в `scripts.dev` (`--port 5176 --strictPort`), а не здесь:
// это запуск, а не конфиг. `--strictPort` обязателен — без него Vite при занятом порте молча
// берёт соседний, и панель (`apps/panel`) показывает зону мёртвой, хотя она поднята.
import { defineConfig } from "@web-core/build/vite";

export default defineConfig();
