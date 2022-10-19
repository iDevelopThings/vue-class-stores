//export const LifeCycleEvents = ['BeforeAll', 'OnInit', 'OnDispose', 'AfterAll'];

export enum LifeCycleEvent {
	BeforeAll = 'BeforeAll',
	OnInit    = 'OnInit',
	OnDispose = 'OnDispose',
	AfterAll  = 'AfterAll',
}

export function isLifeCycleEvent(name: string): boolean {
	return Object.values(LifeCycleEvent).includes(name as LifeCycleEvent);
}
