const Entity = require('./Entity');
const { bounceMovement } = require('./Behaviour');

module.exports = class Normal extends Entity {
  constructor() {
    super();
    this.entityType = 'Normal';
    this.radius = 10;
    this.speed = 2;
    this.update = (area) => bounceMovement(this, area);
    this.color = "#636363";
  }
}