// МИНИ-АВТОРИЗАЦИЯ — модалка (`DialogControl` кита открывает, своей обёртки под кнопку нет) с
// формой логин/пароль. Пароль сверяется с захардкоженным значением на клиенте. На успех —
// `login()` (`../../model`) просто пишет логин локально.
// Триггер двойной: не залогинен — обычный `DialogControl` (открывает модалку); залогинен — кнопка
// "Logout" (разлогинивает, модалку вообще не трогает).
import {
  Button,
  Dialog,
  DialogContent,
  DialogControl,
  Field,
  FieldInput,
  FieldLabel,
  Flow,
  FlowItem,
  toast,
} from "@web-core/ui";
import { createSignal, Show, type JSX } from "solid-js";

import { currentUser, login, logout } from "../../model";

const PASSWORD = "123";

export function Auth() {
  const [open, setOpen] = createSignal(false);
  const [username, setUsername] = createSignal("");
  const [password, setPassword] = createSignal("");

  const onSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (event) => {
    event.preventDefault();

    if (password() !== PASSWORD) {
      toast.error({ title: "Неверный пароль" });
      return;
    }

    toast.success({ title: "Вошли", description: username() });
    setOpen(false);
    login(username());
  };

  return (
    <Dialog
      data-variant="sheet"
      open={open()}
      onOpenChange={(details) => setOpen(details.open)}
    >
      <Show when={currentUser()} fallback={<DialogControl>Auth</DialogControl>}>
        <Button onClick={() => logout()}>Logout</Button>
      </Show>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <Flow data-variant="column-center">
            <FlowItem>
              <Field>
                <FieldLabel>Логин</FieldLabel>
                <FieldInput
                  value={username()}
                  onInput={(event) => setUsername(event.currentTarget.value)}
                />
              </Field>
            </FlowItem>
            <FlowItem>
              <Field>
                <FieldLabel>Пароль</FieldLabel>
                <FieldInput
                  type="password"
                  value={password()}
                  onInput={(event) => setPassword(event.currentTarget.value)}
                />
              </Field>
            </FlowItem>
            <FlowItem>
              <Button type="submit">Войти</Button>
            </FlowItem>
          </Flow>
        </form>
      </DialogContent>
    </Dialog>
  );
}
