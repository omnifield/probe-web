// ЗАСЕВ службы семенем — `pnpm run seed:skins`.
//
// Пустая служба это законное состояние, а не поломка: скины делает человек, и пока он не сделал
// ни одного, показывать нечего. Но пустая служба и витрина, которой нечего надеть, — плохое
// начало работы, поэтому в коде живёт ОДНО семя, и им служба засевается командой.
//
// Почему командой, а не запасным перечнем в витрине: запасной перечень стал бы вторым источником
// правды. Человек не смог бы отличить «служба отдала мой скин» от «служба пуста, показываю
// встроенный», и первое расхождение нашёл бы у коллеги, а не у себя.
//
// Адрес службы — из окружения, умолчание то же, что у витрины.

import { GRAPHITE } from "../src/skins/graphite.ts";

const BASE = process.env["VITE_PRESETS_URL"] ?? "http://127.0.0.1:8787/api/presets";

/** Кладёт семя. Имя занято — служба отказывает, и это НЕ ошибка засева: скин уже есть. */
async function seed() {
  let response;

  try {
    response = await fetch(BASE, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        label: "Графит",
        name: GRAPHITE.name,
        kind: "skin",
        state: GRAPHITE,
      }),
    });
  } catch (cause) {
    console.error(`служба не отвечает по адресу ${new URL(BASE).origin}`);
    console.error("поднять её: pnpm --filter @probe-web/presets start");
    console.debug(cause);
    process.exitCode = 1;
    return;
  }

  if (response.status === 409) {
    console.log(`скин «${GRAPHITE.name}» в службе уже есть — засев не нужен`);
    return;
  }

  if (!response.ok) {
    console.error(`служба отказала (${response.status}): ${(await response.text()).trim()}`);
    process.exitCode = 1;
    return;
  }

  const record = await response.json();
  console.log(`скин «${GRAPHITE.name}» положен в службу, запись ${record.id}`);
}

await seed();
