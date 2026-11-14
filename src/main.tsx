import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initWallet } from "./wallet/appkit";
import "./theme.css";

initWallet();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
