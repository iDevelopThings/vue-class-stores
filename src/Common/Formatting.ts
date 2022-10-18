export function formatVueBindingName(binding: string, storeClassName: string) {
	let value = binding ?? storeClassName;

	if (value.endsWith('Store')) {
		value = value.replace('Store', '');
		value = value.charAt(0).toLowerCase() + value.slice(1);
	}

	return "$" + value;
}


export function createExportName(className: string) {
	className = className.charAt(0).toLowerCase() + className.slice(1);

	if (className.toLowerCase().endsWith('store')) {
		className = className.slice(0, -5);
	}

	return className;
}
