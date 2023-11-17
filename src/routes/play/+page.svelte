<script lang="ts">
	import type { PageData } from './$types';
	import type { Player } from '$lib/types';

	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { config } from '$lib/gameConfig';
	import { phaser } from '$lib/phaser';
	import { abilities } from '$lib/abilities';
	import { getVar as getCssVar } from '$lib/css';
	import { spice_escape } from '$lib/ws';

	import { PlayerRole } from '$lib/types';

	export let data: PageData;

	let game: import('phaser').Game;
	let gameStarted = false;

	let role = PlayerRole.Killer;

	let ws: WebSocket | null = null;

	const players: Record<string, Player> = {};

	let gameOverlayText = '';

	onMount(() => {
		if (browser) {
			// init WebSocket
			ws = new WebSocket(location.origin.replace(/^http/i, 'ws') + '/game');

			ws.addEventListener('message', async (e) => {
				const data = spice_escape.WsMessageServer.decode(
					Uint8Array.from(await e.data.arrayBuffer())
				);

				console.log(data);

				if (data.playerJoin?.playerId && data.playerJoin?.nick) {
					console.log('Player joined:', data.playerJoin);
					players[data.playerJoin.playerId] = {
						nick: data.playerJoin.nick
					};
				}

				if (data.playerLeave?.playerId) {
					console.log('Player left:', data.playerLeave);
					delete players[data.playerLeave.playerId];

					// TODO: remove player from Phaser game
				}

				if (typeof data.gameStarting?.counter == 'number') {
					console.log('Game starting in', data.gameStarting.counter);

					gameOverlayText = `Game starting in ${Math.ceil(data.gameStarting.counter / 60)} seconds`;
				}

				if (data.gameStart) {
					console.log('Game started');

					gameOverlayText = '';
					gameStarted = true;
				}

				if (data.gameEnd?.winnerRole) {
					console.log('Game ended, winner role:', data.gameEnd.winnerRole);

					goto(
						`/game-end?winnerRole=${encodeURIComponent(
							data.gameEnd.winnerRole
						)}&role=${encodeURIComponent(role)}`
					);
				}
			});

			// send nickname
			ws.addEventListener(
				'open',
				() => {
					ws?.send(
						spice_escape.WsMessageClient.encode({
							nick: data.nick
						}).finish()
					);
				},
				{ once: true }
			);

			game = new phaser!.Game(
				config({
					scene: {
						preload: function () {
							if (!ws) {
								throw new Error('WS is null');
							}

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

							// when connected to the server
							ws.addEventListener('open', () => {
								// resume Phaser
								this.scene.resume();

								// change text
								this.data.set('loadingTextMessage', 'Joining game');
							});

							// when disconnected from the server
							ws.addEventListener('close', (e) => {
								// log
								console.log('WS disconnected:', e.reason);

								// pause Phaser
								this.scene.pause();

								// ignore our disconnects
								// TODO
								if (e.reason == 'io client disconnect') return;

								// alert
								//alert('Disconnected from server');
							});
						},
						create: function () {
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
							this.cameras.main.setBackgroundColor(getCssVar('--bg2'));

							// platforms
							this.killersPlat = this.add
								.image(100, 358, 'terrain16x16', 34)
								.setDepth(1)
								.setScale(2);
							this.downPlat = this.add
								.tileSprite(4096, 382, 9512, 16, 'terrain16x16', 65)
								.setDepth(1);
							this.downPlatBC = this.add
								.tileSprite(this.downPlat.x, 800, this.downPlat.width, 16, 'terrain16x16', 129)
								.setDepth(1);
							this.downPlatBL = this.add
								.image(-653, this.downPlatBC.y, 'terrain16x16', 128)
								.setDepth(1);
							this.downPlatTL = this.add
								.image(this.downPlatBL.x, this.downPlat.y, 'terrain16x16', 64)
								.setDepth(1);
							this.downPlatCC = this.add
								.tileSprite(this.downPlat.x, 591, this.downPlat.width, 416, 'terrain16x16', 97)
								.setDepth(1);
							this.downPlatCL = this.add
								.tileSprite(this.downPlatBL.x, 591, 16, 416, 'terrain16x16', 96)
								.setDepth(1);
							this.downPlatTR = this.add
								.image(8845, this.downPlat.y, 'terrain16x16', 66)
								.setDepth(1);
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
									.text(
										data.x + this.nickPositionOffset.x,
										data.y + this.nickPositionOffset.y,
										'',
										{
											fontFamily: 'Spice Escape',
											fontSize: 15,
											fontStyle: 'bold'
										}
									)
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

							// Loading text
							this.loadingText = this.add
								.text(
									this.sys.game.canvas.width / 2,
									this.sys.game.canvas.height / 4,
									'STARTING...',
									{
										fontFamily: 'Spice Escape',
										fontSize: 32
									}
								)
								.setOrigin(0.5, 0.5)
								.setScrollFactor(0)
								.setDepth(0)
								.setColor(getCssVar('--orange'))
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
								.setColor(getCssVar('--bg3'))
								.setAlign('center');
							this.killerBgText = this.add
								.text(50, 300, 'KILLERS, KILL\nALL THE RUNNERS!', {
									fontFamily: 'Spice Escape',
									fontSize: 15
								})
								.setOrigin(0.5, 0.5)
								.setDepth(0)
								.setColor(getCssVar('--bg3'))
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

							// pause
							this.scene.pause();
						},
						update: function () {
							// draw obstacles
							if (!this.createdObstacles) {
								if (!this.gameData?.obstacles) return;

								// loop through each obstacle data
								for (const data of this.gameData.obstacles) {
									// create image
									const img = this.add.image(data.x, 366, 'terrain16x16', data.frame).setDepth(1);

									// add to obstacles group
									this.obstacles.add(img);
								}

								// mark obstacles as created to only do this once
								this.createdObstacles = true;
							}

							// update players
							for (let id of Object.entries(this.players)) {
								const player = id[1]?.playerData;
								id = id[0];

								// if player sprite doesn't exist
								if (this.players[id] == null)
									// create sprite
									this.spawnPlayer(id, player);
								// otherwise update player sprite
								else if (player && this.players[id]) {
									// set player position
									this.players[id]?.setPosition(player.x, player.y);

									// camera follow
									if (id == this.socket.id)
										this.cameras.main._scrollX = player.x - this.sys.game.canvas.width / 2;

									// move spice and ice
									this.players[id]?.spice.setPosition(player.x, player.y);
									this.players[id]?.frozen.setPosition(player.x, player.y);
									this.players[id]?.spice2.setPosition(player.spice2?.x, player.spice2?.y);

									// set nick position
									this.players[id]?.nick.setPosition(
										player.x + this.nickPositionOffset.x,
										player.y + this.nickPositionOffset.y
									);

									// show ice if frozen
									this.players[id].frozen.visible = player.frozen;

									// show spice
									const showSpice =
										player.abilities &&
										'spice' in player.abilities &&
										player.abilities.spice.effect > 0;
									this.players[id].spice.visible = showSpice;
									if (showSpice) this.players[id].spice.play('spice', true);
									this.players[id].spice2.visible = player.spice2?.visible || false;

									// player direction
									this.players[id].flipX = player.flipX || false;

									// player animations
									if (this.players[id].playerData.anim_idle) {
										if (this.players[id].playerData.alive) {
											if (player.move.x == 0)
												this.players[id]?.play(this.players[id].playerData.anim_idle, true);
											else this.players[id]?.play(this.players[id].playerData.anim_walk, true);
										} else {
											this.players[id]?.play(this.players[id].playerData.anim_dead, true);
										}
									}

									// player nick
									if (player.nick) this.players[id].nick.setText(player.nick);
								}
							}

							// update ability images
							if (this.players[this.socket.id] && !this.abilityImgsSet) {
								const role = this.players[this.socket.id].playerData.role;

								if (!role) return;

								this.abilityImgsSet = true;

								const json = this.cache.json.get('abilities');

								if (!json[role]) return;

								const abilities = Object.keys(json[role]);

								for (let i = 0; i < abilities.length; i++) {
									const ability = abilities[i];

									this['abilityBtn' + (i + 1)].dataset.ability = ability;
									this['abilityImg' + (i + 1)].src =
										this.abilityImgsURL + role + '/' + ability + '.png';
									this['abilityBtn' + (i + 1)].style.display = 'unset';
								}

								console.log('Updated abilities');
							}

							// update ability cooldowns
							if (this.players[this.socket.id]) {
								if (this.players[this.socket.id]?.playerData?.abilities) {
									for (const ability of Object.entries(
										this.players[this.socket.id].playerData.abilities
									)) {
										// get span
										const btn = this.abilitiesDiv.querySelector(
											`button.ability[data-ability=${ability[0]}]`
										);
										if (!btn) continue;
										const span = btn.querySelector('span.ability-cooldown');

										// disable button
										if (ability[1].cooldown > 10) btn.disabled = true;
										else btn.disabled = false;

										// set cooldown
										span.innerText = Math.ceil(ability[1].cooldown / 60);
									}

									const disabled = document.querySelectorAll('button.ability[disabled]');
									for (const btn of disabled) {
										if (
											this.players[this.socket.id] &&
											this.players[this.socket.id].abilities &&
											!(btn.dataset.ability in this.players[this.socket.id]?.abilities)
										)
											btn.disabled = false;
									}
								}
							}

							// loading text
							if (this.loadingTextShow) {
								// make it visible
								this.loadingText.visible = true;

								// if game starting show timer
								if (this.gameData.starting && !this.gameData.started) {
									this.loadingTextMessage = `Game starting in ${Math.ceil(
										this.gameData.startingTime / 60
									)} seconds`;
								}

								// if game started show killers timer
								else if (
									this.gameStarted &&
									this.gameData.releaseKillersTime < this.gameData.releaseKillersMaxTime
								) {
									this.loadingTextMessage = `Releasing killers in ${Math.ceil(
										this.gameData.releaseKillersTime / 60
									)} seconds`;

									// if time's up
									if (this.gameData.releaseKillersTime <= 0) {
										// change text
										this.loadingTextMessage = 'Killers released!';

										// hide three dots
										this.loadingTextDots = false;

										// hide text in a few secs
										this.time.delayedCall(
											3000,
											function () {
												this.loadingTextShow = false;
											},
											undefined,
											this
										);

										// hide killers wall
										this.killersPlat.setActive(false).setVisible(false);

										// update abilities
										console.log("Updating abilities because time's up");
										this.abilityImgsSet = false;
									}
								}

								// move the dots
								if (this.loadingTextDots) {
									this.loadingTextFrame++;
									if (this.loadingTextFrame == 5)
										this.loadingText.setText(`${this.loadingTextMessage}.  `.toUpperCase());
									else if (this.loadingTextFrame == 10)
										this.loadingText.setText(`${this.loadingTextMessage}.. `.toUpperCase());
									else if (this.loadingTextFrame == 15)
										this.loadingText.setText(`${this.loadingTextMessage}...`.toUpperCase());
									else if (this.loadingTextFrame == 20)
										this.loadingText.setText(`${this.loadingTextMessage} ..`.toUpperCase());
									else if (this.loadingTextFrame == 25)
										this.loadingText.setText(`${this.loadingTextMessage}  .`.toUpperCase());
									else if (this.loadingTextFrame >= 30) {
										this.loadingText.setText(`${this.loadingTextMessage}   `.toUpperCase());
										this.loadingTextFrame = 0;
									}
								} else {
									this.loadingTextFrame = 0;
									this.loadingText.setText(this.loadingTextMessage.toUpperCase());
								}
							} else {
								this.loadingText.visible = false;
							}

							// animate finish line
							this.finishLine.play('finish_flag', true);
						}
					}
				})
			);
		}
	});
</script>

<h3 class="game-overlay-text">
	{gameOverlayText}
</h3>

<div id="game">
	<!-- Phaser canvas goes here -->
</div>

<div class="abilities">
	{#each Object.entries(abilities[role]) as [abilityId, ability]}
		<div class="ability">
			<img src="/img/abilities/{role}/{abilityId}.png" alt={abilityId} class="pixelated" />
		</div>
	{/each}
</div>

<style>
	.game-overlay-text {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);

		color: var(--orange);
	}

	.abilities {
		position: fixed;
		bottom: 16px;
		left: 16px;

		display: flex;
	}

	.ability {
		width: 96px;
		height: 96px;
		aspect-ratio: 1;
		border-radius: 50%;

		background-color: var(--grey);
	}

	.ability img {
		width: 100%;
		height: 100%;
	}
</style>
