import { render } from "solid-js/web";
import { DepGreeting } from "probe-web-build-fixture-jsx-dep";

const GREETING = "probe-web";

function App() {
  // Два разных JSX в одном дереве: свой (файл приложения) и приезжающий из зависимости
  // непреобразованным. Собраться обязаны оба.
  return (
    <h1 data-testid="greeting">
      hello, <DepGreeting text={GREETING} />
    </h1>
  );
}

const host = document.getElementById("root");
if (!host) throw new Error("в документе нет #root");

render(() => <App />, host);
