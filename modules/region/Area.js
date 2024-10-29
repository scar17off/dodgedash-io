const entityTypes = require('../entity/Enemies');
const Pellet = require('../entity/Pellet');
const Player = require('../player/Player');
const presets = require('./presets.json');

/**
 * Represents an area in the game.
 */
class Area {
  /**
   * Creates a new area instance.
   * @param {Object} data - The data for the area.
   * @param {Object} data.position - The position of the area.
   * @param {number} data.position.x - The x-coordinate of the area.
   * @param {number} data.position.y - The y-coordinate of the area.
   * @param {Object} data.size - The size of the area.
   * @param {number} data.size.width - The width of the area.
   * @param {number} data.size.height - The height of the area.
   * @param {string} data.background - The background color of the area.
   * @param {number} [data.deathTimer] - The death timer for the area.
   * @param {Array} [data.entities] - The entities in the area.
   * @param {string} [regionName='Alpha'] - The name of the region the area belongs to.
   * @param {number} [areaNumber=0] - The number of the area.
   * @param {Array<Player>} [players] - The players in the area.
   * @param {Array} [abilityCreations] - The ability creations in the area.
   */
  constructor(data = {
    position: { x: 0, y: 0 },
    size: { width: 1000, height: 480 },
    background: 'black'
  }, regionName = 'Alpha', areaNumber = 0) {
    this.regionName = regionName;
    this.areaNumber = areaNumber;
    this.position = { x: 0, y: 0 };
    
    if (data.preset && presets.default[data.preset]) {
      const preset = presets.default[data.preset];
      this.size = preset.size || data.size;
      this.background = preset.background || data.background;
    } else {
      this.size = data.size;
      this.background = data.background;
    }
    
    this.deathTimer = data.deathTimer;
    this.players = [];
    this.entities = [];
    this.abilityCreations = [];
    this.border = [
      { x: this.position.x, y: this.position.y },
      { x: this.position.x + this.size.width, y: this.position.y },
      { x: this.position.x + this.size.width, y: this.position.y + this.size.height },
      { x: this.position.x, y: this.position.y + this.size.height }
    ];
    this.startZone = {
      position: { x: this.position.x, y: this.position.y },
      size: { width: 300, height: 480 }
    };
    this.finishZone = {
      position: { x: this.position.x + this.size.width - 300, y: this.position.y },
      size: { width: 300, height: 480 }
    };
    this.nextAreaZone = {
      position: { x: this.position.x + this.size.width - 50, y: this.position.y },
      size: { width: 50, height: this.size.height }
    };
    this.previousAreaZone = areaNumber === 0 ? null : {
      position: { x: this.position.x, y: this.position.y },
      size: { width: 50, height: this.size.height }
    };
    this.generateEntities(data.entities);
  }

  generateEntities(entityData, spawnPellets = true) {
    this.entities = [];
    if (!entityData) return;
    entityData.forEach(data => {
      const amount = data.amount || 1;
      const EntityClass = entityTypes[data.type];

      if (!EntityClass) {
        console.warn(`Unknown entity type: ${data.type}`);
        return;
      }

      for (let i = 0; i < amount; i++) {
        const entity = new EntityClass();

        if (data.speed) entity.speed = data.speed;
        if (data.radius) entity.radius = data.radius;

        switch (data.position) {
          case "random":
            entity.position = this.getRandomPosition(entity.radius);
            break;
          case "wall":
            entity.position = this.getRandomPosition(entity.radius);
            break;
          default:
            if (typeof data.position === 'object' && 'x' in data.position && 'y' in data.position) {
              entity.position = { ...data.position };
            } else {
              entity.position = this.getRandomPosition(entity.radius);
            }
            break;
        }

        // Initialize velocity if it's not set
        if (!entity.velocity || (entity.velocity.x === 0 && entity.velocity.y === 0)) {
          entity.velocity = {
            x: (Math.random() - 0.5) * entity.speed,
            y: (Math.random() - 0.5) * entity.speed
          };
        }

        this.entities.push(entity);
      }
    });
    if(spawnPellets) {
      for(let i = 0; i < 10; i++) {
        this.entities.push(new Pellet(this));
      }
    }
  }

  getRandomPosition(entityRadius) {
    const margin = entityRadius;
    let x, y;
    const isWithinZone = (zone) => {
      if(!zone) return false;
      return x >= zone.position.x && x <= zone.position.x + zone.size.width &&
      y >= zone.position.y && y <= zone.position.y + zone.size.height;
    }

    do {
      x = this.position.x + margin + Math.random() * (this.size.width - 2 * margin);
      y = this.position.y + margin + Math.random() * (this.size.height - 2 * margin);
    } while (
      isWithinZone(this.startZone) ||
      isWithinZone(this.finishZone) ||
      isWithinZone(this.previousAreaZone) ||
      isWithinZone(this.nextAreaZone)
    );
    return { x, y };
  }

  getAreaData() {
    return {
      position: this.position,
      size: this.size,
      background: this.background,
      border: this.border,
      startZone: this.startZone,
      finishZone: this.finishZone,
      nextAreaZone: this.nextAreaZone,
      previousAreaZone: this.previousAreaZone
    };
  }
}

module.exports = Area;