import type { Scene } from 'phaser';

export function preload(this: Scene) {
	console.log('Preloading assets');

	// load textures
	this.load.spritesheet('players', '/img/players.png', {
		frameWidth: 16,
		frameHeight: 16
	});
	this.load.spritesheet('terrain16x16', '/img/terrain.png', {
		frameWidth: 16,
		frameHeight: 16
	});
	this.load.spritesheet('flags', '/img/flags.png', {
		frameWidth: 16,
		frameHeight: 32
	});
	this.load.image('frozen', '/img/frozen.png');
	this.load.spritesheet('spice', '/img/spice.png', {
		frameWidth: 32,
		frameHeight: 32
	});
	this.load.image('spice2', '/img/spice2.png');

	// init Socket.IO instance
	this.data.set('ws', new WebSocket(location.origin.replace(/^http/i, 'ws') + '/game'));

	// when connected to the server
	(this.data.get('ws') as WebSocket).addEventListener('open', () => {
		// resume Phaser
		this.scene.resume();

		// change text
		this.data.set('loadingTextMessage', 'Joining game');
	});

	// when disconnected from the server
	(this.data.get('ws') as WebSocket).addEventListener('close', (e) => {
		// log
		console.log('Socket.IO disconnected:', e);

		// pause Phaser
		this.scene.pause();

		// ignore our disconnects
		// TODO
		if (e == 'io client disconnect') return;

		// alert
		//alert('Disconnected from server');
	});
}
