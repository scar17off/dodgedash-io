const { circleCollision } = require('../collision');
const Entity = require('./Entity');

function getRandomColor() {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
}

class Pellet extends Entity {
  constructor() {
    super();
    this.entityType = 'Pellet';
    this.radius = 5;
    this.color = getRandomColor();
    this.area = null;
    this.position = null;
    this.xp = 1;
    this.update = (area) => {
      if (this.area !== area) {
        this.area = area;
        this.xp = (this.area.areaNumber == 0 ? 1 : this.area.areaNumber) * 2;
        this.respawn();
      }
    };
  }

  collideCheck() {
    return false;
  }

  respawn() {
    if (!this.area) return;
    this.position = this.area.getRandomPosition(this.radius);
  }

  collideCheck(player) {
    if (!player || !player.position || !this.position) {
      return false;
    }
    if (Math.hypot(this.position.x - player.position.x, this.position.y - player.position.y) <= this.radius + player.radius) {
      player.addXp(this.xp);

      player.socket.emit('heroUpdate', {
        xp: player.xp,
        level: player.level,
        xpToNextLevel: player.getXpToNextLevel(),
        upgradePoints: player.upgradePoints
      });
      this.respawn();
      return true;
    }
    return false;
  }
}

module.exports = Pellet;