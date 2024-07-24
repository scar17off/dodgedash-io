class Player {
  constructor() {
    this.id = server.lastId++;
    this.x = 0;
    this.y = 0;
  }
}

module.exports = Player;