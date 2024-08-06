/**
 * Represents an ability creation in the game.
 */
class AbilityCreation {
  /**
   * Creates a new AbilityCreation instance.
   */
  constructor() {
    /**
     * The unique identifier for this ability creation.
     * @type {number}
     */
    this.id = server.lastId++;

    /**
     * The type of ability creation.
     * @type {string|null}
     */
    this.creationType = null;

    /**
     * The position of the ability creation.
     * @type {{x: number, y: number}}
     */
    this.position = { x: 0, y: 0 };

    /**
     * The color of the ability creation.
     * @type {string}
     */
    this.color = "#ffffff";

    /**
     * The cooldown time before the ability creation is destroyed, in seconds.
     * @type {number}
     */
    this.destroyCooldown = -1;
  }

  /**
   * Updates the ability creation state.
   * @param {Object} area - The area containing this ability creation.
   */
  update(area) {
    if (Date.now() - this.creationTime >= this.destroyCooldown * 1000 && this.destroyCooldown !== -1) {
      const index = area.abilityCreations.indexOf(this);
      if (index !== -1) {
        area.abilityCreations.splice(index, 1);
      }
    }
  }

  /**
   * Gets the creation data for this ability creation.
   * @returns {{creationType: (string|null), position: {x: number, y: number}, color: string}}
   */
  getCreationData() {
    return {
      creationType: this.creationType,
      position: this.position,
      color: this.color
    }
  }
}

module.exports = AbilityCreation;