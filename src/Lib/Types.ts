import type {BaseStore} from "./Store";

export type StoreType = { [K in keyof typeof BaseStore['prototype']]: typeof BaseStore['prototype'][K] } &
                        { vueBinding: string };


export type StoreMeta = {
	className: string;
	importPath: string;
	exportName: string;
	vueBinding: string;
	actions: {
		name: string;
		params: { name: string, defaultValue: string, type: string }[];
	}[];
	// Would be something like:
	// {'SomeStore.ts' : {StoreName : StoreClass, storeExport : Store}}
	module: () => { [key: string]: { [key: string]: any } };
}

export type StoreLoaderModule = {
	stores: StoreMeta[];
}