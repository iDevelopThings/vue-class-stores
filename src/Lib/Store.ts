import {reflect} from "@idevelopthings/reflect-extensions";
import {WritableComputedOptions} from "@vue/reactivity";
import {klona} from "klona";
import get from 'lodash.get';
import set from 'lodash.set';
import {computed, EffectScope, getCurrentScope, onScopeDispose, reactive, toRef, watch, WatchOptions} from "vue";
import {mergeReactiveObjects, Subscription} from "../Common";
import {LifeCycleEvent, lifeCycleEventName} from "../Common/LifeCycle";
import DevTools from "../DevTools/DevTools";
import type {Path, PathValue} from "./DotPath";
import {Handler} from "./EventBus/EventBus";
import {StoreEventBus} from "./EventBus/StoreEventBus";
import {StoreEventsMap} from "./EventBus/StoreEventsMap";
import {Logger} from "./Logger";
import {type StoreMetaData} from "./Meta/StoreMetaData";
import {StoreMetaGetterSetterData} from "./Meta/StoreMetaGetterSetterData";
import StoreManager from "./StoreManager";
import type {BaseStoreClass, BaseStoreImpl, CustomWatchOptions, PatchOperationFunction, PatchOperationObject, StoreAction, StoreActionWithSubscriptions, WatchFunction, WatchHandler} from "./StoreTypes";
import {ClassStoreSymbol, getDescriptorsGrouped, makeReactive} from "./StoreUtils";
import {StoreGetterComputedInfo, StoreGetterRegularInfo} from "./Types";
import type {LifeCycleHooks, StoreActionsList, StoreExtensionDefinitions, StoreGettersList, HotReloadChanges, StoreSettersList, StoreType} from "./Types";
import {isTesting, vuePluginErrorMessage} from "./Utils";


export class BaseStore<TStore, TState> implements BaseStoreImpl<TStore, TState> {
	[ClassStoreSymbol] = null;

	private __scope: EffectScope;
	private __storeMeta: StoreMetaData;
	private __getters: StoreGettersList      = {};
	private __setters: StoreSettersList      = {};
	private __actions: StoreActionsList      = {};
	private __lifecycleHooks: LifeCycleHooks = {
		AfterAll  : () => {},
		BeforeAll : () => {},
		OnInit    : () => {},
		OnDispose : () => {},
	};

	private __extensions: StoreExtensionDefinitions = {
		getters    : {},
		actions    : {},
		properties : {}
	};

	private __originalState: TState;
	private __state: any;

	private __stateWatcherFuncs: { [K in keyof TState]: WatchFunction<TState[K]> } = {} as any;
	private __stateWatchHandles: { [K in keyof TState]: (() => any)[] }            = {} as any;

	public __handlers: Subscription                                         = new Subscription();
	public __actionHandlers: StoreActionWithSubscriptions<TStore, TState>[] = [];

	public bus: StoreEventBus = new StoreEventBus();

	constructor() {

	}

	__bindStore(meta: StoreMetaData) {
		if (!meta.store.vueBinding) {
			if (isTesting()) {
				Logger.error(`There is no vue binding defined for the store "${meta.store.className}" in testing mode.`);
				Logger.error(`As a fallback, the store will be bound as "$${meta.store.className}" in your vue templates.`);
				Logger.error(`If you need a specific vue binding, defined 'public static vueBinding = "yourBinding"' on your store.`);
				meta.store.vueBinding = `$${meta.store.className}`;
			} else {
				throw new Error([
					`There is no vue binding defined for the store "${meta.store.className}".`,
					vuePluginErrorMessage('missing vue binding')
				].join('\n'));
			}
		}

		this.__storeMeta         = meta;
		(this as any).vueBinding = meta.store.vueBinding;

		StoreManager.storeModules[meta.store.className] = meta.getModule();
		StoreManager.storeMeta[meta.store.className]    = meta;
		StoreManager.stores[meta.store.className]       = this as any;

		StoreManager.storeBindingToClassName[meta.store.vueBinding] = meta.store.className;
	}

	__preBooting() {
		Logger.label('Store - BeforeAll').debug('Pre Booting store', this.constructor.name);

		this[ClassStoreSymbol] = this.constructor as unknown as BaseStoreClass<TStore, TState>;

		this.__originalState = klona((this as any).state);
		this.__state         = reactive(klona((this as any).state));

		Object.defineProperty(this, 'state', {value : {}, configurable : true});

		// Binding any event handlers to the store
		for (let [method, event] of this.__storeMeta.lifeCycleHandlers) {
			this.bus.$on(lifeCycleEventName(event as LifeCycleEvent), this[method].bind(this));
		}

		// Handle any actions with an @On() decorator defined
		// For these we need to register event handlers on the store
		// Using the parameter set on the decorator as the event name
		if (!this.__storeMeta.actions.isEmpty()) {
			const listenerActions = this.__storeMeta.actions.filter(action => action.decorators.has('On'));
			for (let action of listenerActions) {
				const decorator = action.decorators.get('On');
				if (!decorator || !decorator?.p?.length || decorator?.p[0]?.v === '') continue;
				let eventName = decorator.p[0].v;
				// Because we extract the value as a string via ts compiler, we need to remove any quotes
				eventName     = eventName.replace(/['"]+/g, '');

				// Set the event name to the decorator value and bind the method
				this.bus.$on(eventName, this[action.name].bind(this));
			}
		}
	}

	__bootStore() {
		Logger.label('Store').debug('Booting store', this.constructor.name);

		this.__scope = new EffectScope();
		this.__scope.run(() => {
			this.#defineState();
			this.#defineGetters();
			this.#defineActions();

			let mutationWatcher = () => {};
			if(!StoreManager.options?.disableDevtoolsMutationWatcher)
			{
				mutationWatcher = watch(() => JSON.parse(JSON.stringify((this as any).__state)), (newVal, oldVal) => {
					Logger.label('Store').debug('Pre Mutation detected', this.constructor.name, {
						newVal : newVal.banner?.message,
						oldVal : oldVal.banner?.message
					});
					DevTools.stateMutation(this.constructor.name, newVal, oldVal);
					DevTools.updateStore(this);
				}, {deep : false, flush : 'sync'});
			}

			const devtoolsAction = this.$onAction((action) => {
				DevTools.actionSetup(action);
			});

			onScopeDispose(() => {
				Logger.label('Store').debug('Score scope disposed', this.constructor.name);
				mutationWatcher();
				devtoolsAction();

				this.bus.removeAllListeners();
			});
		});

		if (StoreManager.__scope) {
			onScopeDispose(() => {
				Logger.label('Store').debug('StoreManager Scope disposed', this.constructor.name);
				this.__scope.stop(true);
			});
		}
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
			this.#defineStateProperty(key);
		}

	}

	/**
	 * Define all the individual state management for a single property
	 * @param {string} key
	 * @private
	 */
	#defineStateProperty(key: string) {

		this.__state[key] = makeReactive(this.__originalState[key]);

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
			configurable : true,
			enumerable   : true,
			get          : stateGetter,
			set          : stateSetter,
		});

		/**
		 * Create a shorthand version of the state getter
		 * For ex, in class, we can use `this.$myProp`, instead of `this.state.myProp`
		 * It will also allow us to use `$storeName.$myProp` in templates
		 */
		Object.defineProperty((this as any), "$" + key, {
			configurable : true,
			enumerable   : true,
			get          : stateGetter,
			set          : stateSetter,
		});

		/**
		 * Create an object which gives us a function for each
		 * state key, so we can easily define a watcher on it.
		 */
		Object.defineProperty(this.__stateWatcherFuncs, key, {
			configurable : true,
			enumerable   : true,
			value        : (cb: WatchHandler<any>, options?: CustomWatchOptions) => {
				return this.#createWatcher(key, cb, options);
			}
		});
	}

	#removeStateProperty(key: string) {

		if (Reflect.has(this.__state, key)) {
			Reflect.deleteProperty(this.__state, key);
		}

		if (Reflect.has((this as any).state, key)) {
			Reflect.deleteProperty((this as any).state, key);
		}

		if (Reflect.has((this as any), "$" + key)) {
			Reflect.deleteProperty((this as any), "$" + key);
		}

		if (Reflect.has(this.__stateWatcherFuncs, key)) {
			// Make sure to close any existing watch handles...
			if (Reflect.has(this.__stateWatchHandles, key)) {
				this.__stateWatchHandles[key].forEach((handle) => {
					handle();
				});
				Reflect.deleteProperty(this.__stateWatchHandles, key);
			}

			Reflect.deleteProperty(this.__stateWatcherFuncs, key);
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
		for (let [key, getter] of this.__storeMeta.getters) {
			this.#defineGetter(getter);
		}
	}

	#defineGetter(getter: StoreMetaGetterSetterData, getterFunc?: (() => any), setterFunc?: ((value) => any)) {
		const getterDescriptor = Reflect.getOwnPropertyDescriptor(this.constructor.prototype, getter.name);
		if (!getterDescriptor && !getterFunc) {
			Logger.label('Store').warn(`Getter descriptor "${getter.name}" could not be found on: `, this.constructor.name);
			return;
		}

		if (!getterFunc) {
			getterFunc = getterDescriptor.get.bind(this);
		}

		const baseGetter: StoreGetterComputedInfo = {
			type   : getter.isComputed ? 'computed' : 'function' as any,
			value  : getterFunc as any,
			getter : getterFunc as any,
		};

		const descriptor: PropertyDescriptor = {
			configurable : getterDescriptor?.configurable || true,
			enumerable   : getterDescriptor?.enumerable || true,
			get          : () => {
				// We'll assume our base descriptor is just a regular getter
				return (this.__getters[getter.name] as StoreGetterRegularInfo).value();
			},
		};

		// If our getter is computed, we need to check to see if there is a corresponding setter
		// If there is, this setter becomes a writable computed property instead
		if (getter.isComputed) {
			const setter                                              = this.__storeMeta.setters.get(getter.name);
			const computedOpts: Partial<WritableComputedOptions<any>> = {
				get : () => {
					return (this.__getters[getter.name] as StoreGetterComputedInfo).getter();
				}
			};

			if (setter) {
				const setterDescriptor = Reflect.getOwnPropertyDescriptor(this.constructor.prototype, setter.name);
				if (!setterDescriptor && !setterFunc) {
					Logger.label('Store').warn(`Setter descriptor "${getter.name}" could not be found on: `, this.constructor.name);
					return;
				}

				if (!setterFunc) {
					setterFunc = setterDescriptor.set.bind(this);
				}

				baseGetter.setter = setterFunc as any;

				// Use the setter function for the computed writable
				computedOpts.set = (value) => {
					return (this.__getters[getter.name] as StoreGetterComputedInfo).setter(value);
				};

				// Use the above computed writable for the descriptor setter
				descriptor.set = (value) => {
					(this.__getters[getter.name] as StoreGetterComputedInfo).value.value = value;
				};

				// Overwrite the descriptor getter to use the computed writable
				descriptor.get = () => {
					return (this.__getters[getter.name] as StoreGetterComputedInfo).value.value;
				};
			}

			baseGetter.value = computed(computedOpts as WritableComputedOptions<any>);
		}

		this.__getters[getter.name] = baseGetter;

		// TODO: Think of better way to clean up this code... 🤮

		Object.defineProperty((this as any), getter.name, descriptor);
	}

	/**
	 * For all of the setters located by the generator, we'll override the original setter
	 */
	#defineSetters() {
		for (let [key, setter] of this.__storeMeta.setters) {
			// If our setter is marked as computed, it'll be handled by the getter
			// In this case, the getter will be created as a computed writable instead
			if (setter.isComputed) {
				continue;
			}
			this.#defineSetter(setter);
		}
	}

	#defineSetter(setter: StoreMetaGetterSetterData, setterFunc?: (() => any)) {
		const setterDescriptor = Reflect.getOwnPropertyDescriptor(this.constructor.prototype, setter.name);
		if (!setterDescriptor && !setterFunc) {
			Logger.label('Store').warn(`Setter descriptor "${setter.name}" could not be found on: `, this.constructor.name);
			return;
		}

		if (!setterFunc) {
			setterFunc = setterDescriptor.set.bind(this);
		}

		this.__setters[setter.name] = {type : 'function', value : setterFunc};

		Object.defineProperty((this as any), setter.name, {
			configurable : setterDescriptor?.configurable || true,
			enumerable   : setterDescriptor?.enumerable || true,
			set          : (value) => {
				this.__setters[setter.name].value(value);
			},
		});
	}

	/**
	 * For all the actions located by the generator, we'll proxy access to the original, so we can use `this.$onAction` on them.
	 *
	 * @private
	 */
	#defineActions() {
		for (let [key, action] of this.__storeMeta.actions) {
			const actionDescriptor = Reflect.getOwnPropertyDescriptor(this.constructor.prototype, action.name);
			if (!actionDescriptor) {
				Logger.label('Store').warn(`Action descriptor "${action.name}" could not be found on: `, this.constructor.name);
				continue;
			}

			this.__actions[action.name] = actionDescriptor.value.bind(this);

			this.#defineAction(action.name);
		}
	}

	/**
	 * When a store is loaded, we'll add "proxies" to the methods, which will allow the
	 * developer to subscribe/intercept their calls via {@see $onAction}
	 *
	 * @param {string} actionsKey
	 * @private
	 */
	#defineAction(actionsKey: string) {

		Object.defineProperty(this, actionsKey, {
			configurable : true,
			enumerable   : true,
			value        : (...args) => {
				const action = this.__extensions.actions[actionsKey] ?? this.__actions[actionsKey];
				if (!action) {
					Logger.label('Store').warn(`Action "${actionsKey}" could not be found on: `, this.constructor.name);
					return;
				}
				const actionBuilder = reflect(action)
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

	get $eventBus(): StoreEventBus {
		return this.bus;
	}

	$dispatch<Key extends keyof StoreEventsMap | string>(
		type: Key,
		payload?: Key extends keyof StoreEventsMap ? StoreEventsMap[Key] : any,
	): void {
		this.bus.$dispatch(type, payload);
	}

	$on<Key extends keyof StoreEventsMap | string>(
		type: Key,
		handler: Handler<Key extends keyof StoreEventsMap ? StoreEventsMap[Key] : any>,
		detached: boolean = false
	): () => void {
		return this.bus.$on(type, handler, detached);
	}

	$off<Key extends keyof StoreEventsMap | string>(
		type: Key,
		handler: Handler<Key extends keyof StoreEventsMap ? StoreEventsMap[Key] : any>,
	): void {
		this.bus.$off(type, handler);
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

		const stateVal = this.$getState(stateKey as any);

		const watcher = watch(
			this.$getState(stateKey as any),
			(value: any, oldValue: any) => {
				handler(value, oldValue);
			},
			vOptions
		);

		if (!this.__stateWatchHandles[stateKey]) {
			this.__stateWatchHandles[stateKey] = [];
		}

		const stopHandle = () => {
			watcher();

			const index = this.__stateWatchHandles[stateKey].indexOf(stopHandle);
			if (index > -1) {
				this.__stateWatchHandles[stateKey].splice(index, 1);
			}
		};

		this.__stateWatchHandles[stateKey].push(stopHandle);

		if (stopOnScopeDispose) {
			if (!getCurrentScope()) {
				throw new Error('No scope found. Are you using the plugin outside of a Vue component/setup?');
			}

			onScopeDispose(() => stopHandle());
		}

		return stopHandle;
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

			if (typeof value?.get === 'function') {
				this.__extensions.getters[key] = value.get.bind(this);
			}

			if (value.value !== undefined) {
				this.__extensions.getters[key] = typeof value.value === 'function'
					? value.value.bind(this)
					: () => value.value;
			}

			if (!this.__extensions.getters[key]) {
				delete this.__extensions.getters[key];
				Logger.label('Store').warn(`Cannot add Getter "${key}" extension to store: "${this.constructor.name}", the getter function is not defined. Skipping...`);
				continue;
			}

			// Define the new getter with a custom function
			this.#defineGetter(
				new StoreMetaGetterSetterData("getter", {n : key, c : false}),
				this.__extensions.getters[key]
			);
		}

		for (let [key, value] of Object.entries(descriptors.actions)) {
			if (Reflect.has(BaseStore.prototype, key) || this.__actions[key]) {
				Logger.label('Store').warn(`Cannot add Action "${key}" extension to store: "${this.constructor.name}", there is already an action with that name. Skipping...`);
				continue;
			}
			if (typeof value.value !== 'function') {
				Logger.label('Store').warn(`Cannot add Action "${key}" extension to store: "${this.constructor.name}", the action function is not defined. Skipping...`);
				continue;
			}

			this.__extensions.actions[key] = value.value.bind(this);

			this.#defineAction(key);
		}
	}

	__processHotReloadChanges(changes: HotReloadChanges, newStore: { instance: StoreType, meta: StoreMetaData }) {
		if (!changes.hasChanges()) {
			return false;
		}

		const curCtor      = this.constructor;
		const curClassName = this.constructor.name;

		const newModule = newStore.instance;
		const newCtor   = newStore.instance.constructor;

		// We'll then apply the changes to the store instance

		// -----------------------------------------------
		// ACTIONS
		// -----------------------------------------------
		if (changes.actions.added.length || changes.actions.removed.length) {
			for (let action of changes.actions.added) {
				// Add the new action to the store first
				const actionDescriptor = Reflect.getOwnPropertyDescriptor(newCtor.prototype, action.name);
				if (!actionDescriptor?.value) {
					Logger.label('Store HMR').warn(`Cannot add Action "${action.name}" to store: "${curClassName}", the action function is not defined. Skipping...`);
					continue;
				}

				actionDescriptor.value = actionDescriptor.value.bind(this);

				Object.defineProperty(this, action.name, actionDescriptor);
				this.#defineAction(action.name);

				Logger.label('Store HMR').success(`Added action "${action.name}" to store: "${curClassName}"`);
			}

			for (let action of changes.actions.removed) {
				// Remove the action from the store
				if (Reflect.has(this.constructor.prototype, action.name)) {
					Reflect.deleteProperty(this.constructor.prototype, action.name);
				}

				if (Reflect.has(this.__actions, action.name)) {
					Reflect.deleteProperty(this.__actions, action.name);
				}

				Logger.label('Store HMR').success(`Removed action "${action.name}" from store: "${curClassName}"`);
			}
		}

		// -----------------------------------------------
		// GETTERS
		// -----------------------------------------------
		if (changes.getters.added.length || changes.getters.removed.length) {

			for (let getter of changes.getters.added) {
				const newGetter = Reflect.getOwnPropertyDescriptor(newCtor.prototype, getter.name);
				if (!newGetter?.get) {
					Logger.label('Store HMR').warn(`Cannot add Getter "${getter.name}" extension to store via hot reload: "${curClassName}", the getter function is not defined. Skipping...`);
					continue;
				}

				newGetter.get = newGetter.get.bind(this);

				// Add the new getter to the store first
				Object.defineProperty(this.constructor.prototype, getter.name, newGetter);

				this.#defineGetter(getter);

				Logger.label('Store HMR').success(`Added Getter "${getter.name}" to store: "${curClassName}"`);
			}

			for (let getter of changes.getters.removed) {
				// Remove the getter from the store
				if (Reflect.has(this.constructor.prototype, getter.name)) {
					Reflect.deleteProperty(this.constructor.prototype, getter.name);
				}

				if (Reflect.has(this.__getters, getter.name)) {
					Reflect.deleteProperty(this.__getters, getter.name);
				}

				Logger.label('Store HMR').success(`Removed getter "${getter.name}" from store: "${curClassName}"`);
			}

		}

		// -----------------------------------------------
		// STATE
		// -----------------------------------------------

		if (changes.state.added.length || changes.state.removed.length) {
			// Override the original state with the new one
			this.__originalState = (newModule as any).state;

			for (let stateKey of changes.state.added) {
				// Add the new state key to the store first
				this.#defineStateProperty(stateKey);
				Logger.label('Store HMR').success(`Added state property "${stateKey}" to store: "${curClassName}"`);
			}

			for (let stateKey of changes.state.removed) {
				// Remove the state key from the store
				this.#removeStateProperty(stateKey);
				Logger.label('Store HMR').success(`Removed state property "${stateKey}" from store: "${curClassName}"`);
			}
		}


		return true;
	}

}

export function Store<TStore, TState>() {
	const base = BaseStore<TStore, TState>;
	return base as unknown as BaseStoreClass<TStore, TState>;
}
