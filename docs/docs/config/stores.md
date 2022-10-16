## Template binding name

```typescript
class ApplicationStore extends Store<ApplicationStore, { count: number }>() {
    get state() {
        return {count: 0};
    }
}

export const applicationStore = new ApplicationStore();
```

With the above, the name of `applicationStore` will be bound, so in this case, `$applicationStore` is accessible in the
template

However, if the name contains "Store"/"store" it will be removed, so it will be bound as `$application`
This is just to keep things a tad cleaner

## Specifying your own binding

We can supply static public property with our custom name, even if this contains "Store"/"store" it will not be removed.

```typescript
class ApplicationStore extends Store<ApplicationStore, { count: number }>() {

    public static vueBinding = 'myCustomStoreName';

    get state() {
        return {count: 0};
    }

}
```


