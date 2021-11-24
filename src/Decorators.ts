
import {StoreManager} from "./StoreManager";

export function watch(property: string): MethodDecorator {
	return function (target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<any>): void {
		StoreManager.setStoreWatcher(target, {
			method : propertyKey as string,
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
