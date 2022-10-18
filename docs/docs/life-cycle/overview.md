---
title: Life Cycle Overview
lang: en-US
---


## Life cycle process

- All stores imported in the "Store Loader"

- Each store will run it's pre init stage
    - `BeforeAll` hook is registered
    - At this point, the store isn't fully configured. It will only have it's basic state object initialized and it's
hooks registered.

- All `BeforeAll` hooks are now called

- All stores will now run their main init stage
    - All state will be fully registered
    - All getters/actions will be fully registered
    - `OnInit` hook is called

- All `AfterAll` hooks are now called

- `OnDispose` - to be documented/discussed on how this should be handled correctly and what side-affects it should also
clean up.