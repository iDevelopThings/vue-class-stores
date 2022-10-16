---
title: Creating your first store
lang: en-US
---

# Creating your first store

[[toc]]

For this example, let's imagine we have some Todos, we'll have a store which will fetch them from our api, store them in
our store and handle loading state.

We'll use [Json Placeholder](https://jsonplaceholder.typicode.com/todos/1) for an example api

## Creating & Structuring the store

In ``src/Stores/`` create `TodosStore.ts`

```bash
touch src/Stores/TodosStore.ts
```

**Note:** Our store file has to end in "Store.ts" or "store.ts"

### Store class overview

Open up your store, and let's begin structuring it:

First we'll define our "state" interface, the class and it's export and explain some bits

```typescript
import {Store} from "@idevelopthings/vue-class-stores/vue";

// We define an interface for our "state" object, this will give
// us proper type safety in the store and outside of
// the store(in templates for example)

interface ITodosStore {
    loading: boolean;
}

// The "Store()" function constructor:
// First type param should be your store
// Second should be your state type
class TodosStore extends Store<TodosStore, ITodosStore>() {
    // Note the () above, it must have the brackets!^^
    // It's a function constructor.

    // We use this state getter for our initial store state
    // This is where you'll put your defaults
    get state(): ITodosStore {
        return {}
    }

}

// We export it this way so that it only has one instance
// We can then use "todosStore" from anywhere in
// our application to use this store
export const todosStore = new TodosStore();
```

## Todos Store

Now, let's add some functionality

```typescript
import {Store} from "@idevelopthings/vue-class-stores/vue";
import axios from 'axios';

// We defined loading/todos state here
interface ITodosStore {
    loading: boolean;
    todos: ITodo[];
}

// The type of our todo object
export interface ITodo {
    userId: number;
    id: number;
    title: string;
    completed: boolean;
}

class TodosStore extends Store<TodosStore, ITodosStore>() {

    // Defined our default state values
    get state(): ITodosStore {
        return {
            loading: false,
            todos: [],
        };
    }

    // Load the todos from our api and set them on our state
    async load() {
        try {
            this.$loading = true;
            this.$todos = (await axios.get<ITodo[]>('https://jsonplaceholder.typicode.com/todos/1')).data;
            // We could also use this.state.todos = (await axios....)
        } catch (error) {
            console.error(error);
        } finally {
            this.$loading = false;
        }
    }

    // We can define js "getters" to return specific state
    // from our store, this isn't necessary, but more of a preference
    // In our templates, we could directly use $loading/$todos

    get isLoading(): boolean {
        return this.$loading;
    }

    get todos(): ITodo[] {
        return this.$todos;
    }

}

export const todosStore = new TodosStore();
```

Now let's write our vue component, we'll show a couple of different ways to use our stores

## Vue SFC

### Example #1

This will use the globally available `$todos` variable which is created by the package and is fully type safe, we'll
also use our getters we defined.

```vue

<template>
  <div v-if="$todos.isLoading"><p>Loading your todos!</p></div>
  <div v-else>
    <div v-for="todo in $todos.todos">
      <p>{{ todo.title }}</p>
      <p>Is complete? {{ todo.completed }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {todosStore} from "./Stores/TodoStore";

todosStore.load();
</script>
```

### Example #2

By using setup script, we could use the store that was imported in our script

```vue

<template>
  <div v-if="todosStore.isLoading"><p>Loading your todos!</p></div>
  <div v-else>
    <div v-for="todo in todosStore.todos">
      <p>{{ todo.title }}</p>
      <p>Is complete? {{ todo.completed }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {todosStore} from "./Stores/TodoStore";

todosStore.load();
</script>
```

### Example #3

Using the "magic" state getters(i don't know what to call these)

They're essentially shortcut/proxy variables which are fully typed, they will created for everything defined in your
state type(ITodoStore in this case)

Also to note, they work with `todosStore` from the setup import and the `$todos` template var. We'll use `$todos` for
this example.

```vue

<template>
  <div v-if="$todos.$loading"><p>Loading your todos!</p></div>
  <div v-else>
    <div v-for="todo in $todos.$todos">
      <p>{{ todo.title }}</p>
      <p>Is complete? {{ todo.completed }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import {todosStore} from "./Stores/TodoStore";

todosStore.load();
</script>
```


