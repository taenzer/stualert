import { render } from "preact";

export function App() {
  return (
    <div>
      <p class="text-lg">Hello World!</p>
    </div>
  );
}

render(<App />, document.getElementById("app"));
