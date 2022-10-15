import {Store} from "@idevelopthings/vue-class-stores/vue";

export interface IMyTestStore {
	someValue: string;
	counter: number;
	nested: {
		thing: boolean,
	};

}

export class MyTestStore extends Store<MyTestStore, IMyTestStore>() {

	get state(): IMyTestStore {
		return {
			someValue : '',
			counter   : 0,
			nested    : {
				thing : false,
			}
		};
	}

	storeFunction() {
		return 'hello';
	}

	errorFunction() {
		throw new Error('This is an error');
	}

	storeFunctionWithArgs(x: number, y: number = 10, z = 20) {
		throw new Error('This is an error');
	}

	get storeGetter() {
		return 'hello';
	}

	get someValue() {
		return this.state.someValue;
	}

	get counter() {
		return this.state.counter;
	}

	increment() {
		this.$counter++;
		this.$someValue = 'Message: ' + this.$counter;
	}

}


export const myTestStore = new MyTestStore();

