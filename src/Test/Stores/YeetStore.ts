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

	errorFunc(message: string) {
		throw new Error('nop');
	}

	promiseFunc(message: string) {
		return new Promise((resolve, reject) => {
			resolve(message);
		});
	}

	doThing() {
		return this.someGlobalFunc();
	}

}


export const yeetStore = new NewYeetStore();

