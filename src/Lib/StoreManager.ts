import {App} from "@vue/runtime-core";
import {DevTools} from "./../DevTools";
import {Logger} from "./Logger";
import type {StoreLoaderModule, StoreMeta, StoreType} from "./Types";


export class StoreManagerInstance {
	private app: App;

	private didInstantiateStores: boolean = false;

	/**
	 * Holds store Class Name -> Store Instance
	 * @type {{[p: string]: StoreType}}
	 */
	public stores: { [key: string]: StoreType }               = {};
	/**
	 * Holds store Class Name -> Store Module
	 * @type {{[p: string]: any}}
	 */
	public storeModules: { [key: string]: any }               = {};
	/**
	 * Holds store Class Name -> Store Meta
	 * @type {{[p: string]: StoreMeta}}
	 */
	public storeMeta: { [key: string]: StoreMeta }            = {};
	/**
	 * Holds a reference of Binding -> Class Name for quick lookup
	 * @type {{[p: string]: string}}
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
		//		Logger.debug('StoreManager boot called...', arguments);
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

		//		Logger.debug("Store loader passed via transformer: ", storeLoader);

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

	public handleHotReload(modules: any[]): void {

	}

	private loadStoresFromLoader(storeLoader: StoreLoaderModule): void {
		for (let store of storeLoader.stores) {
			this.loadStore(store);
		}
	}

	private loadStore(meta: StoreMeta) {
		const storeModuleGlob = meta.module();
		if (!storeModuleGlob) {
			throw new Error('Store lazy import; module is not defined for file: ' + meta.importPath);
		}
		const storeModule = Object.values(storeModuleGlob)[0];
		if (!storeModule) {
			throw new Error('Store module is not defined for file: ' + meta.importPath);
		}

		const store      = storeModule[meta.exportName] as StoreType;
		store.vueBinding = meta.vueBinding;

		this.storeModules[meta.className]             = storeModule;
		this.storeMeta[meta.className]                = meta;
		this.stores[meta.className]                   = store;
		this.storeBindingToClassName[meta.vueBinding] = meta.className;

		this.app.config.globalProperties[meta.vueBinding] = store;

		store.__addExtensions(this.extensions.map(extensionFunc => extensionFunc()));

		Logger.label('StoreManager').success('Registered store: ', store);
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

}

const storeManager = new StoreManagerInstance();

export default storeManager;

