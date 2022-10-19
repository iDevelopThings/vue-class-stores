import {LifeCycleEvent} from "../../Common/LifeCycle";

export type StoreMetaAction = {
	// Name of the action
	n: string;
	// Parameters of the action
	p: StoreMetaActionParam[];
	// Decorators defined on the action
	d: string[]
	// The life-cycle event for this action, if there is one
	h: LifeCycleEvent | undefined
};

export type StoreMetaActionParam = {
	// Name of the param
	n: string,
	// Type of the param
	t: string,
	// Default value if any
	dv: string,
};

export class StoreMetaActionData {
	#data: StoreMetaAction;
	
	constructor(data: StoreMetaAction) {
		this.#data = data;
	}
	
	get name() {
		return this.#data.n;
	}
	
	get lifeCycleEvent() {
		return this.#data.h;
	}
	
	get decorators() {
		return this.#data.d;
	}
	
	get params() {
		return this.#data.p;
	}
	
	getParam(name: string): StoreMetaActionParam {
		return this.#data.p[name];
	}
	
	getParamNames(): string[] {
		return Object.keys(this.#data.p);
	}
	
	getParamValues(): StoreMetaActionParam[] {
		return Object.values(this.#data.p);
	}
	
}
