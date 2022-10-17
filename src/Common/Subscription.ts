import {getCurrentInstance, getCurrentScope, onScopeDispose} from "vue";
import {noop} from "./Function";

export type SubscribeOptions = {
	detached?: boolean;
	onCleanup?: () => void;
}

export type SubscriptionCallback = (...args: any[]) => any;

export type SubscriptionCallbackInfo = {
	callback: SubscriptionCallback;
	options: SubscribeOptions;
	disposer: () => void;
}

export class Subscription {

	public callbacks: SubscriptionCallbackInfo[] = [];

	public addSubscription(
		callback: SubscriptionCallback,
		options: SubscribeOptions = {detached : false, onCleanup : noop}
	): SubscriptionCallbackInfo {
		const callbackInfo: SubscriptionCallbackInfo = {
			callback,
			options,
			disposer : () => {
				const idx = this.callbacks.indexOf(callbackInfo);
				if (idx > -1) {
					this.callbacks.splice(idx, 1);
					options.onCleanup();
				}
			}
		};

		this.callbacks.push(callbackInfo);

		if (!options.detached && getCurrentScope()) {
			onScopeDispose(callbackInfo.disposer);
		}

		return callbackInfo;
	}

	public subscribe(
		callback: SubscriptionCallback,
		options: SubscribeOptions = {detached : false, onCleanup : noop}
	): () => void {
		const info = this.addSubscription(callback, options);

		return info.disposer;
	}

	public trigger(...args) {
		if (!this.hasSubscriptions()) {
			return;
		}

		this.callbacks.slice().forEach(({callback}) => {
			callback(...args);
		});
	}

	public triggerPiped(...args) {
		let resultArgs = args;
		if (!this.hasSubscriptions()) {
			return resultArgs;
		}

		this.callbacks.slice().forEach(({callback}) => {
			resultArgs = callback.call(null, resultArgs);
		});

		return resultArgs;
	}

	public hasSubscriptions(): boolean {
		return !!this.callbacks?.length;
	}
}
