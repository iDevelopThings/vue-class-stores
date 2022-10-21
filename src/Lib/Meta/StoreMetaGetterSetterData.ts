type StoreSetterOrGetter = {
	// Name of the getter
	n: string,
	// Is the getter a computed property?(marked with @Computed decorator)
	c: boolean
}

export class StoreMetaGetterSetterData {
	private _type: 'getter' | 'setter';
	private _data: StoreSetterOrGetter;

	constructor(type: 'getter' | 'setter', data: StoreSetterOrGetter) {
		this._type = type;
		this._data = data;
	}

	get name() {
		return this._data.n;
	}

	get isComputed() {
		return this._data.c;
	}

//	public static factory(): StoreBuilderGetterSetter {
//		return new StoreBuilderGetterSetter();
//	}
}

