---
title: Actions
lang: en-US
---

## Defining an action

An action is just a method on your store, using any valid js syntax will work

```typescript
class MyStore extends Store<MyStore, { count: number }>() {
    get state() {
        return {count: 0};
    }

    increment() {
        this.$count++;
    }
}
```

## Subscribing to actions

You can subscribe to actions and intercept their calls.

The callback you define is executed before the action, and allows you to intercept the args it takes, receive it's value
and catch it's error.

Here's an example that logs before running actions and after they finish/error.

```typescript
const unsubscribe = store.$onAction(
    ({
         store, // store instance that triggered the action
         args, // args provided to the action
         name, // name of the action
         before, // callback to intercept action args and provide new ones
         error, // callback to handle error if one is thrown
         after, // callback to do something with the result
     }) => {
        const startTime = Date.now()
        console.log(`Start "${name}" with args [${args.join(', ')}].`)

        before(payload => {
            console.log(`Before "${name}" args`, payload);
            // return some new args to use instead
            return payload;
        });

        after((result) => {
            console.log(
                `Finished "${name}" after ${Date.now() - startTime}ms.\nResult: ${result}.`
            )
        });

        error((error) => {
            console.warn(
                `Failed "${name}" after ${Date.now() - startTime}ms.\nError: ${error}.`
            )
        });

    });

// Manually unsubscribe when we're finished
unsubscribe();
```
