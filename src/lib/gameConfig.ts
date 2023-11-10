import { phaser } from '$lib/phaser';
import type { Types } from 'phaser';

import { browser } from '$app/environment';

export const config: Types.Core.GameConfig = {
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
	parent: 'game',
	disableContextMenu: true,
	fps: {
		target: 30
		//forceSetTimeOut: true
	}
};
