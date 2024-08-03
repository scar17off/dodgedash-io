const Ability = require("./Ability");

class ColdImmunity extends Ability {
  constructor() {
    super("Cold Immunity", "Immune to slowing effects from ice-based enemies");
    this.upgradePath = {
      "Enemy Slowdown Effect Reduction": [20, 40, 60, 80, 100]
    }
  }
}

module.exports = ColdImmunity;