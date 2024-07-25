const Normal = require('./entities/Normal');

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
      for (let i = 0; i < amount; i++) {
        let entity;
        switch (data.type) {
          case 'Normal':
            entity = new Normal();
            if (data.speed) entity.speed = data.speed;
            if (data.radius) entity.radius = data.radius;
            break;
          // Add cases for other entity types here
        }
        if (entity) {
          if (data.position) {
            entity.position = { ...data.position };
          } else {
            entity.position = this.getRandomPositionOutsideStartZone(entity.radius);
          }
          this.entities.push(entity);
        }
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