## Event Bus

### The main event bus

The `StoreManager` has an event bus, this will allow us to register event listeners for anything, but also we can
dispatch events to all registered stores

This is used for dispatching the lifecycle hooks, but will also be useful in applications. It can be accessed
via `StoreManager.bus.`

#### Dispatching events

```typescript
import {StoreManager} from '@idevelopthings/vue-class-stores/vue';

StoreManager.bus.$dispatch('event-name', {my: 'data'});
```

#### Dispatching events to all stores

```typescript
import {StoreManager} from '@idevelopthings/vue-class-stores/vue';

StoreManager.bus.$dispatchToAllStores('event-name', {my: 'data'});
```

#### Listening for events

```typescript
import {StoreManager} from '@idevelopthings/vue-class-stores/vue';

const listener = (message) => console.log(message);

StoreManager.bus.$on('message', listener);
```

#### Removing listeners

```typescript
import {StoreManager} from '@idevelopthings/vue-class-stores/vue';

const listener = (message) => console.log(message);

// This way requires a reference to the handler function
StoreManager.bus.$off('message', listener);

// We can also stop it this way
const stopListener = StoreManager.bus.$on('message', listener);
stopListener();
```

### Store event bus

Each store has their own event bus also, this will allow us to dispatch events to individual stores and more.

This can be accessed via `myStore.$eventBus`

#### Dispatching events

```typescript
myStore.$dispatch('event-name', {my: 'data'});
```

#### Listening for events

```typescript
const listener = (message) => console.log(message);

myStore.$on('message', listener);
```

We can also define event listeners on our store to handle these, they work very similarly to hooks

```typescript
import {Store, On} from '@idevelopthings/vue-class-stores/vue';

type ITodoStore = { todos: Todo[] };

class TodoStore extends Store<TodoStore, ITodoStore>() {
    get state() {
        return {todos: []};
    }

    @On('todo:added')
    todoAdded(todo: any) {
        // this is triggered like a regular listener
    }
}

// We can now dispatch an event to it
todoStore.$dispatch('todo:added', {})

// If we had this @On('todo:added') decorator added to other stores
// also, we could call it on all stores via the store manager
StoreManager.bus.$dispatchToAllStores('todo:added', {})
```

#### Removing listeners

```typescript
const listener = (message) => console.log(message);

// This way requires a reference to the handler function
myStore.$off('message', listener);

// We can also stop it this way
const stopListener = myStore.$on('message', listener);
stopListener();
```