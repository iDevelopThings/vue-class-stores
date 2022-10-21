## Typing events

We can define a declaration file to provide some type information on the available keys and the event data.

```typescript
declare module '@idevelopthings/vue-class-stores/vue' {
    interface StoreEventsMap {
        'todo:added' : {todo: ITodo}
    }
}

export {};
```

Now when we dispatch an event, we'll get completion:

```typescript
// This will give type errors because our
// second param isn't `{todo: ITodo}`
store.$dispatch('todo:added', '...');
```