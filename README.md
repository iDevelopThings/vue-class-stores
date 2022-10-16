<img align="center" src="/repository/logo.png"/>

<p align="center">
A vite/vue package for elegant class based stores
</p>

<p align="center" dir="auto">
  <a href="https://www.npmjs.com/package/@idevelopthings/vue-class-stores" rel="nofollow">
    <img alt="npm (scoped)" src="https://img.shields.io/npm/v/@idevelopthings/vue-class-stores?style=for-the-badge">
  </a>
</p>

<p align="center" dir="auto">
  <a href="https://vue-class-stores.idt.dev" rel="nofollow">
    Documentation
  </a>
</p>

# Features

- Fully reactive
- Ability to be used globally, as small individual stores and used within other stores
- Simple object orientated and regular javascript architecture for your stores(you just write a class, instead of separating everything into individual actions/getters/mutations)
- Vue devtools plugin included, ability to inspect/edit your state and call your actions from it
- Full type completion(I love TS and it's types/auto-completion), code is generated which integrates it into vues types and more!
- It's beautiful to write code this way and separate all of your applications business logic into a store that it belongs too, I used this approach in vue 2 also, it kept many of my applications code tidy and follow-able


## Basic Example:

A store for an "todo" application

The store class:
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
    get state(): ITodosStore {
        return {
            loading: false,
            todos: [],
        };
    }
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
    get isLoading(): boolean {
        return this.$loading;
    }
    get todos(): ITodo[] {
        return this.$todos;
    }
}
export const todosStore = new TodosStore();
```

The vue SFC:
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

# Vue Dev Tools Plugin

The package will automatically register the vue devtools plugin for you
This will allow you to inspect your state and trigger your, actions for testing purposes(although you cannot pass parameters yet :())

You can also edit your state from the plugin also :)

![img.png](repository/devtools-plugin.png)
