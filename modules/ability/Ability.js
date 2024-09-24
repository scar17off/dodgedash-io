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

    /**
     * Whether the ability is unlocked.
     * @type {boolean}
     */
    this.unlocked = false;
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
    if (!this.unlocked) {
      this.unlocked = true;
      this.upgradeLevel = 1;
      return;
    }
    for (const key in this.upgradePath) {
      if (this.upgradeLevel < this.upgradePath[key].length) {
        this.upgradeLevel++;
        return;
      }
    }
  }

  /**
   * Gets the upgrade level for a specific upgrade path.
   * @param {string} upgradeName - The name of the upgrade path.
   * @returns {number|null} The upgrade level or null if the upgrade path is not found.
   */
  getUpgradeLevel(upgradeName) {
    if (this.upgradePath[upgradeName] && this.upgradeLevel > 0) {
      return this.upgradePath[upgradeName][this.upgradeLevel - 1];
    }
    return this.upgradePath[upgradeName] ? this.upgradePath[upgradeName][0] : null;
  }

  /**
   * Gets the data representation of the ability.
   * @returns {Object} The ability data.
   */
  getData() {
    return {
      name: this.name,
      description: this.description,
      upgradeLevel: this.upgradeLevel,
      cooldown: this.getUpgradeLevel("Cooldown")
    };
  }
}

module.exports = Ability;