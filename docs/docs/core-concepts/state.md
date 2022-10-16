---
title: State
lang: en-US
---

## Accessing the state

You can access state directly on your instance via the state object, or via the accessors using $ prefix.

This works inside, outside and in your component template.

```typescript
class MyStore extends Store<MyStore, { count: number }>() {
    get state() {
        return {count: 0};
    }
}

const store = new MyStore();

store.state.count++;
store.$count++;
```

## Resetting the state

You can reset the state via `$reset()` on your store

```typescript
const store = new MyStore();
store.$count++;
store.$reset();
```

## Mutating the state

```typescript
class MyStore extends Store<MyStore, { count: number }>() {
    get state() {
        return {count: 0};
    }

    increment() {
        this.state.count++;
    }

    double() {
        this.$count *= 2;
    }

    triple() {
        this.$patch({count: this.$count * 3});
    }

    quadruple() {
        this.$patch((state) => {
            // This is useful when we need to add items to an array for ex
            // state.items.push(...);
            state.count *= 4;
        });
    }
}

const store = new MyStore();


```