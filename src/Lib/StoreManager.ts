import {App} from "@vue/runtime-core";
import {formatVueBindingName} from "../Common/Formatting";
import {DevTools} from "./../DevTools";
import {BaseStore, InternalStoreKeys} from "./Store";

type StoreType = { [K in keyof typeof BaseStore]: typeof BaseStore[K] } &
                 { vueBinding: string } &
                 BaseStore<any, any>;

type StoreMeta = {
	absFilePath: string;
	relStoreFilePath: string;
	name: string;
	className: string;
	exportName: string;
	vueBinding: string;
	actions: {
		name: string;
		params: { name: string, defaultValue: string, type: string }[];
	}[];
}

export class StoreManagerInstance {
	private didInstantiateStores: boolean = false;

	public stores: { [key: string]: StoreType }     = {};
	private storeModules: { [key: string]: any }    = {};
	private storeMeta: { [key: string]: StoreMeta } = {};

	private extensions: any[] = [];

	public extend(extensionFunc: () => { [key: string]: any }) {
		this.extensions.push(extensionFunc);

		if (this.didInstantiateStores) {
			Object.entries(this.stores).forEach(([key, store]) => {
				store.addExtension(extensionFunc());
			});
		}
	}

	public registerStore(store: StoreType) {
		store.vueBinding = formatVueBindingName(
			(store?.constructor as any)?.vueBinding,
			store.constructor.name
		);

		this.stores[store.vueBinding] = store;
	}

	install(app: App, options: { [key: string]: any }) {
		for (let [key, store] of Object.entries(this.stores)) {
			store.addExtensions(this.extensions.map(extensionFunc => extensionFunc()));

			app.config.globalProperties[key] = store;

			console.log('Registered store: ' + key);
		}

		for (let [key, value] of Object.entries(options)) {
			if (key.endsWith('StoreMeta.json')) {
				this.storeMeta = value.default.reduce((acc, meta: StoreMeta) => {
					acc[meta.className] = meta;
					return acc;
				}, {});
			} else {
				this.storeModules[key] = value;
			}
		}

		DevTools.setup(app);

		this.didInstantiateStores = true;
	}


	public manager(key: string) {
		const store = this.stores[key];
		return {
			store    : {
				getAllState() {
					return (store as any).__state;
				},
				getAllGetters() {
					return Object.entries(store.__descriptors.getters);
				},
				getAllActions : () => {
					//					if (this.storeMeta[store.constructor.name]) {
					return this.storeMeta[store.constructor.name].actions.map(action => {
						return [action.name, {
							...action,
							value : store[action.name],
						}];
					});
					//					}
					//					return Object.entries(store.__descriptors)
					//						.filter(([key, descriptor]) => !descriptor.get
					//							&& !descriptor.set
					//							&& typeof descriptor.value === 'function'
					//							&& !InternalStoreKeys.includes(key)
					//						);
				},
				getName() {
					return store.constructor.name;// _.startCase(_.toLower(store.constructor.name));
				},
				getVueBinding() {
					return store.vueBinding;
				},
				setState(path: any, value: any): void {
					console.log('Set state: ' + path + ' = ' + value);
					(store as any).__setState(path, value);
				}
			},
			instance : store,
		};
	}
}

export default new StoreManagerInstance();
