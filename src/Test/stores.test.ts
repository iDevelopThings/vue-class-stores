/// <reference types="vitest" />

import {mount} from '@vue/test-utils';
import {myTestStore} from "./Stores/TestingStore";
import TestingStoreComponent from './TestingStoreComponent.vue';


test('creating and using a store', async () => {


	const wrapper = mount(TestingStoreComponent, {});
	await wrapper.get('button').trigger('click');
	const res = wrapper.text();
	expect(wrapper.text()).toContain('Result: Message: 1');
	expect(wrapper.text()).toContain('ResultTwo: Message: 1');
	await wrapper.get('button').trigger('click');
	expect(wrapper.text()).toContain('Result: Message: 2');
	expect(wrapper.text()).toContain('ResultTwo: Message: 2');

	myTestStore.increment();
	console.log(myTestStore.$getState('someValue'));
	console.log(myTestStore);

});
