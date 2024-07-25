const Entity = require('./Entity');
const { wallMovement } = require('./Behaviour');

module.exports = class Wall extends Entity {
  constructor() {
    super();
    this.entityType = 'Wall';
    this.radius = 20;
    this.speed = 20;
    this.update = (area) => wallMovement(this, area);
    this.color = "#FF0000";
  }
}