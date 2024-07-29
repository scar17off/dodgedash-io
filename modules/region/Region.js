const Area = require('./Area');

class Region {
  constructor(data = {}, regionName = 'Alpha') {
    this.regionName = regionName;
    this.areas = {};
    this.areasData = data.areas;
  }

  loadArea(areaNumber) {
    if (this.areasData[areaNumber]) {
      // Always create a new Area instance, even if one already exists
      this.areas[areaNumber] = new Area(this.areasData[areaNumber], this.regionName, parseInt(areaNumber));
    }
    return this.areas[areaNumber];
  }

  getArea(areaNumber) {
    return this.areas[areaNumber];
  }

  unloadArea(areaNumber) {
    if (this.areas[areaNumber] && this.areas[areaNumber].players.length === 0) {
      delete this.areas[areaNumber];
    } else if (this.areas[areaNumber]) {
      console.log(`Attempted to unload area ${areaNumber} in region ${this.regionName}, but it still has ${this.areas[areaNumber].players.length} players`);
    } else {
      console.log(`Attempted to unload area ${areaNumber} in region ${this.regionName}, but it doesn't exist`);
    }
  }

  getLoadedAreas() {
    return Object.values(this.areas);
  }
}

module.exports = Region;