/**
 * This decorator is used to mark a Store as a store used in a test file
 */
export const TestStore = (target: { new(...args): any }) => {};

/**
 * Marks a getter as computed
 */
export const Computed = (target: any, propertyKey: string) => {};

/**
 * Marks an action as an event handler for this event
 */
export const BeforeAll = (target: any, propertyKey: string) => {};

/**
 * Marks an action as an event handler for this event
 */
export const OnInit    = (target: any, propertyKey: string) => {};

/**
 * Marks an action as an event handler for this event
 */
export const OnDispose = (target: any, propertyKey: string) => {};

/**
 * Marks an action as an event handler for this event
 */
export const AfterAll  = (target: any, propertyKey: string) => {};

/**
 * Marks an action as an event handler for the specified event
 */
export const On = (eventName: string) => {
	return (target: any, propertyKey: string) => {

	}
};
