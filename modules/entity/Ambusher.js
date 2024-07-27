const Entity = require('./Entity');
const { checkCollisions } = require('./Behaviour');

class Ambusher extends Entity {
  constructor() {
    super();
    this.entityType = 'Ambusher';
    this.radius = 12;
    this.speed = 3;
    this.color = "#FF4500";
    this.hidden = true;
    this.detectionRange = 400;
    this.update = (area) => this.ambusherMovement(area);
  }

  ambusherMovement(area) {
    const playerInRange = area.players.find(player => {
      const dx = player.position.x - this.position.x;
      const dy = player.position.y - this.position.y;
      return Math.sqrt(dx * dx + dy * dy) < this.detectionRange;
    });

    if (playerInRange) {
      this.hidden = false;
      const dx = playerInRange.position.x - this.position.x;
      const dy = playerInRange.position.y - this.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      this.velocity.x = (dx / distance) * this.speed;
      this.velocity.y = (dy / distance) * this.speed;
    } else {
      this.hidden = true;
      this.velocity.x = 0;
      this.velocity.y = 0;
    }

    let newX = this.position.x + this.velocity.x;
    let newY = this.position.y + this.velocity.y;

    ({ newX, newY } = checkCollisions(this, area, newX, newY));

    this.position.x = newX;
    this.position.y = newY;
  }

  getEntityData() {
    return {
      id: this.id,
      entityType: this.entityType,
      position: this.hidden ? { x: 0, y: 0 } : this.position,
      radius: this.radius,
      color: this.color
    };
  }
}

module.exports = Ambusher;