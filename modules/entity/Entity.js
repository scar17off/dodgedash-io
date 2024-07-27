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

  collideCheck(entity) {
    if (Math.hypot(this.position.x - entity.position.x, this.position.y - entity.position.y) <= this.radius + entity.radius) {
      return true;
    }
    return false;
  }

  getEntityData() {
    return {
      id: this.id,
      entityType: this.entityType,
      position: this.position,
      radius: this.radius,
      color: this.color
    };
  }
}

module.exports = Entity;