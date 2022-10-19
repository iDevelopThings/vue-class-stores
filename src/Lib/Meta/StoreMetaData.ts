import {LifeCycleEvent} from "../../Common/LifeCycle";
import type {HotReloadChanges} from "../Types";
import type {StoreMetaInfo, StoreType} from "../Types";
import type {StoreMeta} from "../Types";
import {MetaActionList, MetaList} from "./MetaList";
import type {StoreMetaGetterSetterData} from "./StoreMetaGetterSetterData";

export class StoreMetaData {
	
	public store: StoreMetaInfo;
	
	public stateKeys: string[];
	public setters: MetaList<StoreMetaGetterSetterData>;
	public getters: MetaList<StoreMetaGetterSetterData>;
	public lifeCycleHandlers: MetaList<LifeCycleEvent | string>;
	public actions: MetaActionList;
	
	#module: ReturnType<StoreMetaInfo['module']>;
	
	constructor(data: StoreMeta) {
		this.store             = data.store;
		this.stateKeys         = data.stateKeys;
		this.setters           = new MetaList(data.setters);
		this.getters           = new MetaList(data.getters);
		this.lifeCycleHandlers = new MetaList(data.lifeCycleHandlers);
		this.actions           = new MetaActionList(data.actions);
	}
	
	getModule(ignoreCache: boolean = false) {
		if (this.#module && !ignoreCache) {
			return this.#module;
		}
		
		const storeModuleGlob = this.store.module();
		if (!storeModuleGlob) {
			throw new Error('Store lazy import; module is not defined. Meta: ' + this.store);
		}
		
		const storeModule = Object.values(storeModuleGlob)[0];
		if (!storeModule) {
			throw new Error('Store module is not defined. Meta: ' + this.store);
		}
		
		return this.#module = storeModule;
	}
	
	getStoreExport(ignoreCache: boolean = false): StoreType {
		const storeModule = this.getModule(ignoreCache);
		if (!storeModule) {
			throw new Error('Store module is not defined. Meta: ' + this.store);
		}
		
		return storeModule[this.store.exportName];
	}
	
	public compareChanges(__storeMeta: StoreMetaData): HotReloadChanges {
		// First, we'll compare our new store meta with the old version
		
		const currentMeta = __storeMeta;
		const newMeta     = this;
		
		
		// We'll check for getters being added or removed
		// We'll check for setters being added or removed
		// We'll check for actions being added or removed
		// We'll check for state properties being added or removed
		return {
			actions : {
				added   : newMeta.actions.filter((v) => !currentMeta.actions.has(v.name)),
				removed : currentMeta.actions.filter((v) => !newMeta.actions.has(v.name)),
			},
			getters : {
				added   : newMeta.getters.filter((v) => !currentMeta.getters.has(v.name)),
				removed : currentMeta.getters.filter((v) => !newMeta.getters.has(v.name)),
			},
			setters : {
				added   : newMeta.setters.filter((v) => !currentMeta.setters.has(v.name)),
				removed : currentMeta.setters.filter((v) => !newMeta.setters.has(v.name)),
			},
			state   : {
				added   : newMeta.stateKeys.filter((v) => !currentMeta.stateKeys.includes(v)),
				removed : currentMeta.stateKeys.filter((v) => !newMeta.stateKeys.includes(v)),
			},
			hasChanges(): boolean {
				if (this.actions.added.length > 0 || this.actions.removed.length > 0) {
					return true;
				}
				
				if (this.getters.added.length > 0 || this.getters.removed.length > 0) {
					return true;
				}
				if (this.setters.added.length > 0 || this.setters.removed.length > 0) {
					return true;
				}
				
				return this.state.added.length > 0 || this.state.removed.length > 0;
			}
		};
	}
}
