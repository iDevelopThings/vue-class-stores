import type {WritableComputedRef} from "@vue/reactivity";
import {EffectScope} from "vue";
import {LifeCycleEvent} from "../Common/LifeCycle";
import type {StoreMetaActionData} from "./Meta/StoreMetaActionData";
import type {StoreMetaData} from "./Meta/StoreMetaData";
import type {StoreMetaGetterSetterData} from "./Meta/StoreMetaGetterSetterData";
import type {BaseStore} from "./Store";


interface BaseStorePublic {
	vueBinding: string;
	__scope: EffectScope;
	__storeMeta: StoreMetaData;
	__getters: StoreGettersList;
	__setters: StoreSettersList;
	__actions: StoreActionsList;
	__lifecycleHooks: LifeCycleHooks;
	__extensions: StoreExtensionDefinitions;
}

export type StoreType = { [K in keyof typeof BaseStore['prototype']]: K extends keyof BaseStorePublic ? never : typeof BaseStore['prototype'][K] } & BaseStorePublic;

export type TestingStoreType = { ___getMetaData(): StoreMetaData } & StoreType;

export type LifeCycleHooks = {
	[LifeCycleEvent.BeforeAll]?: () => void | PromiseLike<void>;
	[LifeCycleEvent.OnInit]?: () => void | PromiseLike<void>;
	[LifeCycleEvent.OnDispose]?: () => void | PromiseLike<void>;
	[LifeCycleEvent.AfterAll]?: () => void | PromiseLike<void>;
}

export type StoreMetaModuleData = { [key: string]: { [key: string]: any } }

export type BasicStoreMetaInfo = {
	className?: string;
	exportName?: string;
	vueBinding?: string;
}
export type StoreMetaInfo = BasicStoreMetaInfo & {
	// Would be something like:
	// {'SomeStore.ts' : {StoreName : StoreClass, storeExport : Store}}
	module?: () => StoreMetaModuleData;
}
export type StoreMeta = {
	store: StoreMetaInfo;
	stateKeys: string[];
	getters: { [key: string]: StoreMetaGetterSetterData };
	setters: { [key: string]: StoreMetaGetterSetterData };
	actions: { [key: string]: StoreMetaActionData };
	lifeCycleHandlers: { [key: string]: LifeCycleEvent | string };
}

export type StoreLoaderModule = {
	stores: StoreMetaData[];
}

export enum MutationType {
	// This would be using store.state.val = 'x', or store.$val = 'x'
	Direct        = 'direct',
	// This would be using store.$patch({val: 'x'})
	PatchObject   = 'patch object',
	// This would be using store.$patch(state => {state.val = 'x'})
	PatchFunction = 'patch function',
}

export type StoreExtensionDefinitions = {
	getters: { [key: string]: () => any },
	actions: { [key: string]: () => any },
	properties: { [key: string]: any }
};

export type StoreGetterComputedInfo = {
	type: 'computed',
	value: WritableComputedRef<any>,
	getter: () => any,
	setter?: (value: any) => void,
}
export type StoreGetterRegularInfo = { type: 'function', value: () => any }
export type StoreGetterInfo = StoreGetterComputedInfo | StoreGetterRegularInfo;
export type StoreSetterInfo = { type: 'function', value: (val: any) => void };

export type StoreGettersList = { [key: string]: StoreGetterInfo };
export type StoreSettersList = { [key: string]: StoreSetterInfo };
export type StoreActionsList = { [key: string]: (...args) => any };


export type HotReloadChange<T> = { added: T, removed: T };
export type HotReloadChanges = {
	actions: HotReloadChange<StoreMetaActionData[]>
	getters: HotReloadChange<StoreMetaGetterSetterData[]>
	setters: HotReloadChange<StoreMetaGetterSetterData[]>
	state: HotReloadChange<StoreMeta['stateKeys']>
	hasChanges(): boolean;
};
