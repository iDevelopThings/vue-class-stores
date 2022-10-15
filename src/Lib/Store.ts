import {klona} from "klona";
import * as _ from "lodash";
import {getCurrentScope, onScopeDispose, watch, WatchOptions} from "vue";
import {mergeReactiveObjects} from "../Common/Object";
import {Subscription, SubscriptionCallbackInfo} from "../Common/Subscription";
import DevTools from "../DevTools/DevTools";
import type {Path, PathValue} from "./DotPath";
import StoreManager from "./StoreManager";
import {BaseStoreImpl, PatchOperationFunction, PatchOperationObject, StoreAction, StoreActionWithSubscriptions, StoreCustomProperties} from "./StoreTypes";
import type {BaseStoreClass, CustomWatchOptions, WatchFunction, WatchHandler} from "./StoreTypes";
import {ClassStoreSymbol, DescriptorGroups, getDescriptors, getDescriptorsGrouped, makeReactive} from "./StoreUtils";

export const InternalStoreKeys = [
	'constructor',
	'state',
	'vueBinding',
	'$watch',
	'$patch',
	'$reset',
	'$onAction',
	'$getState',
	'__setState',
	'__originalState',
	'__state',
	'__stateWatcherFuncs',
	'__descriptors',
	'__handlers',
	'__actionHandlers',
	'__actionSubscriptions',
];

export class BaseStore<TStore, TState> implements BaseStoreImpl<TStore, TState> {

	private __originalState: TState;
	private __state: any;
	private __stateWatcherFuncs: { [K in keyof TState]: WatchFunction<TState[K]> } = {} as any;

	[ClassStoreSymbol] = null;

	public __descriptors: DescriptorGroups = {};

	public __handlers: Subscription = new Subscription();

	public __actionHandlers: StoreActionWithSubscriptions<TStore, TState>[] = [];

	public __actionSubscriptions: {
		before: Subscription
		after: Subscription
		error: Subscription
	} = {
		after  : new Subscription(),
		before : new Subscription(),
		error  : new Subscription(),
	};

	constructor() {
		this.__originalState = klona((this as any).state);
		this.__state         = klona((this as any).state);

		Object.defineProperty(this, 'state', {value : {}, configurable : true});

		this.#prepareState(this.__originalState);

		this[ClassStoreSymbol] = this.constructor as unknown as BaseStoreClass<TStore, TState>;

		this.__descriptors = getDescriptorsGrouped(this, InternalStoreKeys);

		this.#defineActions();

		StoreManager.registerStore(this as any);
	}

	/**
	 * Define all the individual state management for a single property
	 * @param {string} key
	 * @private
	 */
	#defineStateProperty(key: string) {
		const stateSetter = (value) => {
			this.__state[key].value = value;
			DevTools.updateStore(this);
		};

		/**
		 * Create a proxy getter/setter for the state value, which will
		 * use `__state` as the backing store. Meaning we always have reactive state(because of refs)
		 */
		Object.defineProperty((this as any).state, key, {
			get : () => { return this.__state[key].value; },
			set : stateSetter,
		});

		/**
		 * Create a shorthand version of the state getter
		 * For ex, in class, we can use `this.$myProp`, instead of `this.state.myProp`
		 * It will also allow us to use `$storeName.$myProp` in templates
		 */
		Object.defineProperty((this as any), "$" + key, {
			get : () => { return this.__state[key].value; },
			set : stateSetter,
		});

		/**
		 * Create an object which gives us a function for each
		 * state key, so we can easily define a watcher on it.
		 */
		Object.defineProperty(this.__stateWatcherFuncs, key, {
			value : (cb: WatchHandler<any>, options?: CustomWatchOptions) => {
				return this.#createWatcher(key, cb, options);
			}
		});
	}

	/**
	 * Override the original `get state()` getter and define reactive state on `__state`
	 * We'll then setup proxy getters/setters on `state` which direct to the regs on `__state`
	 *
	 * @private
	 */
	#prepareState(stateObject) {
		if (!stateObject) {
			throw new Error('State object is not defined...');
		}

		for (let [key, value] of Object.entries(stateObject)) {
			this.__state[key] = makeReactive(stateObject[key]);

			this.#defineStateProperty(key);
		}
	}

	#defineActions() {
		for (let actionsKey in this.__descriptors.actions) {
			const actionDescriptor = this.__descriptors.actions[actionsKey];

			this.#defineAction(actionsKey, actionDescriptor);
		}
	}

	#defineAction(actionsKey: string, actionDescriptor: PropertyDescriptor) {
		Object.defineProperty(this, actionsKey, {
			value : (...args) => {
				const beforeSubscription = new Subscription();
				const afterSubscription  = new Subscription();
				const errorSubscription  = new Subscription();

				args = args || [];

				const action = actionDescriptor.value.bind(this);

				function before(cb: (...args) => any) {
					beforeSubscription.addSubscription(cb);
				}

				function after(cb: (...args) => any) {
					afterSubscription.addSubscription(cb);
				}

				function error(cb: (...args) => any) {
					errorSubscription.addSubscription(cb);
				}

				const ctx: StoreAction<TStore, TState> = {
					before,
					after,
					error,
					args  : args as any,
					name  : actionsKey,
					store : this as any
				};
				this.__handlers.trigger(ctx);

				let funcResult: any;

				try {
					let newArgs = beforeSubscription.triggerPiped(...args);
					newArgs     = newArgs === undefined ? [] : Array.isArray(newArgs) ? newArgs : [newArgs];

					funcResult = action.call(this, ...newArgs);
				} catch (error) {
					errorSubscription.trigger(error);
					throw error;
				}

				if (funcResult instanceof Promise) {
					return funcResult
						.then((result) => {
							afterSubscription.trigger(result);
							return result;
						})
						.catch((error) => {
							errorSubscription.trigger(error);
							return Promise.reject(error);
						});
				}

				afterSubscription.trigger(funcResult);

				return funcResult;
			}
		});
	}

	/**
	 * Reset our state back to the original values defined in `get state()`
	 */
	$reset(): void {

		for (let [key, value] of Object.entries(this.__originalState)) {
			this.__state[key].value = value;
		}

		DevTools.updateStore(this);
	}

	/**
	 * Access the watcher functions for each state key
	 *
	 * @template TState
	 * @returns {{[K in keyof TState]: WatchFunction<TState[K]>}}
	 */
	get $watch(): { [K in keyof TState]: WatchFunction<TState[K]> } {
		return this.__stateWatcherFuncs;
	}

	/**
	 * Quickly access a state value via dot notation string
	 *
	 * @template TState
	 * @param {P} path
	 * @param defaultValue
	 * @returns {PathValue<TState, P>}
	 */
	$getState<P extends Path<TState>>(path: P, defaultValue?: any): PathValue<TState, P> {
		return _.get(this.__state, path, defaultValue);
	}

	private __setState(path: string, value: any) {
		_.set(this.__state, path, value);
	}

	#createWatcher(stateKey: string, handler: WatchHandler<any>, options?: CustomWatchOptions) {
		const stopOnScopeDispose = options?.stopOnScopeDispose ?? true;

		const vOptions: WatchOptions = {
			deep      : options.deep,
			flush     : options.flush,
			immediate : options.immediate,
			onTrack   : options.onTrack,
			onTrigger : options.onTrigger
		};
		const stateVal               = this.$getState(stateKey as any);

		const watcher = watch(
			this.$getState(stateKey as any),
			(value: any, oldValue: any) => {
				handler(value, oldValue);
			},
			vOptions
		);

		if (stopOnScopeDispose) {
			if (!getCurrentScope()) {
				throw new Error('No scope found. Are you using the plugin outside of a Vue component/setup?');
			}

			onScopeDispose(() => watcher());
		}

		return watcher;
	}

	/**
	 * Apply a patch operation to the state
	 *
	 * @example
	 * ```
	 *  store.$patch({myStateValue: 'a new value', anotherStateValue: 'another new value'});
	 *  store.$patch((state) => {
	 *      state.myStateValue = 'a new value';
	 *      state.anotherStateValue = 'another new value';
	 *  });
	 * ```
	 *
	 * @template TState
	 * @param {PatchOperationFunction<TState>} patchOperation
	 */
	$patch(patchOperation: PatchOperationFunction<TState>): void;
	$patch(patchOperation: PatchOperationObject<TState>): void;
	$patch(patchOperation: any): void {
		if (typeof patchOperation === 'function') {
			patchOperation((this as any).state);
			return;
		}

		mergeReactiveObjects((this as any).state, patchOperation);
	}

	$onAction<K extends keyof TStore>(actionHandler?: (context: StoreAction<TStore, TState>) => void): () => void {
		return this.__handlers.subscribe(actionHandler);

		/*const action: StoreActionWithSubscriptions<TStore, TState> = actionHandler;

		 action.subscriptions = {
		 before : undefined,
		 after  : undefined,
		 error  : undefined,
		 };

		 if (action.before) {
		 action.subscriptions.before = this.__actionSubscriptions.before.addSubscription((args) => {
		 console.log('[ACTION HANDLER] > triggered: before', args);
		 action.before(args);
		 });
		 }
		 if (action.after) {
		 action.subscriptions.after = this.__actionSubscriptions.after.addSubscription((args) => {
		 console.log('[ACTION HANDLER] > triggered: after', args);
		 action.after(args);
		 });
		 }
		 if (action.error) {
		 action.subscriptions.error = this.__actionSubscriptions.error.addSubscription((args) => {
		 console.log('[ACTION HANDLER] > triggered: error', args);
		 action.error(args);
		 });
		 }

		 this.__actionHandlers.push(action);

		 return () => {
		 for (let callbackType in action.subscriptions) {
		 action.subscriptions[callbackType].disposer();
		 }

		 const idx = this.__actionHandlers.indexOf(action);
		 if (idx > -1) {
		 this.__actionHandlers.splice(idx, 1);
		 }
		 };*/

		return () => {};
	}

	public addExtensions(extensions: { [key: string]: any }[]) {
		for (let extension of extensions) {
			this.addExtension(extension);
		}
	}

	public addExtension(extension: { [key: string]: any }) {
		const descriptors = getDescriptorsGrouped(extension, InternalStoreKeys);

		const state = {...descriptors.getters, ...descriptors.other};

		for (let [key, value] of Object.entries(descriptors.getters)) {
			Object.defineProperty(this, key, {enumerable : true, configurable : true, value : extension[key]});
			this.__descriptors.getters[key] = value;
		}
		for (let [key, value] of Object.entries(descriptors.other)) {
			Object.defineProperty(this, key, {enumerable : true, configurable : true, value : extension[key]});
			this.__descriptors.other[key] = value;
		}

		for (let [key, value] of Object.entries(descriptors.actions)) {
			this.#defineAction(key, value);
			this.__descriptors.actions[key] = value;
		}
	}

}

export function Store<TStore, TState>() {
	const base = BaseStore<TStore, TState>;
	return base as unknown as BaseStoreClass<TStore, TState>;
}
