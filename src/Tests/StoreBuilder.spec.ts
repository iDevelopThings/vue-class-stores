/*
import {describe, expect} from "vitest";
import {StoreBuilder} from "../StoreBuilderBackup/StoreBuilder";
import {StoreMetaData} from "../Meta/StoreMetaData";

describe('StoreBuilder', () => {

	function mockStoreBuilder(): StoreBuilder {
		return StoreMetaData.createForModule({
			className  : 'MyTestStore',
			exportName : 'myTestStore',
			vueBinding : 'myTest',
		});
	}

	function mockStoreBuilderWithStuff() {
		return StoreMetaData.createForModule({
				className  : 'MyTestStore',
				exportName : 'myTestStore',
				vueBinding : 'myTest',
			})
			.initialState({
				testValue  : 'test',
				testObject : {foo : 'bar'},
				testArr    : ['foo', 'bar'],
				testInt    : 420,
			})
			.action('testingIncrementInt', function (incrementAmount: number = 0) {
				this.state.testInt++;
			})
			.actionBuilder('addToArray', (builder) => {
				return builder
					.param('value', 'string')
					.handler(function (value: string) {
						this.state.testArr.push(value);
					});
			})
			.action('testAddToArr', function () {
				this.addToArray('test');
			})
			.getter('testValue', function () { return this.state.testValue; })
			.getter('testObject', function () { return this.state.testObject; })
			.getter('testArr', function () { return this.state.testArr; })
			.getter('testInt', function () { return this.state.testInt; });
	}

	it('can add new method to store & call it', async () => {
		const builder = mockStoreBuilder();

		const store   = builder.initialState({testing : 'yeet'})
			.action('testingAction', function (testParam: string) {
				console.log(testParam);
				return testParam;
			})
			.getter('testingGetter', function () { return this.state.testing; })
			.buildAndLoad();

		expect(builder.meta.actions.has('testingAction')).toBe(true);

		const result = store.testingAction('test');

		expect(result).toBe('test');
	});

	it('can set initial state', () => {
		const builder = mockStoreBuilder();

		builder.initialState({test : 'test',});

		expect(builder.meta.stateKeys).toEqual(['test']);
		expect(builder.instance.state.test).toBe('test');
	});

	it('can add getter', () => {
		const builder = mockStoreBuilder();

		builder.initialState({testState : 'test state result'});
		builder.getter('testStateGetter', function () { return this.state.testState; });
		builder.getter('test', () => 'test');

		expect(builder.meta.getters.has('test')).toBe(true);
		expect(builder.instance.test).toBe('test');
		expect(builder.instance.testStateGetter).toBe('test state result');

	});

	it('can build store from built store', () => {
		const builder = mockStoreBuilderWithStuff();

		const store = builder.buildAndLoad();

		expect(store.testValue).toBe('test');
		expect(store.testObject).toEqual({foo : 'bar'});
		expect(store.testArr).toEqual(['foo', 'bar']);
		expect(store.testInt).toBe(420);
	});

});
*/

export {};
