import {WritableComputedRef} from "@vue/reactivity";
import type {BaseStore} from "./Store";


interface BaseStorePublic {
	vueBinding: string;
	__storeMeta: StoreMeta;
	__getters: { [key: string]: StoreGetterInfo };
	__actions: { [key: string]: (...args) => any };
	__extensions: StoreExtensionDefinitions;
}

export type StoreType = {
	                        [K in keyof typeof BaseStore['prototype']]: K extends keyof BaseStorePublic ? never : typeof BaseStore['prototype'][K]
                        } & BaseStorePublic;


export type StoreMetaAction = { name: string; params: StoreMetaAction[]; }
export type StoreMetaActionParam = { name: string, defaultValue: string, type: string }

export type StoreMetaGetter = {
	// Name of the getter
	n: string,
	// Is the getter a computed property?(marked with @Computed decorator)
	c: boolean
};

export type StoreMeta = {
	className: string;
	importPath: string;
	exportName: string;
	vueBinding: string;
	stateKeys: string[];
	getters: StoreMetaGetter[];
	actions: StoreMetaAction[];
	// Would be something like:
	// {'SomeStore.ts' : {StoreName : StoreClass, storeExport : Store}}
	module: () => { [key: string]: { [key: string]: any } };
}

export type StoreLoaderModule = {
	stores: StoreMeta[];
}

export enum MutationType {
	// This would be using store.state.val = 'x', or store.$val = 'x'
	Direct        = 'direct',
	// This would be using store.$patch({val: 'x'})
	PatchObject   = 'patch object',
	// This would be using store.$patch(state => {state.val = 'x'})
	PatchFunction = 'patch function',
}

export type StoreGetterComputedInfo = { type: 'computed', value: WritableComputedRef<any> }
export type StoreGetterRegularInfo = { type: 'function', value: () => any }
export type StoreGetterInfo = StoreGetterComputedInfo | StoreGetterRegularInfo;

export type StoreExtensionDefinitions = {
	getters: { [key: string]: () => any },
	actions: { [key: string]: () => any },
	properties: { [key: string]: any }
};
