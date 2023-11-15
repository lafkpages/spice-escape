export function update() {
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
				player.abilities && 'spice' in player.abilities && player.abilities.spice.effect > 0;
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
			this['abilityImg' + (i + 1)].src = this.abilityImgsURL + role + '/' + ability + '.png';
			this['abilityBtn' + (i + 1)].style.display = 'unset';
		}

		console.log('Updated abilities');
	}

	// update ability cooldowns
	if (this.players[this.socket.id]) {
		if (this.players[this.socket.id]?.playerData?.abilities) {
			for (const ability of Object.entries(this.players[this.socket.id].playerData.abilities)) {
				// get span
				const btn = this.abilitiesDiv.querySelector(`button.ability[data-ability=${ability[0]}]`);
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
