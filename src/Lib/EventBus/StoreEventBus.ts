//const GlobalEventBus = new StoreEventBus();
//
//export const EventBusPlugin: Plugin = {
//	install(app: App, ...options: any[]) {
//		app.config.globalProperties.$events    = GlobalEventBus;
//		app.config.globalProperties.$emitEvent = GlobalEventBus.emit.bind(GlobalEventBus);
//	}
//};
//export function useEvent<Key extends keyof StoreEventsMap>(type: Key, handler: Handler<StoreEventsMap[Key]>): void;
//export function useEvent(type: "*", handler: WildcardHandler<StoreEventsMap>): void;
//export function useEvent(type, handler): void {
//	const scope = getCurrentScope();
//	if (!scope) {
//		throw new Error('No scope found. Are you using the plugin outside of a Vue component/setup?');
//	}
//
//	GlobalEventBus.on(type, handler);
//
//	onScopeDispose(() => {
//		GlobalEventBus.off(type, handler);
//		console.log('disposed event listener for', type);
//	});
//}
//
//export function emitEvent<Key extends keyof StoreEventsMap>(type: Key, data: StoreEventsMap[Key]): void;
//export function emitEvent(type, data): void {
//	GlobalEventBus.emit(type, data);
//}
//export {useEvent, emitEvent};

import {getCurrentInstance, onBeforeUnmount} from "vue";
import eventBus, {Emitter} from "./EventBus";
import {StoreEventsMap} from "./StoreEventsMap";

export type EventKey = keyof StoreEventsMap | string;

export class StoreEventBus {

	protected bus: Emitter<StoreEventsMap> = eventBus<StoreEventsMap>();

	/**
	 * Dispatch an event to the main event bus
	 */
	public $dispatch(type: EventKey, evt?: StoreEventsMap[EventKey]) {
		this.bus.emit(type, evt);
	}

	public getAllEvents() {
		const events = [];

		this.bus.all.forEach((handlers, type) => {
			events.push({type, handlers});
		});

		return events;
	}

	public hasEventHandler(type: EventKey) {
		return this.bus.all.has(type);
	}

	public removeAllListeners() {
		this.bus.all.clear();
	}

	/**
	 * By default, when an event is used in a component, and the component is unmounted, the event listener will be removed.
	 * You can set detached to true to disable this.
	 */
	public $on(
		type: EventKey,
		handler: (event: StoreEventsMap[EventKey]) => void,
		detached: boolean = false
	): () => void {

		const offFn = () => this.bus.off(type, handler);

		if (!detached && getCurrentInstance()) {
			onBeforeUnmount(() => offFn());
		}

		this.bus.on(type, handler);

		return offFn;
	}

	public $off(type: EventKey, handler: (event: StoreEventsMap[EventKey]) => void) {
		this.bus.off(type, handler);
	}

}
