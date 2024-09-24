const Entity = require('./Entity');
const { circleCollision } = require("../collision");

class Mine extends Entity {
  constructor() {
    super();
    this.entityType = 'Mine';
    this.radius = 5;
    this.color = "#FFD700";
    this.exploded = false;
    this.detectionRange = 50;
    this.reloadTime = 5000; // 5 seconds
    this.lastExplodeTime = 0;
    this.area = null;
    this.respawnDelay = 2000; // 2 seconds delay before respawning
    this.update = (area) => {
      this.area = area;
      this.mineBehavior(area);
    }
  }

  mineBehavior(area) {
    const currentTime = Date.now();

    if (!this.exploded) {
      const playerInRange = area.players.find(player => {
        const dx = player.position.x - this.position.x;
        const dy = player.position.y - this.position.y;
        return Math.sqrt(dx * dx + dy * dy) < this.detectionRange;
      });

      if (playerInRange) {
        this.explode(playerInRange, area);
      }
    } else if (currentTime - this.lastExplodeTime >= this.reloadTime) {
      this.exploded = false;
      this.respawn();
    }
  }

  collideCheck(entity) {
    if (this.exploded) return false;
    if (circleCollision(this, entity)) {
      this.explode(entity);
      return true;
    }
    if (circleCollision(this, entity)) {
      this.explode(entity);
      return true;
    }
    return false;
  }

  explode(entity) {
    this.exploded = true;
    this.color = "#FF0000";
    this.lastExplodeTime = Date.now();
    entity.deathTimer = this.area.deathTimer * 1000;
    setTimeout(() => this.respawn(), this.respawnDelay);
  }

  respawn() {
    if (!this.area) return;
    const newPosition = this.area.getRandomPosition(this.radius);
    this.position = newPosition;
    this.exploded = false;
    this.color = "#FFD700";
  }

  getEntityData() {
    return {
      id: this.id,
      entityType: this.entityType,
      position: this.position,
      radius: this.radius,
      color: this.color,
      exploded: this.exploded
    };
  }
}

module.exports = Mine;