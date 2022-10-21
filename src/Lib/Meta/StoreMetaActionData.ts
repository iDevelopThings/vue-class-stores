import {LifeCycleEvent} from "../../Common/LifeCycle";
import {MetaDecoratorList} from "./MetaList";

export type StoreMetaAction = {
	// Name of the action
	n?: string;
	// Parameters of the action
	p?: StoreMetaActionParam[];
	// Decorators defined on the action
	d?: { [key: string]: StoreMetaActionDecorator };
	// The life-cycle event for this action, if there is one
	h?: LifeCycleEvent | undefined
};

export type StoreMetaActionDecoratorParam = {
	// Name of the parameter
	n: string,
	// Value of the parameter
	v: string,
}

export type StoreMetaActionDecorator = {
	// Name of the decorator
	n: string;
	// Parameters of the decorator
	p: StoreMetaActionDecoratorParam[];
}
export type StoreMetaActionParam = {
	// Name of the param
	n: string,
	// Type of the param
	t: string,
	// Default value if any
	dv: string,
};

export class StoreMetaActionData {
	private _data: StoreMetaAction;
	private _decorators: MetaDecoratorList;

	constructor(data: StoreMetaAction) {
		this._data       = data;
		this._decorators = new MetaDecoratorList(this._data.d);
	}

	get name() {
		return this._data.n;
	}

	get lifeCycleEvent() {
		return this._data.h;
	}

	get decorators(): MetaDecoratorList {
		return this._decorators;
	}

	get params() {
		return this._data.p;
	}

	getParam(name: string): StoreMetaActionParam {
		return this._data.p[name];
	}

	getParamNames(): string[] {
		return Object.keys(this._data.p);
	}

	getParamValues(): StoreMetaActionParam[] {
		return Object.values(this._data.p);
	}

	//	public static factory<T, B extends (...args: any) => any = F.Function<[], any>>(): StoreBuilderAction<T, B> {
	//		return new StoreBuilderAction<T, B>();
	//	}
}

