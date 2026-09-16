import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { createActionStore, createActionStoreFamily } from "../src/engine/action-store.js";
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

  it("store.use(selector) — то же чтение, без отдельного импорта useAtom", async () => {
    const userStore = createUserStore(() => Promise.resolve({ id: "4", name: "D" }));

    function Profile() {
      const userName = userStore.use((state) => state.user?.name);
      return <p>{userName() ?? "none"}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Profile />, host);

    expect(host.textContent).toBe("none");
    await userStore.actions.loadUser();
    expect(host.textContent).toBe("D");
  });

  it("store.use() без селектора отдаёт весь state", () => {
    const userStore = createUserStore(() => Promise.resolve({ id: "5", name: "E" }));

    function Debug() {
      const state = userStore.use();
      return <p>{state().loading ? "loading" : "idle"}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Debug />, host);

    expect(host.textContent).toBe("idle");
  });
});

describe("createActionStore — третий аргумент selectorsFactory (кейс variantsByTag)", () => {
  function createTaggedStore(fetchUser: () => Promise<User>) {
    return createActionStore<
      UserState,
      { setUser(user: User): void; loadUser(): Promise<void> },
      { greeting(state: UserState): string; isReady(state: UserState): boolean }
    >(
      { user: null, loading: false },
      ({ setState }) => ({
        setUser(user: User) {
          setState((state) => ({ ...state, user }));
        },
        async loadUser() {
          setState((state) => ({ ...state, loading: true }));
          const user = await fetchUser();
          setState((state) => ({ ...state, user, loading: false }));
        },
      }),
      () => ({
        greeting(state) {
          return state.user === null ? "гость" : `привет, ${state.user.name}`;
        },
        isReady(state) {
          return state.user !== null && !state.loading;
        },
      }),
    );
  }

  it("selectors — готовые реактивные аксессоры сразу после создания стора, без .use() в компоненте", () => {
    const store = createTaggedStore(() => Promise.resolve({ id: "1", name: "A" }));

    expect(store.selectors.greeting()).toBe("гость");
    store.actions.setUser({ id: "1", name: "A" });
    expect(store.selectors.greeting()).toBe("привет, A");
  });

  it("несколько селекторов независимо следят за своей частью state", async () => {
    const store = createTaggedStore(() => Promise.resolve({ id: "2", name: "B" }));

    expect(store.selectors.isReady()).toBe(false);
    await store.actions.loadUser();
    expect(store.selectors.isReady()).toBe(true);
    expect(store.selectors.greeting()).toBe("привет, B");
  });

  it("селектор реактивен в реальном компоненте — DemoStand-кейс componentStore.selectors.variantsByTag()", async () => {
    const store = createTaggedStore(() => Promise.resolve({ id: "3", name: "C" }));

    function Greeting() {
      return <p>{store.selectors.greeting()}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);
    dispose = render(() => <Greeting />, host);

    expect(host.textContent).toBe("гость");
    await store.actions.loadUser();
    expect(host.textContent).toBe("привет, C");
  });
});

describe("createActionStoreFamily (кейс componentManagerStore — feedData по компоненту)", () => {
  interface FeedState {
    readonly feedData?: unknown;
  }

  function createFeedStoreOf() {
    return createActionStoreFamily<FeedState, { setFeedData(value: unknown): void }>({}, ({ setState }) => ({
      setFeedData(value) {
        setState((state) => ({ ...state, feedData: value }));
      },
    }));
  }

  it("разные ключи — физически разные store, запись в один не видна в другом", () => {
    const feedStoreOf = createFeedStoreOf();

    feedStoreOf("button").actions.setFeedData({ label: "Кнопка" });
    feedStoreOf("checkbox").actions.setFeedData({ checked: true });

    expect(feedStoreOf("button").get()).toEqual({ feedData: { label: "Кнопка" } });
    expect(feedStoreOf("checkbox").get()).toEqual({ feedData: { checked: true } });
  });

  it("повторный вызов с тем же ключом отдаёт тот же инстанс (кэш, не пересоздание)", () => {
    const feedStoreOf = createFeedStoreOf();

    const first = feedStoreOf("button");
    first.actions.setFeedData({ label: "Кнопка" });

    const second = feedStoreOf("button");
    expect(second).toBe(first);
    expect(second.get()).toEqual({ feedData: { label: "Кнопка" } });
  });

  it("переключение между компонентами в реальном рендере не путает feedData (баг из заявки)", () => {
    const feedStoreOf = createFeedStoreOf();

    function Feed(props: { component: string }) {
      return <p>{JSON.stringify(feedStoreOf(props.component).use((state) => state.feedData)())}</p>;
    }

    const host = document.createElement("div");
    document.body.append(host);

    feedStoreOf("button").actions.setFeedData({ label: "Кнопка" });
    feedStoreOf("checkbox").actions.setFeedData({ checked: true });

    dispose = render(() => <Feed component="button" />, host);
    expect(host.textContent).toBe(JSON.stringify({ label: "Кнопка" }));

    dispose?.();
    dispose = render(() => <Feed component="checkbox" />, host);
    expect(host.textContent).toBe(JSON.stringify({ checked: true }));
  });

  it("с selectorsFactory — тот же третий аргумент, что у createActionStore", () => {
    const feedStoreOf = createActionStoreFamily<
      FeedState,
      { setFeedData(value: unknown): void },
      { hasData(state: FeedState): boolean }
    >(
      {},
      ({ setState }) => ({
        setFeedData(value) {
          setState((state) => ({ ...state, feedData: value }));
        },
      }),
      () => ({
        hasData(state) {
          return state.feedData !== undefined;
        },
      }),
    );

    expect(feedStoreOf("button").selectors.hasData()).toBe(false);
    feedStoreOf("button").actions.setFeedData({ label: "Кнопка" });
    expect(feedStoreOf("button").selectors.hasData()).toBe(true);
    expect(feedStoreOf("checkbox").selectors.hasData()).toBe(false);
  });
});
