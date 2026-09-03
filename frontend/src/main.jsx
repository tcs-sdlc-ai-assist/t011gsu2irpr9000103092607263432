import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { getTheme } from "./utils/theme";
import "./index.css";

document.documentElement.classList.toggle("dark", getTheme() === "dark");

/** Render the WriteSpace application into the browser root. */
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
