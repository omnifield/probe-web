// "/" сам по себе не показывает ничего — витрина живёт под `/showcase` (`PWEB-173`).
//
// `createFileRoute` — исключение из правила «никогда не импортировать @tanstack/solid-router
// напрямую» (README @omnifield/probe-web-router), и не по нашей воле: генератор роутов сам
// переписывает этот импорт в файлах `routes/*` на голый вендор для framework "solid" — не
// настраивается никакой опцией плагина (замерено 2026-08-29, заявка architect → framework).
import { createFileRoute, redirect } from "@tanstack/solid-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/showcase" });
  },
});
