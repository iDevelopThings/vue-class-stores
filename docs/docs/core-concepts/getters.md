---
title: Getters
lang: en-US
---

Getters should be used to create more of a public accessor to our underlying values, they can also be used to hide some
logic

For our examples, we'll use a getter to access the `count` value on our state and use it in our templates.

## Defining a getter

Any regular javascript getter defined on your class will become a getter, this is all it takes!

```typescript
class MyStore extends Store<MyStore, { count: number }>() {
    get state() {
        return {count: 0};
    }

    get count() {
        return this.state.count;
    }
}

// Now we can use it as normal

store.count; // returns 0

```

## Computed getters

To define a read-only computed getter, we can add a decorator to it, in the background this will be translated into a
computed value, and you can use it as normal, without the need to use `.value`

```typescript
class MyStore extends Store<MyStore, { count: number }>() {
    get state() {
        return {count: 0};
    }

    // Now we have a computed getter instead!

    @Computed
    get count() {
        return this.state.count;
    }
}

store.count; // returns 0
```