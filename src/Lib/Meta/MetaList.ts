import {LifeCycleEvent} from "../../Common/LifeCycle";
import type {StoreMetaActionDecorator} from "./StoreMetaActionData";
import type {StoreMetaActionData} from "./StoreMetaActionData";

export class MetaList<IType, T = { [key: string]: IType }> {

	private _items: T = {} as T;
	private _keys: string[];
	private _values: IType[];
	private _entries: [string, IType][];

	constructor(items: T) {
		this._items = items;
	}

	has(key: string): boolean {
		return this._items.hasOwnProperty(key);
	}

	get(key: string): IType {
		return this._items[key];
	}

	set(key: string, value: IType): IType {
		this._items[key] = value;

		// Reset the caches...
		this._keys    = undefined;
		this._values  = undefined;
		this._entries = undefined;

		return this._items[key];
	}

	get items(): T {
		return this._items;
	}

	keys(): string[] {
		if (!this._keys) {
			this._keys = Object.keys(this._items);
		}
		return this._keys;
	}

	values(): IType[] {
		if (!this._values) {
			this._values = Object.values(this._items);
		}
		return this._values;
	}

	entries(): [string, IType][] {
		if (!this._entries) {
			this._entries = Object.entries(this._items);
		}
		return this._entries;
	}

	map<TCallback extends (value: IType, key: string) => any>(callback: TCallback): ReturnType<TCallback>[] {
		const mapped = [];
		for (const [key, value] of this.entries()) {
			mapped.push(callback(value, key));
		}
		return mapped;
	}

	filter<TCallback extends (value: IType, key: string) => boolean>(callback: TCallback): IType[] {
		const filtered: IType[] = [];
		for (const [key, value] of this.entries()) {
			if (callback(value, key)) {
				filtered.push(value);
			}
		}
		return filtered;
	}

	each<TCallback extends (value: IType, key: string) => any>(callback: TCallback): void {
		for (const [key, value] of this.entries()) {
			callback(value, key);
		}
	}

	* [Symbol.iterator](): IterableIterator<[string, IType]> {
		for (const [key, value] of this.entries()) {
			yield [key, value];
		}
	}

	isEmpty() : boolean {
		return this.keys().length === 0;
	}
}


export class MetaActionList extends MetaList<StoreMetaActionData> {
	#lifeCycleHandlers: { [K in keyof LifeCycleEvent]: StoreMetaActionData };

	lifeCycleHandlers() {
		if (this.#lifeCycleHandlers) {
			return this.#lifeCycleHandlers;
		}

		this.#lifeCycleHandlers = {} as any;
		for (const [key, value] of this.entries()) {
			if (value.lifeCycleEvent) {
				this.#lifeCycleHandlers[value.lifeCycleEvent] = value;
			}
		}


	}
}


export class MetaDecoratorList extends MetaList<StoreMetaActionDecorator> {

	hasDecorator(name:string) {
		return this.has(name);
	}

}
