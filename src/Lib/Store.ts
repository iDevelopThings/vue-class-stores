import {reflect} from "@idevelopthings/reflect-extensions";
import {klona} from "klona";
import get from 'lodash.get';
import set from 'lodash.set';
import {computed, EffectScope, effectScope, getCurrentScope, onScopeDispose, reactive, toRef, watch, WatchOptions} from "vue";
import {mergeReactiveObjects, Subscription} from "../Common";
import DevTools from "../DevTools/DevTools";
import type {Path, PathValue} from "./DotPath";
import {Logger} from "./Logger";
import type {BaseStoreClass, CustomWatchOptions, WatchFunction, WatchHandler} from "./StoreTypes";
import type {BaseStoreImpl, PatchOperationFunction, PatchOperationObject, StoreAction, StoreActionWithSubscriptions} from "./StoreTypes";
import {ClassStoreSymbol, type DescriptorGroups, getDescriptorsGrouped, makeReactive} from "./StoreUtils";
import type {StoreExtensionDefinitions, StoreGetterInfo, StoreMeta, StoreMetaGetter} from "./Types";


export class BaseStore<TStore, TState> implements BaseStoreImpl<TStore, TState> {
	[ClassStoreSymbol] = null;

	private __scope: EffectScope;
	private __storeMeta: StoreMeta;
	private __getters: { [key: string]: StoreGetterInfo }  = {};
	private __actions: { [key: string]: (...args) => any } = {};

	private __extensions: StoreExtensionDefinitions = {
		getters    : {},
		actions    : {},
		properties : {}
	};

	private __originalState: TState;
	private __state: any;

	private __stateWatcherFuncs: { [K in keyof TState]: WatchFunction<TState[K]> } = {} as any;

	public __handlers: Subscription                                         = new Subscription();
	public __actionHandlers: StoreActionWithSubscriptions<TStore, TState>[] = [];


	constructor() {

	}

	__bootStore(meta: StoreMeta) {
		Logger.label('Store').debug('Booting store', this.constructor.name);

		this.__storeMeta     = meta;
		this.__originalState = klona((this as any).state);
		this.__state         = reactive(klona((this as any).state));

		Object.defineProperty(this, 'state', {value : {}, configurable : true});

		this[ClassStoreSymbol] = this.constructor as unknown as BaseStoreClass<TStore, TState>;

		this.__scope = effectScope(true);
		this.__scope.run(() => {
			this.#defineState();
			this.#defineGetters();
			this.#defineActions();

			const mutationWatcher = watch(() => JSON.parse(JSON.stringify((this as any).__state)), (newVal, oldVal) => {
				Logger.label('Store').debug('Pre Mutation detected', this.constructor.name, {
					newVal : newVal.banner?.message,
					oldVal : oldVal.banner?.message
				});
				DevTools.stateMutation(this.constructor.name, newVal, oldVal);
				DevTools.updateStore(this);
			}, {deep : false, flush : 'sync'});

			const devtoolsAction = this.$onAction((action) => {
				DevTools.actionSetup(action);
			});

			onScopeDispose(() => {
				Logger.label('Store').debug('Score scope disposed', this.constructor.name);
				mutationWatcher();
				devtoolsAction();
			});
		});
	}


	/**
	 * Define all the individual state management for a single property
	 * @param {string} key
	 * @private
	 */
	#defineStateProperty(key: string) {
		const stateSetter = (value) => {
			this.__state[key] = value;
		};

		const stateGetter = () => {
			return toRef(this.__state, key).value;
		};

		/**
		 * Create a proxy getter/setter for the state value, which will
		 * use `__state` as the backing store. Meaning we always have reactive state(because of refs)
		 */
		Object.defineProperty((this as any).state, key, {
			get : stateGetter,
			set : stateSetter,
		});

		/**
		 * Create a shorthand version of the state getter
		 * For ex, in class, we can use `this.$myProp`, instead of `this.state.myProp`
		 * It will also allow us to use `$storeName.$myProp` in templates
		 */
		Object.defineProperty((this as any), "$" + key, {
			get : stateGetter,
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
	#defineState() {
		if (!this.__originalState) {
			throw new Error('State object is not defined...');
		}

		for (let key of this.__storeMeta.stateKeys) {
			this.__state[key] = makeReactive(this.__originalState[key]);
			this.#defineStateProperty(key);
		}

	}

	/**
	 * For all of the getters located by the generator, we'll override the original getter
	 *
	 * We'll store the accessor to the original getter on __getters, if the getter has @Computed
	 * decorator, we'll make it computed and store that on __getters instead, otherwise it's the getter function
	 *
	 * @private
	 */
	#defineGetters() {
		for (let getter of this.__storeMeta.getters) {
			this.#defineGetter(getter);
		}
	}

	#defineGetter(getter: StoreMetaGetter, getterFunc?: (() => any)) {
		const getterDescriptor = Reflect.getOwnPropertyDescriptor(this.constructor.prototype, getter.n);
		if (!getterDescriptor && !getterFunc) {
			Logger.label('Store').warn(`Getter descriptor "${getter.n}" could not be found on: `, this.constructor.name);
			return;
		}

		if (!getterFunc) {
			getterFunc = getterDescriptor.get.bind(this);
		}

		this.__getters[getter.n] = {
			type  : getter.c ? 'computed' : 'function',
			value : (getter.c ? computed(getterFunc) : getterFunc) as any
		};

		Object.defineProperty((this as any), getter.n, {
			configurable : getterDescriptor?.configurable || true,
			enumerable   : getterDescriptor?.enumerable || true,
			get          : () => {
				const getterInfo = this.__getters[getter.n];

				return getterInfo.type === 'computed'
					? getterInfo.value.value
					: getterInfo.value();
			},
		});
	}

	/**
	 * For all the actions located by the generator, we'll proxy access to the original, so we can use `this.$onAction` on them.
	 *
	 * @private
	 */
	#defineActions() {
		for (let action of this.__storeMeta.actions) {
			const actionDescriptor = Reflect.getOwnPropertyDescriptor(this.constructor.prototype, action.name);
			if (!actionDescriptor) {
				Logger.label('Store').warn(`Action descriptor "${action.name}" could not be found on: `, this.constructor.name);
				continue;
			}
			this.#defineAction(action.name, actionDescriptor);
		}
	}

	/**
	 * When a store is loaded, we'll add "proxies" to the methods, which will allow the
	 * developer to subscribe/intercept their calls via {@see $onAction}
	 *
	 * @param {string} actionsKey
	 * @param {PropertyDescriptor} actionDescriptor
	 * @private
	 */
	#defineAction(actionsKey: string, actionDescriptor: PropertyDescriptor) {

		this.__actions[actionsKey] = actionDescriptor.value;

		Object.defineProperty(this, actionsKey, {
			value : (...args) => {
				const actionBuilder = reflect(this.__actions[actionsKey])
					.function()
					.build()
					.instance(this);

				if (!this.__handlers.hasSubscriptions()) {
					return actionBuilder.parameters(args).call();
				}

				const beforeSubscription = new Subscription();
				const afterSubscription  = new Subscription();
				const errorSubscription  = new Subscription();

				args = args || [];

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
					funcResult = actionBuilder.parameters(beforeSubscription.triggerPiped(...args)).call();
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
		return get(this.__state, path, defaultValue);
	}

	private __setState(path: string, value: any) {
		set(this.__state, path, value);
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

	/**
	 * Subscribe to action calls
	 *
	 * @template TStore
	 * @template TState
	 * @param {(context: StoreAction<TStore, TState>) => void} actionHandler
	 * @returns {() => void}
	 */
	$onAction<K extends keyof TStore>(actionHandler?: (context: StoreAction<TStore, TState>) => void): () => void {
		return this.__handlers.subscribe(actionHandler);
	}

	public __addExtensions(extensions: { [key: string]: any }[]) {
		for (let extension of extensions) {
			this.__addExtension(extension);
		}
	}

	public __addExtension(extension: { [key: string]: any }) {
		const descriptors = getDescriptorsGrouped(extension);

		for (let [key, value] of Object.entries(descriptors.getters)) {
			if (Reflect.has(BaseStore.prototype, key) || this.__getters[key]) {
				Logger.label('Store').warn(`Cannot add Getter "${key}" extension to store: "${this.constructor.name}", there is already a getter with that name. Skipping...`);
				continue;
			}

			// Define the new getter with a custom function
			this.#defineGetter({n : key, c : false}, () => extension[key]);

			// Add the getter meta to our internal getters object(so we can use/show it in other places)
			this.__storeMeta.getters.push({n : key, c : false});
		}

		/*for (let [key, value] of Object.entries(descriptors.other)) {
		 Logger.debug(`Adding extension "${key}" to store: "${this.constructor.name}"`, value);
		 Object.defineProperty(this, key, {enumerable : true, configurable : true, value : extension[key]});
		 this.__descriptors.other[key] = value;
		 }*/

		for (let [key, value] of Object.entries(descriptors.actions)) {
			if (Reflect.has(BaseStore.prototype, key) || this.__actions[key]) {
				Logger.label('Store').warn(`Cannot add Action "${key}" extension to store: "${this.constructor.name}", there is already an action with that name. Skipping...`);
				continue;
			}

			this.#defineAction(key, value);

			this.__storeMeta.actions.push({name : key, params : []});
		}
	}

}

export function Store<TStore, TState>() {
	const base = BaseStore<TStore, TState>;
	return base as unknown as BaseStoreClass<TStore, TState>;
}
