import { createSignal } from "solid-js";

// Просто localStorage, без стора/бэка (пока).
const STORAGE_KEY = "user";

const [currentUser, setCurrentUser] = createSignal<string | undefined>(
  localStorage.getItem(STORAGE_KEY) ?? undefined,
);

export { currentUser };

/** Залогинить: личность ложится сразу — она локальная, пароль сверяется на клиенте. */
export function login(user: string): void {
  localStorage.setItem(STORAGE_KEY, user);
  setCurrentUser(user);
}

/** Разлогинить. */
export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
  setCurrentUser(undefined);
}
