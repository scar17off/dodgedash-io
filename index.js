const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require('fs');
const path = require('path');
const config = require("./config.json");

const Player = require("./modules/player/Player");
const Area = require("./modules/Area");

const app = express();
app.use(cors());
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

global.server = {
  lastId: 0,
  clients: [],
  areas: []
}

const { heroType } = require("./modules/protocol.json");

function copyProtocolToReact() {
  const sourceFile = path.join(__dirname, 'modules', 'protocol.json');
  const destFile = path.join(__dirname, 'react', 'src', 'protocol.json');

  fs.copyFile(sourceFile, destFile, (err) => {
    if (err) {
      console.error('Error copying protocol.json:', err);
    }
  });
}

copyProtocolToReact();

const mainArea = new Area();
server.areas.push(mainArea);

io.on("connection", socket => {
  console.log("Client connected");
  const player = new Player(socket, mainArea);
  
  socket.on('spawn', ({ nickname, hero }) => {
    player.name = nickname;
    player.heroType = heroType.find(h => h.name === hero)?.id || 0;
    server.clients.push(player);
    mainArea.players.push(player);
    
    // Send area data to the client
    socket.emit('areaData', mainArea.getAreaData());

    // Send player data to the client
    const playerData = {
      id: player.id,
      x: player.position.x,
      y: player.position.y,
      radius: player.radius,
      speed: player.speed,
      color: player.color,
      name: player.name
    };
    socket.emit('playerData', playerData);
  });

  socket.on('playerInput', (input) => {
    player.handleInput(input);
  });

  socket.on('disconnect', () => {
    const index = server.clients.indexOf(player);
    if (index !== -1) {
      server.clients.splice(index, 1);
    }
    console.log("Client disconnected");
  });
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.get("/protocol", (req, res) => {
  res.sendFile(__dirname + "/modules/protocol.json");
});

const gameLoop = () => {
  for (const client of server.clients) {
    client.update();
    const playerData = {
      x: client.position.x,
      y: client.position.y,
      radius: client.radius,
      speed: client.speed,
      color: client.color,
      name: client.name
    };
    client.socket.emit('playerUpdate', playerData);
    client.socket.broadcast.emit('playerMove', { id: client.id, ...playerData });
  }
  setTimeout(gameLoop, 1000 / config.fps); // 60 FPS
};
gameLoop();

httpServer.listen(443, () => {
  console.log("Server is running on port 443");
});