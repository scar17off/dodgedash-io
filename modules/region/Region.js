const Area = require('./Area');

/**
 * Represents a region containing multiple areas.
 */
class Region {
  /**
   * Creates an instance of Region.
   * @param {Object} data - The data for the region.
   * @param {string} regionName - The name of the region.
   */
  constructor(data, regionName) {
    /**
     * The name of the region.
     * @type {string}
     */
    this.regionName = regionName;

    /**
     * The position of the region.
     * @type {Object}
     */
    this.position = data.position;

    /**
     * The data for the areas.
     * @type {Object.<string, Object>}
     */
    this.areasData = data.areas;

    /**
     * The loaded areas in the region.
     * @type {Map.<number, Area>}
     */
    this.loadedAreas = new Map();
  }

  /**
   * Loads an area by its number.
   * @param {number} areaNumber - The number of the area to load.
   */
  loadArea(areaNumber) {
    if (this.loadedAreas.has(areaNumber)) {
      return;
    }

    const areaData = this.areasData[areaNumber];
    if (!areaData) {
      console.warn(`Area ${areaNumber} not found in region ${this.regionName}`);
      return;
    }

    const area = new Area(areaData, this.regionName, areaNumber);
    this.loadedAreas.set(areaNumber, area);
  }

  /**
   * Gets an area by its number.
   * @param {number} areaNumber - The number of the area to get.
   * @returns {Area} The area.
   */
  getArea(areaNumber) {
    return this.loadedAreas.get(areaNumber);
  }

  /**
   * Unloads an area by its number if it has no players.
   * @param {number} areaNumber - The number of the area to unload.
   */
  unloadArea(areaNumber) {
    if (this.loadedAreas.has(areaNumber)) {
      const area = this.loadedAreas.get(areaNumber);
      if (area.players.length === 0) {
        this.loadedAreas.delete(areaNumber);
      } else {
        console.log(`Attempted to unload area ${areaNumber} in region ${this.regionName}, but it still has ${area.players.length} players`);
      }
    } else {
      console.log(`Attempted to unload area ${areaNumber} in region ${this.regionName}, but it doesn't exist`);
    }
  }

  /**
   * Gets all loaded areas.
   * @returns {Area[]} An array of loaded areas.
   */
  getLoadedAreas() {
    return Array.from(this.loadedAreas.values());
  }
}

module.exports = Region;