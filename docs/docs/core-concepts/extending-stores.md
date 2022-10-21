---
title: Extending your stores
lang: en-US
---

Extensions allow us to provide properties/methods to all of our stores

Currently these extensions do not provide reactivity, if you change it, those changes won't be reflected in your
template.

Just like state values, store extension properties/methods can be accessed from inside your store, outside and in the
template.

The extension is fully type safe and will give full completion no matter where you use your store.

## Defining an extension

Typlically extensions should only be defined during the initial boostrap, in your main ts/js file, for example:

```typescript
import {createApp} from 'vue';
import {StoreManager} from "@idevelopthings/vue-class-stores/vue";
import App from './App.vue';

// We'll register an extension to access some consts and such from all our stores

StoreManager.extend(() => {
    return {
        apiBaseUrl: 'https://my.api',
        appVersion: '4.2.0',
        getSomething() {
            return "Here's your thing good sir!"
        }
    };
});

const app = createApp(App);
app.use(StoreManager.boot());
app.mount('#app');
```

For typescript to see your extensions, you do need to create a declaration.
Let's create `store_extensions.d.ts` in our project src dir

```typescript
declare module '@idevelopthings/vue-class-stores/vue' {
    interface StoreCustomProperties {
        apiBaseUrl: string;
        appVersion: string;

        getSomething(): string;
    }
}
export {}
```

Now in our store:

```typescript
class MyStore extends Store<MyStore, { count: number }>() {
    get state() {
        return {count: 0};
    }

    getKittenPhotos() {
        return fetch(this.apiBaseUrl + '/kittens').then(res => res.json());
    }

    printMessage() {
        console.log(this.getSomething());
    }
}

const store = new MyStore();
// This will work
store.apiBaseUrl;
store.getSomething();

// it will also work in your template
// <p>{{$store.getSomething()}}</p>
```
