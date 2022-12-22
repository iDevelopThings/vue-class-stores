import {App} from "@vue/runtime-core";
import {flushPromises} from "@vue/test-utils";
import type {VueWrapper, MountingOptions} from "@vue/test-utils";
import {EffectScope, onScopeDispose} from "vue";
import type {ComponentCustomProperties, ComponentPublicInstance} from "vue";
import {Logger} from "./Logger";
import {DevTools} from "./../DevTools";
import {StoreManagerEventBus} from "./EventBus/StoreManagerEventBus";
import type {StoreMetaData} from "./Meta/StoreMetaData";
import type {TestingStoreType, StoreLoaderModule, StoreType} from "./Types";
import {abortIfNotTesting, isTesting, vuePluginErrorMessage} from "./Utils";
import StoreManagerComponent from "./StoreManagerComponent.vue";

type ComponentOpts = Omit<ComponentPublicInstance, '$emit' | keyof ComponentCustomProperties> & {
	$emit: (event: any, ...args: any[]) => void;
} & ComponentCustomProperties;

export class StoreManagerInstance {
	private app: App;

	public __scope: EffectScope;

	private didInstantiateStores: boolean = false;

	/**
	 * Holds store Class Name -> Store Instance
	 */
	public stores: { [key: string]: StoreType } = {};

	/**
	 * Holds store Class Name -> Store Module
	 */
	public storeModules: { [key: string]: any } = {};

	/**
	 * Holds store Class Name -> Store Meta
	 */
	public storeMeta: { [key: string]: StoreMetaData } = {};

	/**
	 * Holds a reference of Binding -> Class Name for quick lookup
	 */
	public storeBindingToClassName: { [key: string]: string } = {};

	/**
	 * Holds a reference of class name -> Store instance & Store constructor
	 *
	 * This is only used for testing
	 */
	public storeInjections: { [key: string]: { store: TestingStoreType, meta: StoreMetaData, storeConstructor: new(...args: any) => TestingStoreType } } = {};

	public bus: StoreManagerEventBus = new StoreManagerEventBus();

	private extensions: any[] = [];

	public options: { disableDevtoolsMutationWatcher?: boolean };

	constructor() {
		if (isTesting()) {
			this.app = {config : {globalProperties : {}}} as any;
		}

		this.runInScope(() => {});
	}

	public runInScope(fn: () => any) {
		if (!this.__scope) this.__scope = new EffectScope();

		this.__scope.run(() => {
			fn();

			onScopeDispose(() => this.__scope = undefined);
		});
	}

	public config(options: {disableDevtoolsMutationWatcher?: boolean}) {
		this.options = options;
	}

	/**
	 * The call to this method is transformed by the vite plugin
	 * It will automatically add the store loader `import.meta.glob('', {eager:true})` call as a parameter
	 *
	 * The end developer just needs to use `app.use(StoreManager.boot())`
	 *
	 * @returns {{install: (app: App) => void}}
	 */
	public boot() {
		if (!arguments?.length) {
			Logger.error('StoreManager boot called without arguments... this could be a problem with the vue-class-stores vite plugin, please report this on github! <3');
			return;
		}

		const storeLoaderGlob = arguments[0];
		if (!storeLoaderGlob) {
			throw new Error('Store loader is not defined');
		}

		const storeLoader = Object.values(storeLoaderGlob)[0];
		if (!storeLoader) {
			throw new Error('Store loader is not defined');
		}

		return {
			install : (app: App) => {
				this.app = app;

				this.runInScope(() => this.bootFromLoader(app, storeLoader as any))
			}
		};
	}

	public bootForTesting() {
		abortIfNotTesting();

		return {
			install : (app: App) => {
				this.app = app;

				this.runInScope(() => this.loadStoresFromInjections());
			}
		};
	}

	/**
	 * Created a @vue/test-utils component instance with the store manager attached
	 */
	public async testComponentInstance(component?: any, options?: MountingOptions<any>): Promise<VueWrapper> {
		options = options || {};

		options.global         = options.global || {};
		options.global.plugins = options.global.plugins || [];
		options.global.plugins.push(this.bootForTesting());

		const testUtils = await import("@vue/test-utils");
		const vm        = testUtils.mount((component ?? StoreManagerComponent) as any, options);
		await flushPromises();

		return vm;
	}

	private bootFromLoader(app: App, storeLoader: StoreLoaderModule) {
		if (!storeLoader) {
			throw new Error('Store loader is not defined');
		}
		this.app = app;

		this.loadStoresFromLoader(storeLoader);

		if (DevTools.isAvailable()) {
			DevTools.setup(app);
		}

		this.didInstantiateStores = true;
	}

	/**
	 * This should only be used in tests
	 *
	 * It should be called before mounting your component, for example:
	 *
	 * ```
	 *  const store = new TestStoreClass();
	 * 	StoreManager.injectStore(store, TestStoreClass);
	 *
	 * 	const component = mount(Component, {
	 * 		global : {plugins : [StoreManager.bootForTesting()]}
	 * 	});
	 * ```
	 */
	public injectStore(storeInstance: any, storeConstructor: new(...args: any) => any) {
		abortIfNotTesting();

		if (!storeInstance || !storeConstructor) {
			throw new Error([
				`To inject a store, you must first create an instance, then pass the instance and the class to this method.`,
				`Example:`,
				`const store = new MyStore();`,
				`StoreManager.injectStore(store, MyStore);`,
			].join('\n'));
		}

		if (!storeInstance?.___getMetaData) {
			throw new Error([
				`A method which is normally injected/created by the vue-class-stores vite plugin is missing.`,
				`There is a chance you are doing something wrong, please check the docs and examples to make sure you are doing it right. https://vue-class-stores.idt.dev/`,
				`But if you're sure that you are doing it right, ${vuePluginErrorMessage('missing ___getMetaData')}`,
			].join('\n'));
		}

		const meta = storeInstance.___getMetaData();

		this.storeInjections[meta.store.className] = {
			meta  : meta,
			store : storeInstance,
			storeConstructor,
		};

	}

	/**
	 * This should only be used in tests
	 */
	public loadStoresFromInjections(): void {

		// Run all of the stores `pre init` stages and get their `beforeAll` and `afterAll` handlers
		for (let [className, {store, meta}] of Object.entries(this.storeInjections)) {
			this.prepareStore(meta, store);
		}

		this.bus.$dispatchToAllStores('@BeforeAll');

		for (let [className, store] of Object.entries(this.stores)) {
			this.loadStore(store);
		}

		this.bus.$dispatchToAllStores('@AfterAll');
	}

	public loadStoresFromLoader(storeLoader: StoreLoaderModule): void {
		// Run all of the stores `pre init` stages and get their `beforeAll` and `afterAll` handlers
		for (let store of storeLoader.stores) {
			this.prepareStore(store);
		}

		this.bus.$dispatchToAllStores('@BeforeAll');

		for (let [className, store] of Object.entries(this.stores)) {
			this.loadStore(store);
		}

		this.bus.$dispatchToAllStores('@AfterAll');
	}

	/**
	 * Run the stores `pre init` stage
	 * This is where it's imported, the binding/meta is setup and
	 * the store is registered on our store manager.
	 */
	private prepareStore(meta: StoreMetaData, storeInstance?: StoreType) {
		// If storeInstance is provided, we're loading this store from an injection in a test
		const store = storeInstance ?? meta.getStoreExport();

		/**
		 * If we're loading an injected store, we need to do some monkey patching
		 * - {@see StoreMetaData.getModule()} needs to return an object with the store instance, to emulate a module
		 * - We need to manually set an export name for the store, so that it can be used in the module emulation
		 * */
		if (storeInstance) {
			meta.store.exportName = '__injectedStore_' + meta.store.className;
			meta.store.module     = () => {
				return {
					[meta.store.className]  : this.storeInjections[meta.store.className].storeConstructor,
					[meta.store.exportName] : storeInstance
				};
			};
		}


		store.__bindStore(meta);
		store.__preBooting();

		return store;
	}

	/**
	 * Run the stores main `init` stage.
	 *
	 * This is where all bindings will be setup and the `init` hook will be called.
	 */
	private loadStore(store: StoreType) {
		store.__bootStore();

		this.app.config.globalProperties[store.vueBinding] = store;

		store.__addExtensions(this.extensions.map(extensionFunc => extensionFunc()));
		store.$dispatch('@OnInit', {store} as any);
	}

	private addExtensions() {
		Object.entries(this.stores).forEach(([key, store]) => {
			store.__addExtensions(this.extensions.map(extensionFunc => extensionFunc()));
		});
	}

	public extend(extensionFunc: () => { [key: string]: any }) {
		this.extensions.push(extensionFunc);

		if (this.didInstantiateStores) {
			this.addExtensions();
		}
	}

	/**
	 * We have to compromise... we can only handle hot reloads for
	 * store meta or individual store modules.... however,
	 * It seems like when we use the meta's lazy import module
	 * function, it fetches the latest store version....
	 * Just means we have to process all stores on hot reload :|
	 */
	loaderReloaded(storesMeta: StoreMetaData[]) {
		for (let storeMeta of storesMeta) {
			this.storeMeta[storeMeta.store.className] = storeMeta;

			const curStoreInst = this.stores[storeMeta.store.className];
			const newStoreInst = storeMeta.getStoreExport();

			const changes = storeMeta.compareChanges(curStoreInst.__storeMeta);
			if (changes.hasChanges()) {
				curStoreInst.__storeMeta = storeMeta;

				Logger.label('Store HMR').info('Handling HMR for store: ' + storeMeta.store.className);

				curStoreInst.__processHotReloadChanges(changes, {
					instance : newStoreInst,
					meta     : storeMeta
				});
			}
		}
	}

}

const storeManager = new StoreManagerInstance();

export default storeManager;

