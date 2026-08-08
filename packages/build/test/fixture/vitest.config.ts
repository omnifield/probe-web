// Ровно то, что ляжет у потребителя: импорт, вызов, `export default`. Ни про jsdom, ни про
// условия разрешения тут не знают — всё за точкой `/vitest` (kb:PROBEWEB-4).
import { defineTestConfig } from "@omnifield/probe-web-build/vitest";

export default defineTestConfig();
