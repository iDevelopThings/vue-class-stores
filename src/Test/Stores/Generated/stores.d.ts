declare module "@vue/runtime-core" {
    import { myTestStore } from "./../TestingStore";
    import { userStore } from "./../UserStore";
    import { yeetStore } from "./../YeetStore";
    interface ComponentCustomProperties {
        $myTest: typeof myTestStore;
        $user: typeof userStore;
        $newYeet: typeof yeetStore;
    }
}
export {};
