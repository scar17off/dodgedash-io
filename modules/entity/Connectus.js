const Entity = require('./Entity');
const { bounceMovement } = require('./Behaviour');

module.exports = class Connectus extends Entity {
  constructor() {
    super();
    this.entityType = 'Connectus';
    this.radius = 10;
    this.speed = 2.5;
    this.color = "#4287f5";
    this.update = (area) => {
      bounceMovement(this, area);
      this.connectWithTwin(area.entities);
    };
    this.twin = null;
    this.isConnecting = false;
    this.connectionStartTime = 0;
    this.cooldownEndTime = 0;
    this.connectionProgress = 0;
    this.line = null;
    this.lineWidth = 2;
    this.connectionTime = 5000;
  }

  connectWithTwin(entities) {
    const currentTime = Date.now();
    if (!this.twin && currentTime >= this.cooldownEndTime) {
      this.twin = this.findTwin(entities);
    }
    if (this.twin && currentTime >= this.cooldownEndTime) {
      if (!this.isConnecting) {
        this.isConnecting = true;
        this.connectionStartTime = currentTime;
      }
      this.connectionProgress = ((currentTime - this.connectionStartTime) / this.connectionTime) * 100;
      if (this.connectionProgress >= 100) {
        this.isConnecting = false;
        this.cooldownEndTime = currentTime + this.connectionTime;
        this.twin = null;
        this.connectionProgress = 0;
        this.line = null;
      } else {
        const progress = this.connectionProgress / 100;
        const lineLength = Math.hypot(this.twin.position.x - this.position.x, this.twin.position.y - this.position.y);
        const partialLength = lineLength * progress / 2;
        const angle = Math.atan2(this.twin.position.y - this.position.y, this.twin.position.x - this.position.x);
        const midX1 = this.position.x + Math.cos(angle) * partialLength;
        const midY1 = this.position.y + Math.sin(angle) * partialLength;
        const midX2 = this.twin.position.x - Math.cos(angle) * partialLength;
        const midY2 = this.twin.position.y - Math.sin(angle) * partialLength;
        
        this.line = [
          [this.position.x, this.position.y, midX1, midY1],
          [this.twin.position.x, this.twin.position.y, midX2, midY2]
        ];
      }
    }
  }

  findTwin(entities) {
    return entities.find(e => e !== this && e.entityType === 'Connectus' && !e.twin);
  }

  collideCheck(entity) {
    if (super.collideCheck(entity)) {
      return true;
    }
    if (this.line) {
      for (const segment of this.line) {
        const [x1, y1, x2, y2] = segment;
        const dist = this.pointToSegmentDistance(entity.position, { x: x1, y: y1 }, { x: x2, y: y2 });
        if (dist <= entity.radius + this.lineWidth / 2) {
          return true;
        }
      }
    }
    return false;
  }

  pointToSegmentDistance(point, v, w) {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.hypot(point.x - v.x, point.y - v.y);
    let t = ((point.x - v.x) * (w.x - v.x) + (point.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(point.x - (v.x + t * (w.x - v.x)), point.y - (v.y + t * (w.y - v.y)));
  }

  getEntityData() {
    return {
      id: this.id,
      entityType: this.entityType,
      position: this.position,
      radius: this.radius,
      color: this.color,
      isConnecting: this.isConnecting,
      connectionProgress: this.connectionProgress,
      twin: this.twin ? this.twin : null,
      line: this.line
    };
  }
}