import {Store} from "@idevelopthings/vue-class-stores/vue";

export interface INewYeetStore {
	counter: number;
	inputValue: string;
}


export class NewYeetStore extends Store<NewYeetStore, INewYeetStore>() {

	get state(): INewYeetStore {
		return {
			counter    : 0,
			inputValue : "",
		};
	}

	get counterRef() {
		return this.$counter;
	}

	get counter() {
		return this.state.counter;
	}

	get inputValueRef() {
		return this.$inputValue;
	}

	get inputValue() {
		return this.state.inputValue;
	}

	increment() {
		this.state.counter++;
	}

	incrementRef() {
		this.$counter++;
	}

	myTestFunc(message: string) {
		this.$inputValue = message;

		return this.$inputValue;
	}

	errorFunc() {
		throw new Error('nop');
	}

	promiseFunc(message: string) {
		return new Promise((resolve, reject) => {
			resolve(message);
		});
	}

	doThing() {
		console.log('ffffffdsadaffffff');
		return this.someGlobalFunc();
	}

	doSomething() {}

}


export const yeetStore = new NewYeetStore();

/*
if (import.meta.hot) {
	import.meta.hot.accept(mod => {
		console.log('module updated', mod);
	});
	import.meta.hot.on('vite:beforeFullReload', (...args) => {
		console.log('before full reload', args);
	});
}
*/

