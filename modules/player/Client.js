const Player = require("./Player");

class Client {
  constructor(ws, req) {
    this.ws = ws;
    this.req = req;
    this.player = new Player(this.ws);
  }

  send(event, data) {
    this.ws.emit(event, data);
  }
}

module.exports = Client;