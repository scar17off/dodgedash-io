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
   * @param {Player} player - The player using the ability.
   * @param {Area} area - The area where the ability is being used.
   */
  use(player, area) {
    const currentTime = Date.now();
    const cooldown = this.getUpgradeLevel("Cooldown");

    if (currentTime - this.lastUse >= cooldown * 1000) {
      this.lastUse = currentTime;
    }
  }

  /**
   * Upgrades the ability.
   * @param {Player} player - The player upgrading the ability.
   * @param {boolean} dryRun - Whether to perform a dry run without actually upgrading.
   * @returns {boolean} Whether the upgrade was successful.
   */
  upgrade(player, dryRun = false) {
    // Get the first upgrade path's length as max upgrades
    const firstUpgradePath = Object.values(this.upgradePath)[0];
    if (!firstUpgradePath) return false;
    
    const currentUpgrade = this.upgradeLevel;
    const maxUpgrades = firstUpgradePath.length;

    // Check if we can upgrade
    if (currentUpgrade >= maxUpgrades - 1) {
      return false;
    }

    // If this is just a check, return true without performing the upgrade
    if (dryRun) {
      return true;
    }

    // Actually perform the upgrade
    this.upgradeLevel++;
    this.unlocked = true;
    
    // Update values based on upgrade path
    for (const key in this.upgradePath) {
      const value = this.upgradePath[key][this.upgradeLevel];
      if (value !== undefined) {
        this[key.toLowerCase()] = value;
      }
    }

    return true;
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