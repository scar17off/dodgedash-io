const entityTypes = require('./entities/Enemies');

class Area {
  constructor(data = {
    position: { x: 0, y: 0 },
    size: { width: 1000, height: 480 },
    background: 'black'
  }, regionName = 'Alpha', areaNumber = 0) {
    this.regionName = regionName;
    this.areaNumber = areaNumber;
    this.position = data.position;
    this.size = data.size;
    this.background = data.background;
    this.players = [];
    this.entities = [];
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
    this.safeZone = {
      position: { x: this.position.x + this.size.width - 300, y: this.position.y },
      size: { width: 300, height: 480 }
    };
    this.finishZone = {
      position: { x: this.position.x + this.size.width - 50, y: this.position.y },
      size: { width: 50, height: 480 }
    };
    this.previousAreaZone = areaNumber === 0 ? null : {
      position: { x: this.position.x, y: this.position.y },
      size: { width: 50, height: 480 }
    };
    this.generateEntities(data.entities);
  }

  generateEntities(entityData) {
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
            entity.position = this.getRandomPositionOutsideStartZone(entity.radius);
            break;
          case "wall":
            entity.position = this.getRandomPositionOutsideStartZone(entity.radius);
            break;
          default:
            if (typeof data.position === 'object' && 'x' in data.position && 'y' in data.position) {
              entity.position = { ...data.position };
            } else {
              entity.position = this.getRandomPositionOutsideStartZone(entity.radius);
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
  }

  getRandomPositionOutsideStartZone(entityRadius) {
    const margin = entityRadius;
    let x, y;
    do {
      x = this.position.x + margin + Math.random() * (this.size.width - 2 * margin);
      y = this.position.y + margin + Math.random() * (this.size.height - 2 * margin);
    } while (
      x >= this.startZone.position.x &&
      x <= this.startZone.position.x + this.startZone.size.width &&
      y >= this.startZone.position.y &&
      y <= this.startZone.position.y + this.startZone.size.height
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
      safeZone: this.safeZone,
      finishZone: this.finishZone,
      previousAreaZone: this.previousAreaZone
    };
  }
}

module.exports = Area;