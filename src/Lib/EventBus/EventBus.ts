// An event handler can take an optional event argument
// and should not return a value
export type Handler<T = unknown> = (event: T) => void;

// An array of all currently registered event handlers for a type
export type EventHandlerList<T = unknown> = Array<Handler<T>>;
//export type WildCardEventHandlerList<T = { [key: string]: any }> = Array<WildcardHandler<T>>;

// A map of event types and their corresponding event handlers.
export type EventHandlerMap<Events extends { [key: string]: any }> = Map<keyof Events, EventHandlerList<Events[keyof Events]>>;

export interface Emitter<Events extends { [key: string]: any }> {
	all: EventHandlerMap<Events>;

	on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void;

	off<Key extends keyof Events>(type: Key, handler?: Handler<Events[Key]>): void;

	emit<Key extends keyof Events>(type: Key, event?: Events[Key]): void;

}

/**
 * Credits to mit
 */
export default function eventBus<Events extends { [key: string]: any }>(
	all?: EventHandlerMap<Events>
): Emitter<Events> {

	all = all || new Map();

	return {

		/**
		 * A Map of event names to registered handler functions.
		 */
		all,

		/**
		 * Register an event handler for the given type.
		 * @param {string|symbol} type Type of event to listen for
		 * @param {Function} handler Function to call in response to given event
		 */
		on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>) {
			const handlers: Array<Handler<Events[Key]>> | undefined = all!.get(type);
			if (handlers) {
				handlers.push(handler);
			} else {
				all!.set(type, [handler] as EventHandlerList<Events[keyof Events]>);
			}
		},

		/**
		 * Remove an event handler for the given type.
		 * If `handler` is omitted, all handlers of the given type are removed.
		 * @param {string|symbol} type Type of event to unregister `handler` from
		 * @param {Function} [handler] Handler function to remove
		 */
		off<Key extends keyof Events>(type: Key, handler?: Handler<Events[Key]>) {
			const handlers: Array<Handler<Events[Key]>> | undefined = all!.get(type);
			if (handlers) {
				if (handler) {
					handlers.splice(handlers.indexOf(handler) >>> 0, 1);
				} else {
					all!.set(type, []);
				}

				if (handlers.length === 0) {
					all!.delete(type);
				}
			}
		},

		/**
		 * Invoke all handlers for the given type.
		 *
		 * @param {string|symbol} type The event type to invoke
		 * @param {Any} [evt] Any value (object is recommended and powerful), passed to each handler
		 */
		emit<Key extends keyof Events>(type: Key, evt?: Events[Key]) {
			let handlers = all!.get(type) as EventHandlerList<Events[keyof Events]> | undefined;
			if (!handlers) {
				return;
			}

			handlers.slice().map((handler) => {
				handler(evt!);
			});
		}
	};
}
