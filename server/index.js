const app = require("express")();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.get("/", function (req, res) {
  res.sendFile(__dirname + "/index.html");
});

const WORLD_SIZE = 10000;

const state = {
  players: {},
};

function gameLoop() {
  Object.entries(state.players).map(([id, player]) => {
    state.players[id] = updatePlayer(player);
  });
}

setInterval(gameLoop, 33);

function addPlayer(id) {
  const loc = [Math.random(WORLD_SIZE), Math.random(WORLD_SIZE)];
  console.log(`new player ${id} joined at ${loc}`);
  state.players[id] = { loc, v: [0, 0] };
}

function movePlayer(id, cmd) {
  state.players[id].loc = getNextLoc(state.players[id].loc, cmd);
}

function updatePlayer(player) {
  return add(player.loc, player.v);
}

function add(v1, v2) {
  return [v1[0] + v2[0], v1[1] + v2[1]];
}

function getNextLoc(loc, cmd) {
  switch (cmd) {
    case "up":
      return [loc[0], loc[1] + 1];
    case "down":
      return [loc[0], loc[1] - 1];
    case "left":
      return [loc[0] - 1, loc[1]];
    case "right":
      return [loc[0] + 1, loc[1]];
  }
}

io.on("connection", function (socket) {
  addPlayer(socket.id);

  socket.emit("update", state);

  socket.on("move", (cmd) => {
    console.log("received move event", cmd);
    movePlayer(socket.id, cmd);
    io.emit("update", state);
  });

  socket.on("disconnect", function () {
    console.log("user disconnected");
  });
});

http.listen(3000, function () {
  console.log("listening on *:3000");
});
