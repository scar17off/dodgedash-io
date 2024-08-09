const Entity = require('./Entity');
const { bounceMovement } = require('./Behaviour');

module.exports = class Pulsar extends Entity {
  constructor() {
    super();
    this.entityType = 'Pulsar';
    this.minRadius = 5;
    this.maxRadius = 20;
    this.radius = this.minRadius;
    this.speed = 1.5;
    this.color = "#FFA500";
    this.pulseSpeed = 0.2;
    this.growing = true;
    this.update = (area) => this.pulsarMovement(area);
  }

  pulsarMovement(area) {
    if (this.growing) {
      this.radius += this.pulseSpeed;
      if (this.radius >= this.maxRadius) {
        this.growing = false;
      }
    } else {
      this.radius -= this.pulseSpeed;
      if (this.radius <= this.minRadius) {
        this.growing = true;
      }
    }

    bounceMovement(this, area);
  }
}