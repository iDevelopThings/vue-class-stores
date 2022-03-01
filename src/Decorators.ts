
import {WatchOptions} from "vue";
import {StoreManager} from "./StoreManager";

export function watch(property: string, watchOptions?: WatchOptions): MethodDecorator {
	return function (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>): void {
		StoreManager.setStoreWatcher(target, {
			method : propertyKey as string,
			watchOptions: watchOptions || {},
			property
		});
	};
}

export function store(): ClassDecorator {
	return function (target: Function): void {
		StoreManager.setStore(target, false);
	};
}

//export function persistedStore(): ClassDecorator {
//	return function (target: Function): void {
//		StoreManager.setStore(target, true);
//	};
//}
