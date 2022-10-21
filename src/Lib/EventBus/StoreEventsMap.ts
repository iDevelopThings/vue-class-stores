import {LifeCycleEvents} from "../../Common/LifeCycle";

export interface StoreEventsMap extends LifeCycleEvents {
	[key: string]: any;
}
