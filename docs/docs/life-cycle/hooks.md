---
title: Hooks
lang: en-US
---

Life cycle hooks are registered by defining a method on your store and adding a decorator to it.

The decorator is used mainly as a tag, that this method is defined for use in a hook only, if we used some method name
like `onInit`/`init` this could cause lots of confusions.

## `BeforeAll`

When this hook is called, your store is not fully initialized, see this kind of like vue's `setup` style components

This could be used to register global event listeners and such when our store is registered

## `AfterAll`

Your store and all other stores are fully initialized at this point, you can use this how ever you see fit

## `OnInit`

Your store is fully initialized.

This could be used for triggering api calls, authenticating your user, populating the store for local storage etc.

**You should avoid using any other stores within this hook.**

## `OnDispose`

TBD

## Examples

```typescript
type ITodoStore = { todos: Todo[] };

class TodoStore extends Store<TodoStore, ITodoStore>() {
    get state() {
        return {todos: []};
    }

    @OnInit
    async _onInit() // The method name can be anything you wish
    {
        this.$todos = (await fetch('....')).json();

        console.log('MyStore is now initialized!');
        console.log(`Oh... and here's your todos: `, this.$todos);
    }

    @BeforeAll
    _beforeAll() {
        console.log('BeforeAll called.');
    }

    @AfterAll
    _afterAll() {
        console.log('AfterAll called.');
    }

}
```