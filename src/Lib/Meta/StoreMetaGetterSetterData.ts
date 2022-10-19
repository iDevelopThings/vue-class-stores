
type StoreSetterOrGetter = {
	// Name of the getter
	n: string,
	// Is the getter a computed property?(marked with @Computed decorator)
	c: boolean
}

export class StoreMetaGetterSetterData {
	#type: 'getter' | 'setter';
	#data: StoreSetterOrGetter;
	
	constructor(type: 'getter' | 'setter', data: StoreSetterOrGetter) {
		this.#type = type;
		this.#data = data;
	}
	
	get name() {
		return this.#data.n;
	}
	
	get isComputed() {
		return this.#data.c;
	}
	
}
