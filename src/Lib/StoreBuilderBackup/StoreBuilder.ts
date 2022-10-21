/*
import {reflect} from "@idevelopthings/reflect-extensions";
import {Compute} from "ts-toolbelt/out/Any/Compute";
import {Merge} from "ts-toolbelt/out/Object/Merge";
import StoreManager from "../StoreManager";
import {BaseStoreInstance} from "../StoreTypes";
import {StoreMetaInfo, StoreType} from "../Types";
import {StoreBuilderAction, StoreMetaActionData} from "../Meta/StoreMetaActionData";
import {StoreMetaData} from "../Meta/StoreMetaData";
import {StoreBuilderGetterSetter, StoreMetaGetterSetterData} from "../Meta/StoreMetaGetterSetterData";

export class StoreBuilder<TStore extends { [key: string]: any } = { state: {} }> {

	public meta: StoreMetaData;
	public instance: { [key: string]: any } & StoreType;

	constructor(info: StoreMetaInfo) {
		this.meta = new StoreMetaData({
			store             : info,
			actions           : {},
			lifeCycleHandlers : {},
			stateKeys         : [],
			getters           : {},
			setters           : {},
		});

		this.instance = this.meta.getStoreExport();
	}

	get clazz() {
		return reflect(this.instance).class();
	}

	initialState<T extends { [key: string]: any }>(
		stateObj: T
	): StoreBuilder<Compute<{ state: T } & TStore>> {
		this.meta.stateKeys = Object.keys(stateObj);

		this.clazz.deleteKey('state');
		this.clazz.addProperty('state', stateObj);

		return this as any;
	}

	action<TName extends string, TAction extends (this: any, ...args: any) => any>(
		name: TName,
		handler?: TAction,
	): StoreBuilder<Compute<{ [K in typeof name]: typeof handler } & TStore>> {
		const actionBuilder = StoreMetaActionData.factory().name(name);
		const action        = new StoreMetaActionData(actionBuilder);

		this.meta.actions.set(name, action);

		actionBuilder.onHandlerAdded = (handler) => {
			reflect(this.instance).class().addMethod(actionBuilder.n, handler.bind(this.instance));
			return actionBuilder;
		};

		actionBuilder.handler(handler);

		return this as any;
	}

	actionBuilder<TName extends string, TBuilder extends (builder: StoreBuilderAction<TStore>) => any>(
		name: TName,
		builder: TBuilder,
	): StoreBuilder<Compute<Merge<TStore, { [K in TName]: (ReturnType<TBuilder> extends StoreBuilderAction<TStore, infer U> ? U : never) }>>> {
		const actionBuilder = StoreMetaActionData.factory<TStore>().name(name);
		const action        = new StoreMetaActionData(actionBuilder);

		this.meta.actions.set(name, action);

		actionBuilder.onHandlerAdded = (handler) => {
			reflect(this.instance).class().addMethod(actionBuilder.n, handler.bind(this.instance));
			return actionBuilder;
		};

		builder(actionBuilder);

		return this as any;
	}

	getter<TName extends string, TGetter extends (this: any, ...args: any) => any>(
		name: TName,
		handler?: TGetter,
	): StoreBuilder<Compute<{ [K in typeof name]-?: ReturnType<typeof handler> }> & TStore> {
		return this.getterBuilder<TName>(name, (builder) => {
			return builder.handler(handler);
		}) as any;
	}

	public getterBuilder<TName extends string>(
		name: TName,
		b: (builder: StoreBuilderGetterSetter<TStore>) => StoreBuilderGetterSetter<TStore>,
	): StoreBuilder<Compute<Merge<TStore, { [K in TName]: (ReturnType<typeof b> extends StoreBuilderGetterSetter<TStore, infer U> ? ReturnType<U> : never) }>>> {
		const builder = StoreMetaGetterSetterData.factory().name(name);
		const getter  = new StoreMetaGetterSetterData('getter', builder);

		this.meta.getters.set(name, getter);

		builder.onHandlerAdded = (handler: (...args: any) => any) => {
			reflect(this.instance).class().addGetter(builder.n, handler.bind(this.instance));
			return builder;
		};

		b(builder);

		return this as any;
	}

	public buildAndLoad<TBase = BaseStoreInstance<TStore, TStore['state']>>(): {
		[K in keyof TStore]: TStore[K] extends Function ? TStore[K] : {
			[K2 in keyof TBase]: TBase[K2]
		}
	} {

		StoreManager.loadStoresFromLoader({
			stores : [this.meta],
		});

		return StoreManager.stores[this.meta.store.className] as any;
	}
}
*/

export {};
