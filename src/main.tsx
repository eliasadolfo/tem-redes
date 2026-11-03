import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/tem/tokens.css";
import "./styles/tem/interfaz.css";
import "./styles/app.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
