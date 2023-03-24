// redirect to deployment
if (window.location.origin.endsWith('.repl.co') && !window.location.search.includes('dev')) {
  window.location.replace('https://spice-escape-luisafk.replit.app');
}

let config = {
  gameTitle: 'Spice Escape',
  gameURL: location.origin,
  gameVersion: '1.0',
  inputMouse: false,
  inputTouch: false,
	type: Phaser.AUTO,
  renderer: Phaser.WEBGL,
  antialias: false,
  crisp: true,
  pixelArt: true,
  roundPixels: true,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%'
  },
  scene: {
    preload,
    create,
    update
  },
  parent: 'game',
  disableContextMenu: true,
  fps: {
    target: 30,
    //forceSetTimeOut: true
  }
};

const game = new Phaser.Game(config);

let has_set_events = false;

let parsedUrl = new URL(location.href);

function preload() {
  console.log('Preloading assets');
  
  // load game data
  this.load.json('abilities', '/abilities.json');

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
  this.socket = io({
    autoConnect: false,
    reconnection: false
  });

  // when connected to the server
  this.socket.on('connect', () => {
    // resume Phaser
    this.scene.resume();
    
    // hide home screen
    this.homeScreen.style.display = 'none';

    // change text
    this.loadingTextMessage = 'Joining game';
  });

  // when disconnected from the server
  this.socket.on('disconnect', reason => {
    // log
    console.log('Socket.IO disconnected:', reason);

    // pause Phaser
    this.scene.pause();

    // ignore our disconnects
    if (reason == 'io client disconnect') return;

    // go to home
    this.gameEndHomeBtn.click();

    // alert
    alert('Disconnected from server');
  });
}

function create() {
  console.log('Creating animations');
  
  // create animations
  this.anims.create({
    key: 'blue_idle',
    frames: this.anims.generateFrameNumbers('players', { frames: [ 0, 1, 2, 3 ] }),
    frameRate: 8,
    repeat: -1
  });
  this.anims.create({
    key: 'blue_walk',
    frames: this.anims.generateFrameNumbers('players', { frames: [ 32, 33, 34, 35, 36, 37, 38, 39 ] }),
    frameRate: 8,
    repeat: -1
  });
  this.anims.create({
    key: 'blue_dead',
    frames: this.anims.generateFrameNumbers('players', { frames: [ 134, 135 ] }),
    frameRate: 3,
    repeat: -1
  });
  this.anims.create({
    key: 'red_idle',
    frames: this.anims.generateFrameNumbers('players', { frames: [ 16, 17, 18, 19 ] }),
    frameRate: 8,
    repeat: -1
  });
  this.anims.create({
    key: 'red_walk',
    frames: this.anims.generateFrameNumbers('players', { frames: [ 48, 49, 50, 51, 52, 53, 54, 55 ] }),
    frameRate: 8,
    repeat: -1
  });
  this.anims.create({
    key: 'red_dead',
    frames: this.anims.generateFrameNumbers('players', { frames: [ 150, 151 ] }),
    frameRate: 3,
    repeat: -1
  });
  this.anims.create({
    key: 'finish_flag',
    frames: this.anims.generateFrameNumbers('flags', { frames: [ 1, 2, 3, 4, 5, 6, 7, 8 ] }),
    frameRate: 3,
    repeat: -1
  });
  this.anims.create({
    key: 'spice',
    frames: this.anims.generateFrameNumbers('spice', { frames: [ 0, 1, 2, 3, 4, 5 ] }),
    frameRate: 8
  });

  // get CSS variables function
  this.getVar = name => getComputedStyle(document.documentElement)
    .getPropertyValue(name).trim();

  // background
  this.cameras.main.setBackgroundColor(this.getVar('--bg2'));

  // home screen
  this.homeScreen = document.querySelector('div#home');
  this.nickContainer = this.homeScreen.querySelector('div#nick-container');
  this.nickInp = this.nickContainer.querySelector('input#nick-inp');
  this.playBtn = this.nickContainer.querySelector('button#play-btn');
  this.homeHeader = this.homeScreen.querySelector('header');

  // focus nick input
  setTimeout(() => {
    this.nickInp.focus();

    // automatic nick from URL
    if (parsedUrl.searchParams.has('nick')) {
      this.nickInp.value = parsedUrl.searchParams.get('nick');
    }
  }, 500);

  // header hot sauce
  this.headerHotSauce = this.homeHeader.querySelector('img#header-hot-sauce');

  this.setHeaderHotSauce = e => {
    // show header
    this.homeHeader.style.visibility = 'visible';

    // show nick container
    this.nickContainer.style.visibility = 'visible';

    // get header positions
    //const pos = this.homeHeader.getBoundingClientRect();

    // position hot sauce
    //this.headerHotSauce.style.top = /*pos.top +*/ 96 + 'px';
    //this.headerHotSauce.style.left = pos.left + 748 + 'px';

    // do header transition
    this.homeHeader.style.animationName = 'header-anim';

    // do nick transition
    this.nickContainer.style.animationName = 'nick-anim';

    // fix horizontal scroll bug
    if (this.adsContainer) {
      this.adsContainer.scrollIntoView();
    }
  };
  this.setHeaderHotSauce();
  if (!has_set_events)
    window.addEventListener('resize', this.setHeaderHotSauce.bind(this));

  // when play button clicked
  if (!has_set_events)
    this.playBtn.addEventListener('click', e => {
      // connect to server
      this.socket.connect();
  
      // send name to server
      this.socket.emit('nick', this.nickInp.value);

      // document.body.requestFullscreen({
      //   navigationUI: 'hide'
      // });
    });

  // platforms
  this.killersPlat = this.add.image(100, 358, 'terrain16x16', 34).setDepth(1).setScale(2);
  this.downPlat = this.add.tileSprite(4096, 382, 9512, 16, 'terrain16x16', 65).setDepth(1);
  this.downPlatBC = this.add.tileSprite(this.downPlat.x, 800, this.downPlat.width, 16, 'terrain16x16', 129).setDepth(1);
  this.downPlatBL = this.add.image(-653, this.downPlatBC.y, 'terrain16x16', 128).setDepth(1);
  this.downPlatTL = this.add.image(this.downPlatBL.x, this.downPlat.y, 'terrain16x16', 64).setDepth(1);
  this.downPlatCC = this.add.tileSprite(this.downPlat.x, 591, this.downPlat.width, 416, 'terrain16x16', 97).setDepth(1);
  this.downPlatCL = this.add.tileSprite(this.downPlatBL.x, 591, 16, 416, 'terrain16x16', 96).setDepth(1);
  this.downPlatTR = this.add.image(8845, this.downPlat.y, 'terrain16x16', 66).setDepth(1);
  this.downPlatBR = this.add.image(this.downPlatTR.x, this.downPlatBC.y, 'terrain16x16', 130).setDepth(1);
  this.downPlatCR = this.add.tileSprite(this.downPlatTR.x, this.downPlatCL.y, 16, 416, 'terrain16x16', 98).setDepth(1);

  // finish line
  this.finishLine = this.add.sprite(8100, 358, 'flags', 1);

  // ability buttons
  this.abilitiesDiv = document.querySelector('div#abilities');
  this.abilityBtn1 = this.abilitiesDiv.querySelector('div#abilities button#ability-1.ability');
  this.abilityBtn1.disabled = false;
  this.abilityCooldown1 = this.abilityBtn1.querySelector('span.ability-cooldown');
  this.abilityImg1 = this.abilityBtn1.querySelector('img.ability-img');
  this.abilityBtn2 = this.abilitiesDiv.querySelector('div#abilities button#ability-2.ability');
  this.abilityBtn2.disabled = false;
  this.abilityCooldown2 = this.abilityBtn2.querySelector('span.ability-cooldown');
  this.abilityImg2 = this.abilityBtn2.querySelector('img.ability-img');
  this.abilityBtn3 = this.abilitiesDiv.querySelector('div#abilities button#ability-3.ability');
  this.abilityBtn3.disabled = false;
  this.abilityCooldown3 = this.abilityBtn3.querySelector('span.ability-cooldown');
  this.abilityImg3 = this.abilityBtn3.querySelector('img.ability-img');
  this.abilityBtn4 = this.abilitiesDiv.querySelector('div#abilities button#ability-4.ability');
  this.abilityBtn4.disabled = false;
  this.abilityCooldown4 = this.abilityBtn4.querySelector('span.ability-cooldown');
  this.abilityImg4 = this.abilityBtn4.querySelector('img.ability-img');
  this.abilityImgsSet = false;
  this.abilityImgsURL = '/img/abilities/';

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
    this.players[id].nick = this.add.text(data.x + this.nickPositionOffset.x, data.y + this.nickPositionOffset.y, '', {
      fontFamily: 'Spice Escape',
      fontSize: 15,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0.5).setDepth(5).setAlign('center');

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
  }

  // obstacles
  this.obstacles = this.physics.add.staticGroup();
  this.createdObstacles = false;

  // game data
  this.gameData = {};

  // when a player joins the game
  this.socket.on('new player', id => {
    this.players[id] = null;

    // check if it's the current player
    if (id == this.socket.id) {
      // check if all players are here
      // TODO
      this.loadingTextMessage = 'Waiting for players';
    }
  });

  // when game is starting
  this.socket.on('game starting', counter => {
    // change text
    this.loadingTextMessage = `Game starting in ${Math.ceil(counter / 60)} seconds`;

    // refresh abilities
    this.abilityImgsSet = false;
  });

  // when player data is received from the server
  this.socket.on('game data', data => {
    // save data in class properties
    for (const key of Object.keys(data)) {
      if (['players'].includes(key))
        continue;

      this.gameData[key] = data[key];
    }

    // save players separately
    for (let entry of Object.entries(data.players))
      if (this.players[entry[0]])
        this.players[entry[0]].playerData = entry[1];
  });

  // when a player leaves
  this.socket.on('player leave', id => {
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
  this.socket.on('game ended', winnerRole => {
    // set end screen title
    this.gameEndTitle.innerText = `${winnerRole}s won`;

    // check if current player was a winner
    this.gameEndTitle.classList.remove('victory');
    this.gameEndTitle.classList.remove('defeat');
    if (this.players[this.socket.id]) {
      if (this.players[this.socket.id].playerData.role == winnerRole) {
        this.gameEndTitle.classList.add('victory');
      }
      else {
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
    this.time.delayedCall(500, function() {
      this.socket.disconnect();
    }, undefined, this);
  });

  // game end screen
  this.gameEndScreen = document.querySelector('div#end-screen');
  this.gameEndTitle = this.gameEndScreen.querySelector('#end-screen-title');
  this.gameEndWinners = this.gameEndScreen.querySelector('div#end-screen-winners');
  this.gameEndHomeBtn = this.gameEndScreen.querySelector('button#end-screen-home');

  // ads container
  this.adsContainer = document.querySelector('div#ads');

  // when home button is clicked
  if (!has_set_events)
    this.gameEndHomeBtn.addEventListener('click', e => {
      // hide game end screen
      this.gameEndScreen.style.display = 'none';
  
      // hide abilities
      this.abilityBtn1.style.display = 'none';
      this.abilityBtn2.style.display = 'none';
      this.abilityBtn3.style.display = 'none';
      this.abilityBtn4.style.display = 'none';
      this.abilityImgsSet = false;
  
      // show home screen
      this.homeScreen.style.display = '';
  
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
            console.error(id[1].frozen, err, '\nThese errors don\'t usually matter but only make your computer have less memory available :P');
          }
          delete this.players[id[0]];
          delete id;
        }
      }
  
      // restart the scene
      this.scene.restart();
    });

  // when game window loses focus
  if (!has_set_events)
    window.addEventListener('visibilitychange', e => {
      console.log(document.visibilityState)
    });

  
  // Loading text
  this.loadingText = this.add.text(this.sys.game.canvas.width / 2, this.sys.game.canvas.height / 4, 'STARTING...', {
    fontFamily: 'Spice Escape',
    fontSize: 32
  }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(0).setColor(this.getVar('--orange')).setAlign('center');
  this.loadingTextMessage = 'Connecting';
  this.loadingTextFrame = 0;
  this.loadingTextShow = true;
  this.loadingTextDots = true;

  // background texts
  this.runnerBgText = this.add.text(400, 300, 'RUNNERS, RUN TO\nTHE FINISH LINE!  -->', {
    fontFamily: 'Spice Escape',
    fontSize: 15
  }).setOrigin(0.5, 0.5).setDepth(0).setColor(this.getVar('--bg3')).setAlign('center');
  this.killerBgText = this.add.text(50, 300, 'KILLERS, KILL\nALL THE RUNNERS!', {
    fontFamily: 'Spice Escape',
    fontSize: 15
  }).setOrigin(0.5, 0.5).setDepth(0).setColor(this.getVar('--bg3')).setAlign('center');

  this.gameStarted = false;

  // scroll to zoom
  this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
    if (deltaY > 0 && this.cameras.main.zoom > 0.8) {
      this.cameras.main.zoom -= .1;
    }
    else if (deltaY < 0) {
      this.cameras.main.zoom += .1;
    }
    
    console.log('Scroll is currently at', this.cameras.main.zoom)
  });

  // key down
  this.input.keyboard.on('keydown', e => {
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
  this.input.keyboard.on('keyup', e => {
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
    this.abilitiesDiv.addEventListener('click', e => {
      if (e.target.matches('div#abilities button.ability')) {
        const ability = e.target.dataset.ability;
  
        this.socket.emit('ability', ability, resp => {
          if (resp == false) {
            console.error('Error activating ability, refreshing...');
            this.abilityImgsSet = false;
            return;
          }
  
          e.target.disabled = true;
          const dv = resp.cooldown / 60;
          e.target.querySelector('span.ability-cooldown').innerText = Math.ceil(dv);
          this.time.delayedCall(dv * 1000, function () {
            e.target.disabled = false;
          }, undefined, this);
        });
      }
    });

  // pause
  this.scene.pause();

  // save events done
  has_set_events = true;
}

function update() {
  // draw obstacles
  if (!this.createdObstacles) {
    if (!this.gameData?.obstacles)
      return;

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
      this.players[id]?.nick.setPosition(player.x + this.nickPositionOffset.x, player.y + this.nickPositionOffset.y);

      // show ice if frozen
      this.players[id].frozen.visible = player.frozen;

      // show spice
      const showSpice = player.abilities && 'spice' in player.abilities && player.abilities.spice.effect > 0;
      this.players[id].spice.visible = showSpice;
      if (showSpice)
        this.players[id].spice.play('spice', true);
      this.players[id].spice2.visible = player.spice2?.visible || false;

      // player direction
      this.players[id].flipX = player.flipX || false;

      // player animations
      if (this.players[id].playerData.anim_idle) {
        if (this.players[id].playerData.alive) {
          if (player.move.x == 0)
            this.players[id]?.play(this.players[id].playerData.anim_idle, true);
          else
            this.players[id]?.play(this.players[id].playerData.anim_walk, true);
        }
        else {
          this.players[id]?.play(this.players[id].playerData.anim_dead, true);
        }
      }

      // player nick
      if (player.nick)
        this.players[id].nick.setText(player.nick);
    }
  }

  // update ability images
  if (this.players[this.socket.id] && !this.abilityImgsSet) {
    const role = this.players[this.socket.id].playerData.role;

    if (!role)
      return;

    this.abilityImgsSet = true;
    
    const json = this.cache.json.get('abilities');

    if (!json[role])
      return;

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
        if (!btn)
          continue;
        const span = btn.querySelector('span.ability-cooldown');

        // disable button
        if (ability[1].cooldown > 10)
          btn.disabled = true;
        else
          btn.disabled = false;
  
        // set cooldown
        span.innerText = Math.ceil(ability[1].cooldown / 60);
      }

      const disabled = document.querySelectorAll('button.ability[disabled]');
      for (const btn of disabled) {
        if (this.players[this.socket.id] && this.players[this.socket.id].abilities && !(btn.dataset.ability in this.players[this.socket.id]?.abilities))
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
      this.loadingTextMessage = `Game starting in ${Math.ceil(this.gameData.startingTime / 60)} seconds`;
    }
      
    // if game started show killers timer
    else if (this.gameStarted && this.gameData.releaseKillersTime < this.gameData.releaseKillersMaxTime) {
      this.loadingTextMessage = `Releasing killers in ${Math.ceil(this.gameData.releaseKillersTime / 60)} seconds`;

      // if time's up
      if (this.gameData.releaseKillersTime <= 0) {
        // change text
        this.loadingTextMessage = 'Killers released!';

        // hide three dots
        this.loadingTextDots = false;

        // hide text in a few secs
        this.time.delayedCall(3000, function () {
          this.loadingTextShow = false;
        }, undefined, this);

        // hide killers wall
        this.killersPlat.setActive(false).setVisible(false);

        // update abilities
        console.log('Updating abilities because time\'s up');
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
    }
    else {
      this.loadingTextFrame = 0;
      this.loadingText.setText(this.loadingTextMessage.toUpperCase());
    }
  }
  else {
    this.loadingText.visible = false;
  }

  // animate finish line
  this.finishLine.play('finish_flag', true);
}

// service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => {
      console.log('Registered service worker');
    })
    .catch(err => {
      console.error('Error registering service worker:', err);
    });
}