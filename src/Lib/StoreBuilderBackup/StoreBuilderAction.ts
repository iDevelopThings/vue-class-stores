/*
 import {F, L} from "ts-toolbelt";
 import {LifeCycleEvent} from "../../Common/LifeCycle";
 import {StoreMetaAction, StoreMetaActionParam} from "../Meta/StoreMetaActionData";

 export class StoreBuilderAction<TStore = {}, T extends (...args: any) => any = F.Function<[], any>> implements StoreMetaAction {

 n: string;
 p: StoreMetaActionParam[] = [];
 d: StoreMetaAction['d']   = {};
 h: LifeCycleEvent | undefined;

 onHandlerAdded: (...args) => any;

 constructor() {

 }

 name(name: string): this {
 this.n = name;
 return this;
 }

 param<N extends string, TT extends any>(
 name: N, type: TT, defaultValue?: string
 ): StoreBuilderAction<TStore, F.Function<L.Concat<F.Parameters<T>, [typeof type]>, F.Return<T>>> {
 if (!this.p) {
 this.p = [];
 }
 this.p.push({
 n  : name,
 t  : type as any,
 dv : defaultValue
 });
 return this;
 }

 /!*decorator(name: string): this {
 if (!this.d) {
 this.d = [];
 }
 this.d.push({name, value : undefined});
 return this;
 }*!/

 hook(lifeCycleEvent: LifeCycleEvent): this {
 this.h = lifeCycleEvent;
 return this;
 }

 handler<H extends (this: TStore, ...args) => any>(
 handler: H
 ): StoreBuilderAction<TStore, H> {
 this.onHandlerAdded(handler);
 return this;
 }


 }*/

export {};
