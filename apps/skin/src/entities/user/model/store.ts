import { createSignal } from "solid-js";

// Между сессиями — просто localStorage, без стора/бэка (пока). Ключ один, значение — сам логин.
const STORAGE_KEY = "user";

const [currentUser, setCurrentUser] = createSignal<string | undefined>(
  localStorage.getItem(STORAGE_KEY) ?? undefined,
);

export { currentUser };

/** Залогинить — пишет в `currentUser` и localStorage разом, переживает перезагрузку/новую сессию. */
export function login(user: string): void {
  localStorage.setItem(STORAGE_KEY, user);
  setCurrentUser(user);
}

/** Разлогинить — чистит `currentUser` и localStorage. */
export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
  setCurrentUser(undefined);
}
