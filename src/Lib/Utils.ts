export function isDev() {
	return import.meta.env.DEV || (typeof process !== 'undefined' && process.env.NODE_ENV === 'development');
}

export function isTesting() {
	return import.meta.env.TEST || typeof process !== 'undefined' && (
		process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
	);
}

export function abortIfNotTesting() {
	if (!isTesting()) {
		throw new Error('StoreManager.bootForTesting() can only be called in a test environment. If you are in a testing environment, please make sure you have set the NODE_ENV to "test", or that `import.meta.env.TEST === true, or... use vitest.');
	}
}

export function isClient() {
	return typeof window !== 'undefined';
}

export function vueDevToolsAvailable() {
	if (!isClient()) {
		return false;
	}

	return (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__ !== undefined;
}

export function reportErrorMessage(type: 'vite plugin' | 'vue plugin', titleReference: string) {
	const typeFormatted = type.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
	const title         = `${typeFormatted} Error: ${titleReference}`;

	const issueUrl = type === 'vite plugin'
		? `https://github.com/iDevelopThings/vue-class-stores/issues/new?assignees=&labels=bug&template=vite-plugin-.md&title=%5BVite+Plugin%5D+${encodeURIComponent(titleReference)}`
		: `https://github.com/iDevelopThings/vue-class-stores/issues/new?assignees=&labels=bug&template=vue-plugin.md&title=%5BVue+Plugin%5D+${encodeURIComponent(titleReference)}`;

	return [
		`This could be a problem/bug with the ${type}.`,
		`Please create an issue <3: ${issueUrl}`
	].join('\n');
}

export function vitePluginErrorMessage(titleReference: string) {
	return reportErrorMessage('vite plugin', titleReference);
}

export function vuePluginErrorMessage(titleReference: string) {
	return reportErrorMessage('vue plugin', titleReference);
}
