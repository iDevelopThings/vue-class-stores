import {Store} from "@idevelopthings/vue-class-stores";

class UserStore extends Store<UserStore, any>() {
	get state() {
		return {
			email  : '',
			boards : []
		};
	}
}

export const userStore = new UserStore();
