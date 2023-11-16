import type { Scene } from 'phaser';

import { goto } from '$app/navigation';

import { getVar } from './css';

export function create(this: Scene) {
	console.log('Creating animations');

	// create animations
	this.anims.create({
		key: 'blue_idle',
		frames: this.anims.generateFrameNumbers('players', {
			frames: [0, 1, 2, 3]
		}),
		frameRate: 8,
		repeat: -1
	});
	this.anims.create({
		key: 'blue_walk',
		frames: this.anims.generateFrameNumbers('players', {
			frames: [32, 33, 34, 35, 36, 37, 38, 39]
		}),
		frameRate: 8,
		repeat: -1
	});
	this.anims.create({
		key: 'blue_dead',
		frames: this.anims.generateFrameNumbers('players', { frames: [134, 135] }),
		frameRate: 3,
		repeat: -1
	});
	this.anims.create({
		key: 'red_idle',
		frames: this.anims.generateFrameNumbers('players', {
			frames: [16, 17, 18, 19]
		}),
		frameRate: 8,
		repeat: -1
	});
	this.anims.create({
		key: 'red_walk',
		frames: this.anims.generateFrameNumbers('players', {
			frames: [48, 49, 50, 51, 52, 53, 54, 55]
		}),
		frameRate: 8,
		repeat: -1
	});
	this.anims.create({
		key: 'red_dead',
		frames: this.anims.generateFrameNumbers('players', { frames: [150, 151] }),
		frameRate: 3,
		repeat: -1
	});
	this.anims.create({
		key: 'finish_flag',
		frames: this.anims.generateFrameNumbers('flags', {
			frames: [1, 2, 3, 4, 5, 6, 7, 8]
		}),
		frameRate: 3,
		repeat: -1
	});
	this.anims.create({
		key: 'spice',
		frames: this.anims.generateFrameNumbers('spice', {
			frames: [0, 1, 2, 3, 4, 5]
		}),
		frameRate: 8
	});

	// background
	this.cameras.main.setBackgroundColor(getVar('--bg2'));

	// focus nick input
	setTimeout(() => {
		this.nickInp.focus();

		// automatic nick from URL
		if (parsedUrl.searchParams.has('nick')) {
			this.nickInp.value = parsedUrl.searchParams.get('nick');
		}
	}, 500);

	// when play button clicked
	// if (!has_set_events)
	// 	this.playBtn.addEventListener('click', (e) => {
	// 		// connect to server
	// 		this.socket.connect();

	// 		// send name to server
	// 		this.socket.emit('nick', this.nickInp.value);

	// 		// document.body.requestFullscreen({
	// 		//   navigationUI: 'hide'
	// 		// });
	// 	});

	// platforms
	this.killersPlat = this.add.image(100, 358, 'terrain16x16', 34).setDepth(1).setScale(2);
	this.downPlat = this.add.tileSprite(4096, 382, 9512, 16, 'terrain16x16', 65).setDepth(1);
	this.downPlatBC = this.add
		.tileSprite(this.downPlat.x, 800, this.downPlat.width, 16, 'terrain16x16', 129)
		.setDepth(1);
	this.downPlatBL = this.add.image(-653, this.downPlatBC.y, 'terrain16x16', 128).setDepth(1);
	this.downPlatTL = this.add
		.image(this.downPlatBL.x, this.downPlat.y, 'terrain16x16', 64)
		.setDepth(1);
	this.downPlatCC = this.add
		.tileSprite(this.downPlat.x, 591, this.downPlat.width, 416, 'terrain16x16', 97)
		.setDepth(1);
	this.downPlatCL = this.add
		.tileSprite(this.downPlatBL.x, 591, 16, 416, 'terrain16x16', 96)
		.setDepth(1);
	this.downPlatTR = this.add.image(8845, this.downPlat.y, 'terrain16x16', 66).setDepth(1);
	this.downPlatBR = this.add
		.image(this.downPlatTR.x, this.downPlatBC.y, 'terrain16x16', 130)
		.setDepth(1);
	this.downPlatCR = this.add
		.tileSprite(this.downPlatTR.x, this.downPlatCL.y, 16, 416, 'terrain16x16', 98)
		.setDepth(1);

	// finish line
	this.finishLine = this.add.sprite(8100, 358, 'flags', 1);

	// players
	this.players = {};
	this.nickPositionOffset = {
		x: 0,
		y: -18
	};
	this.spawnPlayer = (id, data) => {
		/*
		 * define ice and spice before sprite so it shows bellow
		 */

		if (!data)
			data = {
				x: 400,
				y: 250
			};

		// create spice
		let spice = this.add.sprite(data.x, data.y, 'spice').setDepth(2);
		let spice2 = this.add.image(data.x, data.y, 'spice2').setDepth(3);

		// create ice for freezing
		let frozen = this.add.image(data.x, data.y, 'frozen').setDepth(3);

		// create sprite
		this.players[id] = this.physics.add.sprite(data.x, data.y, 'players').setDepth(4);

		// save frozen and spice in sprite
		this.players[id].frozen = frozen;
		this.players[id].spice = spice;
		this.players[id].spice2 = spice2;

		// create nick text
		this.players[id].nick = this.add
			.text(data.x + this.nickPositionOffset.x, data.y + this.nickPositionOffset.y, '', {
				fontFamily: 'Spice Escape',
				fontSize: 15,
				fontStyle: 'bold'
			})
			.setOrigin(0.5, 0.5)
			.setDepth(5)
			.setAlign('center');

		// make spice and ice invisible
		this.players[id].spice.visible = false;
		this.players[id].spice2.visible = false;
		this.players[id].frozen.visible = false;

		// create player data
		this.players[id].playerData = {};

		// make player bigger
		this.players[id].setScale(2);

		// make spice and ice bigger
		this.players[id].spice.setScale(2);
		this.players[id].frozen.setScale(2);

		// animation
		if (this.players[id].playerData.anim_idle)
			this.players[id].play(this.players[id].playerData.anim_idle, true);
	};

	// obstacles
	this.obstacles = this.physics.add.staticGroup();
	this.createdObstacles = false;

	// game data
	this.gameData = {};

	// when a player joins the game
	this.socket.on('new player', (id) => {
		this.players[id] = null;

		// check if it's the current player
		if (id == this.socket.id) {
			// check if all players are here
			// TODO
			this.loadingTextMessage = 'Waiting for players';
		}
	});

	// when game is starting
	this.socket.on('game starting', (counter) => {
		// change text
		this.loadingTextMessage = `Game starting in ${Math.ceil(counter / 60)} seconds`;

		// refresh abilities
		this.abilityImgsSet = false;
	});

	// when player data is received from the server
	this.socket.on('game data', (data) => {
		// save data in class properties
		for (const key of Object.keys(data)) {
			if (['players'].includes(key)) continue;

			this.gameData[key] = data[key];
		}

		// save players separately
		for (let entry of Object.entries(data.players))
			if (this.players[entry[0]]) this.players[entry[0]].playerData = entry[1];
	});

	// when a player leaves
	this.socket.on('player leave', (id) => {
		// destroy the sprite from Phaser
		if (this.players[id]) {
			this.players[id].destroy();

			// destroy the nick from Phaser
			this.players[id].nick.destroy();
		}

		// delete it
		delete this.players[id];
	});

	// when the game starts
	this.socket.on('start game', () => {
		this.gameStarted = true;
		this.loadingTextMessage = '';

		// reset ability cooldowns
		this.abilityBtn1.disabled = false;
		this.abilityBtn2.disabled = false;
		this.abilityBtn3.disabled = false;
		this.abilityBtn4.disabled = false;

		// refresh abilities
		this.abilityImgsSet = false;
	});

	// when the game ends
	this.socket.on('game ended', (winnerRole) => {
		// set end screen title
		this.gameEndTitle.innerText = `${winnerRole}s won`;

		// check if current player was a winner
		this.gameEndTitle.classList.remove('victory');
		this.gameEndTitle.classList.remove('defeat');
		if (this.players[this.socket.id]) {
			if (this.players[this.socket.id].playerData.role == winnerRole) {
				this.gameEndTitle.classList.add('victory');
			} else {
				this.gameEndTitle.classList.add('defeat');
			}
		}

		// show winner players
		this.gameEndWinners.replaceChildren();
		for (let id of Object.keys(this.players)) {
			if (this.players[id] && this.players[id].playerData.role == winnerRole) {
				// create div
				const div = document.createElement('div');
				div.className = `end-screen-player end-screen-player-${this.players[id].playerData.role}`;
				div.dataset.nick = this.players[id].playerData.nick;

				// create image
				const img = document.createElement('img');
				img.src = '/img/empty.png';

				// add image to div
				div.appendChild(img);

				// add div to end screen
				this.gameEndWinners.appendChild(div);
			}
		}

		// show end screen
		this.gameEndScreen.style.display = 'flex';

		// after a few miliseconds disconnect from server
		this.time.delayedCall(
			500,
			function () {
				this.socket.disconnect();
			},
			undefined,
			this
		);
	});

	// when home button is clicked
	if (!has_set_events)
		this.gameEndHomeBtn.addEventListener('click', (e) => {
			// hide game end screen
			this.gameEndScreen.style.display = 'none';

			// hide abilities
			this.abilityBtn1.style.display = 'none';
			this.abilityBtn2.style.display = 'none';
			this.abilityBtn3.style.display = 'none';
			this.abilityBtn4.style.display = 'none';
			this.abilityImgsSet = false;

			// show home screen
			goto('/');

			// disconnect Socket.IO
			this.socket.disconnect();

			// delete all players
			for (const id of Object.entries(this.players)) {
				if (id[1]) {
					try {
						id[1].dispose();
					} catch (err) {
						console.error(id[1], err);
					}
					try {
						id[1].nick.dispose();
					} catch (err) {
						console.error(id[1].nick, err);
					}
					try {
						id[1].spice.dispose();
					} catch (err) {
						console.error(id[1].spice, err);
					}
					try {
						id[1].frozen.dispose();
					} catch (err) {
						console.error(
							id[1].frozen,
							err,
							"\nThese errors don't usually matter but only make your computer have less memory available :P"
						);
					}
				}
			}

			// restart the scene
			this.scene.restart();
		});

	// when game window loses focus
	if (!has_set_events)
		window.addEventListener('visibilitychange', (e) => {
			console.log(document.visibilityState);
		});

	// Loading text
	this.loadingText = this.add
		.text(this.sys.game.canvas.width / 2, this.sys.game.canvas.height / 4, 'STARTING...', {
			fontFamily: 'Spice Escape',
			fontSize: 32
		})
		.setOrigin(0.5, 0.5)
		.setScrollFactor(0)
		.setDepth(0)
		.setColor(this.getVar('--orange'))
		.setAlign('center');
	this.loadingTextMessage = 'Connecting';
	this.loadingTextFrame = 0;
	this.loadingTextShow = true;
	this.loadingTextDots = true;

	// background texts
	this.runnerBgText = this.add
		.text(400, 300, 'RUNNERS, RUN TO\nTHE FINISH LINE!  -->', {
			fontFamily: 'Spice Escape',
			fontSize: 15
		})
		.setOrigin(0.5, 0.5)
		.setDepth(0)
		.setColor(this.getVar('--bg3'))
		.setAlign('center');
	this.killerBgText = this.add
		.text(50, 300, 'KILLERS, KILL\nALL THE RUNNERS!', {
			fontFamily: 'Spice Escape',
			fontSize: 15
		})
		.setOrigin(0.5, 0.5)
		.setDepth(0)
		.setColor(this.getVar('--bg3'))
		.setAlign('center');

	this.gameStarted = false;

	// scroll to zoom
	this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
		if (deltaY > 0 && this.cameras.main.zoom > 0.8) {
			this.cameras.main.zoom -= 0.1;
		} else if (deltaY < 0) {
			this.cameras.main.zoom += 0.1;
		}

		console.log('Scroll is currently at', this.cameras.main.zoom);
	});

	// key down
	this.input.keyboard.on('keydown', (e) => {
		switch (e.code) {
			// player movement
			case 'KeyW':
			case 'ArrowUp':
			case 'Space':
				this.socket.emit('jump');
				break;
			case 'KeyS':
			case 'ArrowDown':
				this.socket.emit('down');
				break;
			case 'KeyA':
			case 'ArrowLeft':
				this.socket.emit('move', {
					x: -1
				});
				break;
			case 'KeyD':
			case 'ArrowRight':
				this.socket.emit('move', {
					x: 1
				});
				break;

			// abilities
			case 'Digit1':
				this.abilityBtn1.click();
				break;
			case 'Digit2':
				this.abilityBtn2.click();
				break;
			case 'Digit3':
				this.abilityBtn3.click();
				break;
			case 'Digit4':
				this.abilityBtn4.click();
				break;
		}
	});

	// key up
	this.input.keyboard.on('keyup', (e) => {
		switch (e.code) {
			case 'KeyW':
			case 'KeyS':
			case 'ArrowUp':
			case 'ArrowDown':
				break;
			case 'KeyA':
			case 'KeyD':
			case 'ArrowLeft':
			case 'ArrowRight':
				this.socket.emit('move', {
					x: 0
				});
				break;
		}
	});

	// ability buttons
	if (!has_set_events)
		this.abilitiesDiv.addEventListener('click', (e) => {
			if (e.target.matches('div#abilities button.ability')) {
				const ability = e.target.dataset.ability;

				this.socket.emit('ability', ability, (resp) => {
					if (resp == false) {
						console.error('Error activating ability, refreshing...');
						this.abilityImgsSet = false;
						return;
					}

					e.target.disabled = true;
					const dv = resp.cooldown / 60;
					e.target.querySelector('span.ability-cooldown').innerText = Math.ceil(dv);
					this.time.delayedCall(
						dv * 1000,
						function () {
							e.target.disabled = false;
						},
						undefined,
						this
					);
				});
			}
		});

	// pause
	this.scene.pause();

	// save events done
	has_set_events = true;
}
