import type {Ref} from "vue";
import StoreManager from "./StoreManager";
import type {StoreMeta, StoreType} from "./Types";

export class StoreApi {

	private readonly store: StoreType;
	private readonly meta: StoreMeta;

	constructor(store: StoreType, storeMeta: StoreMeta) {
		this.store = store;
		this.meta  = storeMeta;
	}

	public static forBinding(storeBinding: string): StoreApi {
		const className = StoreManager.storeBindingToClassName[storeBinding];
		if (!className) {
			throw new Error(`No store found for binding: ${storeBinding}`);
		}

		return StoreApi.forClass(className);
	}

	public static forBindingDevTools(storeBinding: string): { store: StoreApi, instance: StoreType } {
		const className = StoreManager.storeBindingToClassName[storeBinding];
		if (!className) {
			throw new Error(`No store found for binding: ${storeBinding}`);
		}

		const manager = StoreApi.forClass(className);

		return {store : manager, instance : manager.getInstance()};
	}

	public static forClass(storeClassName: string): StoreApi {
		const storeMeta = StoreManager.storeMeta[storeClassName];
		if (!storeMeta) {
			throw new Error(`No store found for binding: ${storeClassName}`);
		}

		const store = StoreManager.stores[storeClassName];
		if (!store) {
			throw new Error(`No store found for binding: ${storeClassName}`);
		}

		return new StoreApi(store, storeMeta);
	}

	getInstance() {
		return this.store;
	}

	getMeta() {
		return this.meta;
	}

	getAllState(): { [key: string]: Ref } {
		return (this.store as any).__state;
	}

	getAllGetters() {
		return Object.entries(this.store.__descriptors.getters);
	}

	getAllActions() {
		return this.meta.actions.map(action => {
			return [action.name, {
				...action,
				value : this.store[action.name],
			}];
		});
	}

	getName() {
		return this.store.constructor.name;
	}

	getVueBinding() {
		return this.store.vueBinding;
	}

	setState(path: any, value: any): void {
		console.log('Set state: ' + path + ' = ' + value);
		(this.store as any).__setState(path, value);
	}
}