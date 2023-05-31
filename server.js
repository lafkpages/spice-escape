const express = require("express");
const http = require("http");
const cors = require("cors");
const socketio = require("socket.io");
const abilities = require("./static/abilities.json");

abilities.killer.spice.hitbox.dx = abilities.killer.spice.hitbox.x / 2;
abilities.killer.spice.hitbox.dy = abilities.killer.spice.hitbox.y / 2;
abilities.runner.heal.hitbox.dx = abilities.runner.heal.hitbox.x / 2;
abilities.runner.heal.hitbox.dy = abilities.runner.heal.hitbox.y / 2;

const app = express();
const server = http.createServer(app);
const io = new socketio.Server(server, {
  allowEIO3: true,
});

const minPlayersInRoom = 2;
const maxPlayersInRoom = 12;
const minKillersInRoom = 1;
const maxKillersInRoom = 2;
const minRunnersInRoom = 1;
const maxRunnersInRoom = 10;
const gameStartingTime = 900; // 600 frames = 10s
const releaseKillersMaxTime = 600; // 900 frames = 15s
const obstaclesPerRoom = 100;
const obstaclesXYBounds = [300, 8000];

const gravity = 0.1;
const jumpAcc = 3;
const downAcc = 5;
const spice2Speed = 4;
const groundY = 359;
const finishX = 8102;

const maxNickLength = 20;

// CORS
app.use(
  cors({
    origin: [
      "https://spice-escape.luisafk.repl.co",
      "https://spice-escape.onrender.com",
      "https://spice-escape.com"
    ],
  })
);

// serve web app origin associations with proper MIME type
app.get("/.well-known/web-app-origin-association", (req, res) => {
  res.set("Content-Type", "application/json");
  res.sendFile(
    __dirname + "/static/.well-known/web-app-origin-association.json"
  );
});

// serve static files
app.use(express.static(__dirname + "/static"));

function getGameRoomIDs() {
  return [...io.sockets.adapter.rooms.keys()].filter((roomId) =>
    roomId.startsWith(gameRoomPrefix)
  );
}

function join(socket, roomId = null) {
  const final = roomId || gameRoomPrefix + lastId;
  socket.join(final);
  players[socket.id].roomId = final;
  lastId++;

  const size = io.sockets.adapter.rooms.get(final).size;

  if (!roomData[final]) {
    roomData[final] = {
      starting: false,
      startingTime: gameStartingTime,
      started: false,
      ended: false,
      releaseKillersTime: releaseKillersMaxTime,
      obstacles: [],
    };

    // generate random obstacles
    for (let i = 0; i < obstaclesPerRoom; i++) {
      const x = Math.floor(
        Math.random() * (obstaclesXYBounds[1] - obstaclesXYBounds[0] + 1) +
          obstaclesXYBounds[0]
      );

      roomData[final].obstacles.push({
        x,
        frame: 35,
      });
    }
  }

  // chose role
  players[socket.id].role = "runner";
  players[socket.id].color = "blue";
  players[socket.id].anim_walk = `blue_walk`;
  players[socket.id].anim_idle = `blue_idle`;
  players[socket.id].anim_dead = `blue_dead`;

  // send new player message to the room
  socket.to(final).emit("new player", socket.id);

  // send players to new user
  for (const id of io.sockets.adapter.rooms.get(final)) {
    socket.emit("new player", id);
  }

  // start starting counter when minimum players join
  if (size >= minPlayersInRoom) {
    roomData[final].starting = true;
    roomData[final].startingTime = gameStartingTime;

    // send message to users
    io.to(final).emit("game starting", gameStartingTime);
  }
}

function start(roomId) {
  // if not already started
  if (roomData[roomId].started) return;

  // save started
  roomData[roomId].started = true;

  // send to players
  io.to(roomId).emit("start game");

  // choose role
  let killers = [];
  const numKillers =
    io.sockets.adapter.rooms.get(roomId).size <
    Math.floor(maxPlayersInRoom / maxKillersInRoom - 0.5)
      ? minKillersInRoom
      : maxKillersInRoom;
  for (let i = 0; i < numKillers; i++) {
    let r = null;
    while (true) {
      r = Math.floor(Math.random() * io.sockets.adapter.rooms.get(roomId).size);
      if (!killers.includes(r)) break;
    }
    killers.push(r);
  }

  // reset players
  let i = 0;
  for (const id of io.sockets.adapter.rooms.get(roomId)) {
    const player = players[id];

    // set role
    if (killers.includes(i)) players[id].role = "killer";
    players[id].color = players[id].role == "killer" ? "red" : "blue";
    players[id].anim_walk = `${players[id].color}_walk`;
    players[id].anim_idle = `${players[id].color}_idle`;
    players[id].anim_dead = `${players[id].color}_dead`;

    // set positions depending on role
    switch (player.role) {
      case "runner":
        player.x = 400;
        player.y = groundY;
        break;

      case "killer":
        player.x = 40;
        player.y = groundY;
    }

    // make player alive
    player.alive = true;

    // reset abilities
    for (const ability of Object.keys(abilities[player.role])) {
      player.abilities[ability] = {
        effect: 0,
        cooldown: (abilities[player.role][ability].cooldown / 2) * 60,
      };
    }

    // save player
    players[id] = player;

    // increment counter
    i++;
  }
}

function logRooms() {
  const ids = getGameRoomIDs();
  console.log(
    "Rooms:",
    ids.length == 0
      ? "none"
      : ids
          .map((room) => `${room}(${io.sockets.adapter.rooms.get(room).size})`)
          .join(",")
  );
}

// socket.io
const gameRoomPrefix = "game_";
let lastId = 0;
let players = {};
let roomData = {};
io.on("connection", (socket) => {
  const gameRooms = getGameRoomIDs();

  players[socket.id] = {
    nick: "PLAYER",

    x: 400,
    y: 250,

    move: {
      x: 0,
      y: 0,
    },

    abilities: {},
    spice2: {
      x: 400,
      y: 350,
      dir: 1,
      visible: false,
    },

    flipX: false,

    roomId: null,

    role: null,
    anim_idle: null,
    anim_walk: null,
    anim_dead: null,

    alive: true,
  };

  // if no game rooms exist
  if (gameRooms.length == 0) {
    join(socket);
  } else {
    // get the room with most users
    let joined = false;
    for (const roomId of getGameRoomIDs()) {
      const size = io.sockets.adapter.rooms.get(roomId).size;

      if (roomData[roomId].started || size >= maxPlayersInRoom)
        // game is full
        continue;

      join(socket, roomId);
      joined = true;
      break;
    }

    // if all games are full
    if (!joined) {
      join(socket);
    }
  }

  logRooms();

  socket.on("ping", (callback) => {
    callback();
  });

  socket.on("nick", (nick) => {
    nick = nick
      .trim()
      .substr(0, maxNickLength)
      .replace(/['"\/\\<>\u200b\u2800]/gi, "")
      .toUpperCase();
    if (nick) players[socket.id].nick = nick;
  });

  socket.on("move", (data) => {
    if (typeof data == "object") {
      if (typeof data.x == "number") players[socket.id].move.x = data.x;

      if (players[socket.id].move.x > 1) players[socket.id].move.x = 1;
      else if (players[socket.id].move.x < -1) players[socket.id].move.x = -1;

      players[socket.id].flipX =
        players[socket.id].move.x > 0
          ? false
          : players[socket.id].move.x < 0
          ? true
          : players[socket.id].flipX;
    }
  });

  socket.on("jump", () => {
    if (
      !players[socket.id].frozen &&
      players[socket.id].alive &&
      players[socket.id].y >= groundY
    ) {
      players[socket.id].move.y = -jumpAcc;
    }
  });

  socket.on("down", () => {
    if (players[socket.id].y < groundY) {
      players[socket.id].move.y = downAcc;
    }
  });

  socket.on("ability", (ability, callback) => {
    if (!ability) {
      callback(false);
      return;
    }

    if (ability in players[socket.id].abilities) {
      callback(false);
      return;
    }

    try {
      players[socket.id].abilities[ability] = {
        cooldown: abilities[players[socket.id].role][ability].cooldown * 60,
        effect: abilities[players[socket.id].role][ability].effect * 60,
      };
    } catch (err) {
      console.error("Error on ability:", err);
      callback(false);
      return;
    }

    switch (ability) {
      case "freeze":
        // for each player in room
        for (const id of io.sockets.adapter.rooms.get(
          players[socket.id].roomId
        )) {
          // check player has opposite role of player doing ability
          if (players[socket.id].role != players[id].role) {
            // freeze player
            players[id].frozen = true;

            // save frozen time
            players[id].frozenTime =
              players[socket.id].abilities[ability].effect;
          }
        }
        break;
      case "heal":
        // get nearest player
        let found_player_to_heal = false;
        for (const id of io.sockets.adapter.rooms.get(
          players[socket.id].roomId
        )) {
          // check player is in heal hitbox
          if (
            id != socket.id &&
            !players[id].alive &&
            players[id].role == "runner" &&
            players[id].x >=
              players[socket.id].x - abilities.runner.heal.hitbox.dx &&
            players[id].x <=
              players[socket.id].x + abilities.runner.heal.hitbox.dx &&
            players[id].y >=
              players[socket.id].y - abilities.runner.heal.hitbox.dy &&
            players[id].y <=
              players[socket.id].y + abilities.runner.heal.hitbox.dy
          ) {
            found_player_to_heal = true;

            // after ability effect, revive player
            setTimeout(() => {
              if (players[id]) players[id].alive = true;
            }, abilities.runner.heal.effect * 1000);
          }
        }

        // if no player can be healed
        if (!found_player_to_heal) {
          // don't trigger ability
          callback(false);
          delete players[socket.id].abilities.heal;
          return;
        }
      case "spice2":
        // set spice2 position to player position
        players[socket.id].spice2.x = players[socket.id].x;
        players[socket.id].spice2.y = players[socket.id].y;
        players[socket.id].spice2.dir = players[socket.id].flipX ? -1 : 1;
        players[socket.id].spice2.visible = true;
    }

    callback(players[socket.id].abilities[ability]);
  });

  socket.on("disconnect", (reason) => {
    // send message to other players in room
    // so they remove the player
    io.to(players[socket.id].roomId).emit("player leave", socket.id);

    // if game was starting but cannot start anymore, cancel start
    if (
      roomData[players[socket.id].roomId].starting &&
      io.sockets.adapter.rooms.get(players[socket.id].roomId).size <
        minPlayersInRoom
    ) {
      roomData[players[socket.id].roomId].starting = false;
      roomData[players[socket.id].roomId].startingTime = gameStartingTime;
    }

    // remove player from memory
    delete players[socket.id];

    // log rooms
    logRooms();
  });
});

// game loop
let sendData = true;
setInterval(() => {
  for (let roomId of getGameRoomIDs()) {
    const roomPlayerIDs = io.sockets.adapter.rooms.get(roomId);
    let roomPlayers = {};

    let allExceptKillersDead = true;
    let allExceptKillersFinished = true;

    if (!roomData[roomId].ended) {
      for (let player_id of roomPlayerIDs) {
        const player = players[player_id];

        // check if all players are dead
        if (player.alive && player.role != "killer")
          allExceptKillersDead = false;

        // check if all players are past the finish line
        if (player.role != "killer" && !player.finishLine)
          allExceptKillersFinished = false;

        // check if player is frozen
        if (player.frozen) {
          // decrement frozen time
          player.frozenTime--;

          // check if frozen time is over
          if (player.frozenTime <= 0) player.frozen = false;
        } else if (
          player.alive &&
          (!("heal" in player.abilities) || player.abilities.heal?.effect <= 0)
        ) {
          // move player
          player.x +=
            player.move.x *
            ("sprint" in player.abilities && player.abilities.sprint.effect > 0
              ? abilities[player.role].sprint?.speed || 1
              : 1);
        }

        // gravity
        player.y += player.move.y;
        if (player.y < groundY) player.move.y += gravity;
        else player.move.y = 0;

        // if is a killer not released yet
        if (
          player.role == "killer" &&
          roomData[roomId].releaseKillersTime > 0
        ) {
          // can't pass the killers wall
          if (player.x > 74) player.x = 74;
        }

        // has gone past finish line
        if (player.x >= finishX) {
          player.finishLine = true;
        }

        // walls
        if (player.x < 18) player.x = 18;
        else if (player.x > 8182) player.x = 8182;
        if (player.y < 140) player.y = 140;
        else if (player.y > groundY) player.y = groundY;

        // reduce abilities cooldown
        for (const ability of Object.keys(player.abilities)) {
          player.abilities[ability].cooldown--;

          if (player.abilities[ability].effect > 0)
            player.abilities[ability].effect--;

          if (player.abilities[ability].cooldown <= 0) {
            delete player.abilities[ability];
          }
        }

        // spice ability kills
        const doingSpice =
          player.abilities.spice && player.abilities.spice.effect > 0;
        const doingSpice2 = player.abilities.spice2 && player.spice2.visible;
        if (doingSpice || doingSpice2) {
          // check all other players
          for (const id of roomPlayerIDs) {
            // check for the hitbox and skip current player and other killers
            if (
              doingSpice &&
              player_id != id &&
              players[id].role != "killer" &&
              players[id].alive &&
              players[id].x >= player.x - abilities.killer.spice.hitbox.dx &&
              players[id].x <= player.x + abilities.killer.spice.hitbox.dx &&
              players[id].y >= player.y - abilities.killer.spice.hitbox.dy &&
              players[id].y <= player.y + abilities.killer.spice.hitbox.dy
            ) {
              // mark player as dead
              players[id].alive = false;
            }

            // check also for spice2
            if (
              doingSpice2 &&
              player_id != id &&
              players[id].role != "killer" &&
              players[id].alive &&
              player.spice2.x >= players[id].x - 20 &&
              player.spice2.x <= players[id].x + 20 &&
              player.spice2.y >= players[id].y - 20 &&
              player.spice2.y <= players[id].y + 20
            ) {
              // hide spice2
              player.spice2.visible = false;

              // mark player as dead
              players[id].alive = false;
            }
          }
        }

        // move spice2
        if (player.spice2.visible)
          player.spice2.x += spice2Speed * player.spice2.dir;

        roomPlayers[player_id] = player;
      }

      if (sendData)
        io.to(roomId).volatile.emit("game data", {
          releaseKillersMaxTime,
          ...roomData[roomId],
          players: roomPlayers,
        });
    }

    // decrease starting counter
    if (roomData[roomId].starting && roomData[roomId].startingTime > 0) {
      roomData[roomId].startingTime--;
    }

    // if starting counter finishes
    if (
      !roomData[roomId].started &&
      roomData[roomId].starting &&
      roomData[roomId].startingTime <= 0
    ) {
      start(roomId);
    }

    // decrease release killers counter
    if (roomData[roomId].started && roomData[roomId].releaseKillersTime > 0) {
      roomData[roomId].releaseKillersTime--;
    }

    // check if runners won
    if (
      roomData[roomId].started &&
      !roomData[roomId].ended &&
      allExceptKillersFinished
    ) {
      roomData[roomId].ended = true;
      roomData[roomId].winners = "runner";

      // send message to players
      io.to(roomId).emit("game ended", roomData[roomId].winners);
      console.log("Runners won in room", roomId);
    }

    // check if killers won
    else if (
      roomData[roomId].started &&
      !roomData[roomId].ended &&
      allExceptKillersDead &&
      roomData[roomId].releaseKillersTime < releaseKillersMaxTime - 300
    ) {
      roomData[roomId].ended = true;
      roomData[roomId].winners = "killer";

      // send message to players
      io.to(roomId).emit("game ended", roomData[roomId].winners);
      console.log("Killers won in room", roomId);
    }
  }

  sendData = !sendData;
}, 1000 / 60);

server.listen(3000);
