import { StoreManager } from "@idevelopthings/vue-class-stores/vue";
import { type App } from "vue";
export const stores = [{
        className: "MyTestStore",
        importPath: "../TestingStore.ts",
        exportName: "myTestStore",
        vueBinding: "$myTest",
        stateKeys: ["someValue", "counter", "nested"],
        getters: [{
                n: "storeGetter",
                c: false
            }, {
                n: "someValue",
                c: false
            }, {
                n: "counter",
                c: false
            }],
        actions: [{
                name: "storeFunction",
                params: []
            }, {
                name: "errorFunction",
                params: []
            }, {
                name: "storeFunctionWithArgs",
                params: [{
                        name: "x",
                        type: "number"
                    }, {
                        name: "y",
                        type: "number",
                        defaultValue: "10"
                    }, {
                        name: "z",
                        type: "number",
                        defaultValue: "20"
                    }]
            }, {
                name: "increment",
                params: []
            }],
        module: () => import.meta.glob("../TestingStore.ts", { eager: true })
    }, {
        className: "UserStore",
        importPath: "../UserStore.ts",
        exportName: "userStore",
        vueBinding: "$user",
        stateKeys: ["email", "boards"],
        getters: [{
                n: "email",
                c: true
            }],
        actions: [],
        module: () => import.meta.glob("../UserStore.ts", { eager: true })
    }, {
        className: "NewYeetStore",
        importPath: "../YeetStore.ts",
        exportName: "yeetStore",
        vueBinding: "$newYeet",
        stateKeys: ["counter", "inputValue", "banner"],
        getters: [{
                n: "counterRef",
                c: false
            }, {
                n: "counter",
                c: true
            }, {
                n: "inputValueRef",
                c: false
            }, {
                n: "inputValue",
                c: false
            }, {
                n: "banner",
                c: false
            }],
        actions: [{
                name: "increment",
                params: []
            }, {
                name: "incrementRef",
                params: []
            }, {
                name: "setNewMessage",
                params: [{
                        name: "message",
                        type: "string"
                    }]
            }, {
                name: "removeBanner",
                params: []
            }, {
                name: "myTestFunc",
                params: [{
                        name: "message",
                        type: "string"
                    }]
            }, {
                name: "errorFunc",
                params: []
            }, {
                name: "promiseFunc",
                params: [{
                        name: "message",
                        type: "string"
                    }]
            }, {
                name: "doThing",
                params: []
            }, {
                name: "doSomething",
                params: []
            }],
        module: () => import.meta.glob("../YeetStore.ts", { eager: true })
    }];
if (import.meta.hot) {
    import.meta.hot.accept(["./../TestingStore", "./../UserStore", "./../YeetStore"], modules => {
        console.log("stores updated", modules);
        StoreManager.handleHotReload(modules);
    });
}
