declare module "@vue/runtime-core" {
    import { myTestStore } from "./TestingStore";
    import { yeetStore } from "./YeetStore";
    interface ComponentCustomProperties {
        $myTest: typeof myTestStore;
        $newYeet: typeof yeetStore;
    }
}
export {};
