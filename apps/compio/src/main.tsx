import { initI18n } from "@compio/i18n";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ensurePluginsBootstrapped } from "./app/bootstrap-plugins";
import "./index.css";

initI18n();
ensurePluginsBootstrapped();

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("#root element not found");

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
