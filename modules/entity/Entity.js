/**
 * Represents an entity in the game.
 */
class Entity {
  /**
   * Creates an instance of Entity.
   */
  constructor() {
    /**
     * @type {number}
     */
    this.id = server.lastId++;
    /**
     * @type {string|null}
     */
    this.entityType = null;
    /**
     * @type {{x: number, y: number}}
     */
    this.position = { x: 0, y: 0 };
    /**
     * @type {{x: number, y: number}}
     */
    this.velocity = { x: 0, y: 0 };
    /**
     * @type {number}
     */
    this.radius = 0;
    /**
     * @type {number}
     */
    this.speed = 0;
    /**
     * @type {string}
     */
    this.color = "#000";
    /**
     * @type {Function|null}
     */
    this.update = null;
  }

  /**
   * Checks if this entity collides with another entity.
   * @param {Entity} entity - The other entity to check collision with.
   * @returns {boolean} True if the entities collide, false otherwise.
   */
  collideCheck(entity) {
    if (Math.hypot(this.position.x - entity.position.x, this.position.y - entity.position.y) <= this.radius + entity.radius) {
      return true;
    }
    return false;
  }

  /**
   * Gets the data of the entity.
   * @returns {{id: number, entityType: string|null, position: {x: number, y: number}, radius: number, color: string}} The data of the entity.
   */
  getEntityData() {
    return {
      id: this.id,
      entityType: this.entityType,
      position: this.position,
      radius: this.radius,
      color: this.color
    };
  }
}

module.exports = Entity;