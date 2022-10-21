import {describe, expect} from "vitest";
import {TestStore} from "../Lib/Decorators";
import {StoreMetaActionData} from "../Lib/Meta/StoreMetaActionData";
import {Store} from "../Lib/Store";
import {StoreApi} from "../Lib/StoreApi";
import StoreManager from "../Lib/StoreManager";


describe('StoreTestability', () => {

	test('we can create a component and inject a store from our test', async () => {

		@TestStore
		class TestingStore extends Store<TestingStore, {}>() {
			get state() { return {foo : 'bar'}; }

			someMethod() { }
		}
		const store = new TestingStore();
		StoreManager.injectStore(store, TestingStore);

		const component = await StoreManager.testComponentInstance();

		const storeApi = StoreApi.forClass('TestingStore');

		expect(StoreApi.forBinding('$TestingStore').getInstance()).toBe(store);
		expect(storeApi.getVueBinding()).toBe('$TestingStore');
		expect(storeApi.getInstance()).toBe(store);
		expect(storeApi.getActionNames().includes('someMethod')).toBe(true);
		expect(storeApi.getAction('someMethod')).toBeInstanceOf(StoreMetaActionData);
		expect(storeApi.getAllState().foo).toBe('bar');

		expect(StoreManager.storeInjections['TestingStore']).toBeDefined();
		expect(StoreManager.storeInjections['TestingStore'].store).toBe(store);
		expect(StoreManager.stores['TestingStore']).toBe(store);
		expect(StoreManager.storeModules['TestingStore']).toBeDefined();
		expect(StoreManager.storeMeta['TestingStore']).toBeDefined();
		expect(StoreManager.storeBindingToClassName['$TestingStore']).toBe('TestingStore');


		expect((component.vm as any).$TestingStore).toBe(store);
		expect((component.vm as any).$TestingStore.someMethod).toBe(store.someMethod);

	});

});
