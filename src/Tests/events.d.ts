declare module '../Lib/EventBus/StoreEventsMap' {
	import {LifeCycleEvents} from "../../Common/LifeCycle";

	export interface StoreEventsMap extends LifeCycleEvents {
		//		'@OnInit': { store: BaseStoreInstance<any, any> };
	}
}

export {};
