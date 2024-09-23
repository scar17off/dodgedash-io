const Ability = require("./Ability");
const AbilityCreation = require("./AbilityCreation");

class MagneticField extends AbilityCreation {
  constructor(player) {
    super();
    this.creationType = "Magnetic Field";
    this.position = { x: player.position.x, y: player.position.y };
    this.radius = 100;
    this.color = "rgba(255, 0, 255, 0.2)"; // Semi-transparent magenta
    this.creationTime = Date.now();
    this.duration = 5000; // 5 seconds duration
    this.affectedEntities = new Set();
    this.isActive = true;
  }

  update(area) {
    super.update(area);
    // Check if duration has ended
    if (Date.now() - this.creationTime >= this.duration) {
      this.isActive = false;
      return;
    }
    const player = area.players.find(p => p.id === this.playerId);
    if (player) {
      this.position = { x: player.position.x, y: player.position.y };
    }
    if (this.isActive) {
      area.entities.forEach(entity => {
        const dx = this.position.x - entity.position.x;
        const dy = this.position.y - entity.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < this.radius) {
          if (!this.affectedEntities.has(entity.id)) {
            this.affectedEntities.add(entity.id);
          }
          const movingAway = (dx * entity.velocity.x + dy * entity.velocity.y) < 0;
          if (!movingAway) {
            entity.velocity.x *= -1;
            entity.velocity.y *= -1;
          }
        } else {
          this.affectedEntities.delete(entity.id);
        }
      });
    }
  }

  getCreationData() {
    return {
      creationType: this.creationType,
      position: this.position,
      radius: this.radius,
      color: this.color,
      isActive: this.isActive
    };
  }
}

class Magnetize extends Ability {
  constructor() {
    super("Magnetize", "Create a magnetic field that reverses the movement of entities within it.");
    this.upgradePath = {
      "Cooldown": [10, 8, 6, 4, 2],
      "Field Radius": [80, 90, 100, 110, 120],
      "Duration": [4, 4.5, 5, 5.5, 6]
    };
    this.energyCost = 15;
  }

  use(player, area) {
    const currentTime = Date.now();
    const cooldown = this.getUpgradeLevel("Cooldown");

    if (currentTime - this.lastUse >= cooldown * 1000 && player.energy >= this.energyCost) {
      super.use();
      player.energy -= this.energyCost;
      const field = new MagneticField(player);
      field.playerId = player.id;
      field.radius = this.getUpgradeLevel("Field Radius");
      field.duration = this.getUpgradeLevel("Duration") * 1000;
      area.abilityCreations.push(field);
    }
  }
}

module.exports = Magnetize;