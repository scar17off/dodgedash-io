const Entity = require('./Entity');
const { chaserMovement } = require('./Behaviour');

module.exports = class Chaser extends Entity {
  constructor() {
    super();
    this.entityType = 'Chaser';
    this.radius = 15;
    this.speed = 1.5;
    this.color = "#FF00FF";
    this.update = (area) => chaserMovement(this, area);
  }
}