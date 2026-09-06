const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {};

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  return code;
}

io.on("connection", (socket) => {

  socket.on("createRoom", () => {
    let code = makeCode();

    while (rooms[code]) {
      code = makeCode();
    }

    rooms[code] = {
      players: {}
    };

    rooms[code].players[socket.id] = {
      playerNumber: 1
    };

    socket.join(code);

    socket.emit("roomCreated", {
      code: code,
      playerNumber: 1
    });
  });

  socket.on("joinRoom", (code) => {
    code = String(code).toUpperCase().trim();

    if (!rooms[code]) {
      socket.emit("joinError", "Room not found.");
      return;
    }

    const playerCount =
      Object.keys(rooms[code].players).length;

    if (playerCount >= 2) {
      socket.emit("joinError", "That room is full.");
      return;
    }

    rooms[code].players[socket.id] = {
      playerNumber: 2
    };

    socket.join(code);

    socket.emit("roomJoined", {
      code: code,
      playerNumber: 2
    });

    io.to(code).emit("startGame");
  });

  socket.on("playerUpdate", (data) => {
    if (!data.room) {
      return;
    }

    socket.to(data.room).emit("opponentUpdate", {
      x: data.x,
      y: data.y,
      vx: data.vx,
      vy: data.vy
    });
  });

  socket.on("slowOpponent", (room) => {
    socket.to(room).emit("getSlowed");
  });

  socket.on("playerWon", (room) => {
    socket.to(room).emit("opponentWon");
  });

  socket.on("disconnect", () => {
    for (const code in rooms) {

      if (rooms[code].players[socket.id]) {

        delete rooms[code].players[socket.id];

        io.to(code).emit("opponentLeft");

        if (
          Object.keys(rooms[code].players).length === 0
        ) {
          delete rooms[code];
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Race Rift running on port " + PORT);
});