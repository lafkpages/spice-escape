import { browser } from '$app/environment';

export const phaser = browser ? await import('phaser') : null;
