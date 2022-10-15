import jetpack from "fs-jetpack";

export type PluginConfig = {
	projectRoot?: string;
	storesPath: string;

	storesFileName?: string;
}

export type AllConfig = {
	projectRootDirectory: typeof jetpack,
	storesDirectory: typeof jetpack,
}

export type FullConfig = AllConfig & PluginConfig;

export const defaultPluginConfig: Partial<FullConfig> = {
	storesFileName : 'stores.d.ts',
};
