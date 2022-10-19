---
title: Getters and setters
lang: en-US
---

## Getters

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

<hr>


## Setters

Setters can be used how ever you see fit

Their main use at the moment and reason for their implementation, was for computed writables. If a getter is paired with
a setter and marked with `@Computed` decorator. It will become a computed writable instead - **[More information here](/core-concepts/getters-and-setters#computed-writables)**

## Defining a setter

Any regular javascript setter defined on your class will become a setter, this is all it takes!

```typescript
class MyStore extends Store<MyStore, { count: number }>() {
    get state() {
        return {count: 0};
    }

    set count(value: number) {
        this.state.count = value;
    }

    get count() {
        return this.state.count;
    }
}

// Now we can use it as normal

store.count = 10;

```

## Computed writables

Not only does vue allow us to create "read only" computed properties. It also allows us to make read/write computed
properties.

You can read more about those on vue's documentation: [here](https://vuejs.org/api/reactivity-core.html#computed)

However, when we pair a getter & setter together, this allows the store to create a computed writable, but **only
if `@Computed` is defined on our getter**

Here's an example:

```typescript
class MyStore extends Store<MyStore, { count: number }>() {
    get state() {
        return {count: 0};
    }

    // The decorator MUST be on the getter.
    @Computed
    get count() {
        return this.state.count;
    }

    // Typescript doesn't allow us to also decorate count, only the getter or setter. So we chose the getter.
    set count(value: number) {
        this.state.count = value;
    }
}
```

And that's all there is to it, behind the scenes this is basically converted to:

```typescript
const count = computed<number>({
    get: () => this.state.count,
    set: (value) => this.state.count = value
});

// With a regular computed property, if we want to use the value we have to use `.value`
const myCount = count.value;

// With the stores, this isn't required at all!
```