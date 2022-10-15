declare module "@vue/runtime-core" {
	import {myTestStore} from "./TestingStore";
	import {yeetStore} from "./YeetStore";
//	import {StoreCustomProperties} from "@idevelopthings/vue-class-stores/vue";

	interface ComponentCustomProperties {
		$myTest: typeof myTestStore;
		$newYeet: typeof yeetStore;
	}
}
export {};
