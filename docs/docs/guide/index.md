---
title: Getting Started
lang: en-US
---
# Getting Started

[[toc]]

## Package Installation

### Npm Package

Npm:

```bash
npm install @idevelopthings/vue-class-stores
```

Yarn:

```bash
yarn add @idevelopthings/vue-class-stores
```

### Vite plugin:

```typescript
import vue from '@vitejs/plugin-vue';
import {ClassStoresPlugin} from "@idevelopthings/vue-class-stores/vite";

export default defineConfig({
    plugins: [
        ClassStoresPlugin({
            // The src path where your stores will be located
            storesPath: 'src/Stores',
            // The name of the generated typescript declaration file
            // stores.d.ts is the default
            storesFileName: 'stores.d.ts',
        }),
        vue(),
    ]
});
```

### Vue plugin:

Register the plugin with vue in your main init script

```typescript
import {createApp} from 'vue';
import {StoreManager} from "@idevelopthings/vue-class-stores/vue";
import App from './App.vue';

const app = createApp(App);
app.use(StoreManager.boot());
app.mount('#app');
```


**Now you're good to go and start coding with the stores :)**
