// Solo dev harness: run the catalog remote on its own at :3001 without the host.
import { createRoot } from "react-dom/client";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <App onAddToCart={(p) => console.log("cart:add-item →", p.name)} />,
);
