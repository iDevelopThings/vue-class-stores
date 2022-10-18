import {Computed, Store} from "@idevelopthings/vue-class-stores/vue";

class UserStore extends Store<UserStore, any>() {
	get state() {
		return {
			email  : '',
			boards : []
		};
	}

	@Computed
	get email() {
		return this.$email;
	}
}

export const userStore = new UserStore();
