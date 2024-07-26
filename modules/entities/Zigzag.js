const Entity = require('./Entity');
const { zigzagMovement } = require('./Behaviour');

class Zigzag extends Entity {
  constructor(x, y, radius, speed) {
    super(x, y, radius, speed);
    this.type = 'Zigzag';
    this.color = '#a36a0f';
    this.zigzagTimer = 0;
    this.zigzagDirection = 1;
    this.update = (area) => zigzagMovement(this, area);
  }
}

module.exports = Zigzag;