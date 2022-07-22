# rg4js Initialisation Issue Reproduction

## Issue

When attempting to use `rg4js` the package initialises before an API key has been set, this causes events to not be sent correctly or sparingly if you are manually sending events via error logging.

## Implementation

Consider this example implementation consuming raygun, configuring it. We know that `import`ing a module will evaluate any expressions on the code that is being imported, in this instance this triggers raygun to attempt to initialise before an `apiKey` has been set.

```ts
// raygun.ts
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
      "[Raygun] Failed to configure, REACT_APP_RAYGUN_KEY is undefined"
    );
    return;
  }

  raygun("apiKey", process.env.REACT_APP_RAYGUN_KEY);
}
```

In our `index.tsx` we import and configure raygun before rendering out application. At this point, the document load is already considered completed.

When trying to start the app we are effectively in a race condition between the configuration of raygun and rayguns expressions being run to setup raygun on the window.

```ascii
┌─index.tsx──────────────────┐       ┌──────────────┐
│                            │       │              ▼
│ ┌────────────────────────┐ │       │  ┌─raygun.umd.js────────┐
│ │ ...                    │ │       │  │                      │
│ │ import ... "./raygun"; ├─┼───────┘  │ ┌──────────────────┐ │
│ │ ...                    │ │          │ │ onLoadHandler(); │ │
│ └────────────────────────┘ │          │ └─────────┬────────┘ │
│                            │          │           │          │
│ ┌────────────────────────┐ │          │    ┌──────▼─────┐    │
│ │                        │ │          │    │ if (apiKey)│    │
│ │ configureRaygun();     ├─┼─────┐    │    └──────┬─────┘    │
│ │                        │ │     │    │           │          │
│ └────────────────────────┘ │     │    │         false        │
│                            │     │    │           │          │
│ ┌────────────────────────┐ │     │    │    ┌──────▼──────┐   │
│ │                        │ │     │    │    │ do not init │   │
│ │ root.render(...)       │ │     │    │    └─────────────┘   │
│ │                        │ │     │    │                      │
│ └────────────────────────┘ │     │    └───────────┬──────────┘
│                            │     │                │
└────────────────────────────┘     │                ▼
                                   │   We are now in a state where
                                   │   raygun has loaded but is not
                                   │   fully initialised as no API
                                   │   key has been set.
                                   │
                                   │
                                   │
                                   └────────────────┐
                                                    ▼
                                       ┌─configureRaygun────────┐
                                       │                        │
                                       │ raygun("apiKey", key); │
                                       │                        │
                                       └────────────┬───────────┘
                                                    │
                                                    ▼
                                        At this point an init has
                                        not occurred and events
                                        will not be captured.
```

## rg4js patch

This repo contains a patch that adds logging so you can more visually track what is happening in the console with raygun and this app.

```ascii
raygun umd loaded
App raygun key has been set
App manual config slow started
raygun4js addEventListener load complete
raygun4js onLoadHandler <--------------------- init would happen here if the key was configured.
App manual config finished
App raygun key has been set
App raygun config run
```

## Workaround

We can get around this race condition by calling `rg4js("boot");` which will manually call the `onLoadHandler()` function again.
