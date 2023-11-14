import { phaser } from '$lib/phaser';
import type { Types } from 'phaser';

import { browser } from '$app/environment';

import { preload } from './gamePreload';

export function config(extra?: Partial<Types.Core.GameConfig>): Types.Core.GameConfig {
	return {
		title: 'Spice Escape',
		url: browser ? location.origin : undefined,
		version: '1.0',
		input: {
			mouse: false,
			touch: false
		},
		antialias: false,
		pixelArt: true,
		roundPixels: true,
		physics: {
			default: 'arcade',
			arcade: {
				debug: false
			}
		},
		scale: {
			mode: phaser?.Scale.RESIZE,
			width: '100%',
			height: '100%'
		},
		scene: {
			preload
		},
		parent: 'game',
		disableContextMenu: true,
		transparent: true,
		...extra
	};
}
