const Ability = require("./Ability");
const AbilityCreation = require("./AbilityCreation");

class Wall extends AbilityCreation {
  constructor(player) {
    super();
    this.creationType = "Ice Wall";
    this.position = { x: 0, y: 0 };
    this.size = { width: 0, height: 0 };
    this.color = "#3dcfd1";
    this.creationTIme = Date.now();
    this.destroyCooldown = 3;

    // Determine wall size and position based on player's direction
    const angle = Math.atan2(player.input.mouse.y, player.input.mouse.x);
    const degree = angle * (180 / Math.PI);
    const offset = 40;

    if (degree >= -22.5 && degree < 22.5) { // Right
      this.size = { width: 10, height: 200 };
      this.position = { x: player.position.x + offset, y: player.position.y - this.size.height / 2 };
    } else if (degree >= 22.5 && degree < 67.5) { // Down-Right
      this.size = { width: 10, height: 200 };
      this.position = { x: player.position.x + offset / 2, y: player.position.y + offset / 2 - this.size.height / 2 };
    } else if (degree >= 67.5 && degree < 112.5) { // Down
      this.size = { width: 200, height: 10 };
      this.position = { x: player.position.x - this.size.width / 2, y: player.position.y + offset };
    } else if (degree >= 112.5 && degree < 157.5) { // Down-Left
      this.size = { width: 10, height: 200 };
      this.position = { x: player.position.x - offset / 2, y: player.position.y + offset / 2 - this.size.height / 2 };
    } else if (degree >= 157.5 || degree < -157.5) { // Left
      this.size = { width: 10, height: 200 };
      this.position = { x: player.position.x - offset, y: player.position.y - this.size.height / 2 };
    } else if (degree >= -157.5 && degree < -112.5) { // Up-Left
      this.size = { width: 10, height: 200 };
      this.position = { x: player.position.x - offset / 2, y: player.position.y - offset / 2 - this.size.height / 2 };
    } else if (degree >= -112.5 && degree < -67.5) { // Up
      this.size = { width: 200, height: 10 };
      this.position = { x: player.position.x - this.size.width / 2, y: player.position.y - offset };
    } else if (degree >= -67.5 && degree < -22.5) { // Up-Right
      this.size = { width: 10, height: 200 };
      this.position = { x: player.position.x + offset / 2, y: player.position.y - offset / 2 - this.size.height / 2 };
    }
  }

  update(area) {
    if (Date.now() - this.creationTIme >= this.destroyCooldown * 1000) {
      const index = area.abilityCreations.indexOf(this);
      if (index !== -1) {
        area.abilityCreations.splice(index, 1);
      }
    }
  }

  collideCheck(entity, newX, newY) {
    const wallLeft = this.position.x;
    const wallRight = this.position.x + this.size.width;
    const wallTop = this.position.y;
    const wallBottom = this.position.y + this.size.height;
    const entityLeft = newX - entity.radius;
    const entityRight = newX + entity.radius;
    const entityTop = newY - entity.radius;
    const entityBottom = newY + entity.radius;
    if (!(entityLeft > wallRight || entityRight < wallLeft || entityTop > wallBottom || entityBottom < wallTop)) {
      return this.onEntityCollided(entity, newX, newY);
    }
    return null;
  }
  
  onEntityCollided(entity, newX, newY) {
    let adjustedX = newX;
    let adjustedY = newY;
    if (entity.position.x < this.position.x) {
      adjustedX = this.position.x - entity.radius;
      entity.velocity.x = -Math.abs(entity.velocity.x);
    } else if (entity.position.x > this.position.x + this.size.width) {
      adjustedX = this.position.x + this.size.width + entity.radius;
      entity.velocity.x = Math.abs(entity.velocity.x);
    }
    if (entity.position.y < this.position.y) {
      adjustedY = this.position.y - entity.radius;
      entity.velocity.y = -Math.abs(entity.velocity.y);
    } else if (entity.position.y > this.position.y + this.size.height) {
      adjustedY = this.position.y + this.size.height + entity.radius;
      entity.velocity.y = Math.abs(entity.velocity.y);
    }
    return { newX: adjustedX, newY: adjustedY };
  }

  getCreationData() {
    return {
      creationType: this.creationType,
      position: this.position,
      size: this.size,
      color: this.color
    }
  }
}

class IceWall extends Ability {
  constructor() {
    super("Ice Wall", "Create a wall of ice that blocks the path of enemies.");
    this.upgradePath = {
      "Cooldown": [6, 5.5, 5, 4.5, 4],
      "Wall duration": [3, 3.5, 4, 4.5, 5]
    }
  }

  use(player, area) {
    const currentTime = Date.now();
    const cooldown = this.getUpgradeLevel("Cooldown");

    if (currentTime - this.lastUse >= cooldown * 1000) {
      super.use();
      const wall = new Wall(player);
      area.abilityCreations.push(wall);
    }
  }
}

module.exports = IceWall;