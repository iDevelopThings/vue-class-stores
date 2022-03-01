import {WatchOptions} from "vue";

export type StoreWatcher = {
	method: string;
	watchOptions: WatchOptions;
	property: string;
}

type StoreObject = {
	store: any,
	persisted: boolean,
}

type StoresList = { [key: string]: StoreObject }

export class StoreManager {

	/**
	 * Get all stores from reflect meta
	 *
	 * @returns {StoresList}
	 */
	public static getStores(): StoresList {
		return Reflect.getMetadata('stores', Reflect) ?? {};
	}

	/**
	 * Get a specific store from the reflect meta
	 *
	 * @param {string} storeName
	 * @returns {StoreObject | null}
	 */
	public static getStore(storeName: string): StoreObject | null {
		return this.getStores()[storeName] ?? null;
	}

	/**
	 * Update our stores list on reflect metadata
	 *
	 * @param {Function} store
	 * @param {boolean} persisted
	 */
	public static setStore(store: Function, persisted: boolean) {
		const stores = this.getStores();

		stores[store.name] = {
			store     : store,
			persisted : persisted,
		};

		Reflect.defineMetadata('stores', stores, Reflect);
	}

	/**
	 * Get the reflect key for a specific stores watcher values
	 *
	 * @param {Object} target
	 * @returns {string}
	 */
	public static storeWatcherKey(target: Object) {
		return `store.watchers.${target.constructor.name}`;
	}

	/**
	 * Set a watcher for a store
	 *
	 * @param {Object} target
	 * @param {StoreWatcher} storeValues
	 */
	public static setStoreWatcher(target: Object, storeValues: StoreWatcher) {
		const storeWatchers = Reflect.getMetadata(this.storeWatcherKey(target), Reflect) ?? [];

		storeWatchers.push(storeValues);

		Reflect.defineMetadata(this.storeWatcherKey(target), storeWatchers, Reflect);
	}

	/**
	 * Get the watchers for a specific store
	 *
	 * @param {Object} target
	 * @returns {StoreWatcher[]}
	 */
	public static getStoreWatchers(target: Object): StoreWatcher[] {
		return Reflect.getMetadata(this.storeWatcherKey(target), Reflect) ?? [];
	}

}
