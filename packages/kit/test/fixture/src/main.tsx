import { mount } from "@omnifield/probe-web-kit";

const GREETING = "hello, probe-web";

function App() {
  return <h1 data-testid="greeting">{GREETING}</h1>;
}

mount(() => <App />);
