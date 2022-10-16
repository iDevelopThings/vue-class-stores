import {Store} from "@idevelopthings/vue-class-stores/vue";
import axios from 'axios';

interface ITodosStore {
	loading: boolean;
	todos: ITodo[];
}

export interface ITodo {
	userId: number;
	id: number;
	title: string;
	completed: boolean;
}

class TodosStore extends Store<TodosStore, ITodosStore>() {

	get state(): ITodosStore {
		return {
			loading : false,
			todos   : [],
		};
	}

	// Load the todos from our api and set them on our state
	async load() {
		try {
			this.$loading = true;
			this.$todos   = (await axios.get<ITodo[]>('https://jsonplaceholder.typicode.com/todos/1')).data;
			// We could also use this.state.todos = (await axios....)
		} catch (error) {
			console.error(error);
		} finally {
			this.$loading = false;
		}
	}

	// We can define js "getters" to return specific state
	// from our store, this isn't necessary, but more of a preference
	// In our templates, we could directly use $loading/$todos

	get isLoading():boolean {
		return this.$loading;
	}

	get todos():ITodo[] {
		return this.$todos;
	}

}

export const todosStore = new TodosStore();
