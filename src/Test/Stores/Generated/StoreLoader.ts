import { StoreManager, StoreMetaData, StoreMetaActionData, StoreMetaGetterSetterData } from "@idevelopthings/vue-class-stores/vue";
export const stores = [new StoreMetaData({
        actions: {
            storeFunction: new StoreMetaActionData({
                n: "storeFunction",
                p: [],
                d: {},
                h: undefined
            }),
            errorFunction: new StoreMetaActionData({
                n: "errorFunction",
                p: [],
                d: {},
                h: undefined
            }),
            storeFunctionWithArgs: new StoreMetaActionData({
                n: "storeFunctionWithArgs",
                p: [{
                        n: "x",
                        t: "number",
                        dv: undefined
                    }, {
                        n: "y",
                        t: "number",
                        dv: "10"
                    }, {
                        n: "z",
                        t: "number",
                        dv: "20"
                    }],
                d: {},
                h: undefined
            }),
            increment: new StoreMetaActionData({
                n: "increment",
                p: [],
                d: {},
                h: undefined
            })
        },
        lifeCycleHandlers: {},
        stateKeys: ["someValue", "counter", "nested"],
        getters: {
            storeGetter: new StoreMetaGetterSetterData("getter", {
                n: "storeGetter",
                c: false
            }),
            someValue: new StoreMetaGetterSetterData("getter", {
                n: "someValue",
                c: false
            }),
            counter: new StoreMetaGetterSetterData("getter", {
                n: "counter",
                c: false
            })
        },
        setters: {},
        store: {
            className: "MyTestStore",
            exportName: "myTestStore",
            vueBinding: "$myTest",
            module: () => import.meta.glob("..\\TestingStore.ts", { eager: true })
        }
    }), new StoreMetaData({
        actions: {},
        lifeCycleHandlers: {},
        stateKeys: ["email", "boards"],
        getters: {
            email: new StoreMetaGetterSetterData("getter", {
                n: "email",
                c: true
            })
        },
        setters: {},
        store: {
            className: "UserStore",
            exportName: "userStore",
            vueBinding: "$user",
            module: () => import.meta.glob("..\\UserStore.ts", { eager: true })
        }
    }), new StoreMetaData({
        actions: {
            increment: new StoreMetaActionData({
                n: "increment",
                p: [],
                d: {},
                h: undefined
            }),
            incrementRef: new StoreMetaActionData({
                n: "incrementRef",
                p: [],
                d: {},
                h: undefined
            }),
            setNewMessage: new StoreMetaActionData({
                n: "setNewMessage",
                p: [{
                        n: "message",
                        t: "string",
                        dv: undefined
                    }],
                d: {},
                h: undefined
            }),
            removeBanner: new StoreMetaActionData({
                n: "removeBanner",
                p: [],
                d: {},
                h: undefined
            }),
            myTestFunc: new StoreMetaActionData({
                n: "myTestFunc",
                p: [{
                        n: "message",
                        t: "string",
                        dv: undefined
                    }],
                d: {},
                h: undefined
            }),
            errorFunc: new StoreMetaActionData({
                n: "errorFunc",
                p: [],
                d: {},
                h: undefined
            }),
            promiseFunc: new StoreMetaActionData({
                n: "promiseFunc",
                p: [{
                        n: "message",
                        t: "string",
                        dv: undefined
                    }],
                d: {},
                h: undefined
            }),
            doThing: new StoreMetaActionData({
                n: "doThing",
                p: [],
                d: {},
                h: undefined
            }),
            doSomething: new StoreMetaActionData({
                n: "doSomething",
                p: [],
                d: {},
                h: undefined
            })
        },
        lifeCycleHandlers: {
            beforeAll: "BeforeAll",
            afterAll: "AfterAll",
            onInit: "OnInit"
        },
        stateKeys: ["counter", "inputValue", "banner"],
        getters: {
            counterRef: new StoreMetaGetterSetterData("getter", {
                n: "counterRef",
                c: false
            }),
            counter: new StoreMetaGetterSetterData("getter", {
                n: "counter",
                c: true
            }),
            newCounter: new StoreMetaGetterSetterData("getter", {
                n: "newCounter",
                c: false
            }),
            inputValueRef: new StoreMetaGetterSetterData("getter", {
                n: "inputValueRef",
                c: false
            }),
            inputValue: new StoreMetaGetterSetterData("getter", {
                n: "inputValue",
                c: false
            }),
            banner: new StoreMetaGetterSetterData("getter", {
                n: "banner",
                c: false
            })
        },
        setters: {
            counter: new StoreMetaGetterSetterData("setter", {
                n: "counter",
                c: true
            })
        },
        store: {
            className: "NewYeetStore",
            exportName: "yeetStore",
            vueBinding: "$newYeet",
            module: () => import.meta.glob("..\\YeetStore.ts", { eager: true })
        }
    })];
