/**
 * Represents a portal that teleports players between regions.
 */
class RegionPortal {
  /**
   * Creates a new RegionPortal instance.
   * @param {string} targetRegion - The name of the region to teleport to.
   * @param {Object} position - The position of the portal.
   * @param {number} position.x - X coordinate.
   * @param {number} position.y - Y coordinate.
   * @param {Object} size - The size of the portal.
   * @param {Object} exitOffset - The offset to apply when exiting the portal.
   */
  constructor(targetRegion, position, size = { width: 250, height: 50 }, exitOffset = { y: 0 }) {
    this.targetRegion = targetRegion;
    this.position = position;
    this.size = size;
    this.exitOffset = exitOffset;
    this.color = 'rgba(138, 43, 226, 0.5)';
    this.lastTeleportTime = 0;
  }

  /**
   * Checks if a player is colliding with the portal.
   * @param {Player} player - The player to check.
   * @returns {boolean} True if the player is colliding with the portal.
   */
  isPlayerInPortal(player) {
    const currentTime = Date.now();
    if (currentTime - this.lastTeleportTime < 1000) {
      return false; 
    }

    const isColliding = player.position.x >= this.position.x &&
           player.position.x <= this.position.x + this.size.width &&
           player.position.y >= this.position.y &&
           player.position.y <= this.position.y + this.size.height;

    if (isColliding) {
      this.lastTeleportTime = currentTime;
    }

    return isColliding;
  }

  /**
   * Gets the portal data for client-side rendering.
   * @returns {Object} Portal data.
   */
  getPortalData() {
    return {
      targetRegion: this.targetRegion,
      position: this.position,
      size: this.size,
      exitOffset: this.exitOffset,
      color: this.color
    };
  }
}

module.exports = RegionPortal; 