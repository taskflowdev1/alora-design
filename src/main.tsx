import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import "./index.css";
import { router } from "./site/routes";
import { applyTokens } from "./site/config";
import { parseConfig } from "./lib/config";

applyTokens(document.documentElement, parseConfig(window.location.search));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
