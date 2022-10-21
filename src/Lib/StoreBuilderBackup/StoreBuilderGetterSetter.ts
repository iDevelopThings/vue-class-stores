/*
export class StoreBuilderGetterSetter<TStore = {}, F extends () => any = F.Function<[], any>> implements StoreSetterOrGetter {

	n: string;
	c: boolean;

	onHandlerAdded: (...args: any) => any;

	constructor() {

	}

	name(name: string): this {
		this.n = name;
		return this;
	}

	computed(): StoreBuilderGetterSetter<TStore, F> {
		this.c = true;
		return this;
	}

	handler<H extends (this: ThisType<TStore>) => any>(
		handler: H
	): StoreBuilderGetterSetter<TStore, H> {
		if (this.onHandlerAdded) {
			this.onHandlerAdded(handler);
		}

		return this;
	}

}*/

export {};
