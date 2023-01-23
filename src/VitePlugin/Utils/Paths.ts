import {relativeify} from "./ViteFunction";

export function slash(path: string) {
	const isExtendedLengthPath = /^\\\\\?\\/.test(path);

	if (isExtendedLengthPath) {
		return path;
	}

	return path.replace(/\\/g, "/");
}


export function formatImport(path: string) {
	return relativeify(slash(path));
}
