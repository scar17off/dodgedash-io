const entityTypes = require('../entity/Enemies');
const Pellet = require('../entity/Pellet');
const Player = require('../player/Player');
const presets = require('./presets.json');
const RegionPortal = require('./RegionPortal');

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
    
    // Initialize portals first
    this.portals = [];
    if (data.portals && Array.isArray(data.portals)) {
      this.portals = data.portals.map(portalData => 
        new RegionPortal(
          portalData.targetRegion,
          portalData.position || { x: this.startZone.position.x, y: this.startZone.position.y },
          portalData.size || { width: 250, height: 50 },
          portalData.exitOffset || { y: 0 }
        )
      );
    }
    else if (areaNumber === 0 && data.portal) {
      this.portals.push(
        new RegionPortal(
          data.portal.targetRegion,
          {
            x: this.startZone.position.x,
            y: this.startZone.position.y
          }
        )
      );
    }

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

    // Generate entities last
    this.generateEntities(data.entities);
  }

  /**
   * Generates entities in the area.
   * @param {Array<Object>} entityData - The data for the entities.
   * @param {boolean} [spawnPellets=true] - Whether to spawn pellets.
   */
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

  /**
   * Gets a random spawn position within the area.
   * @param {number} radius - The radius of the entity.
   * @returns {Object} The random position.
   */
  getRandomPosition(radius) {
    const margin = radius;
    let x, y;
    const isWithinZone = (zone) => {
      if(!zone) return false;
      return x >= zone.position.x && x <= zone.position.x + zone.size.width &&
             y >= zone.position.y && y <= zone.position.y + zone.size.height;
    }

    const isWithinPortal = (portal) => {
      if(!portal) return false;
      return x >= portal.position.x && x <= portal.position.x + portal.size.width &&
             y >= portal.position.y && y <= portal.position.y + portal.size.height;
    }

    do {
      x = this.position.x + margin + Math.random() * (this.size.width - 2 * margin);
      y = this.position.y + margin + Math.random() * (this.size.height - 2 * margin);
    } while (
      isWithinZone(this.startZone) ||
      isWithinZone(this.finishZone) ||
      isWithinZone(this.previousAreaZone) ||
      isWithinZone(this.nextAreaZone) ||
      (this.portals && this.portals.some(portal => isWithinPortal(portal)))  // Add null check
    );
    return { x, y };
  }

  /**
   * Gets the data for the area.
   * @returns {Object} The area data.
   * @property {Object} position - The position of the area.
   * @property {number} position.x - The x-coordinate of the area.
   * @property {number} position.y - The y-coordinate of the area.
   * @property {Object} size - The size of the area.
   * @property {number} size.width - The width of the area.
   * @property {number} size.height - The height of the area.
   * @property {string} background - The background color of the area.
   * @property {Array<Object>} border - The border of the area.
   * @property {Object} startZone - The start zone of the area.
   * @property {Object} startZone.position - The position of the start zone.
   * @property {number} startZone.position.x - The x-coordinate of the start zone.
   * @property {number} startZone.position.y - The y-coordinate of the start zone.
   * @property {Object} startZone.size - The size of the start zone.
   * @property {number} startZone.size.width - The width of the start zone.
   * @property {number} startZone.size.height - The height of the start zone.
   * @property {Object} finishZone - The finish zone of the area.
   * @property {Object} finishZone.position - The position of the finish zone.
   * @property {number} finishZone.position.x - The x-coordinate of the finish zone.
   * @property {number} finishZone.position.y - The y-coordinate of the finish zone.
   * @property {Object} finishZone.size - The size of the finish zone.
   * @property {number} finishZone.size.width - The width of the finish zone.
   * @property {number} finishZone.size.height - The height of the finish zone.
   * @property {Object} nextAreaZone - The next area zone of the area.
   * @property {Object} nextAreaZone.position - The position of the next area zone.
   * @property {number} nextAreaZone.position.x - The x-coordinate of the next area zone.
   * @property {number} nextAreaZone.position.y - The y-coordinate of the next area zone.
   * @property {Object} nextAreaZone.size - The size of the next area zone.
   * @property {number} nextAreaZone.size.width - The width of the next area zone.
   * @property {number} nextAreaZone.size.height - The height of the next area zone.
   * @property {Object} previousAreaZone - The previous area zone of the area.
   * @property {Object} previousAreaZone.position - The position of the previous area zone.
   * @property {number} previousAreaZone.position.x - The x-coordinate of the previous area zone.
   * @property {number} previousAreaZone.position.y - The y-coordinate of the previous area zone.
   * @property {Object} previousAreaZone.size - The size of the previous area zone.
   * @property {number} previousAreaZone.size.width - The width of the previous area zone.
   * @property {number} previousAreaZone.size.height - The height of the previous area zone.
   * @property {Array<Object>} portals - The portals for the area.
   */
  getAreaData() {
    return {
      position: this.position,
      size: this.size,
      areaNumber: this.areaNumber,
      background: this.background,
      border: this.border,
      startZone: this.startZone,
      finishZone: this.finishZone,
      nextAreaZone: this.nextAreaZone,
      previousAreaZone: this.previousAreaZone,
      portals: this.portals.map(portal => portal.getPortalData())
    };
  }
}

module.exports = Area;