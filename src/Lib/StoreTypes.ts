import {type WatchOptions} from "vue";
import {SubscriptionCallbackInfo} from "../Common/Subscription";
import type {Path, PathValue} from "./DotPath";
import {Handler} from "./EventBus/EventBus";
import {StoreEventBus} from "./EventBus/StoreEventBus";
import {StoreEventsMap} from "./EventBus/StoreEventsMap";
import {type BaseStore} from "./Store";

export type Constructor = new (...args: any[]) => {};
export type GConstructor<T = {}> = new (...args: any[]) => T;

export type CustomWatchOptions = WatchOptions & { stopOnScopeDispose?: boolean };
export type WatchHandler<V> = (value: V, old: V) => any
export type WatchFunction<V> = (cb: WatchHandler<V>, options?: CustomWatchOptions) => any;

type PropType<TObj, TProp extends keyof TObj> = TObj[TProp];

export type BaseStorePrototype<TStore, TState> = (typeof BaseStore<TStore, TState>)['prototype'];

export type BaseStoreImpl<TStore, TState> = /*BaseStore<TStore, TState>['$patch'] &*/ {
	$watch: { [K in keyof TState]: WatchFunction<TState[K]> };

	$getState<P extends Path<TState>>(path: P, defaultValue?: any): PathValue<TState, P>;

	$reset(): void;

	$patch(patchOperation: PatchOperationFunction<TState>): void
	$patch(patchOperation: PatchOperationObject<TState>): void
	$patch(patchOperation: any): void

	$dispatch<Key extends keyof StoreEventsMap | string>(
		type: Key,
		payload?: Key extends keyof StoreEventsMap ? StoreEventsMap[Key] : any,
	): void;
	$on<Key extends keyof StoreEventsMap | string>(
		type: Key,
		handler: Handler<Key extends keyof StoreEventsMap ? StoreEventsMap[Key] : any>,
	): () => void;
	$off<Key extends keyof StoreEventsMap | string>(
		type: Key,
		handler: Handler<Key extends keyof StoreEventsMap ? StoreEventsMap[Key] : any>,
	): void;

	$eventBus: StoreEventBus;

	$onAction(handler?: (context: StoreAction<TStore, TState>) => void): () => void;
}

export interface StoreCustomProperties {

}

export type BaseStoreInstance<TStore extends Record<string, any>, TState> =
	{ [P in keyof TState as `$${string & P}`]: TState[P] } &
	{ [P in keyof StoreCustomProperties]: StoreCustomProperties[P] } &
	BaseStoreImpl<TStore, TState> &
	{ get state(): TState };


export type BaseStoreClass<TStore, TState> = {
	new(): BaseStoreInstance<TStore, TState>,

	vueBinding?: string;
}


export type PatchOperationObject<TState> = Partial<TState>;
export type PatchOperationFunction<TState> = ((state: TState) => void);
export type PatchOperation<TState> = PatchOperationObject<TState> | PatchOperationFunction<TState>;

export type PromiseValueOrValue<T> = T extends PromiseLike<T> ? Awaited<T> : T;

export type StoreAction<TStore, TState> = {
	/**
	 * The current store being used for this action
	 */
	store: TStore;
	/**
	 * The name of the action that is being executed
	 */
	name: string;
	/**
	 * The args passed to this action during execution
	 */
	args: any[];

	/**
	 * A callback that is called before the action is executed
	 * This gives us a chance to modify any arguments being passed to the action
	 */
	before: ((cb: <A>(args: A | any) => A | any) => void);

	/**
	 * A callback that is called after the action is executed
	 */
	after: (cb: (result: PromiseValueOrValue<any>) => void | Promise<void>) => void;

	/**
	 * A callback that is called when the action throws an error
	 */
	error: (cb: ((error: any) => void)) => void;
}

export type StoreActionWithSubscriptions<TStore, TState> = StoreAction<TStore, TState> & {
	subscriptions?: {
		before?: SubscriptionCallbackInfo;
		after?: SubscriptionCallbackInfo;
		error?: SubscriptionCallbackInfo;
	}
}
