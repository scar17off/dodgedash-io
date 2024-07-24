const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);

io.on("connection", socket => {
  
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

httpServer.listen(443, () => {
  console.log("Server is running on port 443");
});