import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { configureRaygun } from "./raygun";
configureRaygun();

// Pretend that the single page app is slow to load and run this config
(async () => {
  console.log("App manual config slow started");
  await new Promise((resolve) => setTimeout(resolve, 5000));
  console.log("App manual config finished");
  configureRaygun();
  console.log("App raygun config run");
})();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
