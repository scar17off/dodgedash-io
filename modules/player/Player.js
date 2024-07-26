const { isWithinBorderOrStartZone } = require("../utils");
const { heroType } = require("../protocol.json");

class Player {
  constructor(socket, regionName, areaNumber) {
    this.id = server.lastId++;
    this.socket = socket;
    this.position = { x: 0, y: 0 };
    this.radius = 15;
    this.baseSpeed = 5 / 2;
    // this.baseSpeed = 20;
    this._heroType = heroType[0].id;
    this.color = heroType[0].color;
    this.input = {
      mouse: { x: 0, y: 0 },
      keys: { w: false, a: false, s: false, d: false },
      mouseMovement: false
    };
    this.regionName = regionName;
    this.areaNumber = areaNumber;
  }

  getRandomSpawnPosition(area) {
    const startZone = area.startZone;
    const margin = this.radius;
    
    return {
      x: startZone.position.x + margin + Math.random() * (startZone.size.width - 2 * margin),
      y: startZone.position.y + margin + Math.random() * (startZone.size.height - 2 * margin)
    };
  }

  get heroType() {
    return this._heroType;
  }

  set heroType(newHeroTypeId) {
    const hero = heroType.find(h => h.id === newHeroTypeId);
    if (hero) {
      this._heroType = newHeroTypeId;
      this.color = hero.color;
    } else {
      console.error(`Hero type with id ${newHeroTypeId} not found`);
    }
  }

  handleInput(input) {
    this.input = input;
  }

  update(region, deltaTime) {
    const { mouse, keys, mouseMovement } = this.input;
    let newPosition = { ...this.position };
    const speed = this.isInStartZone(region) || this.isInFinishZone(region) ? 10 : this.baseSpeed;

    if (mouseMovement) {
      const distance = Math.sqrt(mouse.x ** 2 + mouse.y ** 2);
      if (distance > 0) {
        const moveSpeed = Math.min(distance / 10, speed);
        newPosition.x += (mouse.x / distance) * moveSpeed;
        newPosition.y += (mouse.y / distance) * moveSpeed;
      }
    } else {
      let dx = 0;
      let dy = 0;
      if (keys.w) dy -= 1;
      if (keys.s) dy += 1;
      if (keys.a) dx -= 1;
      if (keys.d) dx += 1;

      // Normalize diagonal movement
      if (dx !== 0 && dy !== 0) {
        const factor = 1 / Math.sqrt(2);
        dx *= factor;
        dy *= factor;
      }

      newPosition.x += dx * speed;
      newPosition.y += dy * speed;
    }

    // Adjust position if it's outside the allowed area
    this.adjustPosition(newPosition, region);
  }

  adjustPosition(newPosition, region) {
    const { border, startZone } = region;
    const [topLeft, topRight, bottomRight, bottomLeft] = border;

    // Check if the new position is within the border or start zone
    if (isWithinBorderOrStartZone(newPosition, border, startZone, this.radius)) {
      this.position = newPosition;
    } else {
      // If outside, clamp the position to the nearest valid point
      this.position.x = Math.max(topLeft.x + this.radius, Math.min(newPosition.x, topRight.x - this.radius));
      this.position.y = Math.max(topLeft.y + this.radius, Math.min(newPosition.y, bottomLeft.y - this.radius));
    }
  }

  isInStartZone(region) {
    return (
      this.position.x >= region.startZone.position.x &&
      this.position.x <= region.startZone.position.x + region.startZone.size.width &&
      this.position.y >= region.startZone.position.y &&
      this.position.y <= region.startZone.position.y + region.startZone.size.height
    );
  }

  isInFinishZone(region) {
    return (
      this.position.x >= region.finishZone.position.x &&
      this.position.x <= region.finishZone.position.x + region.finishZone.size.width &&
      this.position.y >= region.finishZone.position.y &&
      this.position.y <= region.finishZone.position.y + region.finishZone.size.height
    );
  }

  isInNextAreaZone(region) {
    return (
      this.position.x + this.radius >= region.nextAreaZone.position.x &&
      this.position.x - this.radius <= region.nextAreaZone.position.x + region.nextAreaZone.size.width &&
      this.position.y + this.radius >= region.nextAreaZone.position.y &&
      this.position.y - this.radius <= region.nextAreaZone.position.y + region.nextAreaZone.size.height
    );
  }

  isInPreviousAreaZone(region) {
    if (!region.previousAreaZone) {
      return false;
    }
    return (
      this.position.x + this.radius >= region.previousAreaZone.position.x &&
      this.position.x - this.radius <= region.previousAreaZone.position.x + region.previousAreaZone.size.width &&
      this.position.y + this.radius >= region.previousAreaZone.position.y &&
      this.position.y - this.radius <= region.previousAreaZone.position.y + region.previousAreaZone.size.height
    );
  }
}

module.exports = Player;