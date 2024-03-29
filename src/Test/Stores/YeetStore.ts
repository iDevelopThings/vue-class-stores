import {AfterAll, BeforeAll, Computed, OnInit, Store} from "@idevelopthings/vue-class-stores/vue";

export interface INewYeetStore {
	counter: number;
	inputValue: string;
	banner: { message: string };
}


export class NewYeetStore extends Store<NewYeetStore, INewYeetStore>() {

	get state(): INewYeetStore {
		return {
			counter    : 0,
			inputValue : "",
			banner     : {message : ""},
		};
	}

	get counterRef() {
		return this.$counter;
	}

	@Computed
	get counter() {
		return this.state.counter;
	}

	set counter(value: number) {
		this.state.counter = value;
	}

	get newCounter() { return '';}


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

	setNewMessage(message: string) {
		this.$banner.message = message;
	}

	removeBanner() {
		this.state.banner.message = '';
	}

	get banner() {
		const msg = this.state.banner.message;

		if (msg === '') {
			return undefined;
		}

		return msg;
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
		return this.someGlobalFunc();
	}

	doSomething() {}


	@BeforeAll
	beforeAll() {
		console.log('hi from: ', this.constructor.name, 'beforeAll');
	}

	@AfterAll
	afterAll() {
		console.log('hi from: ', this.constructor.name, 'afterAll');
	}

	@OnInit
	onInit({store}) {
		console.log('hi from: ', this.constructor.name, 'onInit');
	}


}

export const yeetStore = new NewYeetStore();
