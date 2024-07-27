class Entity {
  constructor() {
    this.id = server.lastId++;
    this.entityType = null;
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.radius = 0;
    this.speed = 0;
    this.color = "#000";
    this.update = null;
  }
}

module.exports = Entity;