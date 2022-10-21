export enum LifeCycleEvent {
	BeforeAll = 'BeforeAll',
	OnInit    = 'OnInit',
	OnDispose = 'OnDispose',
	AfterAll  = 'AfterAll',
}

export function isLifeCycleEvent(name: string): boolean {
	return Object.values(LifeCycleEvent).includes(name as LifeCycleEvent);
}

export function lifeCycleEventName<T extends LifeCycleEvent>(name: T): `@${T}` {
	return `@${name}`;
}

export type LifeCycleEventsMap =
	| { [K in LifeCycleEvent as `@${K}`]: { store: any } };

export type StoreLifeCycleEventsMap =
	| { [K in LifeCycleEvent as `${string}.@${K}`]: { store: any } };

export interface LifeCycleEvents extends LifeCycleEventsMap, StoreLifeCycleEventsMap {
}

