const Entity = require('./Entity');
const { teleporterMovement } = require('./Behaviour');

class Teleporter extends Entity {
  constructor() {
    super();
    this.type = 'Teleporter';
    this.color = '#8A2BE2';
    this.teleportTimer = 0;
    this.update = (area) => teleporterMovement(this, area);
  }
}

module.exports = Teleporter;