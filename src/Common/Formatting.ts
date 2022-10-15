export function formatVueBindingName(binding: string, storeClassName: string) {
	let value = binding ?? storeClassName;

	if (value.endsWith('Store')) {
		value = value.replace('Store', '');
		value = value.charAt(0).toLowerCase() + value.slice(1);
	}

	return "$" + value;
}
