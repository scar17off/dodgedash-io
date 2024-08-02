/**
 * Represents an ability in the game.
 */
class Ability {
  /**
   * Creates a new ability instance.
   * @param {string} name - The name of the ability.
   * @param {string} description - The description of the ability.
   */
  constructor(name, description) {
    /**
     * The name of the ability.
     * @type {string}
     */
    this.name = name;

    /**
     * The description of the ability.
     * @type {string}
     */
    this.description = description;

    /**
     * The current upgrade level of the ability.
     * @type {number}
     */
    this.upgradeLevel = 0;

    /**
     * The upgrade path for the ability.
     * @type {Object<string, Array<number>>}
     */
    this.upgradePath = { "Cooldown": [0, 0, 0, 0, 0] };

    /**
     * The timestamp of the last use of the ability.
     * @type {number}
     */
    this.lastUse = 0;
  }

  /**
   * Uses the ability.
   */
  use() {
    const currentTime = Date.now();
    const cooldown = this.getUpgradeLevel("Cooldown");

    if (currentTime - this.lastUse >= cooldown * 1000) {
      this.lastUse = currentTime;
    }
  }

  /**
   * Upgrades the ability.
   */
  upgrade() {
    for (const key in this.upgradePath) {
      if (this.upgradeLevel < this.upgradePath[key].length - 1) {
        this.upgradeLevel++;
        console.log(`${this.name} upgraded to level ${this.upgradeLevel}`);
        return;
      }
    }
    console.log(`${this.name} is already at max level`);
  }

  /**
   * Gets the upgrade level for a specific upgrade path.
   * @param {string} upgradeName - The name of the upgrade path.
   * @returns {number|null} The upgrade level or null if the upgrade path is not found.
   */
  getUpgradeLevel(upgradeName) {
    if (this.upgradePath[upgradeName]) {
      return this.upgradePath[upgradeName][this.upgradeLevel];
    }
    console.error(`Upgrade path for ${upgradeName} not found`);
    return null;
  }
}

module.exports = Ability;