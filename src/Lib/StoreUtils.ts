import {isRef, ref} from "vue";
import {isPlainObject} from "../Common/Object";

export const ClassStoreSymbol = Symbol('ClassStore');

export function makeReactive(value: any) {
	return isRef(value) ? value : ref(value);
}

export function getDescriptors(store: any) {
	const descriptors = Object.getOwnPropertyDescriptors(store);
	if (store.__proto__) {
		const protoDescriptors = getDescriptors(store.__proto__);
		for (const key in protoDescriptors) {
			if (!descriptors[key]) {
				descriptors[key] = protoDescriptors[key];
			}
		}
	}

	return descriptors;
}

export type DescriptorGroups = {
	state?: { [key: string]: PropertyDescriptor },
	getters?: { [key: string]: PropertyDescriptor },
	setters?: { [key: string]: PropertyDescriptor },
	actions?: { [key: string]: PropertyDescriptor },
	other?: { [key: string]: PropertyDescriptor },
}

export function getDescriptorsGrouped(store: any, ignoreKeys: string[] = []): DescriptorGroups {
	const descriptorGroups: DescriptorGroups = {
		state   : {},
		getters : {},
		setters : {},
		actions : {},
		other   : {},
	};

	ignoreKeys.push(
		'__proto__',
		'hasOwnProperty',
		'isPrototypeOf',
		'propertyIsEnumerable',
		'toLocaleString',
		'toString',
		'valueOf',
		'__defineGetter__',
		'__defineSetter__',
		'__lookupGetter__',
		'__lookupSetter__',
	);

	const descriptors = Object.getOwnPropertyDescriptors(store);
	for (let key in descriptors) {
		if (ignoreKeys.includes(key)) {
			continue;
		}

		const descriptor = descriptors[key];
		if (descriptor.get && !descriptor.set && !descriptor.value) {
			descriptorGroups.getters[key] = descriptor;
			continue;
		}
		if (descriptor.get && descriptor.set && !descriptor.value) {
			descriptorGroups.state[key] = descriptor;
			continue;
		}

		if (descriptor.set && !descriptor.get && !descriptor.value) {
			descriptorGroups.setters[key] = descriptor;
			continue;
		}

		if (!descriptor.set && !descriptor.get && descriptor.value) {
			if (typeof descriptor.value === 'function') {
				descriptorGroups.actions[key] = descriptor;
				continue;
			}
			if (isPlainObject(descriptor.value)) {
				descriptorGroups.getters[key] = descriptor;
				continue;
			}
		}

		descriptorGroups.other[key] = descriptor;
		//		console.warn(`Unknown descriptor type for ${key} in ${store.constructor.name}`, descriptor);
	}

	if (store.__proto__) {
		const protoDescriptors = getDescriptorsGrouped(store.__proto__, ignoreKeys);
		for (const key in protoDescriptors) {
			descriptorGroups[key] = Object.assign({}, protoDescriptors[key], descriptorGroups[key]);
		}
	}

	return descriptorGroups;
}
