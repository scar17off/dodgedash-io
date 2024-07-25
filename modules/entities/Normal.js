const Entity = require('./Entity');
const { bounceMovement } = require('./Behaviour');

module.exports = class Normal extends Entity {
  constructor() {
    super();
    this.entityType = 'Normal';
    this.position = { x: 0, y: 0 };
    this.radius = 10;
    this.speed = 5 / 3;
    this.velocity = { x: 0, y: 0 };
    this.update = (area) => bounceMovement(this, area);
    this.color = "#636363";
  }
}