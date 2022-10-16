declare module "@vue/runtime-core" {
    import { myTestStore } from "./TestingStore";
    import { todosStore } from "./TodoStore";
    import { yeetStore } from "./YeetStore";
    interface ComponentCustomProperties {
        $myTest: typeof myTestStore;
        $todos: typeof todosStore;
        $newYeet: typeof yeetStore;
    }
}
export {};
