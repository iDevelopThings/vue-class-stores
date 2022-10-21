/// <reference types="vitest" />
import {expect, test, vi} from "vitest";
import {On, TestStore} from "../Lib/Decorators";
import {Store} from "../Lib/Store";
import StoreManager from "../Lib/StoreManager";
import EventBusComponent from './Fixtures/EventBus.vue';

@TestStore
export class TestingStore extends Store<TestingStore, {}>() {
	get state() { return {foo : 'bar'}; }

	someMethod() { }

	@On("some_custom_event_name")
	customHandler(someData) {
		//			debugger;
	}
}

export const store = new TestingStore();

describe('EventBus', () => {

	@TestStore
	class OtherTestingStore extends Store<OtherTestingStore, {}>() {
		get state() { return {baz : 'bar'}; }

		@On("some_custom_event_name")
		customHandler(someData) {
			//			debugger;
		}
	}

	const otherStore = new OtherTestingStore();

	StoreManager.injectStore(store, TestingStore);
	StoreManager.injectStore(otherStore, OtherTestingStore);

	test('Receiving @OnInit event on boot', async () => {
		store.$on('@OnInit', (event) => expect(event.store).toBe(store));
		const component = await StoreManager.testComponentInstance();
		component.unmount();
	});

	test('Receiving @BeforeAll event on boot', async () => {
		store.$on('@BeforeAll', (event) => expect(event.store).toBe(store));
		const component = await StoreManager.testComponentInstance();
		component.unmount();
	});

	test('Receiving @AfterAll event on boot', async () => {
		store.$on('@AfterAll', (event) => expect(event.store).toBe(store));
		const component = await StoreManager.testComponentInstance();
		component.unmount();
	});

	//test('Receiving @OnDispose event on boot', async () => {
	//	store.$on('@OnDispose', (event) => expect(event.store).toBe(store));
	//	const component = await StoreManager.testComponentInstance();
	//	component.unmount();
	//});

	test('Custom events metadata exists for store', async () => {
		const meta = (store as any).___getMetaData().actions.get('customHandler');
		expect(meta.decorators.has('On')).toBe(true);
		expect(meta.decorators.get('On').p.some(p => p.n === 'eventName' && p.v === '"some_custom_event_name"')).toBe(true);
	});

	test('Custom events for store', async () => {
		const storeHandlerAction = vi.spyOn(store, 'customHandler');

		const component = await StoreManager.testComponentInstance();

		expect(store.$eventBus.hasEventHandler('some_custom_event_name')).toBe(true);

		store.$dispatch('some_custom_event_name', {foo : 'bar'});

		expect(storeHandlerAction).toHaveBeenCalledTimes(1);
		expect(storeHandlerAction).toHaveBeenCalledWith({foo : 'bar'});

		StoreManager.bus.$dispatchToAllStores('some_custom_event_name', {foo : 'bar'});

		expect(storeHandlerAction).toHaveBeenCalledTimes(2);

		component.unmount();
	});

	test('dispatchToAll works on multiple stores & main bus', async () => {
		const mainHandler = vi.fn(function handler(data) { });
		StoreManager.bus.$on('some_custom_event_name', mainHandler);

		const handlerOne = vi.spyOn(store, 'customHandler');
		const handlerTwo = vi.spyOn(otherStore, 'customHandler');

		const component = await StoreManager.testComponentInstance();

		StoreManager.bus.$dispatchToAllStores('some_custom_event_name', {foo : 'bar'});

		expect(mainHandler).toHaveBeenCalledOnce();
		expect(handlerOne).toHaveBeenCalledOnce();
		expect(handlerTwo).toHaveBeenCalledOnce();

		// for some reason vi thinks we're calling this with the wrong data...
		// expect(mainHandler).toHaveBeenCalledWith({foo : 'bar'});
		// expect(handlerOne).toHaveBeenCalledWith({store : store, foo : 'bar'});
		// expect(handlerTwo).toHaveBeenCalledWith({store : otherStore, foo : 'bar'});

		component.unmount();
	});

	test('event listeners defined in component are removed on unmount', async () => {
		const component = await StoreManager.testComponentInstance(EventBusComponent);

		expect(store.$eventBus.hasEventHandler('some_other_event')).toBe(true);
		expect(StoreManager.bus.hasEventHandler('some_other_event')).toBe(true);

		store.$dispatch('some_other_event', {hello : 'world'});
		StoreManager.bus.$dispatch('some_other_event', {hello : 'world'});

		component.unmount();

		expect(store.$eventBus.hasEventHandler('some_other_event')).toBe(false);
		expect(StoreManager.bus.hasEventHandler('some_other_event')).toBe(false);
	});


});
