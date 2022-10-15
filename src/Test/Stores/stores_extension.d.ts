declare module '@idevelopthings/vue-class-stores/vue' {
	interface StoreCustomProperties {
		someGlobalFunc(): string;

		someGlobalVar: string;
	}
}
declare module './../../Lib/StoreTypes' {
	interface StoreCustomProperties {
		someGlobalFunc(): string;

		someGlobalVar: string;
	}
}
export {};
