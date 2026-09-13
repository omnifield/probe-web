import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { createActionStore } from "../src/engine/action-store.js";
import { useAtom } from "../src/index.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

interface User {
  readonly id: string;
  readonly name: string;
}

interface UserState {
  readonly user: User | null;
  readonly loading: boolean;
}

function createUserStore(fetchUser: () => Promise<User>) {
  return createActionStore<UserState, { setUser(user: User): void; clearUser(): void; loadUser(): Promise<void> }>(
    { user: null, loading: false },
    ({ setState }) => ({
      setUser(user: User) {
        setState((state) => ({ ...state, user }));
      },
      clearUser() {
        setState((state) => ({ ...state, user: null }));
      },
      async loadUser() {
        setState((state) => ({ ...state, loading: true }));
        try {
          const user = await fetchUser();
          setState((state) => ({ ...state, user, loading: false }));
        } catch (error) {
          setState((state) => ({ ...state, loading: false }));
          throw error;
        }
      },
    }),
  );
}

describe("createActionStore (кейс userStore из ТЗ)", () => {
  it("actions.setUser/clearUser меняют state, .set() наружу не торчит", () => {
    const userStore = createUserStore(() => Promise.resolve({ id: "1", name: "A" }));

    expect((userStore as { set?: unknown }).set).toBeUndefined();

    userStore.actions.setUser({ id: "1", name: "A" });
    expect(userStore.get()).toEqual({ user: { id: "1", name: "A" }, loading: false });

    userStore.actions.clearUser();
    expect(userStore.get().user).toBeNull();
  });

  it("асинхронный action проходит через loading: true → done, промежуточные .set() видны", async () => {
    const userStore = createUserStore(() => Promise.resolve({ id: "2", name: "B" }));

    const promise = userStore.actions.loadUser();
    expect(userStore.get().loading).toBe(true);

    await promise;
    expect(userStore.get()).toEqual({ user: { id: "2", name: "B" }, loading: false });
  });

  it("ошибка в action сбрасывает loading и пробрасывается вызывающему", async () => {
    const userStore = createUserStore(() => Promise.reject(new Error("boom")));

    await expect(userStore.actions.loadUser()).rejects.toThrow("boom");
    expect(userStore.get().loading).toBe(false);
  });

  it("через useAtom с селектором отдаёт то же значение живому компоненту", async () => {
    const userStore = createUserStore(() => Promise.resolve({ id: "3", name: "C" }));

    function Profile() {
      const userName = useAtom(userStore, (state) => state.user?.name);
      return <p>{userName() ?? "none"}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Profile />, host);

    expect(host.textContent).toBe("none");
    await userStore.actions.loadUser();
    expect(host.textContent).toBe("C");
  });
});
