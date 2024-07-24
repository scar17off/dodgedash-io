const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const Player = require("./modules/player/Player");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

global.server = {
  lastId: 0,
  clients: []
}

io.on("connection", socket => {
  const player = new Player(socket);
  server.clients.push(player);
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

httpServer.listen(443, () => {
  console.log("Server is running on port 443");
});