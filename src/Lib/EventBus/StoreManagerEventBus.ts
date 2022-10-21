import StoreManager from "../StoreManager";
import {StoreEventBus} from "./StoreEventBus";
import {StoreEventsMap} from "./StoreEventsMap";

type EventKey = keyof StoreEventsMap | string;

export class StoreManagerEventBus extends StoreEventBus {

	/**
	 * Dispatch an event to the main event bus
	 * **Note:** This will not dispatch to the stores, for that, use {@see $dispatchToAllStores}
	 */
	public $dispatch(type: EventKey, evt?: StoreEventsMap[EventKey]) {
		super.$dispatch(type, evt);
	}

	/**
	 * Dispatch an event to the main event bus and all stores
	 */
	public $dispatchToAllStores(type: EventKey, event?: StoreEventsMap[EventKey]) {
		this.bus.emit(type, event);

		for (let className in StoreManager.stores) {
			const storeEventData = event || {};
			if (Object.getPrototypeOf(storeEventData) === Object.prototype) {
				storeEventData.store = StoreManager.stores[className];
			}
			StoreManager.stores[className].$dispatch(type, storeEventData);
		}
	}

}
