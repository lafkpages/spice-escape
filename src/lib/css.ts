export function getVar(name: string) {
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
