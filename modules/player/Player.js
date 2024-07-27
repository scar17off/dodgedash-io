const { isWithinBorderOrStartZone } = require("../utils");
const { heroType } = require("../protocol.json");

class Player {
  constructor(socket) {
    this.id = server.lastId++;
    this.socket = socket;
    this.position = { x: 0, y: 0 };
    this.radius = 15;
    // this.baseSpeed = 5 / 2;
    this.baseSpeed = 20;
    this._heroType = heroType[0].id;
    this.color = heroType[0].color;
    this.input = {
      mouse: { x: 0, y: 0 },
      keys: { w: false, a: false, s: false, d: false },
      mouseMovement: false
    };
    this.regionName = "Alpha";
    this.areaNumber = 0;
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

  update(area) {
    const { mouse, keys, mouseMovement } = this.input;
    let newPosition = { ...this.position };
    const speed = this.isInStartZone(area) || this.isInFinishZone(area) ? 10 : this.baseSpeed;

    if (mouseMovement) {
      const distance = Math.sqrt(mouse.x ** 2 + mouse.y ** 2);
      if (distance > 0) {
        const moveSpeed = Math.min(distance, speed);
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
    this.adjustPosition(newPosition, area);
  }

  adjustPosition(newPosition, region) {
    const { border, startZone } = region;
    const [topLeft, topRight, bottomRight, bottomLeft] = border;

    this.position = newPosition;

    if (!isWithinBorderOrStartZone(newPosition, border, startZone, this.radius)) {
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

  isInNextAreaZone(area) {
    return (
      this.position.x + this.radius >= area.nextAreaZone.position.x &&
      this.position.x - this.radius <= area.nextAreaZone.position.x + area.nextAreaZone.size.width &&
      this.position.y + this.radius >= area.nextAreaZone.position.y &&
      this.position.y - this.radius <= area.nextAreaZone.position.y + area.nextAreaZone.size.height
    );
  }

  isInPreviousAreaZone(area) {
    if (!area.previousAreaZone) {
      return false;
    }
    return (
      this.position.x + this.radius >= area.previousAreaZone.position.x &&
      this.position.x - this.radius <= area.previousAreaZone.position.x + area.previousAreaZone.size.width &&
      this.position.y + this.radius >= area.previousAreaZone.position.y &&
      this.position.y - this.radius <= area.previousAreaZone.position.y + area.previousAreaZone.size.height
    );
  }

  getPlayerData() {
    return {
      id: this.id,
      x: this.position.x,
      y: this.position.y,
      radius: this.radius,
      speed: this.baseSpeed,
      color: this.color,
      name: this.name,
      areaNumber: this.areaNumber
    };
  }
}

module.exports = Player;