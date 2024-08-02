const Area = require('./Area');

/**
 * Represents a region containing multiple areas.
 */
class Region {
  /**
   * Creates an instance of Region.
   * @param {Object} data - The data for the region.
   * @param {Object.<string, Object>} data.areas - The areas data.
   * @param {string} [regionName='Alpha'] - The name of the region.
   */
  constructor(data = {}, regionName = 'Alpha') {
    /**
     * The name of the region.
     * @type {string}
     */
    this.regionName = regionName;

    /**
     * The areas in the region.
     * @type {Object.<number, Area>}
     */
    this.areas = {};

    /**
     * The data for the areas.
     * @type {Object.<string, Object>}
     */
    this.areasData = data.areas;
  }

  /**
   * Loads an area by its number.
   * @param {number} areaNumber - The number of the area to load.
   * @returns {Area} The loaded area.
   */
  loadArea(areaNumber) {
    if (this.areasData[areaNumber]) {
      // Always create a new Area instance, even if one already exists
      this.areas[areaNumber] = new Area(this.areasData[areaNumber], this.regionName, parseInt(areaNumber));
    }
    return this.areas[areaNumber];
  }

  /**
   * Gets an area by its number.
   * @param {number} areaNumber - The number of the area to get.
   * @returns {Area} The area.
   */
  getArea(areaNumber) {
    return this.areas[areaNumber];
  }

  /**
   * Unloads an area by its number if it has no players.
   * @param {number} areaNumber - The number of the area to unload.
   */
  unloadArea(areaNumber) {
    if (this.areas[areaNumber] && this.areas[areaNumber].players.length === 0) {
      delete this.areas[areaNumber];
    } else if (this.areas[areaNumber]) {
      console.log(`Attempted to unload area ${areaNumber} in region ${this.regionName}, but it still has ${this.areas[areaNumber].players.length} players`);
    } else {
      console.log(`Attempted to unload area ${areaNumber} in region ${this.regionName}, but it doesn't exist`);
    }
  }

  /**
   * Gets all loaded areas.
   * @returns {Area[]} An array of loaded areas.
   */
  getLoadedAreas() {
    return Object.values(this.areas);
  }
}

module.exports = Region;