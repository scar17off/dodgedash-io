const Entity = require('./Entity');

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
    this.update = (area) => {
      this.area = area;
      this.mineCheck(area);
    }
  }

  mineCheck(area) {
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
    }
  }

  collideCheck(entity) {
    if (this.exploded) return false;
    if (Math.hypot(this.position.x - entity.position.x, this.position.y - entity.position.y) <= this.radius) {
      return true;
    }
    if (Math.hypot(this.position.x - entity.position.x, this.position.y - entity.position.y) <= this.detectionRange) {
      this.explode(entity);
      return true;
    }
    return false;
  }

  explode(entity) {
    this.exploded = true;
    this.lastExplodeTime = Date.now();
    entity.deathTimer = this.area.deathTimer;
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