import {App} from "@vue/runtime-core";
import {LifeCycleEvent} from "../Common/LifeCycle";
import {DevTools} from "./../DevTools";
import {Logger} from "./Logger";
import type {StoreMetaData} from "./Meta/StoreMetaData";
import type {StoreLoaderModule, StoreType} from "./Types";


export class StoreManagerInstance {
	private app: App;

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

	private extensions: any[] = [];

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
				this.bootFromLoader(app, storeLoader as any);
			}
		};
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

	private callLifeCycleHandlers(handlers: (() => any)[], event: LifeCycleEvent) {
		for (let handler of handlers) {
			try {
				handler();
			} catch (e) {
				Logger.label('StoreManager').error('Error during life cycle event: ' + event, e);
			}
		}
	}

	private loadStoresFromLoader(storeLoader: StoreLoaderModule): void {
		const beforeAllHandlers = [];
		const afterAllHandlers  = [];

		// Run all of the stores `pre init` stages and get their `beforeAll` and `afterAll` handlers
		for (let store of storeLoader.stores) {
			const instance = this.prepareStore(store);
			instance.__preBooting();

			beforeAllHandlers.push(instance.__getHook(LifeCycleEvent.BeforeAll));
			afterAllHandlers.push(instance.__getHook(LifeCycleEvent.AfterAll));
		}

		this.callLifeCycleHandlers(beforeAllHandlers, LifeCycleEvent.BeforeAll);

		for (let [className, store] of Object.entries(this.stores)) {
			this.loadStore(store);
		}

		this.callLifeCycleHandlers(afterAllHandlers, LifeCycleEvent.AfterAll);
	}

	/**
	 * Run the stores `pre init` stage
	 * This is where it's imported, the binding/meta is setup and
	 * the store is registered on our store manager.
	 */
	private prepareStore(meta: StoreMetaData) {
		const store       = meta.getStoreExport();
		store.__storeMeta = meta;
		store.vueBinding  = meta.store.vueBinding;

		this.storeModules[meta.store.className]             = meta.getModule();
		this.storeMeta[meta.store.className]                = meta;
		this.stores[meta.store.className]                   = store;
		this.storeBindingToClassName[meta.store.vueBinding] = meta.store.className;

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
		store.__callHook(LifeCycleEvent.OnInit);
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

