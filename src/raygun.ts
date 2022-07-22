import rg4js from "raygun4js";

declare global {
  interface Window {
    rg4js: typeof rg4js;
  }
}

export const raygun = window.rg4js || rg4js;

export function configureRaygun(): void {
  if (!process.env.REACT_APP_RAYGUN_KEY) {
    console.warn(
      "App failed to configure, REACT_APP_RAYGUN_KEY is undefined"
    );
    return;
  }

  raygun("apiKey", process.env.REACT_APP_RAYGUN_KEY);

  console.log("App raygun key has been set")
}
