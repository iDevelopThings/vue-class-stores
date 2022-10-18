export {BaseStore, Store} from './Store';
export {default as StoreManager, StoreManagerInstance} from './StoreManager';
export {ClassStoreSymbol, makeReactive} from './StoreUtils';
export type {
	BaseStoreClass,
	CustomWatchOptions,
	WatchFunction,
	WatchHandler,
	BaseStoreInstance,
	BaseStorePrototype,
	Constructor,
	GConstructor,
	BaseStoreImpl,
	StoreCustomProperties,
	StoreAction,
	PromiseValueOrValue,
	PatchOperationFunction,
	PatchOperationObject,
	PatchOperation,
	StoreActionWithSubscriptions,
} from './StoreTypes';

export const Computed = (target: any, propertyKey: string) => {};

export const BeforeAll = (target: any, propertyKey: string) => {};
export const OnInit    = (target: any, propertyKey: string) => {};
export const OnDispose = (target: any, propertyKey: string) => {};
export const AfterAll  = (target: any, propertyKey: string) => {};

