# Vue Class Stores

To quickly get started, you can navigate into the apptest directory to view a full working example. There's also a webpack.config.js showing the
implementation... or you can continue reading.

## Why?

For a while I've been doing my stores this way... but explaining to others how it works, how to generate the type definitions etc, was a little difficult. It's
also become a pain in the ass to assign the stores to the vue prototype & manually update the type definitions. This package will take care of the type
definitions and vue prototype manipulation to instantiate your stores.

I love managing my stores this way. Since I learned this method I can't go back, I also cannot stand React for this one single point. I like OO logic/structure
to my applications.

You can put your state and any methods you need all together in one store. Which can be used anywhere in your application, and it will keep it's state + stay
reactive.

Imagine you have some blog posts state, have a websocket connection which receives new blog posts. You can directly push these posts into the state from an
entirely different class/location.

## Getting Started

- [Installing](#installing-the-package)
- [Configuring Webpack](#configuring-webpack)
- [Plugin Configuration](#plugin-configuration)
- [Generating Store Plugin/Files](#generate-plugin/store-files)
- [Final Setup Steps](#final-setup-steps)
  - [Vue 2](#vue-2)
  - [Vue 3](#vue-3)
- [How to work with the stores?](#how-to-work-with-the-stores?)
  - [Creating a store](#creating-a-store)
  - [Using the store in your components](#using-the-store-in-your-components)
    - [Using the store in your components](#sfc-script)
    - [Using the store in your components](#sfc-html)
  - [Using the store from outside components](#using-the-store-from-outside-components)
  - [Persisted Stores](#persisted-stores)

## Installing the package

```shell
npm install vue-class-stores typesafe-local-storage 
yarn add vue-class-stores typesafe-local-storage 
```

typesafe-local-storage is one of my other packages that make some features of this package a little easier to build/work with.
You should take a look at them also, they may help you with other things :)

## Configuring Webpack

Add the plugin to your webpack configuration:

```js
const {WebpackClassStoresLoader} = require('vue-class-stores/Webpack');

module.exports = {
  plugins : [
    new WebpackClassStoresLoader()
  ]
}
```

## Plugin Configuration

| Option              | Type    | Default Value     | Info                                                                                                                                             |
| ------------------- | ------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| usingTypescript     | boolean | false             | Ensures generated files use the correct extensions                                                                                               |
| pluginDirectory     | string  | src/Stores/Plugin | Where the generated vue plugin will be stored                                                                                                    |
| storesDirectory     | string  | src/Stores        | Where your vue stores are located                                                                                                                |
| shortVueDeclaration | boolean | false             | If the store "UserStore" is defined, you will reference it via "user" or "$user" when short === true, otherwise userStore or "$userStore".       |

### Setting your configuration via the webpack plugin:

You can provide an object to the webpack plugin. Though, with this way, these options won't be used when you use
the [Generate Command](#Generate plugin/store files). So the next method is suggested.

```ts
new WebpackClassStoresLoader({
  // true = Using typescript
  // false = Using javascript
  // Ensure you set this correctly!  
  usingTypescript : false,
  // Where you want type definitions and the plugin to be defined
  pluginDirectory : 'src/Stores/Plugin',
  // Where your store classes are located
  storesDirectory : 'src/Stores',
  // When creating the global vue reference
  // shortVueDeclaration = true = $user
  // shortVueDeclaration = false = $userStore
  shortVueDeclaration : false,
})
```

## Defining your configuration in package.json

You would only really need to do this when using the [Generate Command](#Generate plugin/store files) listed below

```json
{
  "vue-class-stores": {
    "usingTypescript": true,
    "shortVueDeclaration": true,
    "pluginDirectory": "src/Stores/Plugin",
    "storesDirectory": "src/Stores"
  }
}
```

## Generate plugin/store files

If webpack errors whilst building, the plugin won't generate its files... which could be the case in some scenarios.

It's also handy for when getting everything set up.

```shell
./node_modules/.bin/vue-class-stores-generate
```

**Run a build of your application**

Now if you navigate to /src/Stores/ you will see a **Plugin** directory. These are the files that this package has built for you.

## Final Setup Steps

The package will automatically determine your vuejs version and generate files/code that will work with your version. However... there's some additional steps
dependent on that version.

#### Vue 2

The package needs to use features from the composition api, which vue 2 doesn't have... however, you can install the vue composition api into vue2. I tried my
best to avoid having to do this, but having the ability to watch a vue object for changes isn't as easy as it sounds.

```shell
npm install @vue/composition-api
yarn add @vue/composition-api
```

##### Add the plugin to your vue app

```ts
// Make sure to add this import before VueClassStoresPlugin 
// or composition api may complain
import './Stores/Plugin/InstallVueCompositionApi';
import {VueClassStoresPlugin} from "./Stores/Plugin/VueClassStoresPlugin";

Vue.use(VueClassStoresPlugin);

const app = new Vue({el : "#app"});
```

#### Vue 3

##### Add the plugin to your vue app

```ts
import {VueClassStoresPlugin} from "./Stores/Plugin/VueClassStoresPlugin";

const app = createApp();
app.use(VueClassStoresPlugin)
```

## How to work with the stores?

### Creating a store

If you're using typescript, you can create a type for your store object and provide this as a generic to the Store class

```ts 
import {Store} from "./Plugin/Store";
import {store, watch} from "vue-class-stores"

type UserStoreState = {
  user: AuthedUser | null;
}

// You need to define the @store decorator
@store()
export class UserStore extends Store<UserStoreState> {

  initialState(): UserStoreState {
    return {
      user : null
    }
  }

  setUser(user: AuthedUser) {
    this.state.user = user;
  }

  get authedUser(): AuthedUser | null {
    return this.state.user;
  }

  // You can also define watchers on the store
  // You can name the method anything

  // The 'user' string is the name of our state property 
  // that we wish to watch for changes on.
  @watch('user')
  onUserUpdated(value: AuthedUser) {
    console.log('Our authed user was updated!', value)
  }
}
```

### Using the store in your components

#### SFC Script

```vue

<script>
import {user, useUserStore} from '@src/Stores/Plugin/VueStores';

export default defineComponent({
  // We can use it in the options api
  mounted()
  {
    // We can use the following methods to access the store
    this.$user.setUser(new User({username : 'Sam'}));
    user.setUser(new User({username : 'Sam'}));
  },

  // Or we can use composition api
  setup()
  {
    const userStore = useUserStore();

    userStore.setUser(new User({username : 'Sam'}));

    return {user}
  }
})
</script>
```

#### SFC Html

```vue

<template>
  <div>
    <!-- In our template, we can use $user or $userStore to reference the store -->
    <!-- Depending on our "shortVueDeclaration" configuration setting -->
    <p>
      The authed user is: {{$user.authedUser === null ? 'Nobody' : $user.authedUser.username }}
    </p>
  </div>
</template>
```

### Using the store from outside components

Imagine we have some logic that handles our internal authentication flow and we wrapped these methods in a class.

```ts
export default class Authentication {
  public async login(username: string, password: string) {
    // ... some login api request
    const response = await Api.login(username, password);

    userStore.setUser(new AuthedUser(response));
    userStore.state.authenticated = true;
  }
}
```

Using a method like this, all of our components will update to match this authenticated state + the authenticated user.

### Persisted Stores

Persisted stores are the same stores, except it will store your state in local storage and re-populate it when the browser loads the page again.

It will also do it's best to make sure all of the types match, for example, in our AuthedUser example above. It will ensure that the AuthedUser class is set on
the state again with the same properties to avoid any issues.

It's super simple to enable persistence, using our UserStore example from further up, we can just change the decorator:

```ts
import {Store} from "./Plugin/Store";
import {persistedStore, watch} from "vue-class-stores"

type UserStoreState = {
  user: AuthedUser | null;
}

// You need to define the @store decorator
@persistedStore()
export class UserStore extends Store<UserStoreState> {

  initialState(): UserStoreState {
    return {
      user : null
    }
  }

  // We can define this method if we'd like to specify
  // Some logic that is run when our store is re-populated from storage
  onLoadedFromStorage() {
  }
}
```

### Explanation of generated files:

**VueCompositionApiExports** - This just exports the methods from the vue composition api if you're using vue 2. Files will used the exports from that file. It
keeps things simple when generating all of those code.

**InstallVueCompositionApi** - VueClassStores plugin will instantiate all of your stores. If vue composition api is not "installed" yet then it will complain.
The logic is extracted into this file so that it can be placed at the top of your main app file and be the first to run, also in a separate scope to
VueClassStoresPlugin

**VueClassStoresPlugin** - This is an auto generated plugin for initiating your stores and registering them with Vue.

**VueStores** - This is an export of all your stores that will maintain state, it will allow you to use your stores in different classes and such.

**VueClassStoresPluginTypes.d.ts** - This should help your ide understand that you're using a store in your vuejs templates and understand that they're
registered with Vue.

**Store** - All of your store classes should extend this class. It's automatically generated depending on your vue project version. It just provides some basic
functionality for everything to work easily.

**stores.meta.json** - This file is incase you need to look at any of the data used for generating files. Or would like to add some further dynamic logic on top
of what vue-class-stores provides.
